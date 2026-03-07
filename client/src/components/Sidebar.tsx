import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Utensils, Activity,
    BarChart3, User, LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
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
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">F</div>
                <h1>FitForge</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
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
