import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';
import type { VoiceAction, ParserContext } from '../utils/voiceCommandParser';
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

const useVoiceActions = ({ context, onActionComplete, onRefresh }: UseVoiceActionsProps) => {
    const [processing, setProcessing] = useState(false);
    const [lastAction, setLastAction] = useState<VoiceAction | null>(null);
    const [feedback, setFeedback] = useState<string>('');
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
                        onActionComplete?.({ success: false, action, message: `Exercise "${action.exerciseName}" not found` });
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

                    // Use last exercise entry, or the last entry if no context
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
                    const setIndex = action.setNumber - 1; // 1-indexed to 0-indexed

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

                    // -1 means last set
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

                    // Update conversation context
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
                        onActionComplete?.({ success: false, action, message: `Food "${action.foodName}" not found` });
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

    const handleVoiceResult = useCallback(async (result: VoiceAIResult) => {
        const { actions } = result;

        if (!actions || actions.length === 0) {
            const msg = `Didn't understand: "${result.transcript}"`;
            setFeedback(msg);
            onActionComplete?.({
                success: false,
                action: { type: 'UNKNOWN', description: result.transcript },
                message: msg,
            });
            return;
        }

        // Filter out UNKNOWN actions if there are real ones alongside
        const validActions = actions.filter(a => a.type !== 'UNKNOWN');
        const toExecute = validActions.length > 0 ? validActions : actions;

        // Execute each action sequentially
        for (const action of toExecute) {
            if (action.type === 'UNKNOWN') {
                const msg = action.message || `Didn't understand: "${result.transcript}"`;
                setFeedback(msg);
                onActionComplete?.({
                    success: false,
                    action,
                    message: msg,
                });
            } else {
                await executeAction(action);
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

    return {
        ...voice,
        processing,
        lastAction,
        feedback,
    };
};

export default useVoiceActions;
