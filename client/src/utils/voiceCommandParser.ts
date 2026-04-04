// Voice command parser — converts speech transcript into structured actions
// Uses keyword/regex matching, no AI API needed

export interface VoiceAction {
    type: string;
    [key: string]: any;
}

export interface ParserContext {
    exercises: { _id: string; name: string; category: string }[];
    workouts: { _id: string; title: string; entries: any[] }[];
    foods?: { _id: string; name: string; servingUnit?: string; gramsPerServing?: number }[];
    activeWorkoutId?: string | null;
    lastExerciseEntryIndex?: number | null;
}

// Fuzzy match an exercise name from the user's speech against the exercise list
function fuzzyMatchExercise(spoken: string, exercises: ParserContext['exercises']): { _id: string; name: string; category: string } | null {
    const lower = spoken.toLowerCase().trim();
    if (!lower) return null;

    // Exact match first
    const exact = exercises.find(e => e.name.toLowerCase() === lower);
    if (exact) return exact;

    // Contains match — exercise name contains spoken text or vice versa
    const contains = exercises.find(e => e.name.toLowerCase().includes(lower));
    if (contains) return contains;
    const reverseContains = exercises.find(e => lower.includes(e.name.toLowerCase()));
    if (reverseContains) return reverseContains;

    // Word overlap scoring
    const spokenWords = lower.split(/\s+/);
    let bestMatch: typeof exercises[0] | null = null;
    let bestScore = 0;

    for (const ex of exercises) {
        const exWords = ex.name.toLowerCase().split(/[\s()\/,]+/);
        let score = 0;
        for (const sw of spokenWords) {
            for (const ew of exWords) {
                if (ew.includes(sw) || sw.includes(ew)) {
                    score += sw.length;
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = ex;
        }
    }

    // Only return if we matched at least 3 chars worth
    return bestScore >= 3 ? bestMatch : null;
}

type FoodItem = { _id: string; name: string; servingUnit?: string; gramsPerServing?: number };

// Fuzzy match food name
function fuzzyMatchFood(spoken: string, foods?: FoodItem[]): FoodItem | null {
    if (!foods) return null;
    const lower = spoken.toLowerCase().trim();
    if (!lower) return null;

    const exact = foods.find(f => f.name.toLowerCase() === lower);
    if (exact) return exact;

    const contains = foods.find(f => f.name.toLowerCase().includes(lower));
    if (contains) return contains;

    const reverseContains = foods.find(f => lower.includes(f.name.toLowerCase()));
    if (reverseContains) return reverseContains;

    const spokenWords = lower.split(/\s+/);
    let bestMatch: FoodItem | null = null;
    let bestScore = 0;

    for (const f of foods) {
        const fWords = f.name.toLowerCase().split(/[\s()\/,]+/);
        let score = 0;
        for (const sw of spokenWords) {
            for (const fw of fWords) {
                if (fw.includes(sw) || sw.includes(fw)) score += sw.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = f;
        }
    }

    return bestScore >= 3 ? bestMatch : null;
}

// ── Suggestion engine ─────────────────────────────────────────────────────────
// Returns top N foods/exercises closest to the misspelled spoken query

export interface SuggestionResult {
    /** Human-readable clickable string, e.g. "Add 3 bananas to breakfast" */
    label: string;
    /** Pre-built partial action payload so the UI can execute without re-parsing */
    action: VoiceAction;
}

/**
 * Compute top-N food suggestions that best match a misspelled/misheard spoken fragment.
 * Uses character-bigram overlap so "banas" → "banana", "idly" → "idli", etc.
 */
function bigramSimilarity(a: string, b: string): number {
    const bigrams = (str: string) => {
        const set: string[] = [];
        for (let i = 0; i < str.length - 1; i++) set.push(str.slice(i, i + 2));
        return set;
    };
    const ba = bigrams(a.toLowerCase());
    const bb = bigrams(b.toLowerCase());
    if (!ba.length || !bb.length) return 0;
    const intersection = ba.filter(g => bb.includes(g)).length;
    return (2 * intersection) / (ba.length + bb.length);
}

function topFoodMatches(spoken: string, foods: FoodItem[], topN = 5): FoodItem[] {
    return foods
        .map(f => ({ food: f, score: bigramSimilarity(spoken, f.name) }))
        .filter(x => x.score > 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(x => x.food);
}

function topExerciseMatches(
    spoken: string,
    exercises: ParserContext['exercises'],
    topN = 5,
): ParserContext['exercises'] {
    return exercises
        .map(e => ({ ex: e, score: bigramSimilarity(spoken, e.name) }))
        .filter(x => x.score > 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(x => x.ex);
}

/**
 * Generate 3-5 suggestion commands based on what the user likely meant.
 * Called when the main parser returns null or a not-found result.
 */
export function generateSuggestions(
    transcript: string,
    context: ParserContext,
): SuggestionResult[] {
    const t = transcript.toLowerCase().trim();
    const suggestions: SuggestionResult[] = [];

    // ── Detect intent ─────────────────────────────────────────────────────────
    const isMealIntent = /(?:log|add|record).*(?:breakfast|lunch|dinner|snack)/.test(t)
        || /(?:breakfast|lunch|dinner|snack).*(?:log|add|record)/.test(t);
    const mealTypeMatch = t.match(/\b(breakfast|lunch|dinner|snack)\b/i);
    const mealType = mealTypeMatch?.[1]?.toLowerCase() ?? 'lunch';

    // Extract quantity from transcript
    const qtyMatch = t.match(/\b(\d+(?:\.\d+)?)\b/);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;

    // Extract likely food/exercise name: strip command words
    const stripped = t
        .replace(/^(?:log|add|record|include)\s+/, '')
        .replace(/\b(\d+(?:\.\d+)?)\s*(?:grams?|g|kg|sets?|reps?|pieces?)?\b/gi, '')
        .replace(/\b(?:for|to|at|in|into|as|my|the|a|an)\b/gi, '')
        .replace(/\b(?:breakfast|lunch|dinner|snack)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!stripped) return [];

    // ── FOOD suggestions ──────────────────────────────────────────────────────
    if (isMealIntent && context.foods?.length) {
        const matches = topFoodMatches(stripped, context.foods, 5);
        for (const food of matches) {
            const qty = food.servingUnit === 'g' || food.servingUnit === 'ml' ? 100 : quantity;
            const label = `Add ${qty} ${food.servingUnit === 'g' ? 'g of' : food.servingUnit === 'ml' ? 'ml of' : ''} ${food.name} to ${mealType}`;
            suggestions.push({
                label,
                action: {
                    type: 'LOG_MEAL',
                    foodId: food._id,
                    foodName: food.name,
                    quantity: qty,
                    mealType,
                    description: label,
                },
            });
        }
        return suggestions;
    }

    // ── EXERCISE suggestions (add / workout context) ───────────────────────────
    const isExerciseIntent = /(?:add|include)/.test(t) && !isMealIntent;
    if (isExerciseIntent && context.exercises?.length) {
        const matches = topExerciseMatches(stripped, context.exercises, 5);
        for (const ex of matches) {
            const label = `Add ${ex.name}`;
            suggestions.push({
                label,
                action: {
                    type: 'ADD_EXERCISE',
                    exerciseId: ex._id,
                    exerciseName: ex.name,
                    category: ex.category,
                    description: label,
                },
            });
        }
        return suggestions;
    }

    // ── Fallback: suggest both food and exercise top matches ──────────────────
    if (context.foods?.length) {
        topFoodMatches(stripped, context.foods, 3).forEach(food => {
            const qty = food.servingUnit === 'g' || food.servingUnit === 'ml' ? 100 : 1;
            const label = `Log ${qty} ${food.servingUnit === 'g' ? 'g of' : ''} ${food.name} for lunch`;
            suggestions.push({
                label,
                action: {
                    type: 'LOG_MEAL',
                    foodId: food._id,
                    foodName: food.name,
                    quantity: qty,
                    mealType: 'lunch',
                    description: label,
                },
            });
        });
    }
    if (context.exercises?.length) {
        topExerciseMatches(stripped, context.exercises, 2).forEach(ex => {
            const label = `Add ${ex.name}`;
            suggestions.push({
                label,
                action: {
                    type: 'ADD_EXERCISE',
                    exerciseId: ex._id,
                    exerciseName: ex.name,
                    category: ex.category,
                    description: label,
                },
            });
        });
    }

    return suggestions.slice(0, 5);
}

// Extract numbers from speech, handling words like "twenty five"
function extractNumber(text: string): number | null {
    // Direct digits
    const digitMatch = text.match(/\d+\.?\d*/);
    if (digitMatch) return parseFloat(digitMatch[0]);

    // Word numbers
    const wordMap: Record<string, number> = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
        sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
        thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
        eighty: 80, ninety: 90, hundred: 100,
    };

    const words = text.toLowerCase().split(/\s+/);
    let result = 0;
    let found = false;

    for (const w of words) {
        if (wordMap[w] !== undefined) {
            if (w === 'hundred') {
                result = result === 0 ? 100 : result * 100;
            } else {
                result += wordMap[w];
            }
            found = true;
        }
    }

    return found ? result : null;
}

export function parseVoiceCommand(transcript: string, context: ParserContext): VoiceAction | null {
    const t = transcript.toLowerCase().trim();
    if (!t) return null;

    // ── CREATE WORKOUT ──
    // "create workout Push Day" / "new workout Leg Day" / "create workout"
    const createWorkoutMatch = t.match(/(?:create|start|new|begin)\s+(?:a\s+)?(?:new\s+)?workout\s*(.*)?/i);
    if (createWorkoutMatch) {
        const title = createWorkoutMatch[1]?.trim();
        return {
            type: 'CREATE_WORKOUT',
            title: title && title.length > 0 ? title.split(/\b(?:for|on|with)\b/)[0].trim() : 'Workout',
            description: `Create workout "${title || 'Workout'}"`,
        };
    }

    // ── ADD EXERCISE ──
    // "add bench press" / "add exercise barbell squat" / "add running 30 minutes 5 km"
    const addExerciseMatch = t.match(/^(?:add|include)\s+(?:exercise\s+)?(.+)/i);
    if (addExerciseMatch && !t.match(/^add\s+(?:\d+\s+)?sets?/i) && !t.match(/^add\s+set/i)) {
        let remainder = addExerciseMatch[1].trim();

        // Check for cardio with duration/distance: "add running 30 minutes 5 km"
        const cardioMatch = remainder.match(/^(.+?)\s+(\d+)\s*(?:minutes?|mins?|m)\s*(?:(\d+\.?\d*)\s*(?:km|kilometers?|kilometres?|k))?/i);
        if (cardioMatch) {
            const exerciseName = cardioMatch[1].trim();
            const matched = fuzzyMatchExercise(exerciseName, context.exercises);
            if (matched && matched.category === 'cardio') {
                return {
                    type: 'ADD_EXERCISE_CARDIO',
                    exerciseId: matched._id,
                    exerciseName: matched.name,
                    duration: parseInt(cardioMatch[2]),
                    distance: cardioMatch[3] ? parseFloat(cardioMatch[3]) : 0,
                    description: `Add ${matched.name} — ${cardioMatch[2]}min${cardioMatch[3] ? `, ${cardioMatch[3]}km` : ''}`,
                };
            }
        }

        // Check for: "add bench press 3 sets 10 reps 60 kg"
        const exerciseWithSetsMatch = remainder.match(/^(.+?)\s+(\d+)\s*sets?\s+(\d+)\s*reps?\s*(?:(\d+\.?\d*)\s*(?:kg|kilos?|pounds?|lbs?|kgs?))?/i);
        if (exerciseWithSetsMatch) {
            const matched = fuzzyMatchExercise(exerciseWithSetsMatch[1].trim(), context.exercises);
            if (matched) {
                return {
                    type: 'ADD_EXERCISE_WITH_SETS',
                    exerciseId: matched._id,
                    exerciseName: matched.name,
                    category: matched.category,
                    setCount: parseInt(exerciseWithSetsMatch[2]),
                    reps: parseInt(exerciseWithSetsMatch[3]),
                    weight: exerciseWithSetsMatch[4] ? parseFloat(exerciseWithSetsMatch[4]) : 0,
                    description: `Add ${matched.name} — ${exerciseWithSetsMatch[2]} sets × ${exerciseWithSetsMatch[3]} reps${exerciseWithSetsMatch[4] ? ` @ ${exerciseWithSetsMatch[4]}kg` : ''}`,
                };
            }
        }

        // Simple exercise add: "add bench press"
        // Strip trailing words that aren't part of exercise names
        const cleanName = remainder.replace(/\s+(?:to|in|into|for)\s+.*$/, '').trim();
        const matched = fuzzyMatchExercise(cleanName, context.exercises);
        if (matched) {
            return {
                type: 'ADD_EXERCISE',
                exerciseId: matched._id,
                exerciseName: matched.name,
                category: matched.category,
                description: `Add ${matched.name}`,
            };
        }

        // No match found — return with the spoken name for error feedback
        return {
            type: 'ADD_EXERCISE',
            exerciseId: null,
            exerciseName: cleanName,
            description: `Exercise "${cleanName}" not found`,
        };
    }

    // ── ADD MULTIPLE SETS ──
    // "add 3 sets 10 reps 60 kg" / "add 3 sets of 12 reps at 50 kg"
    const multiSetMatch = t.match(/^add\s+(\d+)\s*sets?\s+(?:of\s+)?(\d+)\s*reps?\s*(?:(?:at|with|@)?\s*(\d+\.?\d*)\s*(?:kg|kilos?|pounds?|lbs?|kgs?))?/i);
    if (multiSetMatch) {
        return {
            type: 'ADD_MULTIPLE_SETS',
            count: parseInt(multiSetMatch[1]),
            reps: parseInt(multiSetMatch[2]),
            weight: multiSetMatch[3] ? parseFloat(multiSetMatch[3]) : 0,
            description: `Add ${multiSetMatch[1]} sets × ${multiSetMatch[2]} reps${multiSetMatch[3] ? ` @ ${multiSetMatch[3]}kg` : ''}`,
        };
    }

    // ── ADD SINGLE SET ──
    // "add set 12 reps 60 kg" / "add set 10 reps" / "set 12 reps 60 kg"
    const setMatch = t.match(/^(?:add\s+)?set\s+(?:with\s+)?(\d+)\s*reps?\s*(?:(?:at|with|@|and)?\s*(\d+\.?\d*)\s*(?:kg|kilos?|pounds?|lbs?|kgs?))?/i);
    if (setMatch) {
        return {
            type: 'ADD_SET',
            reps: parseInt(setMatch[1]),
            weight: setMatch[2] ? parseFloat(setMatch[2]) : 0,
            description: `Add set — ${setMatch[1]} reps${setMatch[2] ? ` @ ${setMatch[2]}kg` : ''}`,
        };
    }

    // ── UPDATE SET ──
    // "update set 2 to 15 reps 70 kg" / "change set 1 to 8 reps 80 kg"
    const updateSetMatch = t.match(/(?:update|change|modify|edit)\s+set\s+(\d+)\s+(?:to\s+)?(\d+)\s*reps?\s*(?:(?:at|with|@|and)?\s*(\d+\.?\d*)\s*(?:kg|kilos?|pounds?|lbs?|kgs?))?/i);
    if (updateSetMatch) {
        return {
            type: 'UPDATE_SET',
            setNumber: parseInt(updateSetMatch[1]),
            reps: parseInt(updateSetMatch[2]),
            weight: updateSetMatch[3] ? parseFloat(updateSetMatch[3]) : 0,
            description: `Update set ${updateSetMatch[1]} — ${updateSetMatch[2]} reps${updateSetMatch[3] ? ` @ ${updateSetMatch[3]}kg` : ''}`,
        };
    }

    // ── REMOVE SET ──
    // "remove last set" / "delete set 3" / "remove set"
    const removeSetMatch = t.match(/(?:remove|delete)\s+(?:the\s+)?(?:(last)\s+)?set\s*(\d+)?/i);
    if (removeSetMatch) {
        return {
            type: 'REMOVE_SET',
            setNumber: removeSetMatch[1] === 'last' ? -1 : (removeSetMatch[2] ? parseInt(removeSetMatch[2]) : -1),
            description: removeSetMatch[1] === 'last' ? 'Remove last set' : `Remove set ${removeSetMatch[2] || 'last'}`,
        };
    }

    // ── REMOVE EXERCISE ──
    // "remove bench press" / "delete squat"
    const removeExMatch = t.match(/(?:remove|delete)\s+(?:exercise\s+)?(.+)/i);
    if (removeExMatch) {
        const exName = removeExMatch[1].trim().replace(/\s+(?:from|in)\s+.*$/, '');
        const matched = fuzzyMatchExercise(exName, context.exercises);
        if (matched) {
            return {
                type: 'REMOVE_EXERCISE',
                exerciseId: matched._id,
                exerciseName: matched.name,
                description: `Remove ${matched.name}`,
            };
        }
    }

    // ── LOG MEAL ──
    // "log 2 eggs for breakfast" / "log chicken breast 200 grams for lunch"
    const logMealMatch = t.match(/^(?:log|add|record)\s+(?:(\d+\.?\d*)\s+)?(.+?)(?:\s+(\d+\.?\d*)\s*(?:grams?|g))?\s+(?:for\s+|as\s+)?(breakfast|lunch|dinner|snack)/i);
    if (logMealMatch && context.foods) {
        const quantity = logMealMatch[1] ? parseFloat(logMealMatch[1]) : (logMealMatch[3] ? parseFloat(logMealMatch[3]) : 1);
        const foodName = logMealMatch[2].trim();
        const mealType = logMealMatch[4].toLowerCase();
        const matched = fuzzyMatchFood(foodName, context.foods);

        if (matched) {
            return {
                type: 'LOG_MEAL',
                foodId: matched._id,
                foodName: matched.name,
                quantity,
                mealType,
                description: `Log ${quantity} ${matched.servingUnit || 'serving'}(s) of ${matched.name} for ${mealType}`,
            };
        }

        return {
            type: 'LOG_MEAL',
            foodId: null,
            foodName,
            quantity,
            mealType,
            description: `Food "${foodName}" not found`,
        };
    }

    // ── Simpler meal log: "log eggs breakfast" / "log chicken lunch"
    const simpleMealMatch = t.match(/^(?:log|add|record)\s+(.+?)\s+(?:for\s+)?(breakfast|lunch|dinner|snack)/i);
    if (simpleMealMatch && context.foods) {
        let foodPart = simpleMealMatch[1].trim();
        const mealType = simpleMealMatch[2].toLowerCase();

        // Extract leading number as quantity
        const qtyMatch = foodPart.match(/^(\d+\.?\d*)\s+/);
        const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        if (qtyMatch) foodPart = foodPart.replace(qtyMatch[0], '').trim();

        const matched = fuzzyMatchFood(foodPart, context.foods);
        if (matched) {
            return {
                type: 'LOG_MEAL',
                foodId: matched._id,
                foodName: matched.name,
                quantity,
                mealType,
                description: `Log ${quantity} ${matched.servingUnit || 'serving'}(s) of ${matched.name} for ${mealType}`,
            };
        }
    }

    // ── DELETE WORKOUT ──
    // "delete workout" / "remove workout"
    if (t.match(/(?:delete|remove)\s+(?:this\s+)?workout/i)) {
        return {
            type: 'DELETE_WORKOUT',
            description: 'Delete current workout',
        };
    }

    return null;
}

export { fuzzyMatchExercise, fuzzyMatchFood, extractNumber };
