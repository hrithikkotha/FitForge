import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
    className?: string;
}

/**
 * Sun / moon emoji toggle. Shows the destination emoji
 * (i.e. when in dark mode, displays ☀️ inviting you to switch to light).
 * Designed to live in the top-right of the mobile-header.
 */
const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
    const { isDark, toggle } = useTheme();

    return (
        <button
            type="button"
            className={`theme-toggle-pill ${className}`.trim()}
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
            <span className="theme-toggle-emoji" aria-hidden="true">
                {isDark ? '☀️' : '🌙'}
            </span>
        </button>
    );
};

export default ThemeToggle;
