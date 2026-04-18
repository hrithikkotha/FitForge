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
    // The middle item gets the "hero" treatment — raised pill, accent color.
    // Useful when a single feature should be the primary CTA on mobile.
    const heroIndex = items.length % 2 === 1 ? Math.floor(items.length / 2) : -1;
    return (
        <nav className="bottom-nav" aria-label="Primary">
            {items.map(({ to, label, Icon }, i) => {
                const isHero = i === heroIndex;
                return (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `bottom-nav__item ${isActive ? 'active' : ''} ${isHero ? 'bottom-nav__item--hero' : ''}`.trim()
                        }
                        aria-label={label}
                        end
                    >
                        <span className="bottom-nav__icon-wrap">
                            <Icon size={isHero ? 26 : 22} aria-hidden="true" />
                        </span>
                        <span className="bottom-nav__label">{label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
