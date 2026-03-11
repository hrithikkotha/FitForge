import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { UtensilsCrossed, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/Toast';
import PageLoader from '../../components/PageLoader';

const SERVING_UNITS = ['g', 'ml', 'piece', 'slice', 'scoop', 'tbsp', 'cup'];

const emptyForm = { name: '', caloriesPer100g: '', proteinPer100g: '', carbsPer100g: '', fatPer100g: '', servingUnit: 'g', gramsPerServing: '100' };

const FoodsPage = () => {
    const [foods, setFoods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editTarget, setEditTarget] = useState<any | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const { toasts, show: showToast, dismiss } = useToast();

    const load = () => {
        setLoading(true);
        API.get('/super-admin/foods').then(r => setFoods(r.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const openEdit = (food: any) => {
        setForm({
            name: food.name, caloriesPer100g: String(food.caloriesPer100g),
            proteinPer100g: String(food.proteinPer100g), carbsPer100g: String(food.carbsPer100g),
            fatPer100g: String(food.fatPer100g), servingUnit: food.servingUnit, gramsPerServing: String(food.gramsPerServing),
        });
        setEditTarget(food);
    };

    const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };
    const closeModal = () => { setEditTarget(null); setShowCreate(false); };

    const handleSave = async () => {
        const payload = {
            name: form.name,
            caloriesPer100g: parseFloat(form.caloriesPer100g) || 0,
            proteinPer100g: parseFloat(form.proteinPer100g) || 0,
            carbsPer100g: parseFloat(form.carbsPer100g) || 0,
            fatPer100g: parseFloat(form.fatPer100g) || 0,
            servingUnit: form.servingUnit,
            gramsPerServing: parseFloat(form.gramsPerServing) || 100,
        };
        try {
            if (editTarget) {
                await API.put(`/super-admin/foods/${editTarget._id}`, payload);
                showToast(`"${form.name}" updated — reflects to all users`);
            } else {
                await API.post('/super-admin/foods', payload);
                showToast('Food item created globally');
            }
            closeModal(); load();
        } catch (err: any) { showToast(err?.response?.data?.message || 'Save failed', 'error'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await API.delete(`/super-admin/foods/${deleteTarget._id}`);
            showToast(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null); load();
        } catch { showToast('Delete failed', 'error'); }
    };

    const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <PageLoader />;

    const ModalForm = () => (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h3>{editTarget ? `Edit ${editTarget.name}` : 'Create Global Food Item'}</h3>
                    <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
                </div>
                {editTarget && (
                    <div style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--sa-accent)' }}>
                        ⚡ Changes will reflect immediately for <strong>all users</strong> logging this food
                    </div>
                )}
                <div className="form-group">
                    <label>Food Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Brown Rice" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Calories / 100g</label>
                        <input className="form-input" type="number" value={form.caloriesPer100g} onChange={e => setForm({ ...form, caloriesPer100g: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Protein / 100g (g)</label>
                        <input className="form-input" type="number" value={form.proteinPer100g} onChange={e => setForm({ ...form, proteinPer100g: e.target.value })} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Carbs / 100g (g)</label>
                        <input className="form-input" type="number" value={form.carbsPer100g} onChange={e => setForm({ ...form, carbsPer100g: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Fat / 100g (g)</label>
                        <input className="form-input" type="number" value={form.fatPer100g} onChange={e => setForm({ ...form, fatPer100g: e.target.value })} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Serving Unit</label>
                        <select className="form-input" value={form.servingUnit} onChange={e => setForm({ ...form, servingUnit: e.target.value })}>
                            {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Grams per Serving</label>
                        <input className="form-input" type="number" value={form.gramsPerServing} onChange={e => setForm({ ...form, gramsPerServing: e.target.value })} />
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {editTarget ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Create Food</>}
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
                        <div className="modal-header">
                            <h3>Delete Food Item</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Delete <strong>{deleteTarget.name}</strong>?</p>
                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 24 }}>This removes it from the shared food database. Users who already logged this food will retain their records, but it won't appear in search going forward.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><UtensilsCrossed size={22} style={{ color: 'var(--sa-accent)' }} /> Food Database</h2>
                    <p>Edit nutrition data for any food — changes reflect globally to all users</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Food</button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 40 }} placeholder="Search foods…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Cal/100g</th>
                                <th>Protein</th>
                                <th>Carbs</th>
                                <th>Fat</th>
                                <th>Serving</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(food => (
                                <tr key={food._id}>
                                    <td style={{ fontWeight: 600 }}>{food.name}</td>
                                    <td>{food.caloriesPer100g} kcal</td>
                                    <td style={{ color: '#4ade80' }}>{food.proteinPer100g}g</td>
                                    <td style={{ color: '#60a5fa' }}>{food.carbsPer100g}g</td>
                                    <td style={{ color: '#fb923c' }}>{food.fatPer100g}g</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{food.gramsPerServing}{food.servingUnit !== 'g' ? ` (${food.servingUnit})` : 'g'}</td>
                                    <td>
                                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, background: food.isDefault ? 'rgba(252,163,17,0.15)' : 'rgba(148,163,184,0.15)', color: food.isDefault ? 'var(--sa-accent)' : 'var(--text-muted)' }}>
                                            {food.isDefault ? 'Global' : 'Custom'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon btn-sm" title="Edit" onClick={() => openEdit(food)}><Pencil size={14} /></button>
                                            <button className="btn-icon btn-sm" title="Delete" style={{ color: 'var(--accent-danger)' }} onClick={() => setDeleteTarget(food)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="empty-state"><UtensilsCrossed size={48} /><h4>No foods found</h4></div>
                )}
            </div>
        </div>
    );
};

export default FoodsPage;
