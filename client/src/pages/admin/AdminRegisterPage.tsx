import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';

const AdminRegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ gymName: '', displayName: '', username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/admin-register', {
                gymName: form.gymName,
                displayName: form.displayName || form.username,
                username: form.username,
                email: form.email,
                password: form.password,
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const f = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
                <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
                    <CheckCircle size={64} style={{ color: 'var(--admin-accent)', marginBottom: 20 }} />
                    <h2 style={{ marginBottom: 12 }}>Registration Submitted!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Your gym admin account request has been received.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>
                        The FitForge team will review your application and send you an email once approved. This typically takes 24–48 hours.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
            <div style={{ maxWidth: 500, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                    <button className="btn-icon" onClick={() => navigate('/')} title="Back to Login">
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Building2 size={28} style={{ color: 'var(--admin-accent)' }} />
                        <div>
                            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Gym Owner Registration</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                                Register your gym on FitForge
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ background: 'var(--admin-accent)15', border: '1px solid var(--admin-accent)40', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--admin-accent)' }}>ℹ️ Review Process</strong><br />
                        After submitting, your account will be manually reviewed and approved by FitForge before you can log in.
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Gym Name *</label>
                            <input className="form-input" placeholder="e.g. PowerHouse Fitness" required value={form.gymName} onChange={e => f('gymName', e.target.value)} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Your Name</label>
                                <input className="form-input" placeholder="Display name" value={form.displayName} onChange={e => f('displayName', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input className="form-input" placeholder="Unique username" required value={form.username} onChange={e => f('username', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input className="form-input" type="email" placeholder="gym@example.com" required value={form.email} onChange={e => f('email', e.target.value)} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <input className="form-input" type="password" placeholder="Min. 6 characters" required value={form.password} onChange={e => f('password', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <input className="form-input" type="password" placeholder="Repeat password" required value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)} />
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 16, padding: '10px 14px', background: 'var(--accent-danger)15', borderRadius: 8 }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                            {loading ? 'Submitting...' : 'Submit Registration'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminRegisterPage;
