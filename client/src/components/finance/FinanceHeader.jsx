import PropTypes from 'prop-types';
import { Target, RefreshCw, Settings } from 'lucide-react';

export default function FinanceHeader({ onNewGoal, onOpenSettings, onResetTransactions, onResetGoals }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
          Finanzas <span style={{ color: 'var(--primary)' }}>Personales</span>
        </h1>
        <div style={{ height: '3px', width: '40px', background: 'var(--primary)', borderRadius: '10px', marginTop: '2px' }}></div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <button onClick={onResetTransactions} style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer' }} title="Reiniciar Movimientos">
          <RefreshCw size={14} /> 
        </button>
        <button onClick={onResetGoals} style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer' }} title="Eliminar Metas">
          <Target size={14} />
        </button>
        <button className="theme-toggle" onClick={onOpenSettings} title="Ajustes">
          <Settings size={20} />
        </button>
        <button className="btn-primary" onClick={onNewGoal}>
          <Target size={18} /> Nueva Meta
        </button>
      </div>
    </div>
  );
}

FinanceHeader.propTypes = {
  onNewGoal: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onResetTransactions: PropTypes.func.isRequired,
  onResetGoals: PropTypes.func.isRequired,
};
