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

// Lazy-init Groq client
let groqClient = null;
function getGroq() {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

// ── Build the LLM system prompt for command parsing ──
function buildSystemPrompt(context) {
    const exerciseList = (context.exercises || [])
        .slice(0, 30)
        .map(e => `  - id:"${e.id}", name:"${e.name}", category:"${e.category}"`)
        .join('\n');

    const foodList = (context.foods || [])
        .slice(0, 30)
        .map(f => `  - id:"${f.id}", name:"${f.name}"${f.servingUnit ? `, unit:"${f.servingUnit}"` : ''}`)
        .join('\n');

    return `You are a fitness app voice command parser. Your ONLY job is to convert the user's spoken transcript into structured JSON actions.

IMPORTANT: The user may mention MULTIPLE actions in a single sentence. You MUST return ALL of them.
For example:
- "I had paneer curry and rice 100 grams each for lunch" → TWO LOG_MEAL actions
- "Create workout push day and add bench press" → one CREATE_WORKOUT + one ADD_EXERCISE
- "Add bench press 3 sets 10 reps and add squats 4 sets 8 reps" → TWO ADD_EXERCISE_WITH_SETS
- "Log 2 eggs and 200 grams chicken breast for breakfast" → TWO LOG_MEAL actions

Always respond with a JSON object: { "actions": [ ...array of action objects... ] }
If there is only one action, still wrap it in the actions array.

AVAILABLE EXERCISES:
${exerciseList || '  (none)'}

AVAILABLE FOODS:
${foodList || '  (none)'}

CURRENT CONTEXT:
- Active workout ID: ${context.activeWorkoutId || 'none'}
- Last exercise added: ${context.lastExerciseName || 'none'}

ACTION TYPES:

1. CREATE_WORKOUT — user wants to create/start a new workout
   { "type": "CREATE_WORKOUT", "title": "<workout name>" }

2. ADD_EXERCISE — user wants to add an exercise to the current workout
   { "type": "ADD_EXERCISE", "exerciseId": "<id>", "exerciseName": "<name>", "category": "<category>" }

3. ADD_EXERCISE_WITH_SETS — user wants to add an exercise with sets already specified
   { "type": "ADD_EXERCISE_WITH_SETS", "exerciseId": "<id>", "exerciseName": "<name>", "category": "<category>", "setCount": <n>, "reps": <n>, "weight": <kg, 0 if not specified> }

4. ADD_EXERCISE_CARDIO — user wants to add a cardio exercise with duration
   { "type": "ADD_EXERCISE_CARDIO", "exerciseId": "<id>", "exerciseName": "<name>", "duration": <minutes>, "distance": <km, 0 if not specified> }

5. ADD_SET — user wants to add a set to the last/current exercise
   { "type": "ADD_SET", "reps": <n>, "weight": <kg, 0 if not specified> }

6. ADD_MULTIPLE_SETS — user wants to add multiple sets at once
   { "type": "ADD_MULTIPLE_SETS", "count": <n>, "reps": <n>, "weight": <kg, 0 if not specified> }

7. UPDATE_SET — user wants to update/change a specific set number
   { "type": "UPDATE_SET", "setNumber": <1-indexed>, "reps": <n>, "weight": <kg> }

8. REMOVE_SET — user wants to remove a set (-1 means last set)
   { "type": "REMOVE_SET", "setNumber": <1-indexed or -1 for last> }

9. REMOVE_EXERCISE — user wants to remove an exercise from the workout
   { "type": "REMOVE_EXERCISE", "exerciseId": "<id>", "exerciseName": "<name>" }

10. LOG_MEAL — user wants to log a food item for a meal
    { "type": "LOG_MEAL", "foodId": "<id>", "foodName": "<name>", "quantity": <number>, "mealType": "<breakfast|lunch|dinner|snack>" }

11. DELETE_WORKOUT — user wants to delete the current workout
    { "type": "DELETE_WORKOUT" }

12. UNKNOWN — the transcript doesn't match any fitness command
    { "type": "UNKNOWN", "message": "<brief explanation>" }

RULES:
- Always respond with { "actions": [...] } — valid JSON only, no markdown, no explanation.
- Extract ALL actions from the transcript. If user mentions 2 foods, return 2 LOG_MEAL actions.
- If the user says "create workout X and add Y", return CREATE_WORKOUT first, then ADD_EXERCISE.
- Match exercise/food names fuzzily (e.g. "bench" → "Bench Press (Barbell)", "chicken" → "Chicken Breast", "paneer" → "Paneer").
- Use the EXACT id from the lists above. If no match found, set the id to null.
- Weight is always in kg. If the user says "pounds" or "lbs", convert to kg (divide by 2.205).
- If the user doesn't specify weight, use 0.
- If the user says "last set" for removal, use setNumber: -1.
- For meals, if no meal type is mentioned, default to "snack".
- For quantities, if a shared quantity is mentioned (like "100 grams each"), apply it to each food.
- Be generous in interpretation — try to find the best matching action.
- Add a "description" field to each action with a short human-readable summary.`;
}

// ── POST /api/voice/transcribe ──
// Receives audio blob + context, returns transcript + parsed action
router.post('/transcribe', protect, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No audio file provided' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ message: 'Groq API key not configured' });
        }

        const groq = getGroq();

        // Parse context from the request body
        let context = {};
        try {
            context = JSON.parse(req.body.context || '{}');
        } catch {
            context = {};
        }

        // ── Step 1: Whisper transcription ──
        // Convert the multer buffer to a File-like object for Groq SDK
        const audioFile = new File(
            [req.file.buffer],
            req.file.originalname || 'audio.webm',
            { type: req.file.mimetype || 'audio/webm' }
        );

        const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3-turbo',
            language: 'en',
            response_format: 'verbose_json',
        });

        const transcript = (transcription.text || '').trim();

        if (!transcript) {
            return res.json({
                transcript: '',
                action: { type: 'UNKNOWN', message: 'No speech detected' },
            });
        }

        // ── Step 2: LLM command parsing ──
        const systemPrompt = buildSystemPrompt(context);

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
        try {
            const content = chatCompletion.choices[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content);
                // Support both { actions: [...] } and single action object
                if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
                    actions = parsed.actions;
                } else if (parsed.type) {
                    actions = [parsed];
                }
            }
        } catch {
            // LLM returned invalid JSON — fall through with UNKNOWN
        }

        res.json({ transcript, actions });
    } catch (err) {
        console.error('Voice transcribe error:', err?.message || err);

        // Handle Groq-specific errors
        if (err?.status === 413 || err?.message?.includes('too large')) {
            return res.status(413).json({ message: 'Audio file too large. Keep recordings under 25 seconds.' });
        }
        if (err?.status === 429) {
            return res.status(429).json({ message: 'Rate limited. Please wait a moment and try again.' });
        }

        res.status(500).json({ message: 'Voice processing failed. Please try again.' });
    }
});

// ──────────────────────────────────────────────────────────────────────────
// AI ASSISTANT CHAT — answers questions using user data
// ──────────────────────────────────────────────────────────────────────────

const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const MealEntry = require('../models/MealEntry');
const Exercise = require('../models/Exercise');
const FoodItem = require('../models/FoodItem');

// Gather user's fitness data snapshot for LLM context
async function gatherUserData(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [user, recentWorkouts, recentMeals, weekMeals] = await Promise.all([
        User.findById(userId).select('weight height age dailyCalorieGoal displayName username').lean(),
        WorkoutSession.find({ userId, date: { $gte: thirtyDaysAgo } })
            .sort({ date: -1 })
            .limit(15)
            .populate('entries.exerciseId', 'name category muscleGroups')
            .lean(),
        MealEntry.find({ userId, date: { $gte: thirtyDaysAgo } })
            .sort({ date: -1 })
            .limit(50)
            .lean(),
        MealEntry.find({ userId, date: { $gte: sevenDaysAgo } }).lean(),
    ]);

    // Summarize workouts
    const workoutSummary = recentWorkouts.map(w => {
        const exercises = w.entries.map(e => {
            const name = e.exerciseId?.name || 'Unknown';
            const sets = e.sets?.length || 0;
            const topSet = e.sets?.reduce((best, s) => (s.weight > (best?.weight || 0) ? s : best), null);
            return `${name}: ${sets} sets${topSet ? ` (best: ${topSet.reps}×${topSet.weight}kg)` : ''}${e.duration ? `, ${e.duration}min` : ''}`;
        });
        return `${new Date(w.date).toLocaleDateString()} — ${w.title}: ${exercises.join('; ')}`;
    }).join('\n');

    // Summarize nutrition
    const dailyNutrition = {};
    recentMeals.forEach(m => {
        const day = new Date(m.date).toLocaleDateString();
        if (!dailyNutrition[day]) dailyNutrition[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        dailyNutrition[day].calories += m.calories || 0;
        dailyNutrition[day].protein += m.protein || 0;
        dailyNutrition[day].carbs += m.carbs || 0;
        dailyNutrition[day].fat += m.fat || 0;
    });
    const nutritionSummary = Object.entries(dailyNutrition)
        .slice(0, 10)
        .map(([day, d]) => `${day}: ${Math.round(d.calories)} cal, ${Math.round(d.protein)}g protein, ${Math.round(d.carbs)}g carbs, ${Math.round(d.fat)}g fat`)
        .join('\n');

    // Weekly averages
    const weekCalories = weekMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const weekProtein = weekMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const daysTracked = new Set(weekMeals.map(m => new Date(m.date).toDateString())).size;
    const avgCalories = daysTracked > 0 ? Math.round(weekCalories / daysTracked) : 0;
    const avgProtein = daysTracked > 0 ? Math.round(weekProtein / daysTracked) : 0;

    return {
        profile: user,
        workoutSummary,
        nutritionSummary,
        weeklyAvg: { avgCalories, avgProtein, daysTracked },
        totalWorkouts30d: recentWorkouts.length,
    };
}

function buildChatSystemPrompt(userData, exerciseList, foodList) {
    const p = userData.profile || {};
    return `You are FitForge AI — a knowledgeable, friendly fitness and nutrition assistant. You have access to the user's real data and should give personalized, actionable advice.

You MUST always respond with valid JSON in this format:
{
  "response": "<your natural language response to the user>",
  "actions": []
}

The "response" field is your conversational answer. The "actions" field is an array of action commands to execute.

If the user is asking a QUESTION (e.g. "How am I doing?", "Suggest a diet plan"), set "actions" to an empty array and put your answer in "response".

If the user wants to PERFORM AN ACTION (e.g. "log chicken breast for lunch", "create a push day workout", "add bench press 3 sets 10 reps"), you MUST:
1. Put a friendly confirmation message in "response" (e.g. "Done! I've logged chicken breast for lunch.")
2. Put the parsed action commands in "actions" using the action types below.

The user may ask a question AND request an action in the same message. Handle both.

AVAILABLE EXERCISES:
${exerciseList || '  (none loaded)'}

AVAILABLE FOODS:
${foodList || '  (none loaded)'}

ACTION TYPES:

1. CREATE_WORKOUT — user wants to create/start a new workout
   { "type": "CREATE_WORKOUT", "title": "<workout name>", "description": "Created workout <name>" }

2. ADD_EXERCISE_WITH_SETS — user wants to add an exercise with sets (requires a workout to exist)
   { "type": "ADD_EXERCISE_WITH_SETS", "exerciseId": "<id>", "exerciseName": "<name>", "category": "<category>", "setCount": <n>, "reps": <n>, "weight": <kg, 0 if not specified>, "description": "Added <name> — <n> sets" }

3. LOG_MEAL — user wants to log a food item
   { "type": "LOG_MEAL", "foodId": "<id>", "foodName": "<name>", "quantity": <number in grams>, "mealType": "<breakfast|lunch|dinner|snack>", "description": "Logged <name> for <mealType>" }

4. DELETE_WORKOUT — user wants to delete a workout
   { "type": "DELETE_WORKOUT", "description": "Deleted workout" }

RULES FOR ACTIONS:
- Match exercise/food names fuzzily (e.g. "bench" → "Bench Press (Barbell)", "chicken" → "Chicken Breast").
- Use the EXACT id from the lists above. If no match found, set id to null.
- Weight is always in kg. If user says "pounds"/"lbs", convert (divide by 2.205).
- For meals, if no meal type mentioned, default to "snack".
- For quantities, if a shared quantity is mentioned (like "100 grams each"), apply to each food.
- If the user mentions multiple foods, create multiple LOG_MEAL actions.
- If the user says "create workout X and add Y", create CREATE_WORKOUT first, then ADD_EXERCISE_WITH_SETS.
- Add a "description" field to each action with a short summary.

USER PROFILE:
- Name: ${p.displayName || p.username || 'User'}
- Weight: ${p.weight || 'not set'} kg
- Height: ${p.height || 'not set'} cm
- Age: ${p.age || 'not set'}
- Daily calorie goal: ${p.dailyCalorieGoal || 2000} cal

WORKOUT HISTORY (last 30 days, ${userData.totalWorkouts30d} sessions):
${userData.workoutSummary || 'No workouts logged.'}

NUTRITION SUMMARY (recent days):
${userData.nutritionSummary || 'No meals logged.'}

WEEKLY AVERAGES (last 7 days, ${userData.weeklyAvg.daysTracked} days tracked):
- Avg daily calories: ${userData.weeklyAvg.avgCalories} cal
- Avg daily protein: ${userData.weeklyAvg.avgProtein}g

RESPONSE INSTRUCTIONS:
- Give specific, data-backed advice referencing their actual numbers when relevant.
- Keep responses concise but helpful — aim for 2-4 paragraphs max.
- Use bullet points and clear structure for plans.
- Be encouraging and motivating.
- Do NOT make up data that doesn't exist — only reference what's provided above.
- If asked something outside fitness/nutrition, politely redirect to fitness topics.
- ALWAYS respond with valid JSON: { "response": "...", "actions": [...] }`;
}

// ── POST /api/voice/chat ──
// Handles AI assistant chat — text or voice (with audio file)
router.post('/chat', protect, upload.single('audio'), async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ message: 'Groq API key not configured' });
        }

        const groq = getGroq();
        let userMessage = (req.body.message || '').trim();

        // If audio file provided, transcribe it first
        if (req.file && req.file.size > 1000) {
            const audioFile = new File(
                [req.file.buffer],
                req.file.originalname || 'audio.webm',
                { type: req.file.mimetype || 'audio/webm' }
            );

            const transcription = await groq.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3-turbo',
                language: 'en',
                response_format: 'verbose_json',
            });

            userMessage = (transcription.text || '').trim();
        }

        if (!userMessage) {
            return res.json({ transcript: '', response: 'I didn\'t catch that. Could you try again?', actions: [] });
        }

        // Gather user data + exercises/foods in parallel
        const [userData, exercises, foods] = await Promise.all([
            gatherUserData(req.user._id),
            Exercise.find({}).select('name category').lean(),
            FoodItem.find({ $or: [{ isDefault: true }, { userId: req.user._id }] })
                .select('name servingUnit')
                .lean(),
        ]);

        const exerciseList = exercises
            .slice(0, 30)
            .map(e => `  - id:"${e._id}", name:"${e.name}", category:"${e.category}"`)
            .join('\n');

        const foodList = foods
            .slice(0, 30)
            .map(f => `  - id:"${f._id}", name:"${f.name}"${f.servingUnit ? `, unit:"${f.servingUnit}"` : ''}`)
            .join('\n');

        const systemPrompt = buildChatSystemPrompt(userData, exerciseList, foodList);

        // Parse conversation history if provided
        let conversationMessages = [];
        try {
            const historyRaw = req.body.history || '[]';
            const history = JSON.parse(historyRaw);
            // Keep last 5 messages for context (saves tokens)
            conversationMessages = history.slice(-5).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
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
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 512,
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content || '';

        let response = 'Sorry, I couldn\'t generate a response.';
        let actions = [];

        try {
            const parsed = JSON.parse(content);
            response = parsed.response || response;
            if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
                // Filter out UNKNOWN actions
                actions = parsed.actions.filter(a => a.type !== 'UNKNOWN');
            }
        } catch {
            // If JSON parsing fails, treat the whole content as the response
            response = content || response;
        }

        res.json({
            transcript: userMessage,
            response,
            actions,
        });
    } catch (err) {
        console.error('AI chat error:', err?.message || err);

        if (err?.status === 429) {
            return res.status(429).json({ message: 'Rate limited. Please wait a moment and try again.' });
        }

        res.status(500).json({ message: 'AI assistant error. Please try again.' });
    }
});

module.exports = router;
