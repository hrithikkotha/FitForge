import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { ArrowLeft, Users, Building2 } from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = { active: '#4ade80', pending: '#fca311', suspended: '#ef4444' };
    return (
        <span style={{
            padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
            background: `${map[status] || '#999'}22`, color: map[status] || '#999',
        }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const SuperAdminDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<{ admin: any; users: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get(`/super-admin/admins/${id}/users`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <PageLoader />;
    if (!data) return <div className="card"><div className="empty-state"><p>Admin not found.</p></div></div>;

    const { admin, users } = data;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-icon" onClick={() => navigate(-1)} title="Back">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={22} /> {admin.gymName || admin.displayName}
                    </h2>
                    <p>{admin.email} · Joined {new Date(admin.createdAt).toLocaleDateString()} · <StatusBadge status={admin.status} /></p>
                </div>
            </div>

            <div className="card-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon green"><Users size={22} /></div>
                    <div className="stat-content">
                        <h4>Total Members</h4>
                        <div className="stat-value">{users.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Users size={22} /></div>
                    <div className="stat-content">
                        <h4>Active</h4>
                        <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Users size={22} /></div>
                    <div className="stat-content">
                        <h4>Suspended</h4>
                        <div className="stat-value">{users.filter(u => u.status === 'suspended').length}</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="card-header" style={{ padding: '16px 20px' }}>
                    <h3>Members ({users.length})</h3>
                </div>
                {users.length === 0 ? (
                    <div className="empty-state"><p>No members yet under this gym.</p></div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td style={{ fontWeight: 600 }}>{user.displayName || user.username}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>@{user.username}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{user.email}</td>
                                        <td><StatusBadge status={user.status} /></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDetailPage;
