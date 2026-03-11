import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<{ pending: boolean }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
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

    const login = async (email: string, password: string) => {
        const { data } = await API.post('/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('fitforge_user', JSON.stringify(data));
        // Navigation handled in AuthGuard / ProtectedLayout based on role
    };

    const register = async (username: string, email: string, password: string): Promise<{ pending: boolean }> => {
        const { data } = await API.post('/auth/register', { username, email, password });
        if (data.pending) {
            // Account created but awaiting Super Admin approval — do NOT log in
            return { pending: true };
        }
        // Fallback: if somehow token is returned (e.g. future change), log in normally
        setUser(data);
        localStorage.setItem('fitforge_user', JSON.stringify(data));
        return { pending: false };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fitforge_user');
    };

    const updateProfile = async (updates: Partial<User>) => {
        const { data } = await API.put('/auth/me', updates);
        const updated = { ...user!, ...data };
        setUser(updated);
        localStorage.setItem('fitforge_user', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
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
