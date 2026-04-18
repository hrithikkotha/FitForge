import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Users, Search, CheckCircle, UserX, UserCheck, Trash2, X, Clock } from 'lucide-react';
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

type FilterTab = 'all' | 'pending' | 'active' | 'suspended';

const AllUsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<FilterTab>('pending');
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const { toasts, show: showToast, dismiss } = useToast();

    const load = () => {
        setLoading(true);
        API.get('/super-admin/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

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

    const filtered = users.filter(u => {
        const matchesSearch =
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.username || '').toLowerCase().includes(search.toLowerCase());
        const matchesTab = filterTab === 'all' || u.status === filterTab;
        return matchesSearch && matchesTab;
    });

    if (loading) return <PageLoader />;

    const TABS: { key: FilterTab; label: string }[] = [
        { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        { key: 'active', label: 'Active' },
        { key: 'suspended', label: 'Suspended' },
        { key: 'all', label: 'All' },
    ];

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

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
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
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
