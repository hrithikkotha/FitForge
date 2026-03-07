import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Flame, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [nutritionStats, setNutritionStats] = useState<any>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const today = new Date().toISOString();

            const [workoutRes, nutritionRes, recentRes] = await Promise.all([
                API.get(`/analytics/workout-stats?from=${thirtyDaysAgo}&to=${today}`),
                API.get(`/analytics/nutrition-stats?from=${thirtyDaysAgo}&to=${today}`),
                API.get(`/workouts?from=${thirtyDaysAgo}&to=${today}`),
            ]);

            setStats(workoutRes.data);
            setNutritionStats(nutritionRes.data);
            setRecentWorkouts(recentRes.data.slice(0, 5));
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Welcome back, {user?.displayName || user?.username}! 👋</h2>
                <p>Here's your fitness overview for the last 30 days</p>
            </div>

            <div className="card-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon purple"><Dumbbell size={24} /></div>
                    <div className="stat-content">
                        <h4>Total Workouts</h4>
                        <div className="stat-value">{stats?.totalSessions || 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <h4>Total Volume</h4>
                        <div className="stat-value">{stats ? (stats.totalVolume / 1000).toFixed(1) + 'k' : '0'} kg</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Flame size={24} /></div>
                    <div className="stat-content">
                        <h4>Avg Daily Calories</h4>
                        <div className="stat-value">{nutritionStats?.avgDailyCalories || 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Calendar size={24} /></div>
                    <div className="stat-content">
                        <h4>Days Tracked</h4>
                        <div className="stat-value">{nutritionStats?.daysTracked || 0}</div>
                    </div>
                </div>
            </div>

            <div className="page-grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3>Workout Volume Trend</h3>
                    </div>
                    {stats?.volumeOverTime?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={stats.volumeOverTime.map((v: any) => ({ ...v, date: formatDate(v.date) }))}>
                                <defs>
                                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fca311" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fca311" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#b0b8c8', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#b0b8c8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="volume" stroke="#fca311" fill="url(#volGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No workout data yet. Start logging!</p></div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Calorie Trend</h3>
                    </div>
                    {nutritionStats?.dailyTrend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={nutritionStats.dailyTrend}>
                                <defs>
                                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#b0b8c8', fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={{ fill: '#b0b8c8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="calories" stroke="#4ade80" fill="url(#calGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No nutrition data yet. Start tracking!</p></div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>Recent Workouts</h3>
                </div>
                {recentWorkouts.length > 0 ? (
                    recentWorkouts.map((w) => (
                        <div key={w._id} className="workout-item">
                            <div className="workout-item-header">
                                <h4>{w.title || 'Workout'}</h4>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    {new Date(w.date).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="workout-item-meta">
                                <span><Dumbbell size={14} /> {w.entries?.length || 0} exercises</span>
                                <span><Calendar size={14} /> {w.duration || 0} min</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <Dumbbell size={48} />
                        <h4>No workouts yet</h4>
                        <p>Head to the Workouts page to log your first session!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
