import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';
import type { VoiceAction, ParserContext, SuggestionResult } from '../utils/voiceCommandParser';
import { generateSuggestions } from '../utils/voiceCommandParser';
import useVoiceCommand, { type VoiceAIResult, type VoiceContext } from './useVoiceCommand';

interface VoiceActionResult {
    success: boolean;
    action: VoiceAction;
    message: string;
}

interface UseVoiceActionsProps {
    context: ParserContext;
    onActionComplete?: (result: VoiceActionResult) => void;
    onRefresh?: () => void;
}

// ── Confirmation state ────────────────────────────────────────────────────────
// When the LLM returns an action, it is held here pending user confirmation
// instead of auto-executing — prevents false-positive executions.
export interface PendingConfirmation {
    transcript: string;
    action: VoiceAction;
    /** Human-readable description of what WILL happen if the user confirms */
    summary: string;
    /** Alternative suggestions the user can tap instead */
    suggestions: SuggestionResult[];
}

// ── Pretty-print a recognized action for the confirmation card ───────────────
function describeAction(action: VoiceAction): string {
    switch (action.type) {
        case 'LOG_MEAL':
            return `Log ${action.quantity} ${action.servingUnit ?? 'serving(s) of'} ${action.foodName} for ${action.mealType}`;
        case 'ADD_EXERCISE':
        case 'ADD_EXERCISE_WITH_SETS':
            return `Add ${action.exerciseName}${action.setCount ? ` — ${action.setCount} sets × ${action.reps} reps` : ''}${action.weight ? ` @ ${action.weight}kg` : ''}`;
        case 'ADD_EXERCISE_CARDIO':
            return `Add ${action.exerciseName} — ${action.duration} min${action.distance ? `, ${action.distance}km` : ''}`;
        case 'ADD_SET':
            return `Add set — ${action.reps} reps${action.weight ? ` @ ${action.weight}kg` : ''}`;
        case 'ADD_MULTIPLE_SETS':
            return `Add ${action.count} sets × ${action.reps} reps${action.weight ? ` @ ${action.weight}kg` : ''}`;
        case 'CREATE_WORKOUT':
            return `Create workout "${action.title}"`;
        case 'DELETE_WORKOUT':
            return 'Delete current workout';
        default:
            return action.description ?? action.type;
    }
}

const useVoiceActions = ({ context, onActionComplete, onRefresh }: UseVoiceActionsProps) => {
    const [processing, setProcessing] = useState(false);
    const [lastAction, setLastAction] = useState<VoiceAction | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
    // Confirmation gate — set when the LLM parses an action; cleared after confirm/dismiss
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
    const contextRef = useRef(context);
    contextRef.current = context;

    // Track conversational context
    const conversationRef = useRef<{
        lastWorkoutId: string | null;
        lastExerciseEntryIndex: number | null;
        lastExerciseId: string | null;
        lastExerciseName: string | null;
    }>({ lastWorkoutId: null, lastExerciseEntryIndex: null, lastExerciseId: null, lastExerciseName: null });

    const executeAction = useCallback(async (action: VoiceAction) => {
        const ctx = contextRef.current;
        const conv = conversationRef.current;
        const activeWorkoutId = ctx.activeWorkoutId || conv.lastWorkoutId;

        setProcessing(true);
        setLastAction(action);
        setFeedback(action.description || 'Processing...');

        try {
            switch (action.type) {
                case 'CREATE_WORKOUT': {
                    const { data } = await API.post('/workouts', {
                        date: new Date().toISOString(),
                        title: action.title || 'Workout',
                        duration: 0,
                        entries: [],
                    });
                    conv.lastWorkoutId = data._id;
                    conv.lastExerciseEntryIndex = null;
                    conv.lastExerciseId = null;
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Created workout "${action.title}"` });
                    return;
                }

                case 'ADD_EXERCISE': {
                    if (!action.exerciseId) {
                        const msg = `Couldn't find exercise "${action.exerciseName}" — did you mean one of these?`;
                        setSuggestions(generateSuggestions(
                            `add ${action.exerciseName}`,
                            contextRef.current,
                        ));
                        onActionComplete?.({ success: false, action, message: msg });
                        return;
                    }
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout. Say "Create workout" first.' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) {
                        onActionComplete?.({ success: false, action, message: 'Workout not found' });
                        return;
                    }

                    const existingEntries = workout.entries?.map((e: any) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: e.sets || [],
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    })) || [];

                    const isCardio = action.category === 'cardio';
                    await API.put(`/workouts/${activeWorkoutId}`, {
                        entries: [...existingEntries, {
                            exerciseId: action.exerciseId,
                            sets: isCardio ? [] : [{ reps: 0, weight: 0 }],
                            duration: 0,
                            distance: 0,
                        }],
                    });

                    conv.lastExerciseEntryIndex = existingEntries.length;
                    conv.lastExerciseId = action.exerciseId;
                    conv.lastExerciseName = action.exerciseName || null;
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Added ${action.exerciseName}` });
                    return;
                }

                case 'ADD_EXERCISE_WITH_SETS': {
                    if (!action.exerciseId || !activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: !action.exerciseId ? `Exercise "${action.exerciseName}" not found` : 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) return;

                    const existingEntries = workout.entries?.map((e: any) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: e.sets || [],
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    })) || [];

                    const sets = Array.from({ length: action.setCount }, () => ({
                        reps: action.reps,
                        weight: action.weight,
                    }));

                    await API.put(`/workouts/${activeWorkoutId}`, {
                        entries: [...existingEntries, {
                            exerciseId: action.exerciseId,
                            sets,
                            duration: 0,
                            distance: 0,
                        }],
                    });

                    conv.lastExerciseEntryIndex = existingEntries.length;
                    conv.lastExerciseId = action.exerciseId;
                    conv.lastExerciseName = action.exerciseName || null;
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Added ${action.exerciseName} — ${action.setCount} sets` });
                    return;
                }

                case 'ADD_EXERCISE_CARDIO': {
                    if (!action.exerciseId || !activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: !action.exerciseId ? `Exercise not found` : 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) return;

                    const existingEntries = workout.entries?.map((e: any) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: e.sets || [],
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    })) || [];

                    await API.put(`/workouts/${activeWorkoutId}`, {
                        entries: [...existingEntries, {
                            exerciseId: action.exerciseId,
                            sets: [],
                            duration: action.duration || 0,
                            distance: action.distance || 0,
                        }],
                    });

                    conv.lastExerciseEntryIndex = existingEntries.length;
                    conv.lastExerciseId = action.exerciseId;
                    conv.lastExerciseName = action.exerciseName || null;
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Added ${action.exerciseName} — ${action.duration}min` });
                    return;
                }

                case 'ADD_SET': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout || !workout.entries?.length) {
                        onActionComplete?.({ success: false, action, message: 'No exercises in workout. Add an exercise first.' });
                        return;
                    }

                    const entryIndex = conv.lastExerciseEntryIndex ?? (workout.entries.length - 1);

                    const updatedEntries = workout.entries.map((e: any, i: number) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: i === entryIndex
                            ? [...(e.sets || []), { reps: action.reps, weight: action.weight }]
                            : (e.sets || []),
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    }));

                    await API.put(`/workouts/${activeWorkoutId}`, { entries: updatedEntries });
                    onRefresh?.();
                    const exName = workout.entries[entryIndex]?.exerciseId?.name || 'exercise';
                    onActionComplete?.({ success: true, action, message: `Added set to ${exName} — ${action.reps} reps @ ${action.weight}kg` });
                    return;
                }

                case 'ADD_MULTIPLE_SETS': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout || !workout.entries?.length) {
                        onActionComplete?.({ success: false, action, message: 'No exercises in workout' });
                        return;
                    }

                    const entryIndex = conv.lastExerciseEntryIndex ?? (workout.entries.length - 1);
                    const newSets = Array.from({ length: action.count }, () => ({
                        reps: action.reps,
                        weight: action.weight,
                    }));

                    const updatedEntries = workout.entries.map((e: any, i: number) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: i === entryIndex
                            ? [...(e.sets || []), ...newSets]
                            : (e.sets || []),
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    }));

                    await API.put(`/workouts/${activeWorkoutId}`, { entries: updatedEntries });
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Added ${action.count} sets — ${action.reps} reps @ ${action.weight}kg` });
                    return;
                }

                case 'UPDATE_SET': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) return;

                    const entryIndex = conv.lastExerciseEntryIndex ?? (workout.entries.length - 1);
                    const setIndex = action.setNumber - 1;

                    const entry = workout.entries[entryIndex];
                    if (!entry?.sets?.[setIndex]) {
                        onActionComplete?.({ success: false, action, message: `Set ${action.setNumber} not found` });
                        return;
                    }

                    const updatedEntries = workout.entries.map((e: any, i: number) => {
                        const sets = [...(e.sets || [])];
                        if (i === entryIndex) {
                            sets[setIndex] = { reps: action.reps, weight: action.weight };
                        }
                        return {
                            exerciseId: e.exerciseId?._id || e.exerciseId,
                            sets,
                            duration: e.duration || 0,
                            distance: e.distance || 0,
                        };
                    });

                    await API.put(`/workouts/${activeWorkoutId}`, { entries: updatedEntries });
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Updated set ${action.setNumber}` });
                    return;
                }

                case 'REMOVE_SET': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) return;

                    const entryIndex = conv.lastExerciseEntryIndex ?? (workout.entries.length - 1);
                    const entry = workout.entries[entryIndex];
                    if (!entry?.sets?.length) {
                        onActionComplete?.({ success: false, action, message: 'No sets to remove' });
                        return;
                    }

                    const setIdx = action.setNumber === -1 ? entry.sets.length - 1 : action.setNumber - 1;

                    const updatedEntries = workout.entries.map((e: any, i: number) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: i === entryIndex
                            ? e.sets.filter((_: any, si: number) => si !== setIdx)
                            : (e.sets || []),
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    }));

                    await API.put(`/workouts/${activeWorkoutId}`, { entries: updatedEntries });
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: 'Set removed' });
                    return;
                }

                case 'REMOVE_EXERCISE': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout' });
                        return;
                    }

                    const workout = ctx.workouts.find(w => w._id === activeWorkoutId);
                    if (!workout) return;

                    const removeIndex = workout.entries.findIndex(
                        (e: any) => (e.exerciseId?._id || e.exerciseId) === action.exerciseId
                    );

                    if (removeIndex === -1) {
                        onActionComplete?.({ success: false, action, message: `${action.exerciseName} not in this workout` });
                        return;
                    }

                    const updatedEntries = workout.entries
                        .filter((_: any, i: number) => i !== removeIndex)
                        .map((e: any) => ({
                            exerciseId: e.exerciseId?._id || e.exerciseId,
                            sets: e.sets || [],
                            duration: e.duration || 0,
                            distance: e.distance || 0,
                        }));

                    await API.put(`/workouts/${activeWorkoutId}`, { entries: updatedEntries });

                    if (conv.lastExerciseEntryIndex === removeIndex) {
                        conv.lastExerciseEntryIndex = null;
                        conv.lastExerciseId = null;
                    }
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Removed ${action.exerciseName}` });
                    return;
                }

                case 'LOG_MEAL': {
                    if (!action.foodId) {
                        const msg = `Couldn't find "${action.foodName}" — did you mean one of these?`;
                        setSuggestions(generateSuggestions(
                            `add ${action.quantity ?? 1} ${action.foodName} for ${action.mealType}`,
                            contextRef.current,
                        ));
                        onActionComplete?.({ success: false, action, message: msg });
                        return;
                    }

                    await API.post('/meals', {
                        date: new Date().toISOString(),
                        mealType: action.mealType,
                        foodItemId: action.foodId,
                        quantity: action.quantity,
                    });

                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: `Logged ${action.foodName} for ${action.mealType}` });
                    return;
                }

                case 'DELETE_WORKOUT': {
                    if (!activeWorkoutId) {
                        onActionComplete?.({ success: false, action, message: 'No active workout to delete' });
                        return;
                    }
                    await API.delete(`/workouts/${activeWorkoutId}`);
                    conv.lastWorkoutId = null;
                    conv.lastExerciseEntryIndex = null;
                    conv.lastExerciseId = null;
                    onRefresh?.();
                    onActionComplete?.({ success: true, action, message: 'Workout deleted' });
                    return;
                }

                default:
                    onActionComplete?.({ success: false, action, message: 'Unknown command' });
            }
        } catch (err: any) {
            console.error('Voice action error:', err);
            onActionComplete?.({ success: false, action, message: err?.response?.data?.message || 'Action failed' });
        } finally {
            setProcessing(false);
        }
    }, [onActionComplete, onRefresh]);

    // ── Confirmation gate ─────────────────────────────────────────────────────
    // Accepts confirmed pending action and executes it
    const confirmPending = useCallback(async () => {
        if (!pendingConfirmation) return;
        const action = pendingConfirmation.action;
        setPendingConfirmation(null);
        setSuggestions([]);
        await executeAction(action);
    }, [pendingConfirmation, executeAction]);

    // Dismiss without executing
    const dismissConfirmation = useCallback(() => {
        setPendingConfirmation(null);
        setSuggestions([]);
    }, []);

    // Execute a suggestion alternative (replaces pending)
    const executeSuggestionAction = useCallback(async (s: SuggestionResult) => {
        setPendingConfirmation(null);
        setSuggestions([]);
        await executeAction(s.action);
    }, [executeAction]);

    const handleVoiceResult = useCallback(async (result: VoiceAIResult) => {
        const { actions, transcript } = result;

        // ── No recognizable action ─────────────────────────────────────────────
        if (!actions || actions.length === 0) {
            const sug = generateSuggestions(transcript, contextRef.current);
            setSuggestions(sug);
            setFeedback('');
            const msg = sug.length > 0
                ? `Couldn't understand "${transcript}" — did you mean one of these?`
                : `Couldn't understand: "${transcript}"`;
            onActionComplete?.({
                success: false,
                action: { type: 'UNKNOWN', description: transcript },
                message: msg,
            });
            return;
        }

        // Filter out UNKNOWN actions if there are real ones alongside
        const validActions = actions.filter(a => a.type !== 'UNKNOWN');
        const toProcess = validActions.length > 0 ? validActions : actions;

        for (const action of toProcess) {
            if (action.type === 'UNKNOWN') {
                const sug = generateSuggestions(transcript, contextRef.current);
                setSuggestions(sug);
                setFeedback('');
                const msg = sug.length > 0
                    ? `Couldn't understand "${transcript}" — did you mean one of these?`
                    : action.message || `Couldn't understand: "${transcript}"`;
                onActionComplete?.({ success: false, action, message: msg });
            } else {
                // ── CONFIRMATION GATE: don't execute yet — show confirmation card ──
                setSuggestions([]);
                const summary = describeAction(action);
                const altSuggestions = generateSuggestions(transcript, contextRef.current)
                    .filter(s => s.action.type !== action.type || s.label !== summary)
                    .slice(0, 4);

                setPendingConfirmation({
                    transcript,
                    action,
                    summary,
                    suggestions: altSuggestions,
                });
                // Don't call executeAction — wait for user to confirm
            }
        }
    }, [executeAction, onActionComplete]);

    // Build the AI context payload from ParserContext
    const voiceContext: VoiceContext = {
        exercises: (context.exercises || []).map(e => ({
            id: e._id,
            name: e.name,
            category: e.category,
        })),
        foods: (context.foods || []).map((f: any) => ({
            id: f._id,
            name: f.name,
            servingUnit: f.servingUnit,
        })),
        activeWorkoutId: context.activeWorkoutId || conversationRef.current.lastWorkoutId,
        lastExerciseName: conversationRef.current.lastExerciseName,
    };

    const voice = useVoiceCommand({
        context: voiceContext,
        onResult: handleVoiceResult,
    });

    // Update conversation context when activeWorkoutId changes externally
    if (context.activeWorkoutId && context.activeWorkoutId !== conversationRef.current.lastWorkoutId) {
        conversationRef.current.lastWorkoutId = context.activeWorkoutId;
    }

    // ── clearAll: wipe history/suggestions/pending when user records again ────
    const clearAll = useCallback(() => {
        setSuggestions([]);
        setPendingConfirmation(null);
        setFeedback('');
    }, []);

    return {
        ...voice,
        processing,
        lastAction,
        feedback,
        suggestions,
        clearSuggestions: () => setSuggestions([]),
        clearAll,
        executeSuggestion: executeSuggestionAction,
        // Confirmation API
        pendingConfirmation,
        confirmPending,
        dismissConfirmation,
    };
};

export default useVoiceActions;
