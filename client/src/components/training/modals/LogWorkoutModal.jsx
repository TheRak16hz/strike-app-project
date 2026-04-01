import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Play, Save } from 'lucide-react';

export default function LogWorkoutModal({ show, onClose, onSubmit, routine }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (routine && routine.exercises) {
      // Initialize state with target values as a baseline
      setExercises(routine.exercises.map(ex => ({
        routine_exercise_id: ex.id,
        name: ex.name,
        actual_sets: ex.target_sets,
        actual_reps: ex.target_reps,
        actual_weight: ex.target_weight
      })));
    }
  }, [routine]);

  const updateExercise = (index, field, value) => {
    const newExs = [...exercises];
    newExs[index][field] = value;
    setExercises(newExs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
        date, 
        perceived_effort: perceivedEffort, 
        notes, 
        exercises 
    });
  };

  if (!show || !routine) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}><Play size={20} color="#10b981" /></div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Registrar Entrenamiento</h2>
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: routine.color || 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {routine.icon} {routine.name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Confirma los valores que lograste realizar hoy.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="form-group">
              <label>Fecha del Entrenamiento</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
              />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {exercises.map((ex, idx) => (
              <div key={ex.routine_exercise_id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700 }}>{ex.name}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Series</label>
                        <input type="number" value={ex.actual_sets} onChange={e => updateExercise(idx, 'actual_sets', e.target.value)} min="0" required />
                    </div>
                    <div className="form-group">
                        <label>Reps Promedio</label>
                        <input type="number" value={ex.actual_reps} onChange={e => updateExercise(idx, 'actual_reps', e.target.value)} min="0" required />
                    </div>
                    <div className="form-group">
                        <label>Peso Usado (kg)</label>
                        <input type="number" value={ex.actual_weight} onChange={e => updateExercise(idx, 'actual_weight', e.target.value)} min="0" step="0.5" />
                    </div>
                </div>
              </div>
            ))}
            {exercises.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center' }}>Esta rutina no tiene ejercicios.</p>}
          </div>

          <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Esfuerzo Percibido (RPE 1-10) 
                  <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{perceivedEffort}</span>
              </label>
              <input 
                type="range" 
                min="1" max="10" 
                value={perceivedEffort} 
                onChange={e => setPerceivedEffort(e.target.value)}
                style={{ width: '100%', cursor: 'pointer', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>
                  <span>1 (Muy Fácil)</span>
                  <span>10 (Máximo Esfuerzo)</span>
              </div>
          </div>

          <div className="form-group">
              <label>Notas Adicionales</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="¿Cómo te sentiste hoy?"
                rows={2}
              />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontWeight: 800, background: '#10b981' }}
          >
            <Save size={20} /> Terminar Entrenamiento
          </button>
        </form>
      </div>
    </div>
  );
}

LogWorkoutModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  routine: PropTypes.object
};
