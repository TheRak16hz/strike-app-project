import { useState } from 'react';
import PropTypes from 'prop-types';
import { RefreshCcw, ArrowRightLeft, Edit3, Check, X, Wifi, WifiOff, Clock } from 'lucide-react';
import { financeService } from '../../services/financeService';

// Lógicas y UI dependientes de metadatos

// ========================
// LÓGICA DE CONVERSIÓN
// ========================
function calcConversion(amount, from, to, rates) {
  if (!amount || isNaN(amount) || from === to) return '0.00';
  const val = Number(amount);
  const usd_bs   = Number(rates.usd_bs   || 648);
  const usd_bscv = Number(rates.usd_bs_bcv || 474);
  const usd_cop  = Number(rates.usd_cop  || 4200);
  const bs_cop   = Number(rates.bs_cop   || 5);
  const usdt_bs  = Number(rates.usdt_bs  || usd_bs); // treat USDT ≈ USD if not set

  // Convert FROM → USD (pivot)
  let usd = 0;
  if (from === 'USD')    usd = val;
  else if (from === 'USDT')   usd = val * usd_bs / usdt_bs; // USDT via Bs
  else if (from === 'BS_P')   usd = val / usd_bs;
  else if (from === 'BS_BCV') usd = val / usd_bscv;
  else if (from === 'COP')    usd = val / usd_cop;

  // Special direct cross rates
  if (from === 'BS_P' && to === 'COP')   return fmt(val * bs_cop);
  if (from === 'COP' && to === 'BS_P')   return fmt(val / bs_cop);
  if (from === 'BS_BCV' && to === 'COP') return fmt(val * bs_cop);
  if (from === 'COP' && to === 'BS_BCV') return fmt(val / bs_cop);

  // Convert USD → TO
  let result = 0;
  if (to === 'USD')      result = usd;
  else if (to === 'USDT')    result = usd * usdt_bs / usd_bs;
  else if (to === 'BS_P')    result = usd * usd_bs;
  else if (to === 'BS_BCV')  result = usd * usd_bscv;
  else if (to === 'COP')     result = usd * usd_cop;

  return fmt(result);
}

function fmt(n, decimals = 2) {
  // Use en-US so decimals always use period (.) not comma
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function timeSince(isoDate) {
  if (!isoDate) return null;
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

// ========================
// COMPONENTE PRINCIPAL
// ========================
export default function FinanceRates({ rates, onSaveRates, rateConfigs = [], currencies = [] }) {
  const [editingKey, setEditingKey] = useState(null);   // which card is being edited
  const [draftValue, setDraftValue] = useState('');
  const [calc, setCalc] = useState({ amount: '', from: 'USD', to: 'BS_P' });
  const [swapped, setSwapped]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState(null); // { type: 'ok'|'err', text }

  const calcResult = calcConversion(calc.amount, calc.from, calc.to, rates);

  const handleSwap = () => {
    setCalc(prev => ({ ...prev, from: prev.to, to: prev.from }));
    setSwapped(s => !s);
  };

  const startEdit = (key, currentVal) => {
    setEditingKey(key);
    setDraftValue(String(currentVal || ''));
  };

  const confirmEdit = (key) => {
    const val = parseFloat(draftValue);
    if (!isNaN(val) && val > 0) {
      onSaveRates({ ...rates, [key]: val });
    }
    setEditingKey(null);
  };

  const cancelEdit = () => setEditingKey(null);

  const handleFetchLive = async () => {
    setFetching(true);
    setFetchMsg(null);
    try {
      const result = await financeService.fetchLiveRates();
      if (result.rates) {
        onSaveRates({ ...rates, ...result.rates });
        setFetchMsg({
          type: 'ok',
          text: result.success
            ? `✅ BCV: ${result.rates.usd_bs_bcv} · Paralelo: ${result.rates.usd_bs}`
            : result.message || 'Usando tasas en caché',
        });
      } else {
        setFetchMsg({ type: 'err', text: result.error || 'Error desconocido' });
      }
    } catch {
      setFetchMsg({ type: 'err', text: 'No se pudo conectar al servidor' });
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMsg(null), 6000);
    }
  };

  const lastFetch = rates.last_live_fetch;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* =================== RATES GRID =================== */}
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RefreshCcw size={18} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Tasas de Cambio</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {lastFetch && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={11} /> {timeSince(lastFetch)}
              </span>
            )}
            <button
              id="rates-live-btn"
              onClick={handleFetchLive}
              disabled={fetching}
              style={{
                padding: '0.45rem 0.9rem',
                background: fetching ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.12)',
                color: fetching ? 'var(--text-secondary)' : '#10b981',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: fetching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              {fetching ? <><RefreshCcw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Consultando...</> : <><Wifi size={13} /> Actualizar tasas</>}
            </button>
          </div>
        </div>

        {/* Fetch message */}
        {fetchMsg && (
          <div style={{
            marginBottom: '0.75rem',
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: fetchMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: fetchMsg.type === 'ok' ? '#10b981' : '#ef4444',
            border: `1px solid ${fetchMsg.type === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {fetchMsg.type === 'ok' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {fetchMsg.text}
          </div>
        )}

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {rateConfigs.map(cfg => {
            const isEditing = editingKey === cfg.key;
            const value = rates[cfg.key];
            return (
              <div
                key={cfg.key}
                className="glass-panel"
                style={{
                  padding: '1.2rem',
                  border: `1px solid ${cfg.color}22`,
                  background: `linear-gradient(135deg, ${cfg.color}0d, transparent)`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  opacity: cfg.optional && !value ? 0.7 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{cfg.emoji}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{cfg.label}</span>
                      {cfg.autoFetch && (
                        <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}>AUTO</span>
                      )}
                      {cfg.optional && (
                        <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontWeight: 700 }}>OPC</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{cfg.description}</div>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => startEdit(cfg.key, value)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                      title="Editar manualmente"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>

                {/* Value / Edit */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      autoFocus
                      type="number"
                      step="0.01"
                      value={draftValue}
                      onChange={e => setDraftValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmEdit(cfg.key); if (e.key === 'Escape') cancelEdit(); }}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.7rem',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${cfg.color}80`,
                        borderRadius: '10px',
                        color: cfg.color,
                        fontSize: '1rem',
                        fontWeight: 800,
                        textAlign: 'right',
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                    />
                    <button onClick={() => confirmEdit(cfg.key)} style={{ background: cfg.color, border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer', padding: '0.45rem', display: 'flex' }}><Check size={14} /></button>
                    <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.45rem', display: 'flex' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div
                    style={{ fontWeight: 900, fontSize: '1.5rem', color: cfg.color, letterSpacing: '-0.03em', cursor: 'pointer' }}
                    onClick={() => startEdit(cfg.key, value)}
                    title="Clic para editar"
                  >
                    {value ? Number(value).toLocaleString('es-VE', { maximumFractionDigits: 2 }) : <span style={{ opacity: 0.4, fontSize: '1rem' }}>— sin definir</span>}
                    {value && <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.3rem' }}>{cfg.suffix}</span>}
                  </div>
                )}

                {/* Sublabel */}
                <div style={{ fontSize: '0.7rem', color: cfg.color, opacity: 0.6, marginTop: '0.3rem', fontWeight: 600 }}>{cfg.sublabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================== CALCULADORA =================== */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(var(--primary-rgb),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.1rem' }}>🧮</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Calculadora de Conversión</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* FROM */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Convertir de
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.7rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <input
                id="calc-amount-input"
                type="number"
                placeholder="0.00"
                value={calc.amount}
                onChange={e => setCalc(prev => ({ ...prev, amount: e.target.value }))}
                style={{
                  flex: '1 1 auto',
                  width: 0,
                  padding: '0.9rem 1rem',
                  background: 'rgba(var(--primary-rgb),0.06)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  boxSizing: 'border-box',
                }}
              />
              <select
                id="calc-from-select"
                value={calc.from}
                onChange={e => setCalc(prev => ({ ...prev, from: e.target.value }))}
                style={{
                  flex: '1 1 148px',
                  padding: '0.9rem 0.8rem',
                  background: 'rgba(var(--primary-rgb),0.06)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              id="calc-swap-btn"
              onClick={handleSwap}
              style={{
                width: '44px',
                height: '44px',
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

          {/* TO (Result) */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resultado
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.7rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div
                style={{
                  flex: '1 1 auto',
                  width: 0,
                  padding: '0.9rem 1rem',
                  background: 'rgba(var(--primary-rgb),0.07)',
                  border: '1px solid rgba(var(--primary-rgb),0.15)',
                  borderRadius: '12px',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {calcResult}
              </div>
              <select
                id="calc-to-select"
                value={calc.to}
                onChange={e => setCalc(prev => ({ ...prev, to: e.target.value }))}
                style={{
                  flex: '1 1 148px',
                  padding: '0.9rem 0.8rem',
                  background: 'rgba(var(--primary-rgb),0.06)',
                  border: '1px solid rgba(var(--primary-rgb),0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Formula hint */}
          {calc.amount && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.75 }}>
              {calc.amount} {currencies.find(c => c.value === calc.from)?.name} = {calcResult} {currencies.find(c => c.value === calc.to)?.name}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

FinanceRates.propTypes = {
  rates: PropTypes.object.isRequired,
  onSaveRates: PropTypes.func.isRequired,
  rateConfigs: PropTypes.array,
  currencies: PropTypes.array
};
