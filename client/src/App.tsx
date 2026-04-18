import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleHome } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ForceLogoutOverlay from './components/ForceLogoutOverlay';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import NutritionPage from './pages/NutritionPage';
import BodyMapPage from './pages/BodyMapPage';
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage';
import AIAssistantPage from './pages/AIAssistantPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';
import SuperAdminOverviewPage from './pages/superadmin/OverviewPage';
import SuperAdminAdminsPage from './pages/superadmin/AdminsPage';
import SuperAdminDetailPage from './pages/superadmin/AdminDetailPage';
import FoodsPage from './pages/superadmin/FoodsPage';
import ExercisesPage from './pages/superadmin/ExercisesPage';
import AllUsersPage from './pages/superadmin/AllUsersPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MembersPage from './pages/admin/MembersPage';
import './index.css';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

// ── Regular user layout ────────────────────────────────────────────────────
const ProtectedLayout = () => {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setSidebarOpen(false); }, []);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading...</div>
        </div>;
    }

    if (!user) return <Navigate to="/" replace />;
    if (user.role !== 'user') return <Navigate to={getRoleHome(user.role)} replace />;

    return (
        <div className="app-layout">
            <div className="mobile-header">
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}
                    title="Go to Dashboard"
                >
                    <img src="/logo.jpg" alt="FitForge" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                    <h1>FitForge</h1>
                </div>
            </div>
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="app-main"><Outlet /></main>
            <BottomNav />
        </div>
    );
};

// ── Auth guard (login page) ────────────────────────────────────────────────
const AuthGuard = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to={getRoleHome(user.role)} replace />;
    return <AuthPage />;
};

// ── Super Admin route guard ────────────────────────────────────────────────
const SuperAdminGuard = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== 'super_admin') return <Navigate to={getRoleHome(user.role)} replace />;
    return <SuperAdminLayout />;
};

// ── Admin route guard ──────────────────────────────────────────────────────
const AdminGuard = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== 'admin') return <Navigate to={getRoleHome(user.role)} replace />;
    return <AdminLayout />;
};

// ── App ────────────────────────────────────────────────────────────────────
function App() {
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'alternate') {
            document.documentElement.setAttribute('data-theme', 'alternate');
        }
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                {/* Global force-logout overlay — renders on top of everything */}
                <ForceLogoutOverlay />

                <Routes>
                    {/* Public */}
                    <Route path="/" element={<AuthGuard />} />
                    <Route path="/admin/register" element={<AdminRegisterPage />} />

                    {/* Regular users */}
                    <Route element={<ProtectedLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/workouts" element={<WorkoutsPage />} />
                        <Route path="/nutrition" element={<NutritionPage />} />
                        <Route path="/body-map" element={<BodyMapPage />} />
                        <Route path="/stats" element={<StatisticsPage />} />
                        <Route path="/ai-assistant" element={<AIAssistantPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    {/* Super Admin */}
                    <Route element={<SuperAdminGuard />}>
                        <Route path="/super-admin/dashboard" element={<SuperAdminOverviewPage />} />
                        <Route path="/super-admin/admins" element={<SuperAdminAdminsPage />} />
                        <Route path="/super-admin/admins/:id" element={<SuperAdminDetailPage />} />
                        <Route path="/super-admin/foods" element={<FoodsPage />} />
                        <Route path="/super-admin/exercises" element={<ExercisesPage />} />
                        <Route path="/super-admin/users" element={<AllUsersPage />} />
                    </Route>

                    {/* Admin */}
                    <Route element={<AdminGuard />}>
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin/members" element={<MembersPage />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
