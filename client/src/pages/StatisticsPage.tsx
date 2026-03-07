import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
    PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';

const periodOptions = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: 'All', days: 365 * 3 },
];

const COLORS = ['#fca311', '#4ade80', '#e5e5e5', '#38bdf8', '#ef4444'];

const StatisticsPage = () => {
    const [activeTab, setActiveTab] = useState<'workout' | 'nutrition'>('workout');
    const [periodDays, setPeriodDays] = useState(30);
    const [workoutStats, setWorkoutStats] = useState<any>(null);
    const [nutritionStats, setNutritionStats] = useState<any>(null);
    const [heatmap, setHeatmap] = useState<Record<string, number>>({});

    useEffect(() => {
        loadStats();
    }, [periodDays]);

    const loadStats = async () => {
        const from = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date().toISOString();
        try {
            const [wk, nut, hm] = await Promise.all([
                API.get(`/analytics/workout-stats?from=${from}&to=${to}`),
                API.get(`/analytics/nutrition-stats?from=${from}&to=${to}`),
                API.get(`/analytics/body-heatmap?from=${from}&to=${to}`),
            ]);
            setWorkoutStats(wk.data);
            setNutritionStats(nut.data);
            setHeatmap(hm.data.muscleFrequency || {});
        } catch (err) {
            console.error(err);
        }
    };

    const muscleLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const radarData = Object.entries(heatmap).map(([muscle, freq]) => ({
        muscle: muscleLabel(muscle),
        frequency: freq,
    }));

    const formatDate = (d: string) => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Statistics</h2>
                <p>Deep dive into your fitness data</p>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
                <div className="tabs" style={{ marginBottom: 0, flex: 'none', width: 300 }}>
                    <button className={`tab ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')}>Workouts</button>
                    <button className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`} onClick={() => setActiveTab('nutrition')}>Nutrition</button>
                </div>
                <div className="date-pills">
                    {periodOptions.map(p => (
                        <button key={p.days} className={`date-pill ${periodDays === p.days ? 'active' : ''}`} onClick={() => setPeriodDays(p.days)}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'workout' && workoutStats && (
                <>
                    <div className="card-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card">
                            <div className="stat-icon purple">🏋️</div>
                            <div className="stat-content">
                                <h4>Sessions</h4>
                                <div className="stat-value">{workoutStats.totalSessions}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">📊</div>
                            <div className="stat-content">
                                <h4>Total Volume</h4>
                                <div className="stat-value">{(workoutStats.totalVolume / 1000).toFixed(1)}k kg</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange">⏱</div>
                            <div className="stat-content">
                                <h4>Avg Duration</h4>
                                <div className="stat-value">{workoutStats.avgSessionDuration} min</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue">💪</div>
                            <div className="stat-content">
                                <h4>Total Sets</h4>
                                <div className="stat-value">{workoutStats.totalSets}</div>
                            </div>
                        </div>
                    </div>

                    <div className="page-grid-2" style={{ marginBottom: 24 }}>
                        <div className="card">
                            <div className="card-header"><h3>Volume Over Time</h3></div>
                            {workoutStats.volumeOverTime?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={workoutStats.volumeOverTime.map((v: any) => ({ ...v, date: formatDate(v.date) }))}>
                                        <defs>
                                            <linearGradient id="sVolGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fca311" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#fca311" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{ fill: '#b0b8c8', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#b0b8c8', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }} />
                                        <Area type="monotone" dataKey="volume" stroke="#fca311" fill="url(#sVolGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No data</p></div>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header"><h3>Muscle Group Frequency</h3></div>
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#1f3050" />
                                        <PolarAngleAxis dataKey="muscle" tick={{ fill: '#b0b8c8', fontSize: 10 }} />
                                        <Radar dataKey="frequency" stroke="#fca311" fill="#fca311" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No data</p></div>
                            )}
                        </div>
                    </div>

                    {workoutStats.personalRecords?.length > 0 && (
                        <div className="card">
                            <div className="card-header"><h3>Personal Records</h3></div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Exercise</th>
                                        <th>Weight</th>
                                        <th>Reps</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workoutStats.personalRecords.slice(0, 10).map((pr: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{pr.exercise}</td>
                                            <td>{pr.weight} kg</td>
                                            <td>{pr.reps}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{new Date(pr.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'nutrition' && nutritionStats && (
                <>
                    <div className="card-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card">
                            <div className="stat-icon orange">🔥</div>
                            <div className="stat-content">
                                <h4>Avg Daily Calories</h4>
                                <div className="stat-value">{nutritionStats.avgDailyCalories}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple">🥩</div>
                            <div className="stat-content">
                                <h4>Avg Daily Protein</h4>
                                <div className="stat-value">{nutritionStats.avgDailyProtein}g</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">📅</div>
                            <div className="stat-content">
                                <h4>Days Tracked</h4>
                                <div className="stat-value">{nutritionStats.daysTracked}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue">🍽️</div>
                            <div className="stat-content">
                                <h4>Total Calories</h4>
                                <div className="stat-value">{(nutritionStats.totalCalories / 1000).toFixed(1)}k</div>
                            </div>
                        </div>
                    </div>

                    <div className="page-grid-2" style={{ marginBottom: 24 }}>
                        <div className="card">
                            <div className="card-header"><h3>Calorie Trend</h3></div>
                            {nutritionStats.dailyTrend?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={nutritionStats.dailyTrend}>
                                        <XAxis dataKey="date" tick={{ fill: '#b0b8c8', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                                        <YAxis tick={{ fill: '#b0b8c8', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }} />
                                        <Bar dataKey="calories" fill="#fca311" radius={[4, 4, 0, 0]} name="Calories" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No data</p></div>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header"><h3>Macro Split</h3></div>
                            {nutritionStats.totalProtein > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Protein', value: nutritionStats.totalProtein },
                                                { name: 'Carbs', value: nutritionStats.totalCarbs },
                                                { name: 'Fat', value: nutritionStats.totalFat },
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {['#fca311', '#4ade80', '#e5e5e5'].map((c, i) => (
                                                <Cell key={i} fill={c} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            formatter={(value: string) => <span style={{ color: '#fff', fontSize: '0.8rem' }}>{value}</span>}
                                        />
                                        <Tooltip contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state"><p>No data</p></div>
                            )}
                        </div>
                    </div>

                    {nutritionStats.mealTypeBreakdown && (
                        <div className="card">
                            <div className="card-header"><h3>Calories by Meal Type</h3></div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={Object.entries(nutritionStats.mealTypeBreakdown).map(([type, cal]) => ({
                                    type: type.charAt(0).toUpperCase() + type.slice(1),
                                    calories: cal,
                                }))}>
                                    <XAxis dataKey="type" tick={{ fill: '#b0b8c8', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#b0b8c8', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#14213d', border: '1px solid #1f3050', borderRadius: 8, color: '#fff' }} />
                                    <Bar dataKey="calories" radius={[4, 4, 0, 0]} name="Calories">
                                        {Object.keys(nutritionStats.mealTypeBreakdown).map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StatisticsPage;
