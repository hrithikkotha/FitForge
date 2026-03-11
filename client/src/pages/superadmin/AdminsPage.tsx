import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { CheckCircle, XCircle, Eye, Trash2, X, Users } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/Toast';
import PageLoader from '../../components/PageLoader';

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        active: '#4ade80', pending: '#fca311', suspended: '#ef4444'
    };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
            background: `${map[status] || '#999'}22`, color: map[status] || '#999',
        }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const SuperAdminAdminsPage = () => {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const { toasts, show: showToast, dismiss } = useToast();
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        API.get('/super-admin/admins')
            .then(r => setAdmins(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const approve = async (id: string) => {
        try {
            await API.put(`/super-admin/admins/${id}/approve`);
            showToast('Admin approved successfully');
            load();
        } catch { showToast('Failed to approve admin', 'error'); }
    };

    const suspend = async (id: string) => {
        try {
            await API.put(`/super-admin/admins/${id}/suspend`);
            showToast('Admin suspended');
            load();
        } catch { showToast('Failed to suspend', 'error'); }
    };

    const unsuspend = async (id: string) => {
        try {
            await API.put(`/super-admin/admins/${id}/unsuspend`);
            showToast('Admin reactivated');
            load();
        } catch { showToast('Failed to reactivate', 'error'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await API.delete(`/super-admin/admins/${deleteTarget._id}`);
            showToast(`Admin "${deleteTarget.gymName}" deleted`);
            setDeleteTarget(null);
            load();
        } catch { showToast('Failed to delete', 'error'); }
    };

    const filtered = filterStatus === 'all' ? admins : admins.filter(a => a.status === filterStatus);

    if (loading) return <PageLoader />;

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2>Admins</h2>
                    <p>Manage gym owners registered on FitForge</p>
                </div>
            </div>

            {/* Filter pills */}
            <div className="date-pills" style={{ marginBottom: 20 }}>
                {(['all', 'pending', 'active', 'suspended'] as const).map(s => (
                    <button key={s} className={`date-pill ${filterStatus === s ? 'active' : ''}`}
                        onClick={() => setFilterStatus(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        {s !== 'all' && (
                            <span style={{ marginLeft: 4, opacity: 0.7 }}>
                                ({admins.filter(a => a.status === s).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Users size={48} />
                        <h4>No admins found</h4>
                        <p>No gym owners in this category yet.</p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Gym Name</th>
                                    <th>Owner</th>
                                    <th>Email</th>
                                    <th>Members</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(admin => (
                                    <tr key={admin._id}>
                                        <td style={{ fontWeight: 600 }}>{admin.gymName || '—'}</td>
                                        <td>{admin.displayName}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{admin.email}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Users size={13} />
                                                {admin.userCount ?? 0}
                                            </span>
                                        </td>
                                        <td><StatusBadge status={admin.status} /></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn-icon btn-sm" title="View members"
                                                    onClick={() => navigate(`/super-admin/admins/${admin._id}`)}>
                                                    <Eye size={14} />
                                                </button>
                                                {admin.status === 'pending' && (
                                                    <button className="btn btn-primary btn-sm" title="Approve"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        onClick={() => approve(admin._id)}>
                                                        <CheckCircle size={13} /> Approve
                                                    </button>
                                                )}
                                                {admin.status === 'active' && (
                                                    <button className="btn btn-secondary btn-sm" title="Suspend"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        onClick={() => suspend(admin._id)}>
                                                        <XCircle size={13} /> Suspend
                                                    </button>
                                                )}
                                                {admin.status === 'suspended' && (
                                                    <button className="btn btn-secondary btn-sm" title="Reactivate"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        onClick={() => unsuspend(admin._id)}>
                                                        <CheckCircle size={13} /> Reactivate
                                                    </button>
                                                )}
                                                <button className="btn-icon btn-sm" title="Delete"
                                                    style={{ color: 'var(--accent-danger)' }}
                                                    onClick={() => setDeleteTarget(admin)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3>Delete Admin</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                            Delete <strong>{deleteTarget.gymName}</strong>?
                        </p>
                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 24 }}>
                            ⚠️ This will permanently delete the admin and all <strong>{deleteTarget.userCount}</strong> of their members along with all associated workout and nutrition data. This cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                <Trash2 size={16} /> Delete Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminAdminsPage;
