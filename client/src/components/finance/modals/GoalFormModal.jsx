import PropTypes from 'prop-types';

export default function GoalFormModal({ 
  show, 
  onClose, 
  onSubmit, 
  editingItem, 
  newGoal, 
  setNewGoal 
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
      <form className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }} onSubmit={onSubmit}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{editingItem ? 'Editar Meta' : 'Nueva Meta'}</h2>
            <div style={{ padding: '0.8rem', background: newGoal.color || 'var(--primary)', borderRadius: '15px', fontSize: '1.5rem', color: '#fff' }}>
               {newGoal.icon || '🎯'}
            </div>
         </div>

         <div className="form-group" style={{ marginBottom: '1.5rem' }}>
           <label>Nombre de la Meta</label>
           <input type="text" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} placeholder="Ej: Viaje a Japón, Nueva PC..." required />
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
           <div className="form-group">
             <label>Monto Objetivo (USD)</label>
             <input type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} placeholder="0.00" required />
           </div>
           <div className="form-group">
             <label>Fecha Límite (Opcional)</label>
             <input type="date" value={newGoal.deadline || ''} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
           </div>
         </div>

         <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Selecciona un Icono</label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {['🎯', '💰', '🏠', '🚗', '🏍️', '📱', '📺', '🍲', '✈️', '💻', '🎓', '🏥', '🎮', '🎁', '🍕', '🏃', '📈', '🔒'].map(emoji => (
                <div 
                  key={emoji} 
                  onClick={() => setNewGoal({...newGoal, icon: emoji})}
                  style={{ 
                    width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', cursor: 'pointer', borderRadius: '10px',
                    background: newGoal.icon === emoji ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid ' + (newGoal.icon === emoji ? 'var(--primary)' : 'rgba(255,255,255,0.05)'),
                    transform: newGoal.icon === emoji ? 'scale(1.1)' : 'scale(1)', transition: '0.2s'
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
         </div>

         <div className="form-group" style={{ marginBottom: '2rem' }}>
           <label>Color de Seguimiento</label>
           <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
             {['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(c => (
               <div 
                 key={c} 
                 onClick={() => setNewGoal({...newGoal, color: c})}
                 style={{ 
                   width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                   border: newGoal.color === c ? '3px solid #fff' : 'none',
                   transform: newGoal.color === c ? 'scale(1.1)' : 'scale(1)', transition: '0.2s'
                 }} 
               />
             ))}
             <input type="color" value={newGoal.color || '#8b5cf6'} onChange={e => setNewGoal({...newGoal, color: e.target.value})} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }} />
           </div>
         </div>

         <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
           <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.1rem' }}>
             {editingItem ? 'Actualizar Meta' : 'Crear Objetivo'}
           </button>
           <button 
             type="button" 
             onClick={onClose} 
             style={{ 
               flex: 0.5, padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', 
               background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '14px', 
               fontWeight: 700, cursor: 'pointer' 
             }}
           >
             Cancelar
           </button>
         </div>
      </form>
    </div>
  );
}

GoalFormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingItem: PropTypes.object,
  newGoal: PropTypes.shape({
    title: PropTypes.string,
    target_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    deadline: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  setNewGoal: PropTypes.func.isRequired,
};
