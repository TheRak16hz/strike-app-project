import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, RefreshCcw, Calculator, TrendingUp } from 'lucide-react';

export default function FinanceSettingsModal({ show, onClose, rates, budgets, onSave }) {
  const [localRates, setLocalRates] = useState({...rates});
  const [localBudgets, setLocalBudgets] = useState({...budgets});
  const [calc, setCalc] = useState({ amount: '', from: 'BS_P', to: 'USD', result: '0.00' });

  useEffect(() => {
    if (show) {
      setLocalRates({...rates});
      setLocalBudgets({...budgets});
    }
  }, [show, rates, budgets]);

  const categories = ['Comida', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento', 'Otros'];

  const handleCalc = (amount, from, to) => {
    if (!amount) return '0.00';
    let usdValue = 0;
    if (from === 'USD' || from === 'USDT') usdValue = amount;
    else if (from === 'BS_P') usdValue = amount / rates.usd_bs;
    else if (from === 'BS_BCV') usdValue = amount / rates.usd_bs_bcv;
    else if (from === 'COP') usdValue = amount / rates.usd_cop;
    
    let result = 0;
    
    // Direct cross-rate conversion (Bs <-> COP)
    if (from === 'BS_P' && to === 'COP') result = amount * rates.bs_cop;
    else if (from === 'COP' && to === 'BS_P') result = amount / rates.bs_cop;
    else {
        // Standard USD pivot conversion
        if (to === 'USD' || to === 'USDT') result = usdValue;
        else if (to === 'BS_P') result = usdValue * rates.usd_bs;
        else if (to === 'BS_BCV') result = usdValue * rates.usd_bs_bcv;
        else if (to === 'COP') result = usdValue * rates.usd_cop;
    }
    
    return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><RefreshCcw size={20} color="var(--primary)" /></div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Ajustes Financieros</h2>
           </div>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* --- EXCHAGE RATES --- */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Tasas de Cambio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
               <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>USD/BS (Paralelo)</label>
               <input type="number" value={localRates.usd_bs} onChange={e => setLocalRates({...localRates, usd_bs: e.target.value})} step="0.01" />
            </div>
            <div className="form-group">
               <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>USD/BS (BCV)</label>
               <input type="number" value={localRates.usd_bs_bcv} onChange={e => setLocalRates({...localRates, usd_bs_bcv: e.target.value})} step="0.01" />
            </div>
             <div className="form-group">
                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>USD/COP (Pesos)</label>
                <input type="number" value={localRates.usd_cop} onChange={e => setLocalRates({...localRates, usd_cop: e.target.value})} step="1" />
             </div>
             <div className="form-group">
                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>BS/COP (Pesos por 1 BS)</label>
                <input type="number" value={localRates.bs_cop} onChange={e => setLocalRates({...localRates, bs_cop: e.target.value})} step="0.1" />
             </div>
          </div>
        </section>

        {/* --- CONVERSION CALCULATOR --- */}
        <section style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calculator size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Calculadora Rápida</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                placeholder="Monto" 
                value={calc.amount}
                onChange={e => setCalc({ ...calc, amount: e.target.value, result: handleCalc(e.target.value, calc.from, calc.to) })}
                style={{ flex: 1, padding: '0.6rem' }}
              />
              <select 
                value={calc.from} 
                onChange={e => setCalc({ ...calc, from: e.target.value, result: handleCalc(calc.amount, e.target.value, calc.to) })}
                style={{ width: '90px', padding: '0.6rem' }}
              >
                <option value="BS_P">BS (P)</option>
                <option value="BS_BCV">BS (BCV)</option>
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="COP">COP</option>
              </select>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '0.8rem' }}>↓</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                {calc.result}
              </div>
              <select 
                value={calc.to} 
                onChange={e => setCalc({ ...calc, to: e.target.value, result: handleCalc(calc.amount, calc.from, e.target.value) })}
                style={{ width: '90px', padding: '0.6rem' }}
              >
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="BS_P">BS (P)</option>
                <option value="BS_BCV">BS (BCV)</option>
                <option value="COP">COP</option>
              </select>
            </div>
          </div>
        </section>

        {/* --- BUDGETS --- */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
            <TrendingUp size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Presupuestos ($ USD)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {categories.map(cat => (
              <div key={cat} className="form-group">
                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>{cat}</label>
                <input 
                  type="number" 
                  value={localBudgets[cat] || ''} 
                  onChange={e => setLocalBudgets({...localBudgets, [cat]: e.target.value})} 
                  placeholder="Sin límite"
                />
              </div>
            ))}
          </div>
        </section>

        <button 
          onClick={() => onSave({ exchange_rates: localRates, budgets: localBudgets })} 
          className="btn-primary" 
          style={{ width: '100%', padding: '1rem', height: 'auto', fontWeight: 800 }}
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

FinanceSettingsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rates: PropTypes.object.isRequired,
  budgets: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
};
