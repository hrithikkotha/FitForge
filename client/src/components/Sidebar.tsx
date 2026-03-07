import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Utensils, Activity,
    BarChart3, User, LogOut, Palette
} from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleTheme = () => {
        const isAlternate = document.documentElement.getAttribute('data-theme') === 'alternate';
        if (isAlternate) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'default');
        } else {
            document.documentElement.setAttribute('data-theme', 'alternate');
            localStorage.setItem('theme', 'alternate');
        }
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/workouts', label: 'Workouts', icon: <Dumbbell size={20} /> },
        { path: '/nutrition', label: 'Nutrition', icon: <Utensils size={20} /> },
        { path: '/body-map', label: 'Body Map', icon: <Activity size={20} /> },
        { path: '/stats', label: 'Statistics', icon: <BarChart3 size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <img src="/logo.jpg" alt="FitForge Logo" className="logo-icon" />
                <h1>FitForge</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}

                <div style={{ flex: 1 }}></div>

                <div className="theme-toggle-container">
                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        <Palette size={18} className="theme-icon" />
                        <span>Toggle Theme</span>
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
                    <div className="user-avatar">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <div className="name">{user?.displayName || user?.username}</div>
                        <div className="email">{user?.email}</div>
                    </div>
                    <LogOut size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
