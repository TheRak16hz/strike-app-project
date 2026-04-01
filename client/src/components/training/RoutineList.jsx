import PropTypes from 'prop-types';
import { Trash2, Play, Activity } from 'lucide-react';

export default function RoutineList({ routines, onDelete, onExecute }) {
  if (routines.length === 0) {
    return (
      <div className="glass-panel animate-scale" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
        <Activity size={48} style={{ marginBottom: '1rem' }} />
        <h3>Aún no has creado ninguna rutina</h3>
        <p>Crea tu primera rutina de entrenamiento haciendo clic en &quot;Crear Rutina&quot;.</p>
      </div>
    );
  }

  const daysMap = {
    'Monday': 'L',
    'Tuesday': 'M',
    'Wednesday': 'X',
    'Thursday': 'J',
    'Friday': 'V',
    'Saturday': 'S',
    'Sunday': 'D'
  };

  return (
    <div className="sessions-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {routines.map((routine, idx) => {
        const days = typeof routine.days === 'string' ? JSON.parse(routine.days) : (routine.days || []);
        
        return (
          <div 
            key={routine.id} 
            className="glass-panel animate-slide" 
            style={{ 
              padding: '1.5rem', 
              animationDelay: `${idx * 0.05}s`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${routine.color || 'var(--primary)'}40`,
              position: 'relative'
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ padding: '0.6rem', background: `${routine.color || 'var(--primary)'}20`, borderRadius: '12px', fontSize: '1.2rem' }}>
                      {routine.icon || '💪'}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{routine.name}</h4>
                </div>
                <button 
                  onClick={() => onDelete(routine.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer' }}
                  title="Eliminar Rutina"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.2rem' }}>
                  {Object.entries(daysMap).map(([en, es]) => (
                      <div 
                          key={en}
                          style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800,
                              background: days.includes(en) ? (routine.color || 'var(--primary)') : 'rgba(255,255,255,0.05)',
                              color: days.includes(en) ? '#fff' : 'rgba(255,255,255,0.3)'
                          }}
                      >
                          {es}
                      </div>
                  ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {routine.exercises && routine.exercises.length > 0 ? (
                      routine.exercises.slice(0, 3).map(ex => (
                          <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                              <span>{ex.name}</span>
                              <span style={{ opacity: 0.5 }}>{ex.target_sets}x{ex.target_reps}</span>
                          </div>
                      ))
                  ) : (
                      <span style={{ opacity: 0.5 }}>Sin ejercicios</span>
                  )}
                  {routine.exercises && routine.exercises.length > 3 && (
                      <span style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '0.3rem' }}>+ {routine.exercises.length - 3} más</span>
                  )}
              </div>
            </div>

            <button 
                onClick={() => onExecute(routine)}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: routine.color || 'var(--primary)' }}
            >
                <Play size={16} fill="white" /> Iniciar Entrenamiento
            </button>
          </div>
        );
      })}
    </div>
  );
}

RoutineList.propTypes = {
  routines: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExecute: PropTypes.func.isRequired
};
