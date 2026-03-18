import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleHome } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationPending, setRegistrationPending] = useState(false);
    const [suspendedMsg, setSuspendedMsg] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const { toasts, show: showToast, dismiss } = useToast();

    // Read and clear any suspend/delete message left by the interceptor
    useEffect(() => {
        const msg = localStorage.getItem('fitforge_suspended_msg');
        if (msg) {
            setSuspendedMsg(msg);
            localStorage.removeItem('fitforge_suspended_msg');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuspendedMsg(''); // clear banner on new attempt
        setLoading(true);
        try {
            if (isLogin) {
                const { displayName } = await login(email, password);
                showToast(`Welcome back, ${displayName}! 👋`, 'success');
                const stored = localStorage.getItem('fitforge_user');
                if (stored) {
                    const u = JSON.parse(stored);
                    setTimeout(() => navigate(getRoleHome(u.role), { replace: true }), 500);
                }
            } else {
                if (!username.trim()) {
                    setError('Username is required');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                const result = await register(username, email, password);
                if (result.pending) {
                    setRegistrationPending(true);
                    setLoading(false);
                    return;
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    // Show pending approval screen after sign-up
    if (registrationPending) {
        return (
            <div className="auth-page">
                <div className="auth-container fade-in">
                    <div className="auth-brand">
                        <img src="/logo.jpg" alt="FitForge Logo" className="logo-icon-lg" />
                        <h1>FitForge</h1>
                    </div>
                    <div className="auth-card" style={{ textAlign: 'center' }}>
                        <CheckCircle size={56} style={{ color: 'var(--accent-success)', margin: '0 auto 16px' }} />
                        <h2 style={{ marginBottom: 10 }}>Account Under Review</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                            Your account has been created successfully!
                        </p>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
                            The <strong style={{ color: 'var(--accent-primary)' }}>FitForge team</strong> needs to verify your account before you can log in.
                            This typically takes a short while. You'll be able to sign in once approved.
                        </p>
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => { setRegistrationPending(false); setIsLogin(true); setEmail(''); setPassword(''); setUsername(''); setConfirmPassword(''); }}
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="auth-container fade-in">
                <div className="auth-brand">
                    <img src="/logo.jpg" alt="FitForge Logo" className="logo-icon-lg" />
                    <h1>FitForge</h1>
                    <p>Your complete fitness companion</p>
                </div>

                <div className="auth-card">
                    {/* Suspended / deleted account banner */}
                    {suspendedMsg && (
                        <div className="suspended-banner">
                            <span className="suspended-banner-icon">⛔</span>
                            <div className="suspended-banner-content">
                                <div className="suspended-banner-title">Account Access Restricted</div>
                                <div className="suspended-banner-msg">{suspendedMsg}</div>
                            </div>
                        </div>
                    )}

                    <div className="tabs">
                        <button
                            className={`tab ${isLogin ? 'active' : ''}`}
                            onClick={() => { setIsLogin(true); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            className={`tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => { setIsLogin(false); setError(''); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="auth-username">Username</label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    className="form-input"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="auth-email">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="auth-password">Password</label>
                            <input
                                id="auth-password"
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="auth-confirm-password">Confirm Password</label>
                                <input
                                    id="auth-confirm-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-toggle">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>

                    {/* Gym owner CTA */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Are you a gym owner? </span>
                        <button
                            onClick={() => navigate('/admin/register')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-accent)', fontSize: '0.82rem', fontWeight: 600, padding: 0 }}
                        >
                            Register your gym →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
