import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import API from '../api/axios';

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    weight: number;
    height: number;
    age: number;
    dailyCalorieGoal: number;
    role: UserRole;
    status: UserStatus;
    gymName: string;
    adminId: string | null;
    token: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ displayName: string }>;
    /** Step 1 of OTP sign-up: validates input, sends OTP to email. Does NOT create the user. */
    initiateRegister: (username: string, email: string, password: string) => Promise<{ email: string; ttlMinutes: number }>;
    /** Step 2 of OTP sign-up: confirms OTP and finalises account creation. */
    verifyRegisterOtp: (email: string, code: string) => Promise<{ pending: boolean; autoApproved?: boolean; credentials?: { email: string; username: string } }>;
    /** Resend the sign-up OTP for an in-flight registration. */
    resendRegisterOtp: (email: string) => Promise<{ ttlMinutes: number }>;
    /** Manual-approval sign-up: creates account with pending status (no OTP). */
    directRegister: (username: string, email: string, password: string) => Promise<{ pending: boolean; message: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    /** Refresh the locally-cached user (e.g. after a username change). */
    setLocalUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('fitforge_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    // ── Heartbeat: detect suspension/deletion even when the user is idle ──────
    // Polls GET /auth/me every 10 s while logged in. The protect middleware on
    // the server returns 403 "Account is not active" for suspended accounts
    // (including users whose gym admin was suspended). The axios interceptor
    // picks up that 403 and fires the fitforge_force_logout custom event,
    // which ForceLogoutOverlay handles — no extra logic needed here.
    //
    // NOTE: We fire an immediate check on mount so that a freshly-suspended
    // user is caught right away instead of waiting for the first interval tick.
    useEffect(() => {
        if (!user) return;
        const poll = () => {
            API.get('/auth/me').catch(() => {
                // Intentionally empty — axios interceptor handles 403 / 401.
            });
        };
        // Fire immediately so suspension is detected without waiting
        poll();
        const id = setInterval(poll, 10_000);
        return () => clearInterval(id);
    }, [user]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('fitforge_user');
    }, []);

    const login = async (email: string, password: string): Promise<{ displayName: string }> => {
        const { data } = await API.post('/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('fitforge_user', JSON.stringify(data));
        return { displayName: data.displayName || data.username };
    };

    const initiateRegister = async (username: string, email: string, password: string) => {
        const { data } = await API.post('/auth/register/initiate', { username, email, password });
        return { email: data.email as string, ttlMinutes: data.ttlMinutes as number };
    };

    const verifyRegisterOtp = async (email: string, code: string) => {
        const { data } = await API.post('/auth/register/verify', { email, code });
        if (data.pending) return { pending: true };
        if (data.autoApproved) {
            return { pending: false, autoApproved: true, credentials: data.credentials };
        }
        return { pending: false };
    };

    const resendRegisterOtp = async (email: string) => {
        const { data } = await API.post('/auth/register/resend', { email });
        return { ttlMinutes: data.ttlMinutes as number };
    };

    const directRegister = async (username: string, email: string, password: string) => {
        const { data } = await API.post('/auth/register/direct', { username, email, password });
        return { pending: data.pending as boolean, message: data.message as string };
    };

    const updateProfile = async (updates: Partial<User>) => {
        const { data } = await API.put('/auth/me', updates);
        const updated = { ...user!, ...data };
        setUser(updated);
        localStorage.setItem('fitforge_user', JSON.stringify(updated));
    };

    const setLocalUser = (updates: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...updates } as User;
        setUser(updated);
        localStorage.setItem('fitforge_user', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, initiateRegister, verifyRegisterOtp, resendRegisterOtp, directRegister, logout, updateProfile, setLocalUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

/** Returns the home route for the given role */
export const getRoleHome = (role: UserRole): string => {
    if (role === 'super_admin') return '/super-admin/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/dashboard';
};
