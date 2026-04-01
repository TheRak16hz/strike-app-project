import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Trash2, Dumbbell, Save, Search, Filter } from 'lucide-react';

const DAYS = [
  { es: 'L', en: 'Monday' },
  { es: 'M', en: 'Tuesday' },
  { es: 'X', en: 'Wednesday' },
  { es: 'J', en: 'Thursday' },
  { es: 'V', en: 'Friday' },
  { es: 'S', en: 'Saturday' },
  { es: 'D', en: 'Sunday' }
];

const PRESET_COLORS = [
    'var(--primary)', // Blue/Brand
    '#ef4444', // Red
    '#f59e0b', // Orange
    '#10b981', // Green
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#64748b'  // Slate
];

const PRESET_ICONS = ['💪', '🏋️', '🏃', '🧘', '🔥', '⚡', '🥇', '🎯', '🦵']; // fixed ' legs ' to 🦵

export default function RoutineModal({ show, onClose, onSubmit, library }) {
  const [name, setName] = useState('');
  const [days, setDays] = useState([]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('💪');
  const [exercises, setExercises] = useState([]);

  // Advanced Selector State
  const [isSelectingExercise, setIsSelectingExercise] = useState(false);
  const [searchEx, setSearchEx] = useState('');
  const [filterZone, setFilterZone] = useState('All');
  const [filterCompound, setFilterCompound] = useState(false);

  const toggleDay = (en) => {
    setDays(prev => prev.includes(en) ? prev.filter(d => d !== en) : [...prev, en]);
  };

  const startAddingExercise = () => {
    setIsSelectingExercise(true);
    setSearchEx('');
  };

  const selectExerciseForRoutine = (libEx) => {
    setExercises([...exercises, { 
        exercise_library_id: libEx.id, 
        name: libEx.name,
        target_sets: 3, 
        target_reps: 10, 
        target_weight: libEx.equipment.includes('Peso Corporal') ? 0 : 5 
    }]);
    setIsSelectingExercise(false);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const newExs = [...exercises];
    newExs[index][field] = value;
    setExercises(newExs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (exercises.length === 0) {
      alert('Debes añadir al menos un ejercicio a la rutina');
      return;
    }
    onSubmit({ name, days, color, icon, exercises });
  };

  const filteredLibrary = useMemo(() => {
      return library.filter(ex => {
          const matchesSearch = ex.name.toLowerCase().includes(searchEx.toLowerCase()) || ex.muscle.toLowerCase().includes(searchEx.toLowerCase());
          const matchesZone = filterZone === 'All' || ex.zone === filterZone;
          const matchesCompound = !filterCompound || ex.is_compound;
          return matchesSearch && matchesZone && matchesCompound;
      });
  }, [library, searchEx, filterZone, filterCompound]);

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><Dumbbell size={20} color="var(--primary)" /></div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Crear Nueva Rutina</h2>
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {isSelectingExercise ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '75vh' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                        type="button" 
                        onClick={() => setIsSelectingExercise(false)} 
                        style={{ 
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'white', cursor: 'pointer', fontWeight: 700, padding: '0.8rem 1rem', 
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}
                        title="Volver"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Search size={18} opacity={0.5} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchEx} 
                            onChange={e => setSearchEx(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                    </div>

                    <select 
                        value={filterZone} 
                        onChange={e => setFilterZone(e.target.value)}
                        style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        <option value="All">Zonas</option>
                        <option value="Tren Superior">Superior</option>
                        <option value="Tren Inferior">Inferior</option>
                        <option value="Core">Core</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Full Body">Full Body</option>
                    </select>

                    <button 
                        type="button"
                        onClick={() => setFilterCompound(!filterCompound)}
                        style={{ 
                            padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: filterCompound ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: filterCompound ? 'white' : 'var(--text-secondary)',
                            border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                        }}
                    >
                        <Filter size={16} /> Comp.
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                    {filteredLibrary.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No se encontraron ejercicios con esos filtros.</p>
                    ) : (
                        filteredLibrary.map(libEx => (
                            <div 
                                key={libEx.id} 
                                onClick={() => selectExerciseForRoutine(libEx)}
                                style={{ 
                                    padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', 
                                    border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {libEx.name}
                                        {libEx.is_compound && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'var(--primary)', borderRadius: '4px', color: '#fff' }}>Compuesto</span>}
                                    </h4>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{libEx.zone} • {libEx.muscle} • {libEx.equipment}</span>
                                </div>
                                <Plus size={20} color="var(--primary)" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label>Nombre de la Rutina</label>
                        <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ej: Día de Pecho y Tríceps" 
                        required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Días Programados</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {DAYS.map(({ es, en }) => (
                            <button
                                key={en}
                                type="button"
                                onClick={() => toggleDay(en)}
                                style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                fontWeight: 700,
                                background: days.includes(en) ? color : 'var(--border-light)',
                                color: days.includes(en) ? '#fff' : 'var(--text-secondary)'
                                }}
                            >
                                {es}
                            </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label>Color</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c} type="button" onClick={() => setColor(c)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: c, border: color === c ? '3px solid white' : 'none', cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Icono</label>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '12px' }}>
                            {PRESET_ICONS.map(i => (
                                <button
                                    key={i} type="button" onClick={() => setIcon(i)}
                                    style={{
                                        padding: '0.4rem 0.6rem', fontSize: '1.2rem', background: icon === i ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer'
                                    }}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Ejercicios ({exercises.length})</h3>
                    <button 
                        type="button" 
                        onClick={startAddingExercise}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    >
                        <Search size={16} /> Buscar Ejercicios
                    </button>
                </div>
                
                {exercises.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Dumbbell size={32} opacity={0.3} style={{ marginBottom: '1rem' }} />
                        <p style={{ margin: 0, opacity: 0.5 }}>No has añadido ejercicios. Busca y selecciona desde la librería.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {exercises.map((ex, exIdx) => (
                        <div key={exIdx} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                            <button 
                            type="button"
                            onClick={() => removeExercise(exIdx)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer' }}
                            >
                            <Trash2 size={16} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, paddingRight: '2rem' }}>{exIdx + 1}. {ex.name}</h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Series Obj.</label>
                                    <input type="number" value={ex.target_sets} onChange={e => updateExercise(exIdx, 'target_sets', e.target.value)} min="1" required />
                                </div>
                                <div className="form-group">
                                    <label>Reps Obj.</label>
                                    <input type="number" value={ex.target_reps} onChange={e => updateExercise(exIdx, 'target_reps', e.target.value)} min="1" required />
                                </div>
                                <div className="form-group">
                                    <label>Peso (kg)</label>
                                    <input type="number" value={ex.target_weight} onChange={e => updateExercise(exIdx, 'target_weight', e.target.value)} min="0" step="0.5" />
                                </div>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '1.2rem', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.1rem', marginTop: '1rem' }}
            >
                <Save size={20} /> Guardar Rutina Estructurada
            </button>
            </form>
        )}
      </div>
    </div>
  );
}

RoutineModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  library: PropTypes.array.isRequired
};
