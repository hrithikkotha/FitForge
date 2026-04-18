import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'theme';

/**
 * Reads the current theme from <html data-theme> / localStorage.
 * - 'dark'  → no data-theme attribute (default claymorphism dark palette)
 * - 'light' → data-theme="alternate" (existing alternate palette)
 *
 * Storage values intentionally remain backwards-compatible with the previous
 * implementation: 'default' / 'alternate' (the rest of the app may still
 * inspect localStorage directly).
 */
const readInitialTheme = (): ThemeMode => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'alternate') return 'light';
    if (stored === 'default') return 'dark';
    // No explicit preference yet — honor system preference if available.
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
};

const applyTheme = (mode: ThemeMode) => {
    if (mode === 'light') {
        document.documentElement.setAttribute('data-theme', 'alternate');
        localStorage.setItem(STORAGE_KEY, 'alternate');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'default');
    }
};

export const useTheme = () => {
    const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);

    // Apply on mount / whenever the value changes.
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Sync across tabs.
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== STORAGE_KEY) return;
            const next: ThemeMode = e.newValue === 'alternate' ? 'light' : 'dark';
            setThemeState(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);
    const toggle = useCallback(() => setThemeState(t => (t === 'dark' ? 'light' : 'dark')), []);

    return { theme, setTheme, toggle, isDark: theme === 'dark', isLight: theme === 'light' };
};
