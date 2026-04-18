import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
    to: string;
    label: string;
    Icon: LucideIcon;
}

interface BottomNavProps {
    items: BottomNavItem[];
}

/**
 * Mobile-only bottom tab bar (visible at <= 768px via CSS).
 * Items are passed in by the layout so each role gets its own destinations.
 */
const BottomNav = ({ items }: BottomNavProps) => {
    if (!items?.length) return null;
    return (
        <nav className="bottom-nav" aria-label="Primary">
            {items.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
                    aria-label={label}
                    end
                >
                    <span className="bottom-nav__icon-wrap">
                        <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="bottom-nav__label">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
