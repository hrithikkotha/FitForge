import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, UserCog, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { useToast, ToastContainer } from '../components/Toast';

type Purpose = 'change_password' | 'change_username' | 'reset_data';

interface CardState {
    sending: boolean;
    submitting: boolean;
    otpRequested: boolean;
    otp: string;
    error: string;
    cooldown: number;
}

const initialCard = (): CardState => ({
    sending: false,
    submitting: false,
    otpRequested: false,
    otp: '',
    error: '',
    cooldown: 0,
});

const SettingsPage = () => {
    const { user, logout, setLocalUser } = useAuth();
    const { toasts, show, dismiss } = useToast();

    // Username card
    const [usernameState, setUsernameState] = useState<CardState>(initialCard);
    const [newUsername, setNewUsername] = useState('');

    // Password card
    const [passwordState, setPasswordState] = useState<CardState>(initialCard);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Reset data card
    const [resetState, setResetState] = useState<CardState>(initialCard);
    const [resetConfirm, setResetConfirm] = useState('');

    // Cooldown ticker (one shared interval for all three cards)
    useEffect(() => {
        const id = setInterval(() => {
            setUsernameState(s => (s.cooldown > 0 ? { ...s, cooldown: s.cooldown - 1 } : s));
            setPasswordState(s => (s.cooldown > 0 ? { ...s, cooldown: s.cooldown - 1 } : s));
            setResetState(s => (s.cooldown > 0 ? { ...s, cooldown: s.cooldown - 1 } : s));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const requestOtp = async (
        purpose: Purpose,
        setState: React.Dispatch<React.SetStateAction<CardState>>,
        validate?: () => string | null
    ) => {
        const validationError = validate?.() || null;
        if (validationError) {
            setState(s => ({ ...s, error: validationError }));
            return;
        }
        setState(s => ({ ...s, sending: true, error: '' }));
        try {
            await API.post('/auth/me/otp', { purpose });
            setState(s => ({ ...s, sending: false, otpRequested: true, cooldown: 30 }));
            show(`Code sent to ${user?.email}`, 'success');
        } catch (err: any) {
            setState(s => ({ ...s, sending: false, error: err.response?.data?.message || 'Could not send code' }));
        }
    };

    const handleChangeUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{4,8}$/.test(usernameState.otp)) {
            setUsernameState(s => ({ ...s, error: 'Enter the code from your email' }));
            return;
        }
        setUsernameState(s => ({ ...s, submitting: true, error: '' }));
        try {
            const { data } = await API.post('/auth/me/change-username', {
                otp: usernameState.otp,
                newUsername: newUsername.trim(),
            });
            setLocalUser(data);
            show('Username updated!', 'success');
            setNewUsername('');
            setUsernameState(initialCard());
        } catch (err: any) {
            setUsernameState(s => ({ ...s, submitting: false, error: err.response?.data?.message || 'Failed to update username' }));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordState(s => ({ ...s, error: 'Passwords do not match' }));
            return;
        }
        if (!/^\d{4,8}$/.test(passwordState.otp)) {
            setPasswordState(s => ({ ...s, error: 'Enter the code from your email' }));
            return;
        }
        setPasswordState(s => ({ ...s, submitting: true, error: '' }));
        try {
            await API.post('/auth/me/change-password', {
                otp: passwordState.otp,
                currentPassword,
                newPassword,
            });
            show('Password updated! Please sign in again.', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordState(initialCard());
            // Force re-login for security.
            setTimeout(() => logout(), 1200);
        } catch (err: any) {
            setPasswordState(s => ({ ...s, submitting: false, error: err.response?.data?.message || 'Failed to update password' }));
        }
    };

    const handleResetData = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetConfirm !== 'DELETE') {
            setResetState(s => ({ ...s, error: 'Type DELETE to confirm' }));
            return;
        }
        if (!/^\d{4,8}$/.test(resetState.otp)) {
            setResetState(s => ({ ...s, error: 'Enter the code from your email' }));
            return;
        }
        setResetState(s => ({ ...s, submitting: true, error: '' }));
        try {
            const { data } = await API.post('/auth/me/reset-data', { otp: resetState.otp });
            show(
                `Deleted ${data.deleted.workoutSessions} workouts and ${data.deleted.mealEntries} meal entries.`,
                'success'
            );
            setResetConfirm('');
            setResetState(initialCard());
        } catch (err: any) {
            setResetState(s => ({ ...s, submitting: false, error: err.response?.data?.message || 'Failed to reset data' }));
        }
    };

    const canResetData = user?.role === 'user';

    return (
        <div className="settings-page">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="settings-header">
                <h1><ShieldCheck size={28} /> Account Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Sensitive actions are protected by a one-time code sent to <strong>{user?.email}</strong>.
                </p>
            </div>

            {/* USERNAME CARD */}
            <section className="settings-card">
                <header className="settings-card-header">
                    <UserCog size={22} />
                    <div>
                        <h2>Change username</h2>
                        <p>Currently signed in as <strong>@{user?.username}</strong>.</p>
                    </div>
                </header>
                <form onSubmit={handleChangeUsername} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="new-username">New username</label>
                        <input
                            id="new-username"
                            className="form-input"
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            placeholder="At least 3 characters"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            minLength={3}
                            required
                        />
                    </div>
                    {!usernameState.otpRequested ? (
                        <button
                            type="button"
                            className="btn btn-primary settings-btn"
                            disabled={usernameState.sending || newUsername.trim().length < 3}
                            onClick={() => requestOtp('change_username', setUsernameState, () => {
                                if (newUsername.trim().length < 3) return 'Username must be at least 3 characters';
                                if (newUsername.trim() === user?.username) return 'Pick a different username';
                                return null;
                            })}
                        >
                            <Mail size={18} /> {usernameState.sending ? 'Sending...' : 'Send verification code'}
                        </button>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="username-otp">Verification code</label>
                                <input
                                    id="username-otp"
                                    className="form-input otp-input"
                                    type="text"
                                    value={usernameState.otp}
                                    onChange={e => setUsernameState(s => ({ ...s, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="123456"
                                    required
                                />
                            </div>
                            <div className="settings-action-row">
                                <button type="submit" className="btn btn-primary settings-btn" disabled={usernameState.submitting}>
                                    {usernameState.submitting ? 'Updating...' : 'Confirm change'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary settings-btn"
                                    disabled={usernameState.cooldown > 0 || usernameState.sending}
                                    onClick={() => requestOtp('change_username', setUsernameState)}
                                >
                                    {usernameState.cooldown > 0 ? `Resend in ${usernameState.cooldown}s` : 'Resend code'}
                                </button>
                            </div>
                        </>
                    )}
                    {usernameState.error && <div className="auth-error">{usernameState.error}</div>}
                </form>
            </section>

            {/* PASSWORD CARD */}
            <section className="settings-card">
                <header className="settings-card-header">
                    <KeyRound size={22} />
                    <div>
                        <h2>Change password</h2>
                        <p>You'll be signed out after a successful change.</p>
                    </div>
                </header>
                <form onSubmit={handleChangePassword} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="current-password">Current password</label>
                        <input
                            id="current-password"
                            className="form-input"
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            className="form-input"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-new-password">Confirm new password</label>
                        <input
                            id="confirm-new-password"
                            className="form-input"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>
                    {!passwordState.otpRequested ? (
                        <button
                            type="button"
                            className="btn btn-primary settings-btn"
                            disabled={passwordState.sending || !currentPassword || newPassword.length < 6}
                            onClick={() => requestOtp('change_password', setPasswordState, () => {
                                if (!currentPassword) return 'Current password required';
                                if (newPassword.length < 6) return 'New password must be at least 6 characters';
                                if (newPassword !== confirmPassword) return 'Passwords do not match';
                                return null;
                            })}
                        >
                            <Mail size={18} /> {passwordState.sending ? 'Sending...' : 'Send verification code'}
                        </button>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="password-otp">Verification code</label>
                                <input
                                    id="password-otp"
                                    className="form-input otp-input"
                                    type="text"
                                    value={passwordState.otp}
                                    onChange={e => setPasswordState(s => ({ ...s, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="123456"
                                    required
                                />
                            </div>
                            <div className="settings-action-row">
                                <button type="submit" className="btn btn-primary settings-btn" disabled={passwordState.submitting}>
                                    {passwordState.submitting ? 'Updating...' : 'Confirm change'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary settings-btn"
                                    disabled={passwordState.cooldown > 0 || passwordState.sending}
                                    onClick={() => requestOtp('change_password', setPasswordState)}
                                >
                                    {passwordState.cooldown > 0 ? `Resend in ${passwordState.cooldown}s` : 'Resend code'}
                                </button>
                            </div>
                        </>
                    )}
                    {passwordState.error && <div className="auth-error">{passwordState.error}</div>}
                </form>
            </section>

            {/* RESET DATA CARD — user role only */}
            {canResetData && (
                <section className="settings-card settings-card--danger">
                    <header className="settings-card-header">
                        <Trash2 size={22} />
                        <div>
                            <h2>Reset all data</h2>
                            <p>Permanently delete all your workout sessions and meal entries. Your account stays.</p>
                        </div>
                    </header>
                    <form onSubmit={handleResetData} className="settings-form">
                        <div className="form-group">
                            <label htmlFor="reset-confirm">Type <strong>DELETE</strong> to confirm</label>
                            <input
                                id="reset-confirm"
                                className="form-input"
                                type="text"
                                value={resetConfirm}
                                onChange={e => setResetConfirm(e.target.value)}
                                autoCapitalize="characters"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="DELETE"
                                required
                            />
                        </div>
                        {!resetState.otpRequested ? (
                            <button
                                type="button"
                                className="btn btn-danger settings-btn"
                                disabled={resetState.sending || resetConfirm !== 'DELETE'}
                                onClick={() => requestOtp('reset_data', setResetState, () => {
                                    if (resetConfirm !== 'DELETE') return 'Type DELETE first';
                                    return null;
                                })}
                            >
                                <Mail size={18} /> {resetState.sending ? 'Sending...' : 'Send verification code'}
                            </button>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label htmlFor="reset-otp">Verification code</label>
                                    <input
                                        id="reset-otp"
                                        className="form-input otp-input"
                                        type="text"
                                        value={resetState.otp}
                                        onChange={e => setResetState(s => ({ ...s, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        placeholder="123456"
                                        required
                                    />
                                </div>
                                <div className="settings-action-row">
                                    <button type="submit" className="btn btn-danger settings-btn" disabled={resetState.submitting}>
                                        {resetState.submitting ? 'Deleting...' : 'Delete all my data'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary settings-btn"
                                        disabled={resetState.cooldown > 0 || resetState.sending}
                                        onClick={() => requestOtp('reset_data', setResetState)}
                                    >
                                        {resetState.cooldown > 0 ? `Resend in ${resetState.cooldown}s` : 'Resend code'}
                                    </button>
                                </div>
                            </>
                        )}
                        {resetState.error && <div className="auth-error">{resetState.error}</div>}
                    </form>
                </section>
            )}
        </div>
    );
};

export default SettingsPage;
