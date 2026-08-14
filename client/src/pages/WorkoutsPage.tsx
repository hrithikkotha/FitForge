import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';
import { Plus, Dumbbell, Trash2, X, Edit3, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import DatePicker from '../components/DatePicker';
import VoiceAssistant from '../components/VoiceAssistant';
import ExercisePicker from '../components/ExercisePicker';

interface Exercise {
    _id: string;
    name: string;
    category: string;
    muscleGroups: string[];
}

const ALL_MUSCLES = [
    'chest', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms',
    'abs', 'obliques', 'lats', 'lower_back', 'glutes', 'quads',
    'hamstrings', 'calves',
];

const WorkoutsPage = () => {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

    // Add exercise to workout
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [activeWorkoutForPicker, setActiveWorkoutForPicker] = useState<string | null>(null);

    // Custom exercise modal
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customCategory, setCustomCategory] = useState('strength');
    const [customMuscles, setCustomMuscles] = useState<string[]>([]);

    // Creating new workout for today
    const [showNewWorkoutModal, setShowNewWorkoutModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    // Delete confirmation modal
    const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
    const { toasts, show: showToast, dismiss } = useToast();
    const [pageLoading, setPageLoading] = useState(true);

    // ✅ P2-10: Add date range filter to prevent unbounded data loading
    const [dateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    // Note: setDateRange can be added later for UI controls to change date range

    // Loading states
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Cache for pending changes - persisted to localStorage
    const pendingChanges = useRef<Record<string, any>>({});
    const saveInterval = useRef<number | null>(null);
    const CACHE_KEY = `workout_cache_${user?._id || 'temp'}`;

    useEffect(() => {
        // Restore cache from localStorage on mount
        const savedCache = localStorage.getItem(CACHE_KEY);
        if (savedCache) {
            try {
                pendingChanges.current = JSON.parse(savedCache);
            } catch (err) {
                console.error('Failed to restore cache:', err);
            }
        }

        loadData();

        // Auto-save interval: flush cache to DB every 30 seconds
        saveInterval.current = setInterval(() => {
            flushPendingChanges();
        }, 30000);

        // Also try to flush immediately on mount (in case of reload with pending changes)
        setTimeout(() => flushPendingChanges(), 1000);

        return () => {
            // Cleanup: flush any pending changes before unmount
            flushPendingChanges();
            if (saveInterval.current) clearInterval(saveInterval.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = useCallback(async () => {
        try {
            // ✅ P2-10: Add date range parameters to prevent loading all workouts
            const [exRes, wkRes] = await Promise.all([
                API.get('/exercises'),
                API.get(`/workouts?from=${dateRange.from}&to=${dateRange.to}`),
            ]);
            setExercises(exRes.data);
            const loadedWorkouts = wkRes.data.sessions ?? wkRes.data;

            // Apply any pending cached changes on top of loaded data
            const mergedWorkouts = loadedWorkouts.map((w: any) => {
                if (pendingChanges.current[w._id]) {
                    return { ...w, entries: pendingChanges.current[w._id] };
                }
                return w;
            });

            setWorkouts(mergedWorkouts);
        } catch (err) {
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    }, [dateRange.from, dateRange.to]);

    // Flush pending changes to DB
    const flushPendingChanges = async () => {
        if (!pendingChanges.current) return;
        const workoutIds = Object.keys(pendingChanges.current);
        if (workoutIds.length === 0) return;

        const savePromises = workoutIds.map(async (workoutId) => {
            const entries = pendingChanges.current[workoutId];

            // Convert exerciseId objects to IDs for API
            const entriesForAPI = entries.map((e: any) => ({
                exerciseId: e.exerciseId?._id || e.exerciseId,
                sets: e.sets || [],
                duration: e.duration || 0,
                distance: e.distance || 0,
            }));

            try {
                await API.put(`/workouts/${workoutId}`, { entries: entriesForAPI });
                // Success - remove from cache
                delete pendingChanges.current[workoutId];

                // Update localStorage
                localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));

                return { success: true, workoutId, notFound: false };
            } catch (err: any) {
                console.error('Failed to save workout:', workoutId, err);

                // If workout was deleted (404), remove from cache and don't retry
                if (err.response?.status === 404) {
                    console.log('Workout not found, removing from cache:', workoutId);
                    delete pendingChanges.current[workoutId];
                    localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
                    return { success: false, workoutId, notFound: true };
                }

                // For other errors, keep in cache for retry
                return { success: false, workoutId, notFound: false };
            }
        });

        const results = await Promise.allSettled(savePromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const notFoundCount = results.filter(r => r.status === 'fulfilled' && r.value.notFound).length;
        const failedCount = workoutIds.length - successCount - notFoundCount;

        if (successCount > 0) {
            showToast(`Saved ${successCount} workout(s)`);
        }

        if (failedCount > 0) {
            showToast(`Failed to save ${failedCount} workout(s), will retry`, 'error');
        }

        // Update unsaved changes indicator
        setHasUnsavedChanges(Object.keys(pendingChanges.current).length > 0);
    };

    // Create new workout (just title + date, no exercises yet)
    const createWorkout = async () => {
        try {
            const { data } = await API.post('/workouts', {
                date: new Date(newDate).toISOString(),
                title: newTitle || 'Workout',
                duration: 0,
                entries: [],
            });
            setShowNewWorkoutModal(false);
            setNewTitle('');
            setNewDate(new Date().toISOString().split('T')[0]);
            await loadData();
            setExpandedWorkout(data._id);
            showToast('Workout created successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to create workout', 'error');
        }
    };

    // Add exercise entry to existing workout
    const addExerciseToWorkout = async (exerciseId: string) => {
        if (!activeWorkoutForPicker) return;
        const workout = workouts.find(w => w._id === activeWorkoutForPicker);
        if (!workout) return;

        const existingEntries = workout.entries?.map((e: any) => ({
            exerciseId: e.exerciseId?._id || e.exerciseId,
            sets: e.sets || [],
            duration: e.duration || 0,
            distance: e.distance || 0,
        })) || [];

        const ex = exercises.find(e => e._id === exerciseId);
        const isCardio = ex?.category === 'cardio';

        try {
            await API.put(`/workouts/${activeWorkoutForPicker}`, {
                entries: [
                    ...existingEntries,
                    {
                        exerciseId: exerciseId,
                        sets: isCardio ? [] : [{ reps: 0, weight: 0 }],
                        duration: 0,
                        distance: 0,
                    },
                ],
            });

            // Clear any pending changes for this workout since we just saved
            if (pendingChanges.current[activeWorkoutForPicker]) {
                delete pendingChanges.current[activeWorkoutForPicker];
                localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
                setHasUnsavedChanges(Object.keys(pendingChanges.current).length > 0);
            }

            setShowExercisePicker(false);
            setActiveWorkoutForPicker(null);
            loadData();
            showToast('Exercise added to workout');
        } catch (err) {
            console.error(err);
            showToast('Failed to add exercise', 'error');
        }
    };

    // Remove exercise entry from workout
    const removeExerciseFromWorkout = async (workoutId: string, entryIndex: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const updatedEntries = workout.entries
            .filter((_: any, i: number) => i !== entryIndex)
            .map((e: any) => ({
                exerciseId: e.exerciseId?._id || e.exerciseId,
                sets: e.sets || [],
                duration: e.duration || 0,
                distance: e.distance || 0,
            }));

        try {
            await API.put(`/workouts/${workoutId}`, { entries: updatedEntries });

            // Clear any pending changes for this workout since we just saved
            if (pendingChanges.current[workoutId]) {
                delete pendingChanges.current[workoutId];
                localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
                setHasUnsavedChanges(Object.keys(pendingChanges.current).length > 0);
            }

            loadData();
            showToast('Exercise removed');
        } catch (err) {
            console.error(err);
            showToast('Failed to remove exercise', 'error');
        }
    };

    // Add set to a specific exercise in a workout - cache-first
    const addSetToExercise = (workoutId: string, entryIndex: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        // Get current cached entries or use workout entries
        const currentEntries = pendingChanges.current[workoutId] || workout.entries;

        // Add new set to the specific exercise entry, keeping full exerciseId object
        const updatedEntries = currentEntries.map((e: any, i: number) => {
            if (i === entryIndex) {
                return {
                    ...e,
                    sets: [...(e.sets || []), { reps: 0, weight: 0 }],
                };
            }
            return e;
        });

        // Write to cache immediately
        pendingChanges.current[workoutId] = updatedEntries;
        localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
        setHasUnsavedChanges(true);

        // Update local state for instant UI feedback
        setWorkouts(prev => prev.map(w =>
            w._id === workoutId ? { ...w, entries: updatedEntries } : w
        ));
    };

    // Delete a specific set - cache-first
    const deleteSet = (workoutId: string, entryIndex: number, setIndex: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        // Get current cached entries or use workout entries
        const currentEntries = pendingChanges.current[workoutId] || workout.entries;

        // Remove the set from the specific exercise entry, keeping full exerciseId object
        const updatedEntries = currentEntries.map((e: any, i: number) => {
            if (i === entryIndex) {
                return {
                    ...e,
                    sets: e.sets.filter((_: any, si: number) => si !== setIndex),
                };
            }
            return e;
        });

        // Write to cache immediately
        pendingChanges.current[workoutId] = updatedEntries;
        localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
        setHasUnsavedChanges(true);

        // Update local state for instant UI feedback
        setWorkouts(prev => prev.map(w =>
            w._id === workoutId ? { ...w, entries: updatedEntries } : w
        ));
    };

    // Update set values - cache-first (no immediate API call)
    const updateSet = (workoutId: string, entryIndex: number, setIndex: number, field: 'reps' | 'weight', val: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        // Get current cached entries or use workout entries
        const currentEntries = pendingChanges.current[workoutId] || workout.entries;

        const updatedEntries = currentEntries.map((e: any, i: number) => {
            const sets = [...(e.sets || [])];
            if (i === entryIndex) {
                sets[setIndex] = { ...sets[setIndex], [field]: val };
            }
            return {
                exerciseId: e.exerciseId, // Keep full object for UI display
                sets,
                duration: e.duration || 0,
                distance: e.distance || 0,
            };
        });

        // Save to cache immediately
        pendingChanges.current[workoutId] = updatedEntries;

        // Persist to localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));

        // Indicate unsaved changes
        setHasUnsavedChanges(true);

        // Update UI immediately
        setWorkouts(prev => prev.map(w =>
            w._id === workoutId ? { ...w, entries: updatedEntries } : w
        ));
    };

    // Update cardio fields - cache-first (no immediate API call)
    const updateCardioField = (workoutId: string, entryIndex: number, field: 'duration' | 'distance', val: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        // Get current cached entries or use workout entries
        const currentEntries = pendingChanges.current[workoutId] || workout.entries;

        const updatedEntries = currentEntries.map((e: any, i: number) => ({
            exerciseId: e.exerciseId, // Keep full object for UI display
            sets: e.sets || [],
            duration: i === entryIndex && field === 'duration' ? val : (e.duration || 0),
            distance: i === entryIndex && field === 'distance' ? val : (e.distance || 0),
        }));

        // Save to cache immediately
        pendingChanges.current[workoutId] = updatedEntries;

        // Persist to localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));

        // Indicate unsaved changes
        setHasUnsavedChanges(true);

        // Update UI immediately
        setWorkouts(prev => prev.map(w =>
            w._id === workoutId ? { ...w, entries: updatedEntries } : w
        ));
    };

    // Delete workout
    const confirmDeleteWorkout = (id: string) => {
        setDeleteWorkoutId(id);
    };

    const handleDeleteWorkout = async () => {
        if (!deleteWorkoutId) return;
        try {
            await API.delete(`/workouts/${deleteWorkoutId}`);

            // Clear any pending changes for this workout from cache
            if (pendingChanges.current[deleteWorkoutId]) {
                delete pendingChanges.current[deleteWorkoutId];
                localStorage.setItem(CACHE_KEY, JSON.stringify(pendingChanges.current));
                setHasUnsavedChanges(Object.keys(pendingChanges.current).length > 0);
            }

            setDeleteWorkoutId(null);
            loadData();
            showToast('Workout deleted successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete workout', 'error');
        }
    };

    // Create custom exercise
    const createCustomExercise = async () => {
        if (!customName.trim() || customMuscles.length === 0) return;
        try {
            await API.post('/exercises', {
                name: customName.trim(),
                category: customCategory,
                muscleGroups: customMuscles,
            });
            setShowCustomModal(false);
            setCustomName('');
            setCustomCategory('strength');
            setCustomMuscles([]);
            loadData();
            showToast('Custom exercise created');
        } catch (err) {
            console.error(err);
            showToast('Failed to create exercise', 'error');
        }
    };

    const toggleMuscle = (m: string) => {
        setCustomMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    const muscleLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const totalSets = (entries: any[]) => entries?.reduce((s: number, e: any) => s + (e.sets?.length || 0), 0) || 0;

    if (pageLoading) return <PageLoader />;

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2>Workouts</h2>
                    <p>
                        Log and dynamically build your training sessions
                        {hasUnsavedChanges && (
                            <span style={{ marginLeft: 8, fontSize: '0.85rem', color: 'var(--accent-warning)', fontWeight: 600 }}>
                                • Unsaved changes (auto-saving...)
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCustomModal(true)}>
                        <Edit3 size={16} /> Custom Exercise
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowNewWorkoutModal(true)}>
                        <Plus size={18} /> New Workout
                    </button>
                </div>
            </div>

            {/* Workout Cards */}
            {workouts.length > 0 ? (
                workouts.map(w => {
                    const isExpanded = expandedWorkout === w._id;
                    return (
                        <div key={w._id} className="today-workout-card slide-up">
                            {/* Header */}
                            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedWorkout(isExpanded ? null : w._id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Dumbbell size={20} style={{ color: 'var(--accent-primary)' }} />
                                    <div>
                                        <h3 style={{ fontSize: '1rem' }}>{w.title}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(w.date).toLocaleDateString()} · {w.entries?.length || 0} exercises · {totalSets(w.entries)} sets
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button className="btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); confirmDeleteWorkout(w._id); }}>
                                        <Trash2 size={14} />
                                    </button>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div style={{ marginTop: 8 }}>
                                    {/* Exercise blocks */}
                                    {w.entries?.map((entry: any, eIdx: number) => {
                                        const ex = entry.exerciseId;
                                        const isCardio = ex?.category === 'cardio';
                                        return (
                                            <div key={eIdx} className="exercise-block">
                                                <div className="exercise-block-header">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <h4>{ex?.name || 'Unknown'}</h4>
                                                        <span className={`badge badge-${ex?.category || 'strength'}`}>
                                                            {ex?.category || 'strength'}
                                                        </span>
                                                    </div>
                                                    <button className="btn-icon btn-sm" onClick={() => removeExerciseFromWorkout(w._id, eIdx)}>
                                                        <X size={14} />
                                                    </button>
                                                </div>

                                                {isCardio ? (
                                                    <div className="form-row">
                                                        <div className="set-row" style={{ margin: 0, position: 'relative' }}>
                                                            <span className="set-label">Dur(m)</span>
                                                            <input
                                                                type="number"
                                                                inputMode="numeric"
                                                                min="0"
                                                                step="1"
                                                                enterKeyHint="next"
                                                                defaultValue={entry.duration || ''}
                                                                onChange={e => updateCardioField(w._id, eIdx, 'duration', parseFloat(e.target.value) || 0)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="set-row" style={{ margin: 0, position: 'relative' }}>
                                                            <span className="set-label">Dist(km)</span>
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                min="0"
                                                                step="0.1"
                                                                enterKeyHint="done"
                                                                defaultValue={entry.distance || ''}
                                                                onChange={e => updateCardioField(w._id, eIdx, 'distance', parseFloat(e.target.value) || 0)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 44 }}>
                                                            <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight (kg)</span>
                                                            <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reps</span>
                                                            <span style={{ width: 28 }}></span>
                                                        </div>
                                                        {entry.sets?.map((set: any, sIdx: number) => (
                                                                <div key={sIdx} className="set-row">
                                                                    <span className="set-label">Set {sIdx + 1}</span>
                                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                                        <input
                                                                            type="number"
                                                                            inputMode="decimal"
                                                                            min="0"
                                                                            step="0.5"
                                                                            enterKeyHint="next"
                                                                            defaultValue={set.weight || ''}
                                                                            placeholder="kg"
                                                                            onChange={e => updateSet(w._id, eIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    // Move to next input (reps)
                                                                                    const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                                                                                    if (nextInput) (nextInput as HTMLInputElement).focus();
                                                                                }
                                                                            }}
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                                        <input
                                                                            type="number"
                                                                            inputMode="numeric"
                                                                            min="0"
                                                                            step="1"
                                                                            enterKeyHint="done"
                                                                            defaultValue={set.reps || ''}
                                                                            placeholder="Reps"
                                                                            onChange={e => updateSet(w._id, eIdx, sIdx, 'reps', parseFloat(e.target.value) || 0)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.currentTarget.blur();
                                                                                }
                                                                            }}
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </div>
                                                                    <button className="btn-icon btn-sm" style={{ padding: 4, width: 28, height: 28, flexShrink: 0 }}
                                                                        onClick={() => deleteSet(w._id, eIdx, sIdx)}>
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                        ))}
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ marginTop: 6 }}
                                                            onClick={() => addSetToExercise(w._id, eIdx)}>
                                                            <Plus size={14} /> Add Set
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Exercise Bar */}
                                    <div className="add-exercise-bar">
                                        <button
                                            className="btn btn-secondary"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => {
                                                setActiveWorkoutForPicker(w._id);
                                                setShowExercisePicker(true);
                                            }}
                                        >
                                            <Plus size={16} /> Add Exercise
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <Dumbbell size={48} />
                        <h4>No workouts yet</h4>
                        <p>Create a new workout to start building your session</p>
                    </div>
                </div>
            )}

            {/* New Workout Modal */}
            {showNewWorkoutModal && (
                <div className="modal-overlay" onClick={() => setShowNewWorkoutModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Workout</h3>
                            <button className="btn-icon" onClick={() => setShowNewWorkoutModal(false)}><X size={18} /></button>
                        </div>
                        <div className="form-group">
                            <label>Workout Title</label>
                            <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g. Push Day, Leg Day, Cardio..." />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <DatePicker value={newDate} onChange={setNewDate} />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                            After creating, you can dynamically add exercises and sets to this workout.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowNewWorkoutModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createWorkout}>
                                <Plus size={16} /> Create Workout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Exercise Modal */}
            {showCustomModal && (
                <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Custom Exercise</h3>
                            <button className="btn-icon" onClick={() => setShowCustomModal(false)}><X size={18} /></button>
                        </div>
                        <div className="form-group">
                            <label>Exercise Name</label>
                            <input className="form-input" value={customName} onChange={e => setCustomName(e.target.value)}
                                placeholder="e.g. Cable Lateral Raise" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-input" value={customCategory} onChange={e => setCustomCategory(e.target.value)}>
                                <option value="strength">Strength</option>
                                <option value="cardio">Cardio</option>
                                <option value="bodyweight">Bodyweight</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Which body parts does this exercise target?</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                {ALL_MUSCLES.map(m => (
                                    <span key={m}
                                        className={`muscle-chip ${customMuscles.includes(m) ? 'selected' : ''}`}
                                        onClick={() => toggleMuscle(m)}>
                                        {muscleLabel(m)}
                                    </span>
                                ))}
                            </div>
                            {customMuscles.length === 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: 8, display: 'block' }}>
                                    Select at least one body part for statistics tracking
                                </span>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCustomModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createCustomExercise}
                                disabled={!customName.trim() || customMuscles.length === 0}>
                                <Save size={16} /> Save Exercise
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteWorkoutId && (
                <div className="modal-overlay" onClick={() => setDeleteWorkoutId(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Delete Workout</h3>
                            <button className="btn-icon" onClick={() => setDeleteWorkoutId(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this workout? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteWorkoutId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteWorkout}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise Picker Modal */}
            {showExercisePicker && (
                <ExercisePicker
                    exercises={exercises}
                    onSelect={addExerciseToWorkout}
                    onClose={() => {
                        setShowExercisePicker(false);
                        setActiveWorkoutForPicker(null);
                    }}
                />
            )}

            <VoiceAssistant
                context={{
                    exercises,
                    workouts,
                    activeWorkoutId: expandedWorkout,
                }}
                onRefresh={loadData}
            />
        </div>
    );
};

export default WorkoutsPage;
