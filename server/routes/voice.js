const express = require('express');
const multer = require('multer');
const Groq = require('groq-sdk');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer: store audio in memory (max 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Lazy-init Groq client ──────────────────────────────────────────────────
let groqClient = null;
function getGroq() {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

// ── In-memory user data cache (TTL: 5 minutes) ────────────────────────────
// Avoids hitting the DB on every single chat message
const userDataCache = new Map(); // userId -> { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedUserData(userId) {
    const key = userId.toString();
    const entry = userDataCache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
        return entry.data;
    }
    userDataCache.delete(key);
    return null;
}

function setCachedUserData(userId, data) {
    const key = userId.toString();
    userDataCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    // Evict old entries to prevent memory leak (keep max 500 users)
    if (userDataCache.size > 500) {
        const firstKey = userDataCache.keys().next().value;
        userDataCache.delete(firstKey);
    }
}

// Invalidate cache when user logs an action (data changed)
function invalidateUserCache(userId) {
    userDataCache.delete(userId.toString());
}

// ── Models (lazy-loaded to avoid circular require issues) ──────────────────
const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const MealEntry = require('../models/MealEntry');
const Exercise = require('../models/Exercise');
const FoodItem = require('../models/FoodItem');

// ── Detect if the message likely needs action data (exercises/foods) ────────
// Simple keyword-based check to avoid fetching all exercises+foods for questions
function messageNeedsActionData(text) {
    const lower = text.toLowerCase();
    const actionKeywords = [
        'create workout', 'start workout', 'add exercise', 'log meal',
        'log food', 'ate', 'had', 'eaten', 'bench press', 'squat', 'deadlift',
        'push day', 'pull day', 'leg day', 'workout plan', 'add to workout',
        'sets', 'reps', 'calories', 'chicken', 'rice', 'protein', 'grams',
        'for lunch', 'for dinner', 'for breakfast', 'for snack',
        'delete workout', 'remove workout',
    ];
    return actionKeywords.some(kw => lower.includes(kw));
}

// ── Gather compressed user data snapshot ──────────────────────────────────
// Only runs when cache is cold — results are reused for 5 minutes
async function gatherUserData(userId) {
    const cached = getCachedUserData(userId);
    if (cached) return cached;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [user, recentWorkouts, recentMeals, weekMeals] = await Promise.all([
        User.findById(userId)
            .select('weight height age dailyCalorieGoal displayName username')
            .lean(),
        WorkoutSession.find({ userId, date: { $gte: thirtyDaysAgo } })
            .sort({ date: -1 })
            .limit(10) // reduced from 15
            .populate('entries.exerciseId', 'name category')
            .lean(),
        MealEntry.find({ userId, date: { $gte: thirtyDaysAgo } })
            .sort({ date: -1 })
            .limit(30) // reduced from 50
            .lean(),
        MealEntry.find({ userId, date: { $gte: sevenDaysAgo } }).lean(),
    ]);

    // Compact workout summary
    const workoutSummary = recentWorkouts.map(w => {
        const exercises = w.entries.map(e => {
            const name = e.exerciseId?.name || 'Unknown';
            const sets = e.sets?.length || 0;
            const topSet = e.sets?.reduce(
                (best, s) => (s.weight > (best?.weight || 0) ? s : best), null
            );
            return `${name}(${sets}sets${topSet ? ` best:${topSet.reps}x${topSet.weight}kg` : ''})`;
        });
        const dateStr = new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateStr} ${w.title}: ${exercises.join(', ')}`;
    }).join('\n');

    // Compact nutrition summary (last 7 days only for tokens)
    const dailyNutrition = {};
    recentMeals.forEach(m => {
        const day = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyNutrition[day]) dailyNutrition[day] = { cal: 0, p: 0, c: 0, f: 0 };
        dailyNutrition[day].cal += m.calories || 0;
        dailyNutrition[day].p += m.protein || 0;
        dailyNutrition[day].c += m.carbs || 0;
        dailyNutrition[day].f += m.fat || 0;
    });
    const nutritionSummary = Object.entries(dailyNutrition)
        .slice(0, 7)
        .map(([day, d]) =>
            `${day}: ${Math.round(d.cal)}cal ${Math.round(d.p)}g-pro ${Math.round(d.c)}g-carb ${Math.round(d.f)}g-fat`
        )
        .join('\n');

    // Weekly averages
    const weekCalories = weekMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const weekProtein = weekMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const daysTracked = new Set(weekMeals.map(m => new Date(m.date).toDateString())).size;

    const result = {
        profile: user,
        workoutSummary: workoutSummary || 'No workouts logged.',
        nutritionSummary: nutritionSummary || 'No meals logged.',
        weeklyAvg: {
            avgCalories: daysTracked > 0 ? Math.round(weekCalories / daysTracked) : 0,
            avgProtein: daysTracked > 0 ? Math.round(weekProtein / daysTracked) : 0,
            daysTracked,
        },
        totalWorkouts30d: recentWorkouts.length,
    };

    setCachedUserData(userId, result);
    return result;
}

// ── Build evidence-based system prompt (powered by Health & Nutrition Expert skill) ──
function buildChatSystemPrompt(userData, exerciseList, foodList) {
    const p = userData.profile || {};
    const needsActionSection = !!(exerciseList || foodList);

    // Compute the user's estimated protein target (1g per lb bodyweight for muscle building)
    const weightKg = p.weight || 70;
    const weightLbs = Math.round(weightKg * 2.205);
    const proteinTarget = Math.round(weightLbs * 1.0); // 1g/lb = muscle building baseline
    const calorieGoal = p.dailyCalorieGoal || 2000;

    return `You are FitForge AI — an evidence-based fitness and nutrition assistant grounded in 2025 nutrition science. You have access to the user's real data.

ALWAYS respond with valid JSON exactly like this (no markdown, no extra text):
{"response":"<your answer>","actions":[]}

If the user asks a QUESTION → put your full answer in "response", set "actions" to [].
If the user wants to PERFORM AN ACTION → put a friendly confirmation in "response" and add parsed action objects to "actions".

═══════════════════════════════════════════
USER PROFILE
═══════════════════════════════════════════
Name: ${p.displayName || p.username || 'User'}
Weight: ${weightKg}kg (${weightLbs}lbs) | Height: ${p.height || 'not set'}cm | Age: ${p.age || 'not set'}
Daily calorie goal: ${calorieGoal}cal
Estimated protein target: ${proteinTarget}g/day (1g per lb bodyweight)
Per-meal protein target: ${Math.round(proteinTarget / 3)}–${Math.round(proteinTarget / 3) + 5}g per meal (to hit leucine threshold for muscle protein synthesis)

═══════════════════════════════════════════
WORKOUT HISTORY (last 30 days, ${userData.totalWorkouts30d} sessions)
═══════════════════════════════════════════
${userData.workoutSummary}

═══════════════════════════════════════════
NUTRITION (recent days)
═══════════════════════════════════════════
${userData.nutritionSummary}

WEEKLY AVG (last 7 days, ${userData.weeklyAvg.daysTracked} days tracked):
- Avg calories: ${userData.weeklyAvg.avgCalories}cal | Avg protein: ${userData.weeklyAvg.avgProtein}g
- Protein gap: ${Math.max(0, proteinTarget - userData.weeklyAvg.avgProtein)}g below daily target
${needsActionSection ? `
═══════════════════════════════════════════
AVAILABLE EXERCISES (use exact id)
═══════════════════════════════════════════
${exerciseList || '(none)'}

AVAILABLE FOODS (use exact id)
${foodList || '(none)'}

ACTION TYPES (only include when user requests an action):
1. CREATE_WORKOUT: {"type":"CREATE_WORKOUT","title":"<name>","description":"Created <name>"}
2. ADD_EXERCISE_WITH_SETS: {"type":"ADD_EXERCISE_WITH_SETS","exerciseId":"<id>","exerciseName":"<name>","category":"<cat>","setCount":<n>,"reps":<n>,"weight":<kg>,"description":"Added <name>"}
3. LOG_MEAL: {"type":"LOG_MEAL","foodId":"<id>","foodName":"<name>","quantity":<grams>,"mealType":"<breakfast|lunch|dinner|snack>","description":"Logged <name>"}
4. DELETE_WORKOUT: {"type":"DELETE_WORKOUT","description":"Deleted workout"}

FUZZY MATCH: "bench"→"Barbell Bench Press", "chicken"→"Chicken Breast (cooked)". Use exact id. Weight in kg (convert lbs÷2.205). Default meal type: snack.
` : ''}
═══════════════════════════════════════════
2025 NUTRITION SCIENCE KNOWLEDGE BASE
═══════════════════════════════════════════
Apply this science when giving advice:

PROTEIN (most critical):
- Target: 1g per lb bodyweight = ${proteinTarget}g/day for this user
- Distribute EVENLY: ${Math.round(proteinTarget / 3)}g per meal (not 10g breakfast + 80g dinner)
- Leucine threshold per meal: 2.5–3g leucine needed to trigger muscle protein synthesis
  → Chicken 150g ✓ | Paneer 100g ✓ | Dal alone ✗ (combine with paneer/egg)
- Complete proteins: eggs, chicken, fish, dairy, soy, paneer, quinoa
- Incomplete (must combine): dal + rice OR roti + dal = complete

MEAL TIMING & SEQUENCING:
- Pre-workout (1–2hrs before): 30–60g carbs, low fiber (banana, rice + fruit, roti+honey)
- Post-workout (within 2hrs): 30–40g protein + 0.5–1g carbs per lb (rice+chicken, oats+whey)
- Meal sequence for blood sugar: Vegetables first → Protein → Carbs (reduces glucose spike ~30%)
- 10-min walk after meals reduces glucose spike by 25%

CARB QUALITY TIERS:
- Tier 1 (best): sweet potato, quinoa, oats, dal, non-starchy veg
- Tier 2 (good): brown rice, whole wheat roti, fruit
- Tier 3 (context): white rice (fine post-workout), dosa, idli
- Avoid: refined sugars, maida products, fried snacks

ANTI-INFLAMMATORY FOODS (for recovery):
- Daily: salmon/sardines, berries, spinach, olive oil/ghee, turmeric+black pepper, green tea
- Regular: walnuts, avocado, tomatoes, garlic+onion, mushrooms
- Avoid: seed oils when heated, ultra-processed snacks, excess sugar

GUT HEALTH (affects 70% of immunity):
- Daily fermented foods: curd, chaas, kefir, homemade pickle
- 30+ different plant foods per week for microbiome diversity
- High fiber: 35–40g daily (dal, vegetables, oats, fruits)

SUPPLEMENTS (evidence tier 1):
- Creatine 5g/day: muscle strength + cognitive function (no cycling needed)
- Omega-3 2–3g EPA/DHA: anti-inflammatory, heart, brain
- Vitamin D3 2000–5000 IU: immunity, mood (especially indoors)
- Magnesium glycinate 400mg evening: sleep + 300+ enzymatic reactions

INDIAN DIET ADAPTATION:
- Dal + roti/rice = complete protein (combine smartly)
- Paneer is excellent (complete protein + healthy fat) — 100g paneer = 18g protein
- Add protein to Indian meals: extra dal, soya chunks, paneer, curd on the side
- Curd/chaas after meals = probiotic benefit
- Cook vegetables in ghee/olive oil, not refined oil

═══════════════════════════════════════════
RESPONSE FORMATTING (CRITICAL — follow exactly)
═══════════════════════════════════════════
Your "response" string will be rendered as Markdown. Use proper markdown formatting:

FORMAT RULES:
- Use **bold** for key terms, food names, and numbers (e.g. **150g chicken breast**)
- Use ### for section headers (e.g. ### Day 1 — Monday)
- Use bullet lists (- item) for listing foods, tips, or exercises
- Use numbered lists (1. item) for step-by-step instructions
- Use line breaks (two newlines) between sections for visual clarity
- For multi-day plans, use a ### header per day with bullet-point meals beneath:
  ### Day 1 — Monday
  - **Breakfast:** 2 eggs + oats (350cal, 25g protein)
  - **Lunch:** Chicken 150g + brown rice + salad (550cal, 35g protein)
  - **Dinner:** Salmon 120g + quinoa + broccoli (480cal, 30g protein)
- Never dump everything on one line separated by pipes (|)
- Keep responses well-structured but concise
- Reference the user's ACTUAL numbers (their protein avg, calorie gap, workout history)
- Be specific and actionable — tell them exactly what to eat/do, not vague advice
- Be encouraging but honest about gaps in their data
- ALWAYS return valid JSON: {"response":"...","actions":[...]}`;
}

// ── Robust JSON extractor (handles truncated/wrapped responses) ────────────
function extractJSON(raw) {
    if (!raw) return null;
    // Try direct parse first
    try { return JSON.parse(raw); } catch {}
    // Try to find the outermost {...} block
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
        try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
    }
    // Try regex for response field only
    const responseMatch = raw.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (responseMatch) {
        return { response: responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'), actions: [] };
    }
    return null;
}

// ── POST /api/voice/transcribe ──────────────────────────────────────────────
router.post('/transcribe', protect, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No audio file provided' });
        if (!process.env.GROQ_API_KEY) return res.status(500).json({ message: 'Groq API key not configured' });

        const groq = getGroq();
        let context = {};
        try { context = JSON.parse(req.body.context || '{}'); } catch {}

        const audioFile = new File(
            [req.file.buffer],
            req.file.originalname || 'audio.webm',
            // Normalize MIME type — Groq Whisper prefers bare mime without codec params
            { type: (req.file.mimetype || 'audio/webm').split(';')[0] }
        );

        const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3-turbo',
            language: 'en',
            response_format: 'json',
        });

        const transcript = (transcription.text || '').trim();
        if (!transcript) {
            return res.json({ transcript: '', action: { type: 'UNKNOWN', message: 'No speech detected' } });
        }

        // Build exercise/food lists for voice command parsing
        const exerciseList = (context.exercises || [])
            .slice(0, 120)
            .map(e => `  - id:"${e.id}", name:"${e.name}", category:"${e.category}"`)
            .join('\n');

        const foodList = (context.foods || [])
            .slice(0, 200)
            .map(f => `  - id:"${f.id}", name:"${f.name}"${f.servingUnit ? `, unit:"${f.servingUnit}"` : ''}`)
            .join('\n');

        const systemPrompt = `You are a fitness app voice command parser. Convert the user's spoken transcript into structured JSON actions.

IMPORTANT: The user may mention MULTIPLE items in one sentence. Return ALL of them.

AVAILABLE EXERCISES:
${exerciseList || '  (none)'}

AVAILABLE FOODS:
${foodList || '  (none)'}

Active workout ID: ${context.activeWorkoutId || 'none'}
Last exercise added: ${context.lastExerciseName || 'none'}

ACTION TYPES (respond with {"actions":[...]} — valid JSON only):

1. CREATE_WORKOUT — create a new workout session
   {"type":"CREATE_WORKOUT","title":"<name>","description":"Created workout <name>"}

2. ADD_EXERCISE_WITH_SETS — add exercise to current workout
   {"type":"ADD_EXERCISE_WITH_SETS","exerciseId":"<exact id from list>","exerciseName":"<name>","category":"<category>","setCount":<n>,"reps":<n>,"weight":<kg or 0>,"description":"Added <name>"}

3. ADD_EXERCISE_CARDIO — add cardio exercise with duration
   {"type":"ADD_EXERCISE_CARDIO","exerciseId":"<exact id from list>","exerciseName":"<name>","duration":<minutes>,"distance":<km or 0>,"description":"Added <name>"}

4. LOG_MEAL — log a food item for a meal
   {"type":"LOG_MEAL","foodId":"<exact id from list>","foodName":"<name>","quantity":<grams>,"mealType":"<breakfast|lunch|dinner|snack>","description":"Logged <name>"}

5. ADD_SET — add a set to last exercise
   {"type":"ADD_SET","reps":<n>,"weight":<kg or 0>,"description":"Added set"}

6. ADD_MULTIPLE_SETS — add multiple identical sets
   {"type":"ADD_MULTIPLE_SETS","count":<n>,"reps":<n>,"weight":<kg or 0>,"description":"Added <n> sets"}

7. DELETE_WORKOUT — delete current workout
   {"type":"DELETE_WORKOUT","description":"Deleted workout"}

8. UNKNOWN — cannot determine intent
   {"type":"UNKNOWN","message":"<explanation>"}

CONFIDENCE RULE (CRITICAL):
- Only match a food or exercise if the user's transcript EXPLICITLY mentions that item by name or a clear abbreviation.
- "support of food", "random noise", "sabota frut", "one support" etc. — these do NOT match any food. Return UNKNOWN.
- Do NOT guess or infer based on vague phonetic similarity. The user must have clearly said the food/exercise name.
- If ANY food or exercise name is uncertain, set its id to null and type to UNKNOWN.
- Only match when confidence is ≥ 90%.

RULES:
- Fuzzy match names: "banana" → "Banana", "bench" → "Barbell Bench Press", "chicken" → "Chicken Breast (cooked)"
- You MUST use the EXACT id string from the lists above. Copy it exactly.
- If a food/exercise is not in the list at all, set the id to null.
- Weight is in kg. Convert lbs to kg (divide by 2.205).
- If no meal type specified, default to "snack".
- If user says "for lunch/dinner/breakfast", use that meal type.
- If user mentions multiple foods (e.g. "banana and rice"), return multiple LOG_MEAL actions.
- Always respond with {"actions":[...]} — valid JSON, no markdown.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 512,
            response_format: { type: 'json_object' },
        });

        let actions = [{ type: 'UNKNOWN', message: 'Could not parse command' }];
        const parsed = extractJSON(chatCompletion.choices[0]?.message?.content);
        if (parsed) {
            if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
                actions = parsed.actions;
            } else if (parsed.type) {
                actions = [parsed];
            }
        }

        res.json({ transcript, actions });
    } catch (err) {
        const status = err?.status || err?.statusCode;
        const errMsg = err?.error?.error?.message || err?.message || 'Unknown error';
        console.error(`[Voice transcribe] status=${status} msg=${errMsg}`);

        if (status === 401) {
            return res.status(500).json({ message: 'AI service authentication failed. Check API key.' });
        }
        if (status === 413 || errMsg.includes('too large')) {
            return res.status(413).json({ message: 'Audio file too large. Keep recordings under 25 seconds.' });
        }
        if (status === 429) {
            return res.status(429).json({ message: 'Rate limited. Please wait a moment and try again.' });
        }
        if (status === 400) {
            return res.status(400).json({ message: `Audio could not be processed: ${errMsg}` });
        }
        res.status(500).json({ message: `Voice processing failed: ${errMsg}` });
    }
});

// ── Flexible body parser: multipart for audio uploads, JSON otherwise ──────
function chatBodyParser(req, res, next) {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
        upload.single('audio')(req, res, next);
    } else {
        // express.json() already parsed the body globally; just continue
        next();
    }
}

// ── POST /api/voice/chat ────────────────────────────────────────────────────
// Handles AI assistant chat — text or voice (with audio file)
router.post('/chat', protect, chatBodyParser, async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ message: 'AI service not configured. Please contact support.' });
        }

        const groq = getGroq();
        let userMessage = (req.body.message || '').trim();

        // Transcribe voice if audio provided
        if (req.file && req.file.size > 1000) {
            const audioFile = new File(
                [req.file.buffer],
                req.file.originalname || 'audio.webm',
                { type: (req.file.mimetype || 'audio/webm').split(';')[0] }
            );
            const transcription = await groq.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3-turbo',
                language: 'en',
                response_format: 'json',
            });
            userMessage = (transcription.text || '').trim();
        }

        if (!userMessage) {
            return res.json({ transcript: '', response: "I didn't catch that. Could you try again?", actions: [] });
        }

        // Determine if this message needs exercise/food data (action-oriented)
        const needsActionData = messageNeedsActionData(userMessage);

        // Always gather user fitness data (cached after first call)
        const [userData, exercises, foods] = await Promise.all([
            gatherUserData(req.user._id),
            needsActionData ? Exercise.find({}).select('name category').limit(40).lean() : Promise.resolve([]),
            needsActionData
                ? FoodItem.find({ $or: [{ isDefault: true }, { userId: req.user._id }] })
                      .select('name servingUnit')
                      .limit(40)
                      .lean()
                : Promise.resolve([]),
        ]);

        const exerciseList = exercises
            .map(e => `  - id:"${e._id}", name:"${e.name}", category:"${e.category}"`)
            .join('\n');

        const foodList = foods
            .map(f => `  - id:"${f._id}", name:"${f.name}"${f.servingUnit ? `, unit:"${f.servingUnit}"` : ''}`)
            .join('\n');

        const systemPrompt = buildChatSystemPrompt(
            userData,
            needsActionData ? exerciseList : null,
            needsActionData ? foodList : null
        );

        // Parse conversation history — keep last 6 exchanges (3 pairs) max
        let conversationMessages = [];
        try {
            const history = JSON.parse(req.body.history || '[]');
            conversationMessages = history
                .slice(-6)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    // Truncate long history messages to save tokens
                    content: (m.content || '').slice(0, 400),
                }));
        } catch {
            conversationMessages = [];
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationMessages,
            { role: 'user', content: userMessage },
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 4096,   // Large enough for multi-day plans (7-day diet = ~3000 tokens)
            response_format: { type: 'json_object' },
        });

        const choice = chatCompletion.choices[0];
        const finishReason = choice?.finish_reason;

        // Warn if the model was cut off — but still try to salvage the partial response
        if (finishReason === 'length') {
            console.warn(`[AI chat] Response truncated (finish_reason=length). User: ${req.user._id}. Message: "${userMessage.slice(0, 80)}..."`);
        }

        const rawContent = choice?.message?.content || '';
        const parsed = extractJSON(rawContent);

        let response = "I'm here to help with your fitness journey! Could you rephrase that?";
        let actions = [];

        if (parsed) {
            response = parsed.response || response;
            if (Array.isArray(parsed.actions)) {
                actions = parsed.actions.filter(a => a.type && a.type !== 'UNKNOWN');
            }
        } else {
            // Fallback: treat raw content as the response text
            response = rawContent.replace(/^\s*\{.*?"response"\s*:\s*"/, '').replace(/"\s*,?\s*"actions".*$/, '').trim() || response;
        }

        // Invalidate user data cache if actions were taken (data will change)
        if (actions.length > 0) {
            invalidateUserCache(req.user._id);
        }

        res.json({ transcript: userMessage, response, actions });
    } catch (err) {
        const status = err?.status || err?.statusCode;
        const errMsg = err?.error?.error?.message || err?.message || 'Unknown error';
        console.error(`[AI chat] status=${status} msg=${errMsg}`);

        if (status === 429) {
            return res.status(429).json({ message: 'The AI is busy right now. Please wait a moment and try again.' });
        }
        if (status === 401) {
            return res.status(500).json({ message: 'AI service authentication failed. Check API key.' });
        }
        if (status === 400) {
            return res.status(400).json({ message: `AI request failed: ${errMsg}` });
        }

        res.status(500).json({ message: `AI error: ${errMsg}` });
    }
});

module.exports = router;
