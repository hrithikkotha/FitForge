import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Shield, LogOut, UtensilsCrossed, Dumbbell, Globe, Palette } from 'lucide-react';

const SuperAdminLayout = () => {
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
        { path: '/super-admin/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/super-admin/admins', label: 'Gym Admins', icon: <Shield size={20} /> },
        { path: '/super-admin/users', label: 'All Users', icon: <Users size={20} /> },
        { path: '/super-admin/foods', label: 'Food Database', icon: <UtensilsCrossed size={20} /> },
        { path: '/super-admin/exercises', label: 'Exercise Library', icon: <Dumbbell size={20} /> },
    ];

    return (
        <div className="app-layout">
            <aside className="sidebar super-admin-sidebar">
                <div className="sidebar-logo" style={{ cursor: 'default', background: 'linear-gradient(135deg, rgba(252,163,17,0.12), rgba(252,163,17,0.04))' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(252,163,17,0.35)'
                    }}>
                        <Globe size={22} color="#000" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>FitForge</h1>
                        <span style={{ fontSize: '0.65rem', color: 'var(--sa-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Super Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ paddingTop: 20 }}>
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
                    <div style={{ padding: '8px 12px', marginBottom: 8, background: 'rgba(252,163,17,0.08)', borderRadius: 12, fontSize: '0.72rem', color: 'var(--sa-accent)', fontWeight: 600, textAlign: 'center' }}>
                        ⚡ Super Admin Mode
                    </div>
                    <div className="sidebar-user" onClick={handleLogout} title="Click to logout" style={{ cursor: 'pointer' }}>
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)', color: '#000' }}>
                            {user?.displayName?.charAt(0).toUpperCase() || 'S'}
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

export default SuperAdminLayout;
