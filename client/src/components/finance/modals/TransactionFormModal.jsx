import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { FINANCE_CATEGORIES } from '../../../constants/financeConstants';

export default function TransactionFormModal({ 
  show, 
  onClose, 
  onSubmit, 
  editingItem, 
  newTrans, 
  setNewTrans, 
  goals 
}) {
  if (!show) return null;

  const handleTypeChange = (type) => {
    setNewTrans({ ...newTrans, type });
  };

  const handleCategorySelect = (cat) => {
    setNewTrans({ ...newTrans, category: cat.label });
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
      <form className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }} onSubmit={onSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{editingItem ? 'Editar' : 'Nuevo'} Movimiento</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '16px' }}>
          {[
            { id: 'income', label: 'Ingreso', color: '#10b981' },
            { id: 'saving', label: 'Ahorro', color: 'var(--primary)' },
            { id: 'expense', label: 'Egreso', color: '#ef4444' }
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => handleTypeChange(opt.id)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: newTrans.type === opt.id ? opt.color : 'transparent', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
           <div className="form-group">
             <label>Monto</label>
             <input type="number" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} step="0.01" required />
           </div>
           <div className="form-group">
             <label>Divisa</label>
             <select value={newTrans.currency} onChange={e => setNewTrans({...newTrans, currency: e.target.value})}>
               <option value="USD">USD</option>
               <option value="BS">BS (Paralelo)</option>
               <option value="BS_BCV">BS (BCV)</option>
               <option value="COP">COP</option>
               <option value="USDT">USDT</option>
             </select>
           </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Categoría</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
            {FINANCE_CATEGORIES.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => handleCategorySelect(cat)}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0.5rem',
                  borderRadius: '8px', cursor: 'pointer', transition: '0.2s',
                  background: newTrans.category === cat.label ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                  border: `1px solid ${newTrans.category === cat.label ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Origen / Fuente</label>
            <input type="text" value={newTrans.source} onChange={e => setNewTrans({...newTrans, source: e.target.value})} placeholder="Ej: Efectivo, Banco..." />
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} required />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label>Meta Asociada (Opcional)</label>
          <select value={newTrans.goal_id || ''} onChange={e => setNewTrans({...newTrans, goal_id: e.target.value || null})}>
            <option value="">Ninguna</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', background: newTrans.type === 'income' ? '#10b981' : (newTrans.type === 'expense' ? '#ef4444' : 'var(--primary)') }}>
          {editingItem ? 'Actualizar' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
}

TransactionFormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingItem: PropTypes.object,
  newTrans: PropTypes.shape({
    type: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    category: PropTypes.string,
    source: PropTypes.string,
    date: PropTypes.string,
    goal_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  setNewTrans: PropTypes.func.isRequired,
  goals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
  })).isRequired,
};
