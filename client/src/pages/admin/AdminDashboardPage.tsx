import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, UserCheck, UserX, UserPlus, Building2 } from 'lucide-react';
import PageLoader from '../../components/PageLoader';

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentMembers, setRecentMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get('/admin/stats'),
            API.get('/admin/users'),
        ]).then(([sRes, uRes]) => {
            setStats(sRes.data);
            setRecentMembers(uRes.data.slice(0, 5));
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoader />;

    const cards = [
        { label: 'Total Members', value: stats?.total ?? 0, icon: <Users size={24} />, color: 'purple' },
        { label: 'Active Members', value: stats?.active ?? 0, icon: <UserCheck size={24} />, color: 'green' },
        { label: 'Suspended', value: stats?.suspended ?? 0, icon: <UserX size={24} />, color: 'orange' },
        { label: 'Joined This Month', value: stats?.newThisMonth ?? 0, icon: <UserPlus size={24} />, color: 'blue' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Building2 size={28} style={{ color: 'var(--admin-accent)' }} />
                    <div>
                        <h2>Welcome, {user?.displayName}!</h2>
                        <p>{user?.gymName} — Member Management Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="card-grid" style={{ marginBottom: 24 }}>
                {cards.map(card => (
                    <div key={card.label} className="stat-card">
                        <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                        <div className="stat-content">
                            <h4>{card.label}</h4>
                            <div className="stat-value">{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Recent Members</h3>
                    <a href="/admin/members" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>View All →</a>
                </div>
                {recentMembers.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h4>No members yet</h4>
                        <p>Go to Members to add your first gym member.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr>
                            </thead>
                            <tbody>
                                {recentMembers.map(m => (
                                    <tr key={m._id}>
                                        <td style={{ fontWeight: 600 }}>{m.displayName || m.username}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.email}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                                                background: m.status === 'active' ? '#4ade8022' : '#ef444422',
                                                color: m.status === 'active' ? '#4ade80' : '#ef4444',
                                            }}>{m.status}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {new Date(m.createdAt).toLocaleDateString()}
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

export default AdminDashboardPage;
