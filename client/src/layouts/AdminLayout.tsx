import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Building2, Palette } from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/'); };

    const [isAlternate, setIsAlternate] = useState(
        localStorage.getItem('theme') === 'alternate' || document.documentElement.getAttribute('data-theme') === 'alternate'
    );
    useEffect(() => {
        const handleStorage = () => setIsAlternate(localStorage.getItem('theme') === 'alternate' || document.documentElement.getAttribute('data-theme') === 'alternate');
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    const toggleTheme = () => {
        if (isAlternate) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'default'); setIsAlternate(false); }
        else { document.documentElement.setAttribute('data-theme', 'alternate'); localStorage.setItem('theme', 'alternate'); setIsAlternate(true); }
    };

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/members', label: 'Members', icon: <Users size={20} /> },
    ];

    return (
        <div className="app-layout">
            <aside className="sidebar admin-sidebar">
                <div className="sidebar-logo" style={{ cursor: 'default' }}>
                    <Building2 size={28} style={{ color: 'var(--admin-accent)' }} />
                    <div>
                        <h1 style={{ fontSize: '1rem' }}>{user?.gymName || 'Gym Portal'}</h1>
                        <span style={{ fontSize: '0.65rem', color: 'var(--admin-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            {item.icon}{item.label}
                        </NavLink>
                    ))}
                    <div style={{ flex: 1 }} />
                    <div className="theme-toggle-container">
                        <button onClick={toggleTheme} className="theme-toggle-btn">
                            <Palette size={18} className="theme-icon" />
                            <span>Change Theme</span>
                        </button>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={handleLogout} title="Click to logout" style={{ cursor: 'pointer' }}>
                        <div className="user-avatar" style={{ background: 'var(--admin-accent)' }}>
                            {user?.displayName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="user-info">
                            <div className="name">{user?.displayName}</div>
                            <div className="email">{user?.email}</div>
                        </div>
                        <LogOut size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                </div>
            </aside>
            <main className="app-main"><Outlet /></main>
        </div>
    );
};

export default AdminLayout;
