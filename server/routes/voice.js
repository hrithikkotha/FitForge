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
        .slice(0, 60)
        .map(e => `  - id:"${e.id}", name:"${e.name}", category:"${e.category}"`)
        .join('\n');

    const foodList = (context.foods || [])
        .slice(0, 60)
        .map(f => `  - id:"${f.id}", name:"${f.name}"${f.servingUnit ? `, unit:"${f.servingUnit}"` : ''}`)
        .join('\n');

    return `You are a fitness app voice command parser. Your ONLY job is to convert the user's spoken transcript into a single structured JSON action.

AVAILABLE EXERCISES:
${exerciseList || '  (none)'}

AVAILABLE FOODS:
${foodList || '  (none)'}

CURRENT CONTEXT:
- Active workout ID: ${context.activeWorkoutId || 'none'}
- Last exercise added: ${context.lastExerciseName || 'none'}

ACTION TYPES (respond with exactly one):

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
- Always respond with valid JSON only — no markdown, no explanation, no extra text.
- Match exercise/food names fuzzily (e.g. "bench" → "Bench Press (Barbell)", "chicken" → "Chicken Breast").
- Use the EXACT id from the lists above. If no match found, set the id to null.
- Weight is always in kg. If the user says "pounds" or "lbs", convert to kg (divide by 2.205).
- If the user doesn't specify weight, use 0.
- If the user says "last set" for removal, use setNumber: -1.
- For meals, if no meal type is mentioned, default to "snack".
- For quantities, if just a number with a food is mentioned (like "2 eggs"), use that as quantity.
- Be generous in interpretation — try to find the best matching action.
- Add a "description" field with a short human-readable summary of the action.`;
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
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        let action = { type: 'UNKNOWN', message: 'Could not parse command' };
        try {
            const content = chatCompletion.choices[0]?.message?.content;
            if (content) {
                action = JSON.parse(content);
            }
        } catch {
            // LLM returned invalid JSON — fall through with UNKNOWN
        }

        res.json({ transcript, action });
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

module.exports = router;
