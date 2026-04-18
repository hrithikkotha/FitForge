import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { Plus, Trash2, X, UserCheck, UserX, Users, KeyRound, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/Toast';
import PageLoader from '../../components/PageLoader';

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = { active: '#4ade80', suspended: '#ef4444' };
    return (
        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: `${map[status] || '#999'}22`, color: map[status] || '#999' }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const MembersPage = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [activity, setActivity] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [resetTarget, setResetTarget] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
    const { toasts, show: showToast, dismiss } = useToast();

    const load = useCallback(() => {
        setLoading(true);
        API.get('/admin/users')
            .then(r => setMembers(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const loadActivity = async (userId: string) => {
        if (activity[userId]) return; // already loaded
        try {
            const { data } = await API.get(`/admin/users/${userId}/activity`);
            setActivity(prev => ({ ...prev, [userId]: data }));
        } catch { /* silently fail */ }
    };

    const toggleExpand = (userId: string) => {
        const next = expandedRow === userId ? null : userId;
        setExpandedRow(next);
        if (next) loadActivity(next);
    };

    // ── Selection ──
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };
    const toggleAll = () => {
        setSelected(prev => prev.size === members.length ? new Set() : new Set(members.map(m => m._id)));
    };

    // ── Actions ──
    const suspend = async (id: string) => {
        try { await API.put(`/admin/users/${id}/suspend`); load(); showToast('Member suspended'); }
        catch { showToast('Failed', 'error'); }
    };
    const activate = async (id: string) => {
        try { await API.put(`/admin/users/${id}/activate`); load(); showToast('Member reactivated'); }
        catch { showToast('Failed', 'error'); }
    };

    const bulkSuspend = async () => {
        try {
            const { data } = await API.put('/admin/users/bulk-suspend', { ids: [...selected] });
            showToast(data.message); setSelected(new Set()); load();
        } catch { showToast('Bulk suspend failed', 'error'); }
    };
    const bulkActivate = async () => {
        try {
            const { data } = await API.put('/admin/users/bulk-activate', { ids: [...selected] });
            showToast(data.message); setSelected(new Set()); load();
        } catch { showToast('Bulk activate failed', 'error'); }
    };

    const handleAdd = async () => {
        if (!form.username || !form.email || !form.password) { showToast('Username, email, and password are required', 'error'); return; }
        try {
            await API.post('/admin/users', form);
            setShowAddModal(false);
            setForm({ username: '', email: '', password: '', displayName: '' });
            load(); showToast('Member added');
        } catch (err: any) { showToast(err?.response?.data?.message || 'Failed to add member', 'error'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await API.delete(`/admin/users/${deleteTarget._id}`);
            setDeleteTarget(null); load(); showToast('Member deleted');
        } catch { showToast('Delete failed', 'error'); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        try {
            await API.put(`/admin/users/${resetTarget._id}/reset-password`, { newPassword });
            setResetTarget(null); setNewPassword('');
            showToast(`Password reset for ${resetTarget.displayName || resetTarget.username}`);
        } catch (err: any) { showToast(err?.response?.data?.message || 'Reset failed', 'error'); }
    };

    if (loading) return <PageLoader />;

    const hasSelected = selected.size > 0;

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Member</h3>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                        </div>
                        <div className="form-group">
                            <label>Display Name</label>
                            <input className="form-input" placeholder="e.g. John Doe" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} autoComplete="name" autoCapitalize="words" enterKeyHint="next" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input className="form-input" placeholder="johndoe" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input className="form-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password *</label>
                            <input className="form-input" type="password" autoComplete="new-password" enterKeyHint="done" placeholder="Temporary password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Share credentials with member so they can log in.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> Add Member</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="modal-overlay" onClick={() => setResetTarget(null)} style={{ zIndex: 1100 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KeyRound size={18} /> Reset Password</h3>
                            <button className="btn-icon" onClick={() => setResetTarget(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.85rem' }}>
                            Set a new password for <strong>{resetTarget.displayName || resetTarget.username}</strong>. Share it with them directly.
                        </p>
                        <div className="form-group">
                            <label>New Password *</label>
                            <input className="form-input" type="password" autoComplete="new-password" enterKeyHint="done" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => { setResetTarget(null); setNewPassword(''); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleResetPassword}><KeyRound size={15} /> Reset Password</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Delete Member</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Remove <strong>{deleteTarget.displayName || deleteTarget.username}</strong>?</p>
                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 24 }}>All their workout and nutrition data will be permanently deleted.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Delete Member</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2>Members</h2>
                    <p>Manage your gym's registered members and their access</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Member</button>
            </div>

            {/* Bulk action bar */}
            {hasSelected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-accent)' }}>{selected.size} selected</span>
                    <button className="btn btn-secondary btn-sm" onClick={bulkActivate}><UserCheck size={14} /> Activate All</button>
                    <button className="btn btn-secondary btn-sm" onClick={bulkSuspend}><UserX size={14} /> Suspend All</button>
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelected(new Set())}><X size={14} /> Clear</button>
                </div>
            )}

            {members.length === 0 ? (
                <div className="card"><div className="empty-state"><Users size={48} /><h4>No members yet</h4><p>Click "Add Member" to register your first gym member.</p></div></div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input type="checkbox" checked={selected.size === members.length && members.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                                    </th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                    <th style={{ width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(m => (
                                    <>
                                        <tr key={m._id}>
                                            <td>
                                                <input type="checkbox" checked={selected.has(m._id)} onChange={() => toggleSelect(m._id)} style={{ cursor: 'pointer' }} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 30, height: 30, borderRadius: 50, background: 'linear-gradient(135deg, var(--admin-accent), #7dd3fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#000', flexShrink: 0 }}>
                                                        {(m.displayName || m.username)?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.displayName || m.username}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{m.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.email}</td>
                                            <td><StatusBadge status={m.status} /></td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {m.status === 'active'
                                                        ? <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => suspend(m._id)}><UserX size={13} /> Suspend</button>
                                                        : <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => activate(m._id)}><UserCheck size={13} /> Activate</button>
                                                    }
                                                    <button className="btn-icon btn-sm" title="Reset Password" onClick={() => { setResetTarget(m); setNewPassword(''); }}><KeyRound size={14} /></button>
                                                    <button className="btn-icon btn-sm" title="Delete" style={{ color: 'var(--accent-danger)' }} onClick={() => setDeleteTarget(m)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn-icon btn-sm" title="View activity" onClick={() => toggleExpand(m._id)}>
                                                    {expandedRow === m._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded activity row */}
                                        {expandedRow === m._id && (
                                            <tr key={`${m._id}-activity`} style={{ background: 'var(--bg-elevated)' }}>
                                                <td colSpan={7} style={{ paddingLeft: 60 }}>
                                                    {!activity[m._id] ? (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading activity…</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: 28, paddingBlock: 4, flexWrap: 'wrap' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Activity size={14} style={{ color: 'var(--admin-accent)' }} />
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                    <strong style={{ color: 'var(--text-primary)' }}>{activity[m._id].totalWorkouts}</strong> workouts logged
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Activity size={14} style={{ color: '#4ade80' }} />
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                    <strong style={{ color: 'var(--text-primary)' }}>{activity[m._id].totalMeals}</strong> meals logged
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                    Last workout: <strong style={{ color: 'var(--text-primary)' }}>
                                                                        {activity[m._id].lastWorkout ? new Date(activity[m._id].lastWorkout.date).toLocaleDateString() : 'Never'}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                    Last meal: <strong style={{ color: 'var(--text-primary)' }}>
                                                                        {activity[m._id].lastMeal ? new Date(activity[m._id].lastMeal.date).toLocaleDateString() : 'Never'}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;
