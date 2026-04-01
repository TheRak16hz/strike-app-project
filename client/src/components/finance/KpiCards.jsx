import PropTypes from 'prop-types';
import { useState } from 'react';
import { TrendingUp, DollarSign, PiggyBank, ChevronDown, ChevronUp } from 'lucide-react';

export default function KpiCards({ totals, goalsCount }) {
  const [showDetails, setShowDetails] = useState(false);
  const { currencyBalances } = totals;

  return (
    <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.2rem', borderBottom: '3px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
           <div style={{ padding: '0.4rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><TrendingUp size={16} color="var(--primary)" /></div>
           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CAPITAL DISPONIBLE</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>${totals.availableLiquidUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
      </div>

      <div className="glass-panel" style={{ padding: '1.2rem', borderBottom: '3px solid #10b981', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
             <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}><DollarSign size={16} color="#10b981" /></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PATRIMONIO BRUTO</span>
          </div>
          <button 
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem' }}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Detalle (Ingresado)
          </button>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>${totals.grossTotalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>

        {/* Small Sparkline for Net Worth Trend */}
        {totals.trendData && totals.trendData.length > 1 && (
          <div style={{ height: '30px', marginTop: '0.8rem', opacity: 0.6 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d={`M ${totals.trendData.map((d, i) => {
                  const min = Math.min(...totals.trendData.map(v => v.value));
                  const max = Math.max(...totals.trendData.map(v => v.value));
                  const range = max - min || 1;
                  const x = (i / (totals.trendData.length - 1)) * 100;
                  const y = 30 - ((d.value - min) / range) * 30;
                  return `${x},${y}`;
                }).join(' L ')}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {showDetails && currencyBalances && (
          <div className="animate-scale" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>USD/USDT</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>${((currencyBalances.USD || 0) + (currencyBalances.USDT || 0)).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>BOLÍVARES (BS)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Bs. {(currencyBalances.BS || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>PESOS (COP)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>$ {(currencyBalances.COP || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.2rem', borderBottom: '3px solid #f59e0b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
           <div style={{ padding: '0.4rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px' }}><PiggyBank size={16} color="#f59e0b" /></div>
           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RESERVA EN {goalsCount} METAS</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>${totals.totalSavedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
      </div>
    </div>
  );
}

KpiCards.propTypes = {
  totals: PropTypes.shape({
    availableLiquidUSD: PropTypes.number.isRequired,
    grossTotalUSD: PropTypes.number.isRequired,
    totalSavedUSD: PropTypes.number.isRequired,
    currencyBalances: PropTypes.object.isRequired,
    trendData: PropTypes.array
  }).isRequired,
  goalsCount: PropTypes.number.isRequired,
};
