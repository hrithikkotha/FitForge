import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleHome } from '../context/AuthContext';
import { CheckCircle, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationPending, setRegistrationPending] = useState(false);
    const [autoApprovedCreds, setAutoApprovedCreds] = useState<{ email: string; username: string } | null>(null);
    const [copiedField, setCopiedField] = useState('');
    const [suspendedMsg, setSuspendedMsg] = useState('');
    // OTP step (sign-up email verification)
    const [otpStage, setOtpStage] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpTtl, setOtpTtl] = useState(0);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const { login, initiateRegister, verifyRegisterOtp, resendRegisterOtp } = useAuth();
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
                const result = await initiateRegister(username, email, password);
                setOtpEmail(result.email);
                setOtpTtl(result.ttlMinutes);
                setOtpStage(true);
                setOtpCode('');
                showToast(`Verification code sent to ${result.email}`, 'success');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    // Resend cooldown timer
    useEffect(() => {
        if (otpResendCooldown <= 0) return;
        const id = setInterval(() => setOtpResendCooldown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(id);
    }, [otpResendCooldown]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^\d{4,8}$/.test(otpCode.trim())) {
            setError('Enter the 6-digit code from your email');
            return;
        }
        setLoading(true);
        try {
            const result = await verifyRegisterOtp(otpEmail, otpCode.trim());
            setOtpStage(false);
            setOtpCode('');
            if (result.pending) {
                setRegistrationPending(true);
            } else if (result.autoApproved && result.credentials) {
                setAutoApprovedCreds(result.credentials);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired code');
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        if (otpResendCooldown > 0) return;
        setError('');
        try {
            const r = await resendRegisterOtp(otpEmail);
            setOtpTtl(r.ttlMinutes);
            setOtpResendCooldown(30);
            showToast('New code sent', 'success');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not resend code');
        }
    };

    // OTP verification screen — between sign-up form and pending/autoApproved screens
    if (otpStage) {
        return (
            <div className="auth-page">
                <ToastContainer toasts={toasts} dismiss={dismiss} />
                <div className="auth-container fade-in">
                    <div className="auth-brand">
                        <img src="/logo.jpg" alt="FitForge Logo" className="logo-icon-lg" />
                        <h1>FitForge</h1>
                    </div>
                    <div className="auth-card">
                        <h2 style={{ marginBottom: 8, textAlign: 'center' }}>Verify your email</h2>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 18, fontSize: '0.9rem' }}>
                            We sent a 6-digit code to <strong style={{ color: 'var(--accent-primary)' }}>{otpEmail}</strong>.
                            Enter it within {otpTtl} minutes.
                        </p>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={handleVerifyOtp}>
                            <div className="form-group">
                                <label htmlFor="otp-code">Verification code</label>
                                <input
                                    id="otp-code"
                                    type="text"
                                    className="form-input"
                                    placeholder="123456"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    required
                                    style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.3rem', fontWeight: 600 }}
                                    enterKeyHint="go"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.85rem' }}>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={otpResendCooldown > 0}
                                style={{ background: 'none', border: 'none', cursor: otpResendCooldown > 0 ? 'not-allowed' : 'pointer', color: otpResendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)', fontWeight: 600 }}
                            >
                                {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend code'}
                            </button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={() => { setOtpStage(false); setOtpCode(''); setError(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}
                            >
                                ← Back to sign-up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

    // Show auto-approved credentials popup
    if (autoApprovedCreds) {
        const copyToClipboard = (text: string, field: string) => {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedField(field);
                setTimeout(() => setCopiedField(''), 2000);
            });
        };

        return (
            <div className="auth-page">
                <div className="auth-container fade-in">
                    <div className="auth-brand">
                        <img src="/logo.jpg" alt="FitForge Logo" className="logo-icon-lg" />
                        <h1>FitForge</h1>
                    </div>
                    <div className="auth-card" style={{ textAlign: 'center' }}>
                        <CheckCircle size={56} style={{ color: 'var(--accent-success)', margin: '0 auto 16px' }} />
                        <h2 style={{ marginBottom: 10 }}>Account Created!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
                            Your account has been <strong style={{ color: 'var(--accent-success)' }}>approved automatically</strong>. Use these credentials to log in:
                        </p>

                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem', wordBreak: 'break-all' }}>{autoApprovedCreds.email}</span>
                                    <button
                                        onClick={() => copyToClipboard(autoApprovedCreds.email, 'email')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 6, display: 'flex' }}
                                        title="Copy email"
                                    >
                                        {copiedField === 'email' ? <Check size={14} style={{ color: 'var(--accent-success)' }} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>{autoApprovedCreds.username}</span>
                                    <button
                                        onClick={() => copyToClipboard(autoApprovedCreds.username, 'username')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 6, display: 'flex' }}
                                        title="Copy username"
                                    >
                                        {copiedField === 'username' ? <Check size={14} style={{ color: 'var(--accent-success)' }} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
                            Your password is the one you just entered. Click below to log in now.
                        </p>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                            onClick={() => {
                                setEmail(autoApprovedCreds.email);
                                setPassword('');
                                setAutoApprovedCreds(null);
                                setIsLogin(true);
                                setUsername('');
                                setConfirmPassword('');
                            }}
                        >
                            Go to Sign In
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
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint="next"
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
                                inputMode="email"
                                autoComplete="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                enterKeyHint="next"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="auth-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    enterKeyHint={isLogin ? 'go' : 'next'}
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 4,
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="auth-confirm-password">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="auth-confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                        enterKeyHint="go"
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(v => !v)}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        style={{
                                            position: 'absolute',
                                            right: 10,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 4,
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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
