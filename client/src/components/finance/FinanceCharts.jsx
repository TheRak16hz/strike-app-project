import PropTypes from 'prop-types';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function FinanceCharts({ totals }) {
  return (
    <>
      {/* Gráfica 1: Flujo de Caja — ocupa 2 columnas */}
      <section className="glass-panel area-flow" style={{ padding: '1.4rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Flujo de Caja (7D)
        </h3>
        <div style={{ height: '200px', width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={totals.trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                tickFormatter={(v) => v ? v.slice(5) : ''} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#incomeGrad)" strokeWidth={2.5} name="Patrimonio" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Gráfica 2: Distribución (Donut) */}
      <section className="glass-panel area-dist" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100%', textAlign: 'left' }}>
          Distribución
        </h3>
        <div style={{ height: '160px', width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totals.distributionData}
                dataKey="value"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={5}
                strokeWidth={0}
              >
                {totals.distributionData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '0.8rem' }}
                formatter={(value) => [`$${value.toFixed(2)}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}>
          {totals.distributionData.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '0.6rem 0.8rem',
                background: `${d.color}12`,
                borderRadius: '10px',
                border: `1px solid ${d.color}30`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: d.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                {d.name}
              </div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                ${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

FinanceCharts.propTypes = {
  totals: PropTypes.shape({
    trendData: PropTypes.array,
    distributionData: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    })).isRequired,
  }).isRequired,
};
