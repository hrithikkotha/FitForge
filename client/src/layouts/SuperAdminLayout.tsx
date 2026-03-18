import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Shield, LogOut, UtensilsCrossed, Dumbbell, Globe, Palette, Menu, X } from 'lucide-react';

const SuperAdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => { setSidebarOpen(false); }, []);

    const confirmLogout = () => {
        setShowLogoutModal(false);
        setSidebarOpen(false);
        logout();
        navigate('/');
    };

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

            <div className="app-layout">
                {/* Mobile header */}
                <div className="mobile-header">
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => { navigate('/super-admin/dashboard'); setSidebarOpen(false); }}
                        title="Go to Dashboard"
                    >
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Globe size={16} color="#000" />
                        </div>
                        <h1 style={{ color: 'var(--sa-accent)' }}>FitForge</h1>
                        <span style={{ fontSize: '0.6rem', color: 'var(--sa-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: -4 }}>
                            Super Admin
                        </span>
                    </div>
                </div>

                {/* Overlay (mobile) */}
                <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

                <aside className={`sidebar super-admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                                onClick={() => setSidebarOpen(false)}
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
                        <div className="sidebar-user" onClick={() => setShowLogoutModal(true)} title="Click to logout" style={{ cursor: 'pointer' }}>
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
        </>
    );
};

export default SuperAdminLayout;
