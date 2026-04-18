import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import { Users, Search, CheckCircle, UserX, UserCheck, Trash2, X, Clock, Activity, Dumbbell, Utensils } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/Toast';
import PageLoader from '../../components/PageLoader';

const STATUS_COLOR: Record<string, string> = { active: '#4ade80', pending: '#fca311', suspended: '#ef4444' };

const StatusBadge = ({ status }: { status: string }) => (
    <span style={{
        padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
        background: `${STATUS_COLOR[status] || '#999'}22`, color: STATUS_COLOR[status] || '#999',
        display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
        {status === 'pending' && <Clock size={9} />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
);

// Coloured "last seen" pill — green ≤7d, amber ≤30d, red >30d, grey never.
const formatRelative = (iso: string | null | undefined): { label: string; color: string; days: number | null } => {
    if (!iso) return { label: 'Never', color: '#777', days: null };
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    let label: string;
    if (mins < 1) label = 'Just now';
    else if (mins < 60) label = `${mins}m ago`;
    else if (hrs < 24) label = `${hrs}h ago`;
    else if (days < 30) label = `${days}d ago`;
    else if (days < 365) label = `${Math.floor(days / 30)}mo ago`;
    else label = `${Math.floor(days / 365)}y ago`;
    const color = days <= 7 ? '#4ade80' : days <= 30 ? '#fca311' : '#ef4444';
    return { label, color, days };
};

const LastSeenBadge = ({ iso }: { iso: string | null | undefined }) => {
    const { label, color } = formatRelative(iso);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
            background: `${color}1f`, color,
        }} title={iso ? new Date(iso).toLocaleString() : 'No recorded activity'}>
            <Activity size={10} /> {label}
        </span>
    );
};

type FilterTab = 'all' | 'pending' | 'active' | 'suspended' | 'inactive';

const AllUsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<FilterTab>('pending');
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [activityTarget, setActivityTarget] = useState<any | null>(null);
    const [activityData, setActivityData] = useState<any | null>(null);
    const [activityLoading, setActivityLoading] = useState(false);
    const { toasts, show: showToast, dismiss } = useToast();

    const load = () => {
        setLoading(true);
        API.get('/super-admin/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const openActivity = async (u: any) => {
        setActivityTarget(u);
        setActivityData(null);
        setActivityLoading(true);
        try {
            const { data } = await API.get(`/super-admin/users/${u._id}/activity`);
            setActivityData(data);
        } catch {
            showToast('Failed to load activity', 'error');
            setActivityTarget(null);
        } finally {
            setActivityLoading(false);
        }
    };

    const approve = async (id: string, name: string) => {
        try {
            await API.put(`/super-admin/users/${id}/approve`);
            showToast(`${name} approved — they can now log in`);
            load();
        } catch { showToast('Approve failed', 'error'); }
    };

    const suspend = async (id: string) => {
        try {
            await API.put(`/super-admin/users/${id}/suspend`);
            showToast('User suspended');
            load();
        } catch { showToast('Suspend failed', 'error'); }
    };

    const unsuspend = async (id: string) => {
        try {
            await API.put(`/super-admin/users/${id}/unsuspend`);
            showToast('User reactivated');
            load();
        } catch { showToast('Reactivate failed', 'error'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await API.delete(`/super-admin/users/${deleteTarget._id}`);
            showToast(`${deleteTarget.displayName || deleteTarget.username} deleted`);
            setDeleteTarget(null);
            load();
        } catch { showToast('Delete failed', 'error'); }
    };

    const pendingCount = users.filter(u => u.status === 'pending').length;

    // Engagement breakdown — drives the summary chips and the "inactive" tab.
    const engagement = useMemo(() => {
        const buckets = { active7: 0, active30: 0, dormant: 0, never: 0 };
        users.forEach(u => {
            const { days } = formatRelative(u.lastSeenAt);
            if (days === null) buckets.never++;
            else if (days <= 7) buckets.active7++;
            else if (days <= 30) buckets.active30++;
            else buckets.dormant++;
        });
        return buckets;
    }, [users]);

    const filtered = users.filter(u => {
        const matchesSearch =
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.username || '').toLowerCase().includes(search.toLowerCase());
        let matchesTab = true;
        if (filterTab === 'inactive') {
            const { days } = formatRelative(u.lastSeenAt);
            matchesTab = days === null || days > 30;
        } else if (filterTab !== 'all') {
            matchesTab = u.status === filterTab;
        }
        return matchesSearch && matchesTab;
    });

    if (loading) return <PageLoader />;

    const TABS: { key: FilterTab; label: string }[] = [
        { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        { key: 'active', label: 'Active' },
        { key: 'suspended', label: 'Suspended' },
        { key: 'inactive', label: `Inactive 30d+${engagement.dormant + engagement.never > 0 ? ` (${engagement.dormant + engagement.never})` : ''}` },
        { key: 'all', label: 'All' },
    ];

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Activity drilldown modal */}
            {activityTarget && (
                <div className="modal-overlay" onClick={() => setActivityTarget(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={18} style={{ color: 'var(--sa-accent)' }} />
                                Activity · {activityTarget.displayName || activityTarget.username}
                            </h3>
                            <button className="btn-icon" onClick={() => setActivityTarget(null)}><X size={18} /></button>
                        </div>
                        {activityLoading || !activityData ? (
                            <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>Loading activity…</p>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>LAST SEEN</div>
                                        <LastSeenBadge iso={activityData.user.lastSeenAt} />
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                            {activityData.user.lastSeenAt ? new Date(activityData.user.lastSeenAt).toLocaleString() : '—'}
                                        </div>
                                    </div>
                                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>LAST LOGIN</div>
                                        <LastSeenBadge iso={activityData.user.lastLoginAt} />
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                            {activityData.user.lastLoginAt ? new Date(activityData.user.lastLoginAt).toLocaleString() : '—'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                        <Dumbbell size={16} style={{ color: '#4ade80' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Workouts</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {activityData.activity.lastWorkoutAt
                                                    ? `Last: ${activityData.activity.lastWorkoutName || 'Workout'} · ${formatRelative(activityData.activity.lastWorkoutAt).label}`
                                                    : 'No workouts logged yet'}
                                            </div>
                                        </div>
                                        <strong style={{ fontSize: '1.1rem' }}>{activityData.activity.totalWorkouts}</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)' }}>
                                        <Utensils size={16} style={{ color: '#fca311' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Meals</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {activityData.activity.lastMealAt
                                                    ? `Last: ${activityData.activity.lastMealType || 'Meal'} · ${formatRelative(activityData.activity.lastMealAt).label}`
                                                    : 'No meals logged yet'}
                                            </div>
                                        </div>
                                        <strong style={{ fontSize: '1.1rem' }}>{activityData.activity.totalMeals}</strong>
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 14 }}>
                                    Joined {new Date(activityData.user.createdAt).toLocaleDateString()}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Delete User</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                            Remove <strong>{deleteTarget.displayName || deleteTarget.username}</strong>?
                        </p>
                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 24 }}>
                            All their workout and nutrition data will be permanently deleted.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Users size={22} style={{ color: 'var(--sa-accent)' }} /> All Platform Users
                    </h2>
                    <p>
                        {users.length} total users
                        {pendingCount > 0 && (
                            <span style={{ marginLeft: 10, color: 'var(--sa-accent)', fontWeight: 700 }}>
                                · ⚠️ {pendingCount} awaiting approval
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Engagement summary chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                    { label: 'Active 7d', value: engagement.active7, color: '#4ade80' },
                    { label: 'Active 30d', value: engagement.active30, color: '#fca311' },
                    { label: 'Dormant 30d+', value: engagement.dormant, color: '#ef4444' },
                    { label: 'Never seen', value: engagement.never, color: '#777' },
                ].map(c => (
                    <div key={c.label} style={{
                        padding: '8px 14px', borderRadius: 12,
                        background: `${c.color}14`, border: `1px solid ${c.color}33`,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Activity size={13} style={{ color: c.color }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.label}</span>
                        <strong style={{ color: c.color, fontSize: '0.95rem' }}>{c.value}</strong>
                    </div>
                ))}
            </div>

            {/* Pending attention banner */}
            {pendingCount > 0 && filterTab !== 'pending' && (
                <div style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.3)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Clock size={18} style={{ color: 'var(--sa-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--sa-accent)' }}>{pendingCount} user{pendingCount > 1 ? 's' : ''}</strong> waiting for approval.
                    </span>
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setFilterTab('pending')}>
                        Review Now →
                    </button>
                </div>
            )}

            {/* Filters + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="date-pills" style={{ margin: 0 }}>
                    {TABS.map(t => (
                        <button key={t.key} className={`date-pill ${filterTab === t.key ? 'active' : ''}`}
                            onClick={() => setFilterTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
                    <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 38 }} type="search" inputMode="search" enterKeyHint="search" autoCapitalize="none" autoCorrect="off" placeholder="Search by name, email…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Gym</th>
                                <th>Status</th>
                                <th>Last seen</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 50, background: 'linear-gradient(135deg, var(--sa-accent), #fdb940)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#000', flexShrink: 0 }}>
                                                {(u.displayName || u.username)?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.displayName || u.username}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{u.email}</td>
                                    <td>
                                        {u.adminId ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-accent)' }}>
                                                {u.adminId.gymName || u.adminId.displayName}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Independent</span>
                                        )}
                                    </td>
                                    <td><StatusBadge status={u.status} /></td>
                                    <td><LastSeenBadge iso={u.lastSeenAt} /></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn-icon btn-sm"
                                                title="View activity"
                                                onClick={() => openActivity(u)}
                                                style={{ color: 'var(--sa-accent)' }}
                                            >
                                                <Activity size={14} />
                                            </button>
                                            {u.status === 'pending' && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                                    onClick={() => approve(u._id, u.displayName || u.username)}
                                                    title="Approve account"
                                                >
                                                    <CheckCircle size={13} /> Approve
                                                </button>
                                            )}
                                            {u.status === 'active' && (
                                                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => suspend(u._id)}>
                                                    <UserX size={13} /> Suspend
                                                </button>
                                            )}
                                            {u.status === 'suspended' && (
                                                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => unsuspend(u._id)}>
                                                    <UserCheck size={13} /> Reactivate
                                                </button>
                                            )}
                                            <button className="btn-icon btn-sm" title="Delete user" style={{ color: 'var(--accent-danger)' }} onClick={() => setDeleteTarget(u)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Users size={48} />
                        <h4>{filterTab === 'pending' ? 'No pending approvals 🎉' : 'No users found'}</h4>
                        {filterTab === 'pending' && <p>All user accounts are reviewed and up to date.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllUsersPage;
