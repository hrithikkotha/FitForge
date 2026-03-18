import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Building2, Palette, Menu, X } from 'lucide-react';

const AdminLayout = () => {
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
        { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/members', label: 'Members', icon: <Users size={20} /> },
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
                        onClick={() => { navigate('/admin/dashboard'); setSidebarOpen(false); }}
                        title="Go to Dashboard"
                    >
                        <Building2 size={22} style={{ color: 'var(--admin-accent)', flexShrink: 0 }} />
                        <h1 style={{ color: 'var(--admin-accent)' }}>{user?.gymName || 'Gym Portal'}</h1>
                    </div>
                </div>

                {/* Overlay (mobile) */}
                <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

                <aside className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                        <div className="sidebar-user" onClick={() => setShowLogoutModal(true)} title="Click to logout" style={{ cursor: 'pointer' }}>
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
        </>
    );
};

export default AdminLayout;
