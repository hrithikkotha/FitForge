import { useState, useEffect } from 'react';
import API from '../api/axios';
import BodySVG from '../components/BodySVG';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const periodOptions = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: 'All Time', days: 365 * 3 },
];

const BodyMapPage = () => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const [selectedMuscle, setSelectedMuscle] = useState('');
    const [periodDays, setPeriodDays] = useState(30);
    const [heatmap, setHeatmap] = useState<Record<string, number>>({});
    const [muscleStats, setMuscleStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHeatmap();
    }, [periodDays]);

    useEffect(() => {
        if (selectedMuscle) loadMuscleStats(selectedMuscle);
    }, [selectedMuscle, periodDays]);

    const loadHeatmap = async () => {
        try {
            const from = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
            const to = new Date().toISOString();
            const { data } = await API.get(`/analytics/body-heatmap?from=${from}&to=${to}`);
            setHeatmap(data.muscleFrequency || {});
        } catch (err) {
            console.error(err);
        }
    };

    const loadMuscleStats = async (muscle: string) => {
        setLoading(true);
        try {
            const from = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
            const to = new Date().toISOString();
            const { data } = await API.get(`/analytics/muscle/${muscle}?from=${from}&to=${to}`);
            setMuscleStats(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSelectMuscle = (muscle: string) => {
        setSelectedMuscle(muscle === selectedMuscle ? '' : muscle);
    };

    const muscleLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const heatmapLegend = [
        { color: '#3a3f5c', label: 'Not trained' },
        { color: '#90caf9', label: '1-2 sessions' },
        { color: '#66bb6a', label: '3-4 sessions' },
        { color: '#ffb74d', label: '5-7 sessions' },
        { color: '#ef5350', label: '8+ sessions' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Body Map Analyzer</h2>
                <p>Click on a muscle group to see your training analytics</p>
            </div>

            <div className="date-pills" style={{ marginBottom: 20 }}>
                {periodOptions.map(p => (
                    <button
                        key={p.days}
                        className={`date-pill ${periodDays === p.days ? 'active' : ''}`}
                        onClick={() => setPeriodDays(p.days)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="body-map-container">
                <div className="body-map-svg-wrapper">
                    <div className="body-view-toggle">
                        <button
                            className={`date-pill ${view === 'front' ? 'active' : ''}`}
                            onClick={() => setView('front')}
                        >
                            Front
                        </button>
                        <button
                            className={`date-pill ${view === 'back' ? 'active' : ''}`}
                            onClick={() => setView('back')}
                        >
                            Back
                        </button>
                    </div>

                    <div className="body-svg-container">
                        <BodySVG
                            view={view}
                            muscleFrequency={heatmap}
                            selectedMuscle={selectedMuscle}
                            onSelectMuscle={handleSelectMuscle}
                        />
                    </div>

                    <div className="heatmap-legend">
                        {heatmapLegend.map(item => (
                            <div key={item.label} className="legend-item">
                                <div className="legend-dot" style={{ background: item.color }} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-panel">
                    {selectedMuscle && muscleStats ? (
                        loading ? (
                            <div className="empty-state"><p>Loading...</p></div>
                        ) : (
                            <>
                                <h3>📊 {muscleLabel(selectedMuscle)} Analysis</h3>

                                <div className="muscle-stat-row">
                                    <span className="label">Total Sessions</span>
                                    <span className="value">{muscleStats.totalSessions}</span>
                                </div>
                                <div className="muscle-stat-row">
                                    <span className="label">Total Sets</span>
                                    <span className="value">{muscleStats.totalSets}</span>
                                </div>
                                <div className="muscle-stat-row">
                                    <span className="label">Total Reps</span>
                                    <span className="value">{muscleStats.totalReps}</span>
                                </div>
                                <div className="muscle-stat-row">
                                    <span className="label">Total Volume</span>
                                    <span className="value">{(muscleStats.totalVolume / 1000).toFixed(1)}k kg</span>
                                </div>
                                <div className="muscle-stat-row">
                                    <span className="label">Total Duration</span>
                                    <span className="value">{muscleStats.totalDuration} min</span>
                                </div>
                                <div className="muscle-stat-row">
                                    <span className="label">Last Trained</span>
                                    <span className="value">
                                        {muscleStats.lastTrained
                                            ? new Date(muscleStats.lastTrained).toLocaleDateString()
                                            : 'Never'}
                                    </span>
                                </div>

                                {muscleStats.topExercises?.length > 0 && (
                                    <>
                                        <h3 style={{ marginTop: 24 }}>Top Exercises</h3>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={muscleStats.topExercises.slice(0, 5)} layout="vertical">
                                                <XAxis type="number" tick={{ fill: '#7986cb', fontSize: 11 }} />
                                                <YAxis type="category" dataKey="name" tick={{ fill: '#e8eaf6', fontSize: 11 }} width={120} />
                                                <Tooltip
                                                    contentStyle={{ background: '#1c2137', border: '1px solid #2a3050', borderRadius: 8, color: '#e8eaf6' }}
                                                />
                                                <Bar dataKey="volume" fill="#6c63ff" radius={[0, 4, 4, 0]} name="Volume (kg)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </>
                                )}
                            </>
                        )
                    ) : (
                        <div className="empty-state" style={{ padding: '80px 24px' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                            <h4>Select a Muscle Group</h4>
                            <p>Click on any muscle in the body map to see detailed analytics for that area</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BodyMapPage;
