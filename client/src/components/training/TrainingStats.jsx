import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Flame } from 'lucide-react';

export default function TrainingStats({ logs }) {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // Group logs by date (last 7 days or just all available sorted)
    // For simplicity, we just take the last 14 logs and sort chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
    
    return sortedLogs.map(log => ({
      date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      calories: parseFloat(log.total_calories_burned)
    }));
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="glass-panel animate-scale" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Flame size={20} color="#10b981" />
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Calorías Quemadas (Últimas 14 Sesiones)</h3>
      </div>

      <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{ 
                background: 'rgba(var(--surface-rgb), 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ color: '#10b981', fontWeight: 800 }}
              formatter={(value) => [`${value} kcal`, 'Calorías']}
            />
            <Bar 
              dataKey="calories" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

TrainingStats.propTypes = {
  logs: PropTypes.array.isRequired
};
