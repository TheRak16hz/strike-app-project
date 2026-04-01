import PropTypes from 'prop-types';

export default function BudgetProgress({ budgets, categorySpending }) {
  const categories = Object.keys(budgets);

  if (categories.length === 0) return (
    <div style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.5, fontSize: '0.85rem' }}>
        No has definido presupuestos mensuales.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {categories.map(cat => {
        const budget = Number(budgets[cat]) || 0;
        const spent = Number(categorySpending[cat]) || 0;
        const progress = Math.min((spent / budget) * 100, 100);
        const isOver = spent > budget;

        return (
          <div key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700 }}>{cat}</span>
              <span>
                <span style={{ color: isOver ? '#ef4444' : 'var(--text-primary)', fontWeight: 800 }}>
                  ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span style={{ opacity: 0.5 }}> / ${budget.toLocaleString()}</span>
              </span>
            </div>
            <div className="progress-bar-container" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progress}%`, 
                  background: isOver ? '#ef4444' : 'linear-gradient(90deg, var(--primary), #10b981)' 
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

BudgetProgress.propTypes = {
  budgets: PropTypes.object.isRequired,
  categorySpending: PropTypes.object.isRequired,
};
