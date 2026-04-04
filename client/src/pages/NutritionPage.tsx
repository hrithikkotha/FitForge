import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Trash2, X, Search, Sunrise, Sun, Moon, Apple, UtensilsCrossed,
    Shield, Star
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import PageLoader from '../components/PageLoader';
import DatePicker from '../components/DatePicker';
import VoiceAssistant from '../components/VoiceAssistant';

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

// ── Meal Scoring Logic (Health & Nutrition Expert skill) ──────────────────────
interface MealScore {
    score: number;
    proteinG: number;
    leucineOk: boolean;
    fiberOk: boolean;
    carbTier: 1 | 2 | 3 | 4;
    hasHealthyFat: boolean;
    isAntiInflammatory: boolean;
    tips: string[];
    label: string;
    color: string;
}

const ANTI_INFLAMMATORY_KEYWORDS = [
    'salmon', 'sardine', 'mackerel', 'blueberr', 'strawberr', 'spinach', 'kale',
    'broccoli', 'turmeric', 'ginger', 'olive oil', 'ghee', 'walnut', 'avocado',
    'dark chocolate', 'mushroom', 'green tea', 'garlic', 'tomato'
];

const HEALTHY_FAT_KEYWORDS = [
    'avocado', 'olive oil', 'walnut', 'almond', 'salmon', 'sardine', 'ghee',
    'chia', 'flax', 'hemp', 'cashew', 'peanut', 'mackerel', 'dark chocolate'
];

const HIGH_FIBER_KEYWORDS = [
    'oats', 'dal', 'lentil', 'rajma', 'chole', 'chickpea', 'bean', 'quinoa',
    'broccoli', 'spinach', 'kale', 'apple', 'pear', 'chia', 'flax', 'sweet potato',
    'sambar', 'bisibelebath', 'kootu', 'aviyal', 'methi', 'thoran', 'idli', 'dosa'
];

const TIER1_CARBS = ['sweet potato', 'quinoa', 'oats', 'dal', 'lentil', 'broccoli', 'spinach', 'kale', 'cauliflower', 'rajma', 'chole', 'chickpea', 'bean', 'bisibelebath', 'sambar', 'idli', 'appam', 'puttu'];
const TIER3_CARBS = ['white rice', 'dosa', 'idli', 'pasta', 'paratha', 'uttapam', 'upma', 'poha', 'pongal', 'khichdi', 'bhatura', 'puri', 'naan', 'kulcha', 'rava', 'lemon rice', 'coconut rice', 'tamarind rice', 'curd rice', 'tomato rice', 'vangi bath'];
const TIER4_CARBS = ['maida', 'fried', 'samosa', 'biscuit', 'cake', 'candy', 'soda', 'juice', 'vada', 'bonda', 'bajji', 'murukku', 'chakli', 'jalebi', 'gulab jamun', 'ladoo', 'barfi', 'halwa', 'kheer', 'payasam', 'mysore pak', 'kachori', 'sev puri', 'bhujia', 'mixture', 'mathri', 'namak pare'];

function scoreMeal(meals: any[]): MealScore {
    const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
    const names = meals.map(m => (m.foodName || m.foodItemId?.name || '').toLowerCase()).join(' ');

    const leucineOk = totalProtein >= 25;
    const hasFiber = HIGH_FIBER_KEYWORDS.some(k => names.includes(k));
    const hasHealthyFat = HEALTHY_FAT_KEYWORDS.some(k => names.includes(k));
    const isAntiInflammatory = ANTI_INFLAMMATORY_KEYWORDS.some(k => names.includes(k));

    let carbTier: 1 | 2 | 3 | 4 = 2;
    if (TIER4_CARBS.some(k => names.includes(k))) carbTier = 4;
    else if (TIER3_CARBS.some(k => names.includes(k))) carbTier = 3;
    else if (TIER1_CARBS.some(k => names.includes(k))) carbTier = 1;

    let score = 40;
    if (leucineOk) score += 25;
    else if (totalProtein >= 15) score += 10;
    if (hasFiber) score += 15;
    if (hasHealthyFat) score += 10;
    if (isAntiInflammatory) score += 5;
    if (carbTier === 1) score += 5;
    if (carbTier === 4) score -= 10;
    score = Math.max(20, Math.min(100, score));

    const tips: string[] = [];
    if (!leucineOk) tips.push(`Add ${Math.max(0, 25 - Math.round(totalProtein))}g more protein (leucine threshold: 25–30g/meal)`);
    if (!hasFiber) tips.push('Add a fiber source: dal, vegetables, or oats');
    if (!hasHealthyFat) tips.push('Add a healthy fat: ghee, nuts, or avocado');
    if (carbTier >= 3) tips.push('Upgrade carbs: try brown rice or roti instead');
    if (!isAntiInflammatory) tips.push('Add anti-inflammatory food: turmeric, berries, or leafy greens');

    const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Moderate' : 'Needs Work';
    const color = score >= 85 ? '#4ade80' : score >= 70 ? '#fca311' : score >= 55 ? '#f97316' : '#ef4444';

    return {
        score, proteinG: Math.round(totalProtein),
        leucineOk, fiberOk: hasFiber, carbTier, hasHealthyFat, isAntiInflammatory, tips, label, color
    };
}

// ── Meal Score Card Component ─────────────────────────────────────────────────
function MealScoreCard({ meals }: { meals: any[] }) {
    const score = useMemo(() => scoreMeal(meals), [meals]);
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (score.score / 100) * circumference;

    if (meals.length === 0) return null;

    return (
        <div className="card" style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${score.color}22`,
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${score.color}aa, ${score.color})`,
                borderRadius: '4px 4px 0 0'
            }} />
            <div className="card-header" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={15} color={score.color} />
                    <h3 style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: '0.95rem' }}>Today's Meal Quality Score</h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Based on 2025 nutrition science</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Ring */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <svg width="68" height="68" viewBox="0 0 68 68">
                        <circle cx="34" cy="34" r="28" fill="none" stroke="var(--bg-primary)" strokeWidth="6" />
                        <circle cx="34" cy="34" r="28" fill="none" stroke={score.color} strokeWidth="6"
                            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                            transform="rotate(-90 34 34)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Nunito', color: score.color, lineHeight: 1 }}>{score.score}</span>
                        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 1 }}>/ 100</span>
                    </div>
                </div>

                {/* Label + indicators */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: score.color, fontFamily: 'Nunito', marginBottom: 8 }}>{score.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                            { ok: score.leucineOk, label: `Protein ${score.proteinG}g`, tip: 'Leucine threshold' },
                            { ok: score.fiberOk, label: 'Fiber', tip: 'Digestive health' },
                            { ok: score.hasHealthyFat, label: 'Healthy fat', tip: 'Nutrient absorption' },
                            { ok: score.isAntiInflammatory, label: 'Anti-inflam.', tip: 'Recovery foods' },
                            { ok: score.carbTier <= 2, label: `Carb Tier ${score.carbTier}`, tip: 'Quality carbs' },
                        ].map((item, i) => (
                            <span key={i} title={item.tip} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: item.ok ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${item.ok ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.2)'}`,
                                borderRadius: 20, padding: '3px 9px', fontSize: '0.7rem',
                                color: item.ok ? '#4ade80' : '#ef4444', fontWeight: 600,
                            }}>
                                {item.ok ? '✓' : '·'} {item.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tips */}
            {score.tips.length > 0 && (
                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        💡 Improve your score
                    </div>
                    {score.tips.slice(0, 3).map((tip, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '2px 0', display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span> {tip}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Anti-inflammatory badge ───────────────────────────────────────────────────
function AntiInflamBadge({ name }: { name: string }) {
    const lower = name.toLowerCase();
    const isAntiInflam = ANTI_INFLAMMATORY_KEYWORDS.some(k => lower.includes(k));
    if (!isAntiInflam) return null;
    return (
        <span title="Anti-inflammatory food" style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: 20, padding: '1px 6px', fontSize: '0.65rem', color: '#4ade80', fontWeight: 700
        }}>
            <Shield size={9} /> Anti-inflam
        </span>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
    const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingUnit: 'g', gramsPerServing: '1' });
    const { toasts, show: showToast, dismiss } = useToast();
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [foodRes, mealRes] = await Promise.all([API.get('/foods'), API.get('/meals')]);
            setFoods(foodRes.data);
            setMeals(mealRes.data);
            const today = new Date().toISOString().split('T')[0];
            setTodayMeals(mealRes.data.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === today));
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
        } catch {
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
            setFoods(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setShowFoodModal(false);
            setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', servingUnit: 'g', gramsPerServing: '1' });
            if (showModal) { setSelectedFood(res.data); setSearchTerm(res.data.name); }
            showToast('Custom food created');
        } catch {
            showToast('Failed to create custom food', 'error');
        }
    };

    const handleDeleteMeal = async () => {
        if (!deleteMealId) return;
        try {
            await API.delete(`/meals/${deleteMealId}`);
            setDeleteMealId(null);
            loadData();
            showToast('Meal deleted');
        } catch {
            showToast('Failed to delete meal', 'error');
        }
    };

    const todayCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
    const todayFat = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
    const calGoal = user?.dailyCalorieGoal || 2000;
    const calPercent = Math.min((todayCals / calGoal) * 100, 100);
    const weightKg = (user as any)?.weight || 70;

    const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const mealTypeLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    const mealTypeIcon = (t: string) => {
        const map: Record<string, React.ReactNode> = {
            breakfast: <Sunrise size={16} />, lunch: <Sun size={16} />,
            dinner: <Moon size={16} />, snack: <Apple size={16} />,
        };
        return map[t] || <UtensilsCrossed size={16} />;
    };

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
                            <circle cx="100" cy="100" r={radius} fill="none"
                                stroke={calPercent >= 100 ? 'var(--accent-danger)' : 'var(--accent-success)'}
                                strokeWidth="12" strokeLinecap="round"
                                strokeDasharray={circumference} strokeDashoffset={offset}
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
                            <div className="macro-bar-track"><div className="macro-bar-fill" style={{ width: `${Math.min(todayProtein / Math.round(weightKg * 2.205) * 100, 100)}%`, background: 'var(--accent-primary)' }} /></div>
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

                {/* Right column: Score + Today's meals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <MealScoreCard meals={todayMeals} />

                    <div className="card">
                        <div className="card-header"><h3>Today's Meals</h3></div>
                        {todayMeals.length > 0 ? (
                            todayMeals.map(m => (
                                <div key={m._id} className="meal-item">
                                    <div className="meal-item-info">
                                        <div className={`meal-type-icon ${m.mealType}`}>{mealTypeIcon(m.mealType)}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {m.foodName || m.foodItemId?.name}
                                                <AntiInflamBadge name={m.foodName || m.foodItemId?.name || ''} />
                                            </div>
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
                                        <button className="btn-icon btn-sm" onClick={() => setDeleteMealId(m._id)} style={{ marginLeft: 4 }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state"><p>No meals logged today</p></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Meal History */}
            <div className="card">
                <div className="card-header"><h3>Meal History</h3></div>
                {meals.length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>Meal</th><th>Food</th><th>Qty</th>
                                    <th>Calories</th><th>P / C / F</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {meals.slice(0, 25).map(m => (
                                    <tr key={m._id}>
                                        <td>{new Date(m.date).toLocaleDateString()}</td>
                                        <td><span className={`badge badge-${m.mealType === 'breakfast' ? 'cardio' : m.mealType === 'lunch' ? 'bodyweight' : 'strength'}`}>{mealTypeLabel(m.mealType)}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {m.foodName || m.foodItemId?.name}
                                                <AntiInflamBadge name={m.foodName || m.foodItemId?.name || ''} />
                                            </div>
                                        </td>
                                        <td>{m.quantity}{m.servingUnit === 'g' || m.servingUnit === 'ml' || !m.servingUnit ? (m.servingUnit || 'g') : ` ${m.servingUnit}`}</td>
                                        <td style={{ fontWeight: 600 }}>{m.calories}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{m.protein}g / {m.carbs}g / {m.fat}g</td>
                                        <td><button className="btn-icon btn-sm" onClick={() => setDeleteMealId(m._id)}><Trash2 size={12} /></button></td>
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
                                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search 350+ foods..."
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <button className="btn btn-secondary" onClick={() => setShowFoodModal(true)} title="Create custom food" style={{ padding: '0 12px' }}>
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        {searchTerm && (
                            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                                {filteredFoods.length === 0 && (
                                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                                        No matches.{' '}
                                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowFoodModal(true)}>
                                            Create custom food →
                                        </button>
                                    </div>
                                )}
                                {filteredFoods.map(f => (
                                    <div key={f._id}
                                        onClick={() => { setSelectedFood(f); setSearchTerm(f.name); setQuantity(f.servingUnit === 'g' || f.servingUnit === 'ml' ? '100' : '1'); }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, background: selectedFood?._id === f._id ? 'rgba(252,163,17,0.12)' : 'transparent', fontSize: '0.85rem' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = selectedFood?._id === f._id ? 'rgba(252,163,17,0.12)' : 'transparent')}>
                                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {f.name}
                                            <AntiInflamBadge name={f.name} />
                                        </div>
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
                                        const protG = selectedFood.proteinPer100g * mult;
                                        return (
                                            <>
                                                <strong style={{ color: 'var(--text-primary)' }}>{Math.round(selectedFood.caloriesPer100g * mult)} kcal</strong>{' '}
                                                · P: <span style={{ color: protG >= 25 ? '#4ade80' : 'var(--text-secondary)', fontWeight: protG >= 25 ? 700 : 400 }}>{protG.toFixed(1)}g</span>
                                                · C: {(selectedFood.carbsPer100g * mult).toFixed(1)}g
                                                · F: {(selectedFood.fatPer100g * mult).toFixed(1)}g
                                                {protG >= 25 && <span style={{ marginLeft: 6, color: '#4ade80', fontSize: '0.72rem' }}>✓ leucine threshold</span>}
                                                {selectedFood.servingUnit !== 'g' && selectedFood.servingUnit !== 'ml' && (
                                                    <span style={{ marginLeft: 8, opacity: 0.7 }}>({Math.round(totalGrams)}g)</span>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveMeal} disabled={!selectedFood}>Save Meal</button>
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
                            <input className="form-input" value={customFood.name} onChange={e => setCustomFood({ ...customFood, name: e.target.value })} placeholder="E.g., Mom's Dal Tadka" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Calories (per 100g) *</label>
                                <input type="number" className="form-input" value={customFood.calories} onChange={e => setCustomFood({ ...customFood, calories: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Protein (per 100g)</label>
                                <input type="number" className="form-input" value={customFood.protein} onChange={e => setCustomFood({ ...customFood, protein: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Carbs (per 100g)</label>
                                <input type="number" className="form-input" value={customFood.carbs} onChange={e => setCustomFood({ ...customFood, carbs: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Fat (per 100g)</label>
                                <input type="number" className="form-input" value={customFood.fat} onChange={e => setCustomFood({ ...customFood, fat: e.target.value })} />
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
                                    <input type="number" className="form-input" value={customFood.gramsPerServing} onChange={e => setCustomFood({ ...customFood, gramsPerServing: e.target.value })} placeholder="e.g., 50 for one egg" />
                                </div>
                            )}
                        </div>
                        <div className="modal-actions" style={{ marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setShowFoodModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createCustomFood} disabled={!customFood.name || !customFood.calories}>Create Food</button>
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
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Are you sure you want to delete this meal record? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteMealId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteMeal}><Trash2 size={16} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <VoiceAssistant context={{ exercises: [], workouts: [], foods }} onRefresh={loadData} />
        </div>
    );
};

export default NutritionPage;
