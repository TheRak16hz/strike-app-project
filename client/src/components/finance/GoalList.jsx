import PropTypes from 'prop-types';
import { ArrowLeftRight, Edit2, Trash2 } from 'lucide-react';

export default function GoalList({ goals, onAdjust, onEdit, onDelete }) {
  return (
    <section className="glass-panel area-goals" style={{ padding: '1.2rem', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Metas Activas</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.85rem' }}>Cero metas activas</div>
        ) : (
          goals.map(goal => {
            const progress = Math.min((Number(goal.current_amount) / (Number(goal.target_amount) || 1)) * 100, 100);
            return (
              <div key={goal.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                     <span style={{ fontSize: '1.2rem' }}>{goal.icon}</span>
                     <h4 style={{ 
                       margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff',
                       whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                     }}>
                       {goal.title}
                     </h4>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                    <button onClick={() => onAdjust(goal)} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Ajustar"><ArrowLeftRight size={13} /></button>
                    <button onClick={() => onEdit(goal)} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Editar"><Edit2 size={13} /></button>
                    <button onClick={() => onDelete(goal.id)} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }} title="Eliminar"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700 }}>${Number(goal.current_amount).toLocaleString()}</span>
                    <span style={{ opacity: 0.5 }}>${Number(goal.target_amount).toLocaleString()}</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px', marginBottom: '0.5rem' }}>
                   <div className="progress-bar-fill" style={{ width: `${progress}%`, background: goal.color }}></div>
                </div>

                {goal.estDate && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    color: goal.status === 'delayed' ? '#ef4444' : (goal.status === 'completed' ? '#10b981' : 'var(--text-secondary)') 
                  }}>
                    <span>Progreso:</span>
                    <span style={{ fontWeight: 800 }}>{goal.statusLabel || 'En curso'} • {goal.estDate}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

GoalList.propTypes = {
  goals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    current_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    target_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  onAdjust: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
