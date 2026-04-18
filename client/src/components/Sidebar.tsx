import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Dumbbell, Utensils, Activity,
    BarChart3, User, LogOut, Settings, Bot
} from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const confirmLogout = () => {
        setShowLogoutModal(false);
        if (onClose) onClose();
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/workouts', label: 'Workouts', icon: <Dumbbell size={20} /> },
        { path: '/nutrition', label: 'Nutrition', icon: <Utensils size={20} /> },
        { path: '/body-map', label: 'Body Map', icon: <Activity size={20} /> },
        { path: '/stats', label: 'Statistics', icon: <BarChart3 size={20} /> },
        { path: '/ai-assistant', label: 'AI Assistant', icon: <Bot size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
        { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <>
            {/* Logout confirmation modal */}
            {showLogoutModal && (
                <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="logout-modal" onClick={e => e.stopPropagation()}>
                        <div className="logout-modal-icon">
                            <LogOut size={24} />
                        </div>
                        <h3>Log Out?</h3>
                        <p>You'll be returned to the sign-in page. Any unsaved progress may be lost.</p>
                        <div className="logout-modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmLogout}>
                                <LogOut size={15} /> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div
                    className="sidebar-logo"
                    onClick={() => {
                        navigate('/dashboard');
                        if (onClose) onClose();
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Go to Dashboard"
                >
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
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={() => setShowLogoutModal(true)} title="Click to logout">
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
        </>
    );
};

export default Sidebar;
