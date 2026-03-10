import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, X, Search, Sunrise, Sun, Moon, Apple, UtensilsCrossed } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import PageLoader from '../components/PageLoader';
import DatePicker from '../components/DatePicker';

interface FoodItem {
    _id: string;
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    servingUnit?: string;
    gramsPerServing?: number;
}

const NutritionPage = () => {
    const { user } = useAuth();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [meals, setMeals] = useState<any[]>([]);
    const [todayMeals, setTodayMeals] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [quantity, setQuantity] = useState('1');
    const [mealType, setMealType] = useState('lunch');
    const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);

    // Delete confirmation modal
    const [deleteMealId, setDeleteMealId] = useState<string | null>(null);

    // Custom Food Modal State
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingUnit: 'g', gramsPerServing: '1' });
    const { toasts, show: showToast, dismiss } = useToast();
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [foodRes, mealRes] = await Promise.all([
                API.get('/foods'),
                API.get('/meals'),
            ]);
            setFoods(foodRes.data);
            setMeals(mealRes.data);

            const today = new Date().toISOString().split('T')[0];
            setTodayMeals(mealRes.data.filter((m: any) =>
                new Date(m.date).toISOString().split('T')[0] === today
            ));
        } catch (err) {
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    const saveMeal = async () => {
        if (!selectedFood) return;
        try {
            await API.post('/meals', {
                date: new Date(mealDate).toISOString(),
                mealType,
                foodItemId: selectedFood._id,
                quantity: parseFloat(quantity) || 1,
            });
            setShowModal(false);
            setSelectedFood(null);
            setQuantity('1');
            setMealType('lunch');
            loadData();
            showToast('Meal logged successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to log meal', 'error');
        }
    };

    const createCustomFood = async () => {
        if (!customFood.name || !customFood.calories) return;
        try {
            const res = await API.post('/foods', {
                name: customFood.name,
                caloriesPer100g: Number(customFood.calories),
                proteinPer100g: Number(customFood.protein || 0),
                carbsPer100g: Number(customFood.carbs || 0),
                fatPer100g: Number(customFood.fat || 0),
                servingUnit: customFood.servingUnit,
                gramsPerServing: Number(customFood.gramsPerServing || 1),
            });
            setFoods((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setShowFoodModal(false);
            setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', servingUnit: 'g', gramsPerServing: '1' });

            // Auto-select if user is in the middle of logging a meal
            if (showModal) {
                setSelectedFood(res.data);
                setSearchTerm(res.data.name);
            }
            showToast('Custom food created');
        } catch (err) {
            console.error(err);
            showToast('Failed to create custom food', 'error');
        }
    };

    const confirmDeleteMeal = (id: string) => {
        setDeleteMealId(id);
    };

    const handleDeleteMeal = async () => {
        if (!deleteMealId) return;
        try {
            await API.delete(`/meals/${deleteMealId}`);
            setDeleteMealId(null);
            loadData();
            showToast('Meal deleted successfully');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete meal', 'error');
        }
    };

    const todayCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
    const todayFat = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
    const calGoal = user?.dailyCalorieGoal || 2000;
    const calPercent = Math.min((todayCals / calGoal) * 100, 100);

    const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const mealTypeLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    const mealTypeIcon = (t: string) => {
        const map: Record<string, React.ReactNode> = {
            breakfast: <Sunrise size={16} />,
            lunch: <Sun size={16} />,
            dinner: <Moon size={16} />,
            snack: <Apple size={16} />,
        };
        return map[t] || <UtensilsCrossed size={16} />;
    };

    // SVG ring
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (calPercent / 100) * circumference;

    if (pageLoading) return <PageLoader />;

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="page-header">
                <div>
                    <h2>Nutrition Tracker</h2>
                    <p className="text-secondary">Log meals and track your macros</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowFoodModal(true)}>
                        <Plus size={18} /> Custom Food
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Log Meal
                    </button>
                </div>
            </div>

            <div className="page-grid-sidebar" style={{ marginBottom: 24 }}>
                {/* Calorie Ring */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Today's Calories</h3>
                    <div style={{ position: 'relative', width: 200, height: 200 }}>
                        <svg width="200" height="200" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--bg-primary)" strokeWidth="12" />
                            <circle
                                cx="100" cy="100" r={radius}
                                fill="none"
                                stroke={calPercent >= 100 ? 'var(--accent-danger)' : 'var(--accent-success)'}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                transform="rotate(-90 100 100)"
                                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{todayCals}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ {calGoal} kcal</div>
                        </div>
                    </div>

                    <div className="macro-bars" style={{ marginTop: 20 }}>
                        <div className="macro-bar-item">
                            <div className="macro-label">Protein</div>
                            <div className="macro-bar-track"><div className="macro-bar-fill" style={{ width: `${Math.min(todayProtein / 150 * 100, 100)}%`, background: 'var(--accent-primary)' }} /></div>
                            <div className="macro-value">{todayProtein.toFixed(0)}g</div>
                        </div>
                        <div className="macro-bar-item">
                            <div className="macro-label">Carbs</div>
                            <div className="macro-bar-track"><div className="macro-bar-fill" style={{ width: `${Math.min(todayCarbs / 250 * 100, 100)}%`, background: 'var(--accent-success)' }} /></div>
                            <div className="macro-value">{todayCarbs.toFixed(0)}g</div>
                        </div>
                        <div className="macro-bar-item">
                            <div className="macro-label">Fat</div>
                            <div className="macro-bar-track"><div className="macro-bar-fill" style={{ width: `${Math.min(todayFat / 80 * 100, 100)}%`, background: 'var(--accent-warning)' }} /></div>
                            <div className="macro-value">{todayFat.toFixed(0)}g</div>
                        </div>
                    </div>
                </div>

                {/* Today's meals */}
                <div className="card">
                    <div className="card-header">
                        <h3>Today's Meals</h3>
                    </div>
                    {todayMeals.length > 0 ? (
                        todayMeals.map(m => (
                            <div key={m._id} className="meal-item">
                                <div className="meal-item-info">
                                    <div className={`meal-type-icon ${m.mealType}`}>{mealTypeIcon(m.mealType)}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.foodName || m.foodItemId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {mealTypeLabel(m.mealType)} · {m.quantity}{m.servingUnit === 'g' || m.servingUnit === 'ml' || !m.servingUnit ? (m.servingUnit || 'g') : ` ${m.servingUnit}${m.quantity !== 1 ? 's' : ''}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="meal-item-macros">
                                    <span className="cal">{m.calories} kcal</span>
                                    <span>P: {m.protein}g</span>
                                    <span>C: {m.carbs}g</span>
                                    <span>F: {m.fat}g</span>
                                    <button className="btn-icon btn-sm" onClick={() => confirmDeleteMeal(m._id)} style={{ marginLeft: 4 }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No meals logged today</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Meal History */}
            <div className="card">
                <div className="card-header">
                    <h3>Meal History</h3>
                </div>
                {meals.length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Meal</th>
                                    <th>Food</th>
                                    <th>Qty</th>
                                    <th>Calories</th>
                                    <th>P / C / F</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {meals.slice(0, 20).map(m => (
                                    <tr key={m._id}>
                                        <td>{new Date(m.date).toLocaleDateString()}</td>
                                        <td><span className={`badge badge-${m.mealType === 'breakfast' ? 'cardio' : m.mealType === 'lunch' ? 'bodyweight' : 'strength'}`}>{mealTypeLabel(m.mealType)}</span></td>
                                        <td>{m.foodName || m.foodItemId?.name}</td>
                                        <td>{m.quantity}{m.servingUnit === 'g' || m.servingUnit === 'ml' || !m.servingUnit ? (m.servingUnit || 'g') : ` ${m.servingUnit}${m.quantity !== 1 ? 's' : ''}`}</td>
                                        <td style={{ fontWeight: 600 }}>{m.calories}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{m.protein}g / {m.carbs}g / {m.fat}g</td>
                                        <td><button className="btn-icon btn-sm" onClick={() => confirmDeleteMeal(m._id)}><Trash2 size={12} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state"><p>No meal history yet</p></div>
                )}
            </div>

            {/* Log Meal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Log Meal</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date</label>
                                <DatePicker value={mealDate} onChange={setMealDate} />
                            </div>
                            <div className="form-group">
                                <label>Meal Type</label>
                                <select className="form-input" value={mealType} onChange={e => setMealType(e.target.value)}>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Search Food</label>
                            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    <input
                                        className="form-input"
                                        style={{ paddingLeft: 36 }}
                                        placeholder="Search foods..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowFoodModal(true)}
                                    title="Create missing food"
                                    style={{ padding: '0 12px' }}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {searchTerm && (
                            <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 16 }}>
                                {filteredFoods.map(f => (
                                    <div
                                        key={f._id}
                                        onClick={() => { setSelectedFood(f); setSearchTerm(f.name); setQuantity(f.servingUnit === 'g' || f.servingUnit === 'ml' ? '100' : '1'); }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderRadius: 6,
                                            background: selectedFood?._id === f._id ? 'rgba(108,99,255,0.15)' : 'transparent',
                                            fontSize: '0.85rem',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = selectedFood?._id === f._id ? 'rgba(108,99,255,0.15)' : 'transparent')}
                                    >
                                        <div style={{ fontWeight: 500 }}>{f.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {f.caloriesPer100g} kcal · P:{f.proteinPer100g}g · C:{f.carbsPer100g}g · F:{f.fatPer100g}g per 100g
                                            {f.servingUnit && f.servingUnit !== 'g' && f.servingUnit !== 'ml' && (
                                                <span> · 1 {f.servingUnit} = {f.gramsPerServing}g</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFood && (
                            <div className="form-group">
                                <label>Quantity ({selectedFood.servingUnit === 'g' ? 'grams' : selectedFood.servingUnit === 'ml' ? 'ml' : selectedFood.servingUnit === 'piece' ? 'pieces' : selectedFood.servingUnit === 'slice' ? 'slices' : selectedFood.servingUnit === 'scoop' ? 'scoops' : selectedFood.servingUnit === 'tbsp' ? 'tablespoons' : selectedFood.servingUnit === 'cup' ? 'cups' : 'grams'})</label>
                                <input className="form-input" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" step={selectedFood.servingUnit === 'g' || selectedFood.servingUnit === 'ml' ? '10' : '1'} />
                                <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {(() => {
                                        const gps = selectedFood.gramsPerServing || 1;
                                        const totalGrams = (parseFloat(quantity) || 0) * gps;
                                        const mult = totalGrams / 100;
                                        return (
                                            <>
                                                <strong style={{ color: 'var(--text-primary)' }}>
                                                    {Math.round(selectedFood.caloriesPer100g * mult)} kcal
                                                </strong>{' '}
                                                · P: {(selectedFood.proteinPer100g * mult).toFixed(1)}g
                                                · C: {(selectedFood.carbsPer100g * mult).toFixed(1)}g
                                                · F: {(selectedFood.fatPer100g * mult).toFixed(1)}g
                                                {selectedFood.servingUnit !== 'g' && selectedFood.servingUnit !== 'ml' && (
                                                    <span style={{ marginLeft: 8, opacity: 0.7 }}>
                                                        ({Math.round(totalGrams)}g)
                                                    </span>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveMeal} disabled={!selectedFood}>
                                Save Meal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Custom Food Modal */}
            {showFoodModal && (
                <div className="modal-overlay" onClick={() => setShowFoodModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Custom Food</h3>
                            <button className="btn-icon" onClick={() => setShowFoodModal(false)}><X size={18} /></button>
                        </div>

                        <div className="form-group">
                            <label>Food Name *</label>
                            <input
                                className="form-input"
                                value={customFood.name}
                                onChange={e => setCustomFood({ ...customFood, name: e.target.value })}
                                placeholder="E.g., Mom's Lasagna"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Calories (per 100g) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={customFood.calories}
                                    onChange={e => setCustomFood({ ...customFood, calories: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Protein (per 100g)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={customFood.protein}
                                    onChange={e => setCustomFood({ ...customFood, protein: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Carbs (per 100g)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={customFood.carbs}
                                    onChange={e => setCustomFood({ ...customFood, carbs: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fat (per 100g)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={customFood.fat}
                                    onChange={e => setCustomFood({ ...customFood, fat: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Serving Unit</label>
                                <select className="form-input" value={customFood.servingUnit} onChange={e => setCustomFood({ ...customFood, servingUnit: e.target.value, gramsPerServing: e.target.value === 'g' || e.target.value === 'ml' ? '1' : customFood.gramsPerServing })}>
                                    <option value="g">Grams (g)</option>
                                    <option value="ml">Milliliters (ml)</option>
                                    <option value="piece">Piece</option>
                                    <option value="slice">Slice</option>
                                    <option value="scoop">Scoop</option>
                                    <option value="tbsp">Tablespoon</option>
                                    <option value="cup">Cup</option>
                                </select>
                            </div>
                            {customFood.servingUnit !== 'g' && customFood.servingUnit !== 'ml' && (
                                <div className="form-group">
                                    <label>Grams per {customFood.servingUnit}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={customFood.gramsPerServing}
                                        onChange={e => setCustomFood({ ...customFood, gramsPerServing: e.target.value })}
                                        placeholder="e.g., 50 for one egg"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setShowFoodModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createCustomFood} disabled={!customFood.name || !customFood.calories}>
                                Create Food
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteMealId && (
                <div className="modal-overlay" onClick={() => setDeleteMealId(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Delete Meal</h3>
                            <button className="btn-icon" onClick={() => setDeleteMealId(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this meal record? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteMealId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteMeal}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionPage;
