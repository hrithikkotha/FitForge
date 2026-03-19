import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TOTAL = 5;
const CIRCUMFERENCE = 2 * Math.PI * 35; // ~220

const ForceLogoutOverlay = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [reason, setReason] = useState('');
    const [count, setCount] = useState(TOTAL);
    const reasonRef = useRef('');
    const hasLoggedOut = useRef(false);

    const doLogout = useCallback(() => {
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;
        localStorage.setItem('fitforge_suspended_msg', reasonRef.current || 'Session ended.');
        logout();
        setVisible(false);
        navigate('/', { replace: true });
    }, [logout, navigate]);

    // Listen for the custom event
    useEffect(() => {
        const handler = (e: Event) => {
            // If the overlay is already showing, don't reset the countdown
            if (hasLoggedOut.current) return;
            const msg = (e as CustomEvent<string>).detail || 'Your session has ended.';
            reasonRef.current = msg;
            hasLoggedOut.current = false;
            setReason(msg);
            setCount(prev => (prev > 0 && prev < TOTAL ? prev : TOTAL)); // don't reset if already counting
            setVisible(true);
        };
        window.addEventListener('fitforge_force_logout', handler);
        return () => window.removeEventListener('fitforge_force_logout', handler);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [visible]);

    // Trigger logout at 0
    useEffect(() => {
        if (visible && count === 0) {
            const t = setTimeout(() => doLogout(), 300);
            return () => clearTimeout(t);
        }
    }, [count, visible, doLogout]);

    if (!visible) return null;

    const progress = (count / TOTAL) * CIRCUMFERENCE;

    return (
        <div className="force-logout-backdrop">
            <div className="force-logout-card">
                <div className="force-logout-icon-wrap">⛔</div>
                <div className="force-logout-title">Account Access Revoked</div>
                <div className="force-logout-reason">{reason}</div>

                <div className="force-logout-timer">
                    <svg className="force-logout-ring" viewBox="0 0 80 80">
                        <circle className="force-logout-ring-bg" cx="40" cy="40" r="35" />
                        <circle
                            className="force-logout-ring-progress"
                            cx="40" cy="40" r="35"
                            style={{
                                strokeDasharray: CIRCUMFERENCE,
                                strokeDashoffset: CIRCUMFERENCE - progress,
                            }}
                        />
                    </svg>
                    <div className="force-logout-count">{count}</div>
                </div>

                <div className="force-logout-hint">
                    You will be signed out in <strong>{count}</strong> second{count !== 1 ? 's' : ''}…
                </div>
            </div>
        </div>
    );
};

export default ForceLogoutOverlay;
