import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export default function GoalAdjustModal({ 
  show, 
  onClose, 
  onSubmit, 
  selectedGoal, 
  adjustType, 
  setAdjustType, 
  adjustData, 
  setAdjustData,
  rates
}) {
  if (!show || !selectedGoal) return null;

  const currentRate = adjustData.currency === 'USD' ? 1 : (rates[adjustData.currency] || 1);
  const usdPreview = (parseFloat(adjustData.amount) || 0) / currentRate;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Ajustar Reserva</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={20} /></button>
        </div>
        
        <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', opacity: 0.8 }}>
          Meta: <strong>{selectedGoal.title}</strong>
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.3rem', borderRadius: '12px' }}>
          <button onClick={() => setAdjustType('add')} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', background: adjustType === 'add' ? 'var(--primary)' : 'transparent', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Sumar</button>
          <button onClick={() => setAdjustType('remove')} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', background: adjustType === 'remove' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Retirar</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Moneda</label>
            <select value={adjustData.currency} onChange={e => setAdjustData({...adjustData, currency: e.target.value})}>
              <option value="USD">USD</option>
              <option value="BS">BS (Paralelo)</option>
              <option value="BS_BCV">BS (BCV)</option>
              <option value="COP">COP</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          <div className="form-group">
            <label>Monto</label>
            <input type="number" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value})} placeholder="0.00" step="0.01" required />
          </div>
        </div>

        {adjustData.currency !== 'USD' && (
          <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.6 }}>Equivalente:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>${usdPreview.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</span>
          </div>
        )}

        <button onClick={onSubmit} className="btn-primary" style={{ width: '100%', padding: '1rem', background: adjustType === 'add' ? 'var(--primary)' : '#3b82f6' }}>
          Confirmar {adjustType === 'add' ? 'Ingreso' : 'Retiro'}
        </button>
      </div>
    </div>
  );
}

GoalAdjustModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectedGoal: PropTypes.shape({
    title: PropTypes.string,
  }),
  adjustType: PropTypes.string.isRequired,
  setAdjustType: PropTypes.func.isRequired,
  adjustData: PropTypes.shape({
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
  }).isRequired,
  setAdjustData: PropTypes.func.isRequired,
  rates: PropTypes.object.isRequired,
};

