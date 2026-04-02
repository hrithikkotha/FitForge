import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Shield, Users, Clock, Dumbbell, UtensilsCrossed, Activity, TrendingUp, UserCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const OverviewPage = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [autoApprove, setAutoApprove] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            API.get('/super-admin/stats'),
            API.get('/super-admin/settings'),
        ])
            .then(([statsRes, settingsRes]) => {
                setStats(statsRes.data);
                setAutoApprove(settingsRes.data.autoApproveUsers ?? false);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleAutoApprove = async () => {
        setSettingsLoading(true);
        try {
            const { data } = await API.put('/super-admin/settings', { autoApproveUsers: !autoApprove });
            setAutoApprove(data.autoApproveUsers);
        } catch (err) {
            console.error('Failed to toggle auto-approve:', err);
        } finally {
            setSettingsLoading(false);
        }
    };

    if (loading) return <PageLoader />;

    const cards = [
        { label: 'Gym Admins', value: stats?.totalAdmins ?? 0, icon: <Shield size={22} />, color: 'sa', sub: `${stats?.pendingAdmins ?? 0} pending` },
        { label: 'Total Members', value: stats?.totalUsers ?? 0, icon: <Users size={22} />, color: 'green', sub: `${stats?.pendingUsers ?? 0} awaiting approval` },
        { label: 'Workouts Logged', value: stats?.totalWorkouts ?? 0, icon: <Dumbbell size={22} />, color: 'purple', sub: 'all time' },
        { label: 'Meals Logged', value: stats?.totalMeals ?? 0, icon: <UtensilsCrossed size={22} />, color: 'blue', sub: 'all time' },
        { label: 'Food Items', value: stats?.totalFoods ?? 0, icon: <Activity size={22} />, color: 'orange', sub: 'in database' },
        { label: 'Exercises', value: stats?.totalExercises ?? 0, icon: <TrendingUp size={22} />, color: 'green', sub: 'in library' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, string> = { active: '#4ade80', pending: '#fca311', suspended: '#ef4444' };
        return (
            <span style={{ padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, background: `${map[status] || '#999'}22`, color: map[status] || '#999' }}>
                {status}
            </span>
        );
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(252,163,17,0.3)' }}>
                        <Shield size={24} color="#000" />
                    </div>
                    <div>
                        <h2>Platform Overview</h2>
                        <p>Command centre — all systems across FitForge</p>
                    </div>
                </div>
            </div>

            {/* ── Auto-Approve Toggle ────────────────────────────────────────── */}
            <div style={{
                background: autoApprove
                    ? 'rgba(74,222,128,0.08)'
                    : 'rgba(252,163,17,0.06)',
                border: `1px solid ${autoApprove ? 'rgba(74,222,128,0.3)' : 'rgba(252,163,17,0.25)'}`,
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {autoApprove
                            ? <ToggleRight size={20} style={{ color: '#4ade80' }} />
                            : <ToggleLeft size={20} style={{ color: 'var(--sa-accent)' }} />
                        }
                        Auto-Approve New Signups
                        <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: 99,
                            background: autoApprove ? 'rgba(74,222,128,0.2)' : 'rgba(252,163,17,0.2)',
                            color: autoApprove ? '#4ade80' : 'var(--sa-accent)',
                        }}>
                            {autoApprove ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {autoApprove
                            ? 'New users are instantly approved when they sign up — no manual review needed.'
                            : 'New users must be manually approved before they can log in.'}
                    </div>
                </div>
                <button
                    onClick={toggleAutoApprove}
                    disabled={settingsLoading}
                    style={{
                        flexShrink: 0,
                        width: 52,
                        height: 28,
                        borderRadius: 99,
                        border: 'none',
                        cursor: settingsLoading ? 'not-allowed' : 'pointer',
                        background: autoApprove
                            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                            : 'var(--bg-card)',
                        boxShadow: autoApprove
                            ? '0 2px 8px rgba(74,222,128,0.4)'
                            : '0 2px 6px rgba(0,0,0,0.3)',
                        position: 'relative',
                        transition: 'background 0.25s, box-shadow 0.25s',
                        opacity: settingsLoading ? 0.6 : 1,
                    }}
                    title={autoApprove ? 'Turn OFF auto-approve' : 'Turn ON auto-approve'}
                >
                    <span style={{
                        position: 'absolute',
                        top: 3,
                        left: autoApprove ? 26 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        transition: 'left 0.25s',
                    }} />
                </button>
            </div>

            {/* Pending admin alert — hide when auto-approve is on */}
            {stats?.pendingAdmins > 0 && (
                <div style={{ background: 'rgba(252,163,17,0.1)', border: '1px solid rgba(252,163,17,0.3)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Clock size={20} style={{ color: 'var(--sa-accent)', flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: 'var(--sa-accent)' }}>{stats.pendingAdmins} pending gym registration{stats.pendingAdmins > 1 ? 's' : ''}</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.85rem' }}>
                            Review in <a href="/super-admin/admins" style={{ color: 'var(--sa-accent)' }}>Gym Admins →</a>
                        </span>
                    </div>
                </div>
            )}

            {/* Pending user approval alert — only relevant when auto-approve is OFF */}
            {!autoApprove && stats?.pendingUsers > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Clock size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: '#ef4444' }}>{stats.pendingUsers} user account{stats.pendingUsers > 1 ? 's' : ''} awaiting approval</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.85rem' }}>
                            Review in <a href="/super-admin/users" style={{ color: '#ef4444' }}>All Users →</a>
                        </span>
                    </div>
                </div>
            )}

            {/* Stats grid */}
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 28 }}>
                {cards.map(card => (
                    <div key={card.label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{card.sub}</span>
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: '2rem' }}>{card.value.toLocaleString()}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{card.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent activity grid */}
            <div className="page-grid-2" style={{ gap: 20 }}>
                {/* Recent Gym Admins */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} style={{ color: 'var(--sa-accent)' }} /> Recent Gyms</h3>
                        <a href="/super-admin/admins" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>View all →</a>
                    </div>
                    {stats?.recentAdmins?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px' }}><p>No gyms registered yet.</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats?.recentAdmins?.map((admin: any) => (
                                <div key={admin._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 50, background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#000', flexShrink: 0 }}>
                                        {admin.gymName?.charAt(0) || admin.displayName?.charAt(0) || 'G'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.gymName || admin.displayName}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(admin.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <StatusBadge status={admin.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Users */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserCheck size={16} style={{ color: 'var(--admin-accent)' }} /> Recent Members</h3>
                        <a href="/super-admin/users" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>View all →</a>
                    </div>
                    {stats?.recentUsers?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px' }}><p>No members yet.</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats?.recentUsers?.map((user: any) => (
                                <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 50, background: 'linear-gradient(135deg, var(--admin-accent), #7dd3fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#000', flexShrink: 0 }}>
                                        {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName || user.username}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            {user.adminId?.gymName ? `${user.adminId.gymName} · ` : 'Independent · '}
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <StatusBadge status={user.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
