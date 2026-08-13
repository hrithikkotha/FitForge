import { useState, useMemo } from 'react';
import { Search, X, Dumbbell } from 'lucide-react';

interface Exercise {
    _id: string;
    name: string;
    category: string;
    muscleGroups: string[];
}

interface ExercisePickerProps {
    exercises: Exercise[];
    onSelect: (exerciseId: string) => void;
    onClose: () => void;
}

const ExercisePicker = ({ exercises, onSelect, onClose }: ExercisePickerProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter exercises based on search query
    const filteredExercises = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return exercises;

        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(query) ||
            ex.category.toLowerCase().includes(query) ||
            ex.muscleGroups.some(m => m.toLowerCase().includes(query))
        );
    }, [exercises, searchQuery]);

    // Group by category
    const groupedExercises = useMemo(() => {
        const groups: Record<string, Exercise[]> = {
            strength: [],
            cardio: [],
            bodyweight: [],
        };

        filteredExercises.forEach(ex => {
            if (groups[ex.category]) {
                groups[ex.category].push(ex);
            }
        });

        return groups;
    }, [filteredExercises]);

    const handleSelectExercise = (exerciseId: string) => {
        onSelect(exerciseId);
        onClose();
    };

    const categoryLabel = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal exercise-picker-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header" style={{ marginBottom: 16 }}>
                    <h3>Select Exercise</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="exercise-picker-search" style={{ position: 'relative', marginBottom: 16 }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{ paddingLeft: 42 }}
                    />
                    {searchQuery && (
                        <button
                            className="btn-icon btn-sm"
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: 6,
                                minWidth: 32,
                                minHeight: 32
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Exercise List */}
                <div className="exercise-picker-list">
                    {filteredExercises.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
                            <Dumbbell size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                No exercises found matching "{searchQuery}"
                            </p>
                        </div>
                    ) : (
                        <>
                            {['strength', 'cardio', 'bodyweight'].map(category => {
                                const categoryExercises = groupedExercises[category];
                                if (categoryExercises.length === 0) return null;

                                return (
                                    <div key={category} className="exercise-category-group">
                                        <div className="exercise-category-header">
                                            <span className={`badge badge-${category}`}>
                                                {categoryLabel(category)}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {categoryExercises.length} exercise{categoryExercises.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="exercise-items">
                                            {categoryExercises.map(ex => (
                                                <button
                                                    key={ex._id}
                                                    className="exercise-picker-item"
                                                    onClick={() => handleSelectExercise(ex._id)}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>
                                                            {ex.name}
                                                        </div>
                                                        {ex.muscleGroups.length > 0 && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {ex.muscleGroups
                                                                    .slice(0, 3)
                                                                    .map(m => m.replace(/_/g, ' '))
                                                                    .join(', ')}
                                                                {ex.muscleGroups.length > 3 && ` +${ex.muscleGroups.length - 3}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Dumbbell size={16} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExercisePicker;
