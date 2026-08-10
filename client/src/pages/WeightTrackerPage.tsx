import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
    Scale, TrendingDown, TrendingUp, Target, Calendar,
    Activity, Flame, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import PageLoader from '../components/PageLoader';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, Area, ComposedChart, Bar, Legend
} from 'recharts';

const WeightTrackerPage = () => {
    const { user } = useAuth();
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [stats, setStats] = useState<any>(null);
    const [period, setPeriod] = useState(30);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { toasts, show: showToast, dismiss } = useToast();

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - period);

            const res = await API.get(`/analytics/weight-stats`, {
                params: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            });

            setStats(res.data);
        } catch (error) {
            console.error('Error loading weight data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!weight || parseFloat(weight) <= 0) {
            showToast('Please enter a valid weight', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await API.post('/weight', {
                date: new Date().toISOString(),
                weight: parseFloat(weight),
                notes,
                timeOfDay,
            });

            showToast('Weight logged successfully');
            setWeight('');
            setNotes('');
            loadData();
        } catch (error) {
            showToast('Failed to log weight', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (loading) return <PageLoader />;

    const {
        trend = [],
        stats: weightStats = {},
        correlation = {},
        dailyData = [],
    } = stats || {};

    const {
        daysLogged = 0,
        consistency = 0,
        currentWeight = user?.currentWeight || 0,
        change = 0,
        avgWeeklyChange = 0,
        targetWeeklyChange = 0.5,
        goalWeight = 0,
        weightGoalType = 'maintain',
        daysToGoal = 0,
    } = weightStats;

    const {
        tdee = 0,
        avgDailyCalories = 0,
        avgCaloriesBurned = 0,
        avgDailyBalance = 0,
        expectedChange = 0,
        actualChange = 0,
        efficiency = 0,
    } = correlation;

    const isOnTrack = weightGoalType === 'lose'
        ? avgWeeklyChange < 0 && Math.abs(avgWeeklyChange) >= targetWeeklyChange * 0.7
        : weightGoalType === 'gain'
        ? avgWeeklyChange > 0 && avgWeeklyChange >= targetWeeklyChange * 0.7
        : true;

    const totalDays = period;

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            <div className="page-header">
                <div>
                    <h2>Weight Tracker</h2>
                    <p>Track your weight and monitor progress toward your goals</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[7, 30, 90].map(days => (
                        <button
                            key={days}
                            className={`btn ${period === days ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPeriod(days)}
                        >
                            {days}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Weight Entry */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3>Log Today's Weight</h3>
                    {daysLogged > 0 && trend.length > 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Last: {formatDate(trend[trend.length - 1].date)} • {currentWeight.toFixed(1)} kg
                        </span>
                    )}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                className="form-input"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                placeholder="72.5"
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time of Day</label>
                            <select
                                className="form-input"
                                value={timeOfDay}
                                onChange={e => setTimeOfDay(e.target.value)}
                                disabled={submitting}
                            >
                                <option value="morning">Morning (Recommended)</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                                <option value="night">Night</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes (optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Feeling good, bloated, etc."
                                disabled={submitting}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: 8 }}
                    >
                        <Scale size={18} /> {submitting ? 'Logging...' : 'Log Weight'}
                    </button>
                </form>
            </div>

            {/* Stats Cards */}
            <div className="card-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Scale size={24} />
                    </div>
                    <div className="stat-content">
                        <h4>Current Weight</h4>
                        <div className="stat-value">{currentWeight.toFixed(1)} kg</div>
                        <p style={{ fontSize: '0.8rem', color: change < 0 ? 'var(--accent-success)' : change > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)', margin: 0 }}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)} kg
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        {weightGoalType === 'lose' ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                    </div>
                    <div className="stat-content">
                        <h4>Weekly Change</h4>
                        <div className="stat-value">{avgWeeklyChange >= 0 ? '+' : ''}{avgWeeklyChange.toFixed(2)} kg</div>
                        <p style={{ fontSize: '0.8rem', color: isOnTrack ? 'var(--accent-success)' : 'var(--text-secondary)', margin: 0 }}>
                            Target: {targetWeeklyChange.toFixed(2)} kg/wk
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <h4>Days to Goal</h4>
                        <div className="stat-value">
                            {daysToGoal > 0 ? daysToGoal : daysToGoal === -1 ? '∞' : '0'}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {goalWeight > 0 ? `Goal: ${goalWeight} kg` : 'Set in profile'}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                        <h4>Consistency</h4>
                        <div className="stat-value">{consistency}%</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {daysLogged} of {totalDays} days
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            {trend.length > 0 ? (
                <div className="page-grid-2" style={{ marginBottom: 24 }}>
                    <div className="card">
                        <div className="card-header">
                            <h3>Weight Trend</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={trend}>
                                <defs>
                                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#b0b8c8', fontSize: 12 }}
                                    tickFormatter={formatDate}
                                />
                                <YAxis
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                    tick={{ fill: '#b0b8c8', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#14213d',
                                        border: '1px solid #1f3050',
                                        borderRadius: 8,
                                        color: '#fff',
                                    }}
                                    labelFormatter={(val: any) => new Date(val).toLocaleDateString()}
                                    formatter={(value: any) => [Number(value).toFixed(1) + ' kg', '']}
                                />
                                {goalWeight > 0 && (
                                    <ReferenceLine
                                        y={goalWeight}
                                        stroke="var(--accent-success)"
                                        strokeDasharray="3 3"
                                        label={{ value: 'Goal', fill: 'var(--accent-success)', fontSize: 11 }}
                                    />
                                )}
                                <Area
                                    dataKey="weight"
                                    fill="url(#weightGradient)"
                                    stroke="none"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                    dot={{ fill: '#38bdf8', r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="smoothedWeight"
                                    stroke="#fca311"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {dailyData.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3>Calorie Balance</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <ComposedChart data={dailyData}>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#b0b8c8', fontSize: 12 }}
                                        tickFormatter={formatDate}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fill: '#b0b8c8', fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fill: '#b0b8c8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#14213d',
                                            border: '1px solid #1f3050',
                                            borderRadius: 8,
                                            color: '#fff',
                                        }}
                                        labelFormatter={(val: any) => formatDate(String(val))}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="smoothedWeight"
                                        stroke="#38bdf8"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Weight (kg)"
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="balance"
                                        fill="#fca311"
                                        name="Cal Balance"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Insights Panel */}
            {daysLogged > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3>Progress Insights</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* On Track Status */}
                        {isOnTrack ? (
                            <div className="insight-box success">
                                <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>On Track!</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Your weekly change of {Math.abs(avgWeeklyChange).toFixed(2)} kg is meeting your target of {targetWeeklyChange} kg/week.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="insight-box warning">
                                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Progress Slower Than Expected</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Your weekly change is {Math.abs(avgWeeklyChange).toFixed(2)} kg, below target. Consider adjusting calorie intake or activity.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Calorie Balance */}
                        {avgDailyBalance !== 0 && (
                            <div className="insight-box info">
                                <Flame size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Calorie Balance</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Avg daily {avgDailyBalance < 0 ? 'deficit' : 'surplus'}: {Math.abs(avgDailyBalance)} cal •
                                        TDEE: {tdee} • Eating: {avgDailyCalories} • Exercise: {avgCaloriesBurned} cal
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Consistency */}
                        {consistency < 70 && (
                            <div className="insight-box info">
                                <Info size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Improve Consistency</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        You've logged weight {consistency}% of days. Daily weigh-ins provide more accurate trends.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Efficiency */}
                        {efficiency > 0 && efficiency !== 100 && (
                            <div className="insight-box info">
                                <Activity size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Efficiency: {efficiency}%</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Expected: {expectedChange.toFixed(2)} kg • Actual: {actualChange.toFixed(2)} kg
                                        {efficiency > 100 ? ' - Faster than expected!' : ' - Consider adjusting goals.'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {daysLogged === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <Scale size={48} color="var(--text-muted)" />
                        <h3>No Weight Data Yet</h3>
                        <p>Start logging your weight daily to track progress and see trends</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeightTrackerPage;
