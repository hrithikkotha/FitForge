import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const ProfilePage = () => {
    const { user, updateProfile, logout } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [currentWeight, setCurrentWeight] = useState(String(user?.currentWeight || ''));
    const [goalWeight, setGoalWeight] = useState(String(user?.goalWeight || ''));
    const [weightGoalType, setWeightGoalType] = useState<'lose' | 'gain' | 'maintain'>(user?.weightGoalType || 'maintain');
    const [targetWeeklyChange, setTargetWeeklyChange] = useState(String(user?.targetWeeklyChange || 0.5));
    const [activityLevel, setActivityLevel] = useState<string>(user?.activityLevel || 'moderate');
    const [gender, setGender] = useState<string>(user?.gender || 'male');
    const [height, setHeight] = useState(String(user?.height || ''));
    const [age, setAge] = useState(String(user?.age || ''));
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(String(user?.dailyCalorieGoal || 2000));
    const { toasts, show: showToast, dismiss } = useToast();

    // Update form fields when user data changes
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setCurrentWeight(String(user.currentWeight || ''));
            setGoalWeight(String(user.goalWeight || ''));
            setWeightGoalType(user.weightGoalType || 'maintain');
            setTargetWeeklyChange(String(user.targetWeeklyChange || 0.5));
            setActivityLevel(user.activityLevel || 'moderate');
            setGender(user.gender || 'male');
            setHeight(String(user.height || ''));
            setAge(String(user.age || ''));
            setDailyCalorieGoal(String(user.dailyCalorieGoal || 2000));
        }
    }, [user]);

    // Calculate recommended calories
    const calculateBMR = () => {
        const w = parseFloat(currentWeight) || 70;
        const h = parseFloat(height) || 170;
        const a = parseInt(age) || 30;
        if (gender === 'male') {
            return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
        } else {
            return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
        }
    };

    const calculateTDEE = () => {
        const bmr = calculateBMR();
        const multipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
        };
        return Math.round(bmr * (multipliers[activityLevel] || 1.55));
    };

    const getRecommendedCalories = () => {
        const tdee = calculateTDEE();
        if (weightGoalType === 'maintain') return tdee;
        const weeklyChange = parseFloat(targetWeeklyChange) || 0.5;
        const dailyAdjustment = Math.round((weeklyChange * 7700) / 7);
        return weightGoalType === 'lose' ? tdee - dailyAdjustment : tdee + dailyAdjustment;
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                displayName,
                currentWeight: parseFloat(currentWeight) || 0,
                goalWeight: parseFloat(goalWeight) || 0,
                weightGoalType,
                targetWeeklyChange: parseFloat(targetWeeklyChange) || 0.5,
                activityLevel,
                gender,
                height: parseFloat(height) || 0,
                age: parseInt(age) || 0,
                dailyCalorieGoal: parseInt(dailyCalorieGoal) || 2000,
            } as any);
            showToast('Profile updated successfully');
        } catch (err) {
            showToast('Failed to update profile', 'error');
        }
    };

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="page-header">
                <h2>Profile</h2>
                <p>Manage your account and fitness goals</p>
            </div>

            <div className="profile-grid">
                <div className="card profile-sidebar">
                    <div className="profile-avatar-lg">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3 style={{ marginBottom: 4 }}>{user?.displayName || user?.username}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                        {user?.email}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        @{user?.username}
                    </p>
                    <button className="btn btn-danger" onClick={logout} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
                        Logout
                    </button>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Edit Profile</h3>
                    </div>

                    <div className="form-group">
                        <label>Display Name</label>
                        <input className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} autoComplete="name" enterKeyHint="next" />
                    </div>

                    <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: '0.95rem' }}>Body Metrics</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Current Weight (kg)</label>
                            <input className="form-input" type="number" inputMode="decimal" min="0" step="0.1" enterKeyHint="next" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input className="form-input" type="number" inputMode="decimal" min="0" step="0.1" enterKeyHint="next" value={height} onChange={e => setHeight(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Age</label>
                            <input className="form-input" type="number" inputMode="numeric" min="0" max="120" step="1" enterKeyHint="next" value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: '0.95rem' }}>Weight Goals</h4>

                    <div className="form-group">
                        <label>Weight Goal</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <button
                                className={`btn ${weightGoalType === 'lose' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setWeightGoalType('lose')}
                                style={{ flex: 1 }}
                            >
                                Lose Weight
                            </button>
                            <button
                                className={`btn ${weightGoalType === 'maintain' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setWeightGoalType('maintain')}
                                style={{ flex: 1 }}
                            >
                                Maintain
                            </button>
                            <button
                                className={`btn ${weightGoalType === 'gain' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setWeightGoalType('gain')}
                                style={{ flex: 1 }}
                            >
                                Gain Weight
                            </button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Target Weight (kg)</label>
                            <input className="form-input" type="number" inputMode="decimal" min="0" step="0.1" enterKeyHint="next" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Target Weekly Change</label>
                            <select className="form-input" value={targetWeeklyChange} onChange={e => setTargetWeeklyChange(e.target.value)}>
                                <option value="0.25">Slow (0.25 kg/week)</option>
                                <option value="0.5">Moderate (0.5 kg/week)</option>
                                <option value="0.75">Aggressive (0.75 kg/week)</option>
                                <option value="1">Very Aggressive (1 kg/week)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Activity Level</label>
                        <select className="form-input" value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
                            <option value="sedentary">Sedentary (little/no exercise)</option>
                            <option value="light">Light (1-3 days/week)</option>
                            <option value="moderate">Moderate (3-5 days/week)</option>
                            <option value="active">Active (6-7 days/week)</option>
                            <option value="very_active">Very Active (2x/day)</option>
                        </select>
                    </div>

                    {currentWeight && height && age && (
                        <div style={{
                            marginTop: 16,
                            padding: 16,
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: 8,
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#38bdf8' }}>
                                Recommended Daily Calories
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
                                {getRecommendedCalories()} kcal/day
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                BMR: {calculateBMR()} kcal · TDEE: {calculateTDEE()} kcal
                                {weightGoalType !== 'maintain' && (
                                    <span> · {weightGoalType === 'lose' ? 'Deficit' : 'Surplus'}: {Math.abs(calculateTDEE() - getRecommendedCalories())} kcal</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: 24 }}>
                        <label>Daily Calorie Goal (kcal)</label>
                        <input className="form-input" type="number" inputMode="numeric" min="0" step="50" enterKeyHint="done" value={dailyCalorieGoal} onChange={e => setDailyCalorieGoal(e.target.value)} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Or use the recommended value above
                        </p>
                    </div>

                    <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }}>
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
