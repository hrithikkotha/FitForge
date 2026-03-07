import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save } from 'lucide-react';

const ProfilePage = () => {
    const { user, updateProfile, logout } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [weight, setWeight] = useState(String(user?.weight || ''));
    const [height, setHeight] = useState(String(user?.height || ''));
    const [age, setAge] = useState(String(user?.age || ''));
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(String(user?.dailyCalorieGoal || 2000));
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        try {
            await updateProfile({
                displayName,
                weight: parseFloat(weight) || 0,
                height: parseFloat(height) || 0,
                age: parseInt(age) || 0,
                dailyCalorieGoal: parseInt(dailyCalorieGoal) || 2000,
            } as any);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update profile');
        }
    };

    return (
        <div className="fade-in">
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

                    {message && (
                        <div style={{
                            padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem',
                            background: message.includes('success') ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                            color: message.includes('success') ? 'var(--accent-success)' : 'var(--accent-danger)',
                            border: `1px solid ${message.includes('success') ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)'}`,
                        }}>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Display Name</label>
                        <input className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input className="form-input" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input className="form-input" type="number" value={height} onChange={e => setHeight(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Age</label>
                            <input className="form-input" type="number" value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Daily Calorie Goal (kcal)</label>
                            <input className="form-input" type="number" value={dailyCalorieGoal} onChange={e => setDailyCalorieGoal(e.target.value)} />
                        </div>
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
