import PropTypes from 'prop-types';
import { X, Download, Share2, Calendar, FileText } from 'lucide-react';

export default function MonthlyReportModal({ show, onClose, transactions, totals, rates }) {
  if (!show) return null;

  const getVeDate = (date = new Date()) => {
    const veStr = date.toLocaleString("en-US", { timeZone: "America/Caracas" });
    return new Date(veStr);
  };

  const nowVe = getVeDate();
  const currentMonth = nowVe.toLocaleString('es-ES', { month: 'long' });
  
  // Filtrar transacciones del mes actual en VET
  const thisMonthTrans = transactions.filter(t => {
    const d = getVeDate(new Date(t.date));
    return d.getMonth() === nowVe.getMonth() && d.getFullYear() === nowVe.getFullYear();
  });

  const categories = [...new Set(thisMonthTrans.map(t => t.category))];
  const expenseByCategory = categories.map(cat => ({
    name: cat,
    value: thisMonthTrans.filter(t => t.category === cat && t.type === 'expense')
                        .reduce((sum, t) => sum + Number(t.amount), 0)
  })).filter(c => c.value > 0);

  const savingsRate = totals.monthlyIncomeUSD > 0 
    ? ((totals.monthlyIncomeUSD - totals.monthlyExpenseUSD) / totals.monthlyIncomeUSD) * 100 
    : 0;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(15px)' }}>
      <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
             <div style={{ padding: '0.6rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '12px' }}><FileText size={20} color="var(--primary)" /></div>
             <h2 style={{ margin: 0, fontSize: '1.4rem', textTransform: 'capitalize' }}>Reporte {currentMonth}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
           <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '0.5rem' }}>INGRESOS TOTALES</div>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>${totals.monthlyIncomeUSD.toLocaleString()}</h3>
           </div>
           <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>GASTOS TOTALES</div>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>${totals.monthlyExpenseUSD.toLocaleString()}</h3>
           </div>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
           <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Gastos por Categoría</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {expenseByCategory.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No hay gastos registrados este mes</div>
              ) : (
                expenseByCategory.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                       <span>{c.name}</span>
                       <span style={{ fontWeight: 700 }}>${c.value.toLocaleString()} ({((c.value / totals.monthlyExpenseUSD) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                       <div className="progress-bar-fill" style={{ width: `${(c.value / totals.monthlyExpenseUSD) * 100}%`, background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
           <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Resumen de Salud Financiera</h4>
           <p style={{ fontSize: '0.85rem', lineHeight: 1.6, opacity: 0.9 }}>
              Este mes has ahorrado un <strong>{savingsRate.toFixed(1)}%</strong> de tus ingresos. 
              {savingsRate > 20 ? ' ¡Excelente capacidad de ahorro!' : ' Intenta reducir gastos hormiga para mejorar tu ahorro.'}
           </p>
           <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.75rem' }}>
              <span style={{ opacity: 0.7 }}>Tasa de cambio aplicada:</span> <strong>1 USD = {rates.usd_bs} BS</strong>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}><Download size={18} /> Descargar PDF</button>
          <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '14px', fontWeight: 700 }}><Share2 size={18} /> Compartir</button>
        </div>
      </div>
    </div>
  );
}

MonthlyReportModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  transactions: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })).isRequired,
  totals: PropTypes.shape({
    monthlyIncomeUSD: PropTypes.number.isRequired,
    monthlyExpenseUSD: PropTypes.number.isRequired,
  }).isRequired,
  rates: PropTypes.shape({
    usd_bs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};
