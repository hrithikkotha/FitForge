import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Utensils, Bot, User } from 'lucide-react';

/**
 * Mobile-only bottom tab bar (visible at <= 768px via CSS).
 * 5 primary destinations chosen for thumb-zone reachability and frequency of use.
 * Secondary screens (Body Map, Statistics) remain accessible from the side drawer.
 */
const BottomNav = () => {
    const items = [
        { to: '/dashboard', label: 'Home', Icon: LayoutDashboard },
        { to: '/workouts', label: 'Workouts', Icon: Dumbbell },
        { to: '/nutrition', label: 'Nutrition', Icon: Utensils },
        { to: '/ai-assistant', label: 'AI', Icon: Bot },
        { to: '/profile', label: 'Profile', Icon: User },
    ];

    return (
        <nav className="bottom-nav" aria-label="Primary">
            {items.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'active' : ''}`
                    }
                    aria-label={label}
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
