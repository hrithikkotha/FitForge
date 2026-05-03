import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
    className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
    const { isDark, toggle } = useTheme();

    return (
        <button
            type="button"
            className={className}
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
                position: 'relative',
                width: 70,
                height: 32,
                borderRadius: 999,
                border: isDark
                    ? '2px solid rgba(180,180,255,0.22)'
                    : '2px solid rgba(180,160,130,0.45)',
                background: isDark
                    ? 'linear-gradient(150deg, #0d0d28 0%, #1a1a42 45%, #24245a 100%)'
                    : 'linear-gradient(150deg, #87CEEB 0%, #a8d8ea 40%, #c9e4f0 100%)',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                overflow: 'hidden',
                transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
                boxShadow: isDark
                    ? '0 2px 8px rgba(0,0,30,0.65), inset 0 1px 0 rgba(255,255,255,0.07)'
                    : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            {/* ── DARK mode decorations ── */}
            {isDark && (
                <>
                    {/* Sparkle 4-point star near the moon knob */}
                    <svg
                        viewBox="0 0 10 10"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ position: 'absolute', right: 8, top: 5, width: 6, height: 6, opacity: 0.9, zIndex: 2 }}
                    >
                        <path d="M5 0 L5.9 3.7 L10 5 L5.9 6.3 L5 10 L4.1 6.3 L0 5 L4.1 3.7 Z" />
                    </svg>
                    {/* Small dark cloud on the left */}
                    <svg
                        width="22" height="14" viewBox="0 0 36 22" fill="none"
                        style={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)', opacity: 0.28, zIndex: 1 }}
                    >
                        <ellipse cx="18" cy="15" rx="16" ry="7" fill="#4a4a80" />
                        <ellipse cx="12" cy="12" rx="10" ry="8" fill="#4a4a80" />
                        <ellipse cx="24" cy="13" rx="9" ry="7" fill="#4a4a80" />
                    </svg>
                </>
            )}

            {/* ── LIGHT mode decorations ── */}
            {!isDark && (
                <>
                    {/* Fluffy clouds at the bottom-right */}
                    <svg
                        width="44" height="20" viewBox="0 0 72 32" fill="none"
                        style={{ position: 'absolute', bottom: -1, right: 1, zIndex: 1 }}
                    >
                        <ellipse cx="36" cy="26" rx="33" ry="9" fill="white" fillOpacity="0.92" />
                        <ellipse cx="22" cy="20" rx="18" ry="12" fill="white" fillOpacity="0.85" />
                        <ellipse cx="46" cy="21" rx="15" ry="11" fill="white" fillOpacity="0.8" />
                        <ellipse cx="62" cy="25" rx="10" ry="8" fill="white" fillOpacity="0.75" />
                    </svg>
                </>
            )}

            {/* ── KNOB (slides left ↔ right) ── */}
            <div
                style={{
                    position: 'absolute',
                    top: 3,
                    left: isDark ? 40 : 3,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    transition: 'left 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 5,
                    background: isDark
                        ? 'radial-gradient(circle at 42% 38%, #a0a0c0, #6a6a90 55%, #42426a)'
                        : 'radial-gradient(circle at 38% 32%, #ffe86a, #ffd000 52%, #ffb300)',
                    boxShadow: isDark
                        ? '0 1px 6px rgba(0,0,30,0.55), inset 0 1px 1px rgba(255,255,255,0.18)'
                        : '0 1px 6px rgba(255,185,0,0.55), inset 0 1px 2px rgba(255,255,255,0.65)',
                }}
            >
                {/* Moon craters */}
                {isDark && (
                    <>
                        <div style={{ position: 'absolute', top: 5, left: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,20,0.22)' }} />
                        <div style={{ position: 'absolute', top: 12, left: 10, width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,20,0.18)' }} />
                        <div style={{ position: 'absolute', top: 8, left: 15, width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,20,0.16)' }} />
                    </>
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;
