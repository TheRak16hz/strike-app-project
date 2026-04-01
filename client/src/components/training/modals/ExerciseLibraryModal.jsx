import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Trash2, BookOpen, Save, Dumbbell, Search, HelpCircle, Edit3 } from 'lucide-react';

export default function ExerciseLibraryModal({ show, onClose, library, onCreateExercise, onUpdateExercise, onDeleteExercise }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Tren Superior');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('Peso Corporal');
  const [isCompound, setIsCompound] = useState(false);
  const [calories, setCalories] = useState(0.5);
  const [description, setDescription] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEx, setHoveredEx] = useState(null);

  const ZONES = ['Tren Superior', 'Tren Inferior', 'Core', 'Cardio', 'Full Body'];
  const EQUIPMENTS = ['Peso Corporal', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Kettlebell', 'Sin Equipo'];

  const resetForm = () => {
    setName(''); setMuscle(''); setDescription('');
    setZone('Tren Superior'); setEquipment('Peso Corporal');
    setIsCompound(false); setCalories(0.5);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (ex) => {
    setName(ex.name);
    setZone(ex.zone);
    setMuscle(ex.muscle);
    setEquipment(ex.equipment);
    setIsCompound(ex.is_compound);
    setCalories(parseFloat(ex.calories_per_rep));
    setDescription(ex.description || '');
    setEditingId(ex.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { name, zone, muscle, equipment, is_compound: isCompound, calories_per_rep: calories, description };
    
    if (editingId) {
        onUpdateExercise(editingId, data);
    } else {
        onCreateExercise(data);
    }
    resetForm();
  };

  const filteredLibrary = useMemo(() => {
    return library.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [library, searchQuery]);

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><BookOpen size={20} color="var(--primary)" /></div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Gestión de la Librería</h2>
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6 }}><X size={24} /></button>
        </div>

        {!showForm ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, zona o músculo..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '0.8rem 1rem 0.8rem 2.8rem', width: '100%', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}
                    />
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                    style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', height: 'auto' }}
                >
                    <Plus size={18} /> Nuevo Ejercicio
                </button>
            </div>
            
            <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '0.8rem', 
                maxHeight: '52vh', overflowY: 'auto', paddingRight: '0.5rem' 
            }}>
                {filteredLibrary.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>No se encontraron resultados</div>
                ) : (
                    filteredLibrary.map(ex => (
                        <div key={ex.id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: 750, fontSize: '1.05rem', color: 'var(--text-main)' }}>{ex.name}</h4>
                                    {ex.is_compound && <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'var(--primary)', borderRadius: '6px', color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compuesto</span>}
                                    
                                    <div 
                                        style={{ position: 'relative', cursor: 'help' }}
                                        onMouseEnter={() => setHoveredEx(ex.id)}
                                        onMouseLeave={() => setHoveredEx(null)}
                                    >
                                        <HelpCircle size={16} opacity={0.3} />
                                        {hoveredEx === ex.id && ex.description && (
                                            <div style={{ position: 'absolute', bottom: '100%', left: '0', background: 'rgba(var(--surface-rgb), 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', width: '250px', zIndex: 10, fontSize: '0.8rem', backdropFilter: 'blur(10px)', color: 'white', marginBottom: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                                                {ex.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.5, fontWeight: 600 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Dumbbell size={12} /> {ex.equipment}</span>
                                    <span>📍 {ex.zone} ({ex.muscle})</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => startEdit(ex)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', opacity: 0.7 }}
                                    title="Editar"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button 
                                    onClick={() => onDeleteExercise(ex.id)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', opacity: 0.7 }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', fontWeight: 700, padding: 0, fontSize: '0.9rem' }}>
                    ← Volver a la lista
                </button>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {editingId ? 'Editando Ejercicio' : 'Nuevo Ejercicio'}
                </div>
            </div>

            <div className="form-group">
                <label>Nombre del Ejercicio</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Curl Araña" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.2rem' }}>
                <div className="form-group">
                    <label>Zona</label>
                    <select value={zone} onChange={e => setZone(e.target.value)} required>
                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Músculo Principal</label>
                    <input type="text" value={muscle} onChange={e => setMuscle(e.target.value)} required placeholder="Ej. Bíceps" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <div className="form-group">
                    <label>Equipamiento</label>
                    <select value={equipment} onChange={e => setEquipment(e.target.value)} required>
                        {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Calorías por Rep (Est.)</label>
                    <input type="number" step="0.1" min="0.01" value={calories} onChange={e => setCalories(e.target.value)} required />
                </div>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.7rem', background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <input type="checkbox" id="is_compound" checked={isCompound} onChange={e => setIsCompound(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="is_compound" style={{ margin: 0, cursor: 'pointer', fontWeight: 700 }}>¿Es ejercicio compuesto?</label>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Activa múltiples grupos musculares simultáneamente.</span>
                </div>
            </div>

            <div className="form-group">
                <label>Descripción / Técnica</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe cómo se ejecuta el ejercicio correctamente..." />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'center', gap: '0.7rem', fontWeight: 850, fontSize: '1rem', marginTop: '1rem' }}>
                <Save size={20} /> {editingId ? 'Actualizar Cambios' : 'Guardar en Librería'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

ExerciseLibraryModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  library: PropTypes.array.isRequired,
  onCreateExercise: PropTypes.func.isRequired,
  onUpdateExercise: PropTypes.func.isRequired,
  onDeleteExercise: PropTypes.func.isRequired
};
