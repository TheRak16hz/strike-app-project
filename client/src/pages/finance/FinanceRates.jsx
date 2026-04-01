import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RefreshCcw, ArrowRightLeft, Edit3, Check } from 'lucide-react';

const RATE_CONFIGS = [
  {
    key: 'usd_bs',
    label: 'USD / BS (Paralelo)',
    emoji: '🇻🇪',
    description: 'Tasa paralela del mercado venezolano',
    color: '#c084fc',
  },
  {
    key: 'usd_bs_bcv',
    label: 'USD / BS (BCV)',
    emoji: '🏛️',
    description: 'Tasa oficial del Banco Central',
    color: '#60a5fa',
  },
  {
    key: 'usd_cop',
    label: 'USD / COP',
    emoji: '🇨🇴',
    description: 'Pesos colombianos por dólar',
    color: '#34d399',
  },
  {
    key: 'bs_cop',
    label: 'BS / COP',
    emoji: '🔁',
    description: 'Pesos por 1 bolívar',
    color: '#f97316',
  },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD 🇺🇸' },
  { value: 'USDT', label: 'USDT 💎' },
  { value: 'BS_P', label: 'BS (P) 🇻🇪' },
  { value: 'BS_BCV', label: 'BS (BCV) 🏛️' },
  { value: 'COP', label: 'COP 🇨🇴' },
];

function calcConversion(amount, from, to, rates) {
  if (!amount || isNaN(amount)) return '0.00';
  const val = Number(amount);

  // USD equivalent of 'from'
  let usd = 0;
  if (from === 'USD' || from === 'USDT') usd = val;
  else if (from === 'BS_P') usd = val / Number(rates.usd_bs || 1);
  else if (from === 'BS_BCV') usd = val / Number(rates.usd_bs_bcv || 1);
  else if (from === 'COP') usd = val / Number(rates.usd_cop || 1);

  // Direct cross-rate
  if (from === 'BS_P' && to === 'COP') {
    const result = val * Number(rates.bs_cop || 1);
    return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (from === 'COP' && to === 'BS_P') {
    const result = val / Number(rates.bs_cop || 1);
    return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Standard pivot
  let result = 0;
  if (to === 'USD' || to === 'USDT') result = usd;
  else if (to === 'BS_P') result = usd * Number(rates.usd_bs || 1);
  else if (to === 'BS_BCV') result = usd * Number(rates.usd_bs_bcv || 1);
  else if (to === 'COP') result = usd * Number(rates.usd_cop || 1);

  return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanceRates({ rates, onSaveRates }) {
  const [editingRates, setEditingRates] = useState(false);
  const [localRates, setLocalRates] = useState({ ...rates });
  const [calc, setCalc] = useState({ amount: '', from: 'USD', to: 'BS_P' });
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    setLocalRates({ ...rates });
  }, [rates]);

  const calcResult = calcConversion(calc.amount, calc.from, calc.to, rates);

  const handleSwap = () => {
    setCalc(prev => ({ ...prev, from: prev.to, to: prev.from }));
    setSwapped(s => !s);
  };

  const handleSave = () => {
    onSaveRates(localRates);
    setEditingRates(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* =================== RATES GRID =================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RefreshCcw size={18} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Tasas de Cambio</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {editingRates ? (
              <>
                <button
                  id="rates-save-btn"
                  onClick={handleSave}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Check size={14} /> Guardar
                </button>
                <button
                  onClick={() => { setEditingRates(false); setLocalRates({ ...rates }); }}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                id="rates-edit-btn"
                onClick={() => setEditingRates(true)}
                style={{
                  padding: '0.45rem 0.9rem',
                  background: 'rgba(var(--primary-rgb),0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(var(--primary-rgb),0.25)',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Edit3 size={14} /> Actualizar Tasas
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {RATE_CONFIGS.map(cfg => (
            <div
              key={cfg.key}
              className="glass-panel"
              style={{
                padding: '1.4rem',
                border: `1px solid ${cfg.color}22`,
                background: `linear-gradient(135deg, ${cfg.color}10, transparent)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{cfg.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{cfg.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{cfg.description}</div>
                </div>
              </div>

              {editingRates ? (
                <input
                  id={`rate-input-${cfg.key}`}
                  type="number"
                  value={localRates[cfg.key] || ''}
                  onChange={e => setLocalRates(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${cfg.color}60`,
                    borderRadius: '10px',
                    color: cfg.color,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    textAlign: 'right',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: cfg.color, letterSpacing: '-0.02em' }}>
                  {Number(rates[cfg.key] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* =================== CALCULATOR =================== */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(var(--primary-rgb),0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🧮</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Calculadora de Conversión</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px', margin: '0 auto' }}>

          {/* FROM */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Convertir de
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', alignItems: 'center' }}>
              <input
                id="calc-amount-input"
                type="number"
                placeholder="0.00"
                value={calc.amount}
                onChange={e => setCalc(prev => ({ ...prev, amount: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'rgba(var(--primary-rgb),0.05)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                }}
              />
              <select
                id="calc-from-select"
                value={calc.from}
                onChange={e => setCalc(prev => ({ ...prev, from: e.target.value }))}
                style={{
                  padding: '0.75rem 0.8rem',
                  background: 'rgba(var(--primary-rgb),0.05)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  minWidth: '110px',
                }}
              >
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* SWAP */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              id="calc-swap-btn"
              onClick={handleSwap}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(var(--primary-rgb),0.12)',
                border: '2px solid rgba(var(--primary-rgb),0.25)',
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.35s ease',
                transform: swapped ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* TO */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resultado
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', alignItems: 'center' }}>
              <div
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'rgba(var(--primary-rgb),0.07)',
                  border: '1px solid rgba(var(--primary-rgb),0.15)',
                  borderRadius: '12px',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  letterSpacing: '-0.02em',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {calcResult}
              </div>
              <select
                id="calc-to-select"
                value={calc.to}
                onChange={e => setCalc(prev => ({ ...prev, to: e.target.value }))}
                style={{
                  padding: '0.75rem 0.8rem',
                  background: 'rgba(var(--primary-rgb),0.05)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  minWidth: '110px',
                }}
              >
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Formula hint */}
          {calc.amount && (
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              {calc.amount} {calc.from.replace('_P', '').replace('_BCV', ' BCV')} = {calcResult} {calc.to.replace('_P', '').replace('_BCV', ' BCV')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

FinanceRates.propTypes = {
  rates: PropTypes.object.isRequired,
  onSaveRates: PropTypes.func.isRequired,
};
