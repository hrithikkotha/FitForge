import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { Plus, Dumbbell, Trash2, X, Edit3, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import PageLoader from '../components/PageLoader';
import DatePicker from '../components/DatePicker';
import VoiceAssistant from '../components/VoiceAssistant';

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
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

    // Add exercise to workout
    const [selectedExercise, setSelectedExercise] = useState('');
    const [addingToWorkoutId, setAddingToWorkoutId] = useState<string | null>(null);

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [exRes, wkRes] = await Promise.all([
                API.get('/exercises'),
                API.get('/workouts'),
            ]);
            setExercises(exRes.data);
            setWorkouts(wkRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    }, []);

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
    const addExerciseToWorkout = async (workoutId: string) => {
        if (!selectedExercise) return;
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const existingEntries = workout.entries?.map((e: any) => ({
            exerciseId: e.exerciseId?._id || e.exerciseId,
            sets: e.sets || [],
            duration: e.duration || 0,
            distance: e.distance || 0,
        })) || [];

        const ex = exercises.find(e => e._id === selectedExercise);
        const isCardio = ex?.category === 'cardio';

        try {
            await API.put(`/workouts/${workoutId}`, {
                entries: [
                    ...existingEntries,
                    {
                        exerciseId: selectedExercise,
                        sets: isCardio ? [] : [{ reps: 0, weight: 0 }],
                        duration: 0,
                        distance: 0,
                    },
                ],
            });
            setSelectedExercise('');
            setAddingToWorkoutId(null);
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
            loadData();
            showToast('Exercise removed');
        } catch (err) {
            console.error(err);
            showToast('Failed to remove exercise', 'error');
        }
    };

    // Add set to a specific exercise in a workout
    const addSetToExercise = async (workoutId: string, entryIndex: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const updatedEntries = workout.entries.map((e: any, i: number) => ({
            exerciseId: e.exerciseId?._id || e.exerciseId,
            sets: i === entryIndex ? [...(e.sets || []), { reps: 0, weight: 0 }] : (e.sets || []),
            duration: e.duration || 0,
            distance: e.distance || 0,
        }));

        try {
            await API.put(`/workouts/${workoutId}`, { entries: updatedEntries });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Delete a specific set
    const deleteSet = async (workoutId: string, entryIndex: number, setIndex: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const updatedEntries = workout.entries.map((e: any, i: number) => ({
            exerciseId: e.exerciseId?._id || e.exerciseId,
            sets: i === entryIndex ? e.sets.filter((_: any, si: number) => si !== setIndex) : (e.sets || []),
            duration: e.duration || 0,
            distance: e.distance || 0,
        }));

        try {
            await API.put(`/workouts/${workoutId}`, { entries: updatedEntries });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Update set values
    const updateSet = async (workoutId: string, entryIndex: number, setIndex: number, field: 'reps' | 'weight', val: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const updatedEntries = workout.entries.map((e: any, i: number) => {
            const sets = [...(e.sets || [])];
            if (i === entryIndex) {
                sets[setIndex] = { ...sets[setIndex], [field]: val };
            }
            return {
                exerciseId: e.exerciseId?._id || e.exerciseId,
                sets,
                duration: e.duration || 0,
                distance: e.distance || 0,
            };
        });

        try {
            await API.put(`/workouts/${workoutId}`, { entries: updatedEntries });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Update cardio fields
    const updateCardioField = async (workoutId: string, entryIndex: number, field: 'duration' | 'distance', val: number) => {
        const workout = workouts.find(w => w._id === workoutId);
        if (!workout) return;

        const updatedEntries = workout.entries.map((e: any, i: number) => ({
            exerciseId: e.exerciseId?._id || e.exerciseId,
            sets: e.sets || [],
            duration: i === entryIndex && field === 'duration' ? val : (e.duration || 0),
            distance: i === entryIndex && field === 'distance' ? val : (e.distance || 0),
        }));

        try {
            await API.put(`/workouts/${workoutId}`, { entries: updatedEntries });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Delete workout
    const confirmDeleteWorkout = (id: string) => {
        setDeleteWorkoutId(id);
    };

    const handleDeleteWorkout = async () => {
        if (!deleteWorkoutId) return;
        try {
            await API.delete(`/workouts/${deleteWorkoutId}`);
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
                    <p>Log and dynamically build your training sessions</p>
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
                                                        <div className="set-row" style={{ margin: 0 }}>
                                                            <span className="set-label">Dur(m)</span>
                                                            <input type="number" defaultValue={entry.duration || ''} onBlur={e => updateCardioField(w._id, eIdx, 'duration', +e.target.value)} />
                                                        </div>
                                                        <div className="set-row" style={{ margin: 0 }}>
                                                            <span className="set-label">Dist(km)</span>
                                                            <input type="number" defaultValue={entry.distance || ''} onBlur={e => updateCardioField(w._id, eIdx, 'distance', +e.target.value)} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 44 }}>
                                                            <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reps</span>
                                                            <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight (kg)</span>
                                                            <span style={{ width: 28 }}></span>
                                                        </div>
                                                        {entry.sets?.map((set: any, sIdx: number) => (
                                                            <div key={sIdx} className="set-row">
                                                                <span className="set-label">Set {sIdx + 1}</span>
                                                                <input type="number" defaultValue={set.reps || ''} placeholder="Reps"
                                                                    onBlur={e => updateSet(w._id, eIdx, sIdx, 'reps', +e.target.value)} />
                                                                <input type="number" defaultValue={set.weight || ''} placeholder="kg"
                                                                    onBlur={e => updateSet(w._id, eIdx, sIdx, 'weight', +e.target.value)} />
                                                                <button className="btn-icon btn-sm" style={{ padding: 4, width: 28, height: 28, flexShrink: 0 }}
                                                                    onClick={() => deleteSet(w._id, eIdx, sIdx)}>
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}
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
                                        <select className="form-input" value={addingToWorkoutId === w._id ? selectedExercise : ''}
                                            onFocus={() => setAddingToWorkoutId(w._id)}
                                            onChange={e => { setSelectedExercise(e.target.value); setAddingToWorkoutId(w._id); }}>
                                            <option value="">Add an exercise...</option>
                                            {['strength', 'cardio', 'bodyweight'].map(cat => (
                                                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                                                    {exercises.filter(e => e.category === cat).map(e => (
                                                        <option key={e._id} value={e._id}>{e.name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <button className="btn btn-primary btn-sm"
                                            onClick={() => addExerciseToWorkout(w._id)}
                                            disabled={!selectedExercise || addingToWorkoutId !== w._id}>
                                            <Plus size={16} /> Add
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
