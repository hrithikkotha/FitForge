import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Dumbbell, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/Toast';
import PageLoader from '../../components/PageLoader';

const CATEGORIES = ['strength', 'cardio', 'bodyweight'];
const MUSCLE_GROUPS = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'forearms', 'core', 'quadriceps', 'hamstrings', 'glutes',
    'calves', 'traps', 'lats', 'hip_flexors', 'adductors',
];
const muscleLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const emptyForm = { name: '', category: 'strength', muscleGroups: [] as string[] };

const ExercisesPage = () => {
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [editTarget, setEditTarget] = useState<any | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const { toasts, show: showToast, dismiss } = useToast();

    const load = () => {
        setLoading(true);
        API.get('/super-admin/exercises').then(r => setExercises(r.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const openEdit = (ex: any) => { setForm({ name: ex.name, category: ex.category, muscleGroups: [...ex.muscleGroups] }); setEditTarget(ex); };
    const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };
    const closeModal = () => { setEditTarget(null); setShowCreate(false); };

    const toggleMuscle = (m: string) => {
        setForm(prev => ({
            ...prev,
            muscleGroups: prev.muscleGroups.includes(m) ? prev.muscleGroups.filter(x => x !== m) : [...prev.muscleGroups, m]
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
        try {
            if (editTarget) {
                await API.put(`/super-admin/exercises/${editTarget._id}`, form);
                showToast(`"${form.name}" updated — reflects to all users`);
            } else {
                await API.post('/super-admin/exercises', form);
                showToast('Exercise created globally');
            }
            closeModal(); load();
        } catch (err: any) { showToast(err?.response?.data?.message || 'Save failed', 'error'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await API.delete(`/super-admin/exercises/${deleteTarget._id}`);
            showToast(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null); load();
        } catch { showToast('Delete failed', 'error'); }
    };

    const filtered = exercises.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) &&
        (catFilter === 'all' || e.category === catFilter)
    );

    if (loading) return <PageLoader />;

    const catColor: Record<string, string> = { strength: '#f59e0b', cardio: '#ef4444', bodyweight: '#8b5cf6' };

    const ModalForm = () => (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
                <div className="modal-header">
                    <h3>{editTarget ? `Edit ${editTarget.name}` : 'Create Global Exercise'}</h3>
                    <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
                </div>
                {editTarget && (
                    <div style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--sa-accent)' }}>
                        ⚡ Changes will reflect immediately for <strong>all users</strong> logging workouts
                    </div>
                )}
                <div className="form-row">
                    <div className="form-group">
                        <label>Exercise Name *</label>
                        <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Barbell Squat" />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Muscle Groups</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {MUSCLE_GROUPS.map(m => (
                            <button key={m} type="button" onClick={() => toggleMuscle(m)}
                                style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${form.muscleGroups.includes(m) ? 'var(--sa-accent)' : 'var(--border-color)'}`, fontSize: '0.75rem', cursor: 'pointer', background: form.muscleGroups.includes(m) ? 'rgba(252,163,17,0.15)' : 'transparent', color: form.muscleGroups.includes(m) ? 'var(--sa-accent)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                                {muscleLabel(m)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {editTarget ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Create Exercise</>}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            {(editTarget || showCreate) && <ModalForm />}

            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Delete Exercise</h3><button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={18} /></button></div>
                        <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Delete <strong>{deleteTarget.name}</strong> from the global library?</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Dumbbell size={22} style={{ color: 'var(--sa-accent)' }} /> Exercise Library</h2>
                    <p>Manage global exercises — edits reflect across all user workout logs</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Exercise</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 40 }} placeholder="Search exercises…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="date-pills" style={{ margin: 0 }}>
                    {(['all', ...CATEGORIES] as const).map(c => (
                        <button key={c} className={`date-pill ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Category</th><th>Muscle Groups</th><th>Type</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(ex => (
                                <tr key={ex._id}>
                                    <td style={{ fontWeight: 600 }}>{ex.name}</td>
                                    <td>
                                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: `${catColor[ex.category]}22`, color: catColor[ex.category] }}>
                                            {ex.category}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ex.muscleGroups.map(muscleLabel).join(', ') || '—'}
                                    </td>
                                    <td>
                                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, background: ex.isDefault ? 'rgba(252,163,17,0.15)' : 'rgba(148,163,184,0.15)', color: ex.isDefault ? 'var(--sa-accent)' : 'var(--text-muted)' }}>
                                            {ex.isDefault ? 'Global' : 'Custom'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon btn-sm" title="Edit" onClick={() => openEdit(ex)}><Pencil size={14} /></button>
                                            <button className="btn-icon btn-sm" title="Delete" style={{ color: 'var(--accent-danger)' }} onClick={() => setDeleteTarget(ex)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="empty-state"><Dumbbell size={48} /><h4>No exercises found</h4></div>}
            </div>
        </div>
    );
};

export default ExercisesPage;
