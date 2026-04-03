import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Settings, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Categorías precargadas pasadas por propiedades

function StatusBadge({ pct }) {
  if (pct >= 100)
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: 'rgba(239,68,68,0.12)',
          color: '#ef4444',
          borderRadius: '8px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.72rem',
          fontWeight: 800,
        }}
      >
        <XCircle size={12} /> Excedido
      </span>
    );
  if (pct >= 80)
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: 'rgba(234,179,8,0.12)',
          color: '#eab308',
          borderRadius: '8px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.72rem',
          fontWeight: 800,
        }}
      >
        <AlertTriangle size={12} /> Cerca del límite
      </span>
    );
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        background: 'rgba(16,185,129,0.12)',
        color: '#10b981',
        borderRadius: '8px',
        padding: '0.2rem 0.6rem',
        fontSize: '0.72rem',
        fontWeight: 800,
      }}
    >
      <CheckCircle size={12} /> En control
    </span>
  );
}

StatusBadge.propTypes = { pct: PropTypes.number.isRequired };

export default function FinanceBudgets({ budgets, categorySpending, onOpenSettings, onSaveBudgets, categories = [] }) {
  // Inline editing state
  const [editing, setEditing] = useState(false);
  const [localBudgets, setLocalBudgets] = useState({ ...budgets });

  useEffect(() => {
    setLocalBudgets({ ...budgets });
  }, [budgets]);

  const totalBudget = categories.reduce((a, cObj) => a + (Number(localBudgets[cObj.id]) || 0), 0);
  const totalSpent = categories.reduce((a, cObj) => a + (Number(categorySpending[cObj.id]) || 0), 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const handleSave = () => {
    onSaveBudgets(localBudgets);
    setEditing(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.08), rgba(var(--primary-rgb),0.02))',
          border: '1px solid rgba(var(--primary-rgb),0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(var(--primary-rgb),0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={24} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Presupuesto Mensual</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              ${totalSpent.toFixed(2)} gastado de ${totalBudget.toFixed(2)} USD
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!editing ? (
            <>
              <button
                id="budgets-edit-btn"
                onClick={() => setEditing(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(var(--primary-rgb),0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(var(--primary-rgb),0.3)',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Settings size={14} /> Editar Límites
              </button>
              <button
                onClick={onOpenSettings}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
                title="Ajustes avanzados"
              >
                <Settings size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                id="budgets-save-btn"
                onClick={handleSave}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✅ Guardar
              </button>
              <button
                onClick={() => { setEditing(false); setLocalBudgets({ ...budgets }); }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Progress */}
      {totalBudget > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total General</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StatusBadge pct={overallPct} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: overallPct >= 100 ? '#ef4444' : 'var(--primary)' }}>
                {overallPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${overallPct}%`,
                borderRadius: '999px',
                background: overallPct >= 100
                  ? '#ef4444'
                  : overallPct >= 80
                  ? 'linear-gradient(90deg, #eab308, #ef4444)'
                  : 'linear-gradient(90deg, var(--primary), #10b981)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {categories.map(catObj => {
          const cat = catObj.id;
          const budget = Number(localBudgets[cat]) || 0;
          const spent = Number(categorySpending[cat]) || 0;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const rawPct = budget > 0 ? (spent / budget) * 100 : 0;

          return (
            <div
              key={cat}
              className="glass-panel"
              style={{
                padding: '1.2rem 1.4rem',
                border: rawPct >= 100
                  ? '1px solid rgba(239,68,68,0.3)'
                  : rawPct >= 80
                  ? '1px solid rgba(234,179,8,0.2)'
                  : '1px solid rgba(255,255,255,0.05)',
                transition: 'border-color 0.3s',
              }}
            >
              {/* Category Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{catObj.icon || '📦'}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{cat}</div>
                    {budget > 0 && <StatusBadge pct={rawPct} />}
                  </div>
                </div>
                {editing && (
                  <input
                    id={`budget-input-${cat}`}
                    type="number"
                    value={localBudgets[cat] || ''}
                    onChange={e => setLocalBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '90px',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(var(--primary-rgb),0.08)',
                      border: '1px solid rgba(var(--primary-rgb),0.3)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textAlign: 'right',
                    }}
                  />
                )}
              </div>

              {/* Amounts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
                <span>
                  Gastado: <b style={{ color: rawPct >= 100 ? '#ef4444' : 'var(--text-primary)' }}>
                    ${spent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </b>
                </span>
                <span>
                  {budget > 0 ? `Límite: $${budget.toLocaleString()}` : <span style={{ opacity: 0.5 }}>Sin límite</span>}
                </span>
              </div>

              {/* Progress Bar */}
              {budget > 0 ? (
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: '999px',
                      background: rawPct >= 100
                        ? '#ef4444'
                        : rawPct >= 80
                        ? 'linear-gradient(90deg, #eab308, #f97316)'
                        : 'linear-gradient(90deg, var(--primary), #10b981)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              ) : (
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px' }}>
                  {spent > 0 && (
                    <div style={{ height: '100%', width: '100%', borderRadius: '999px', background: 'rgba(var(--primary-rgb),0.25)' }} />
                  )}
                </div>
              )}

              {/* Remaining */}
              {budget > 0 && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {rawPct < 100
                    ? <span style={{ color: '#10b981' }}>Disponible: ${(budget - spent).toFixed(2)}</span>
                    : <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ Excedido en ${(spent - budget).toFixed(2)}</span>
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {totalBudget === 0 && (
        <div
          className="glass-panel"
          style={{ textAlign: 'center', padding: '3rem 2rem', opacity: 0.7 }}
        >
          <TrendingUp size={40} style={{ marginBottom: '1rem', color: 'var(--primary)', opacity: 0.5 }} />
          <h3 style={{ margin: 0 }}>Sin presupuestos configurados</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Haz clic en &quot;Editar Límites&quot; para definir cuánto quieres gastar por categoría.
          </p>
        </div>
      )}
    </div>
  );
}

FinanceBudgets.propTypes = {
  budgets: PropTypes.object.isRequired,
  categorySpending: PropTypes.object.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onSaveBudgets: PropTypes.func.isRequired,
  categories: PropTypes.array
};
