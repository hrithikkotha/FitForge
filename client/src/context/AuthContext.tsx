import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import API from '../api/axios';

interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    weight: number;
    height: number;
    age: number;
    dailyCalorieGoal: number;
    token: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
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
    };

    const register = async (username: string, email: string, password: string) => {
        const { data } = await API.post('/auth/register', { username, email, password });
        setUser(data);
        localStorage.setItem('fitforge_user', JSON.stringify(data));
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
