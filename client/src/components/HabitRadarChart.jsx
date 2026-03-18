import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const HabitRadarChart = ({ habits }) => {
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const metricDetails = {
    'Dedicación': 'Porcentaje de hábitos completados hoy.',
    'Disciplina': 'Promedio de tus rachas actuales comparado con una meta de 30 días.',
    'Enfoque': 'Porcentaje de hábitos cuantificables completados hoy.',
    'Resiliencia': 'Porcentaje de hábitos con rachas mayores a 3 días.',
    'Ambición': 'Porcentaje de tareas de una sola vez (one-time) completadas.',
    'Vigor': 'Ratio de esfuerzo total: progreso real acumulado vs metas del día.'
  };

  const data = useMemo(() => {
    if (!habits || habits.length === 0) return [];

    const habitItems = habits.filter(h => !h.is_one_time);
    const taskItems = habits.filter(h => h.is_one_time);

    // 1. Dedicación
    const dedication = habitItems.length > 0 
      ? (habitItems.filter(h => h.isCompletedToday).length / habitItems.length) * 100 
      : 0;

    // 2. Disciplina
    const avgStreak = habitItems.length > 0 
      ? habitItems.reduce((acc, h) => acc + (h.currentStreak || 0), 0) / habitItems.length 
      : 0;
    const discipline = Math.min((avgStreak / 30) * 100, 100);

    // 3. Enfoque
    const quantifiable = habitItems.filter(h => h.type === 'quantifiable');
    const focus = quantifiable.length > 0 
      ? (quantifiable.filter(h => h.isCompletedToday).length / quantifiable.length) * 100 
      : 0;

    // 4. Resiliencia
    const resilient = habitItems.filter(h => (h.currentStreak || 0) >= 3);
    const resilience = habitItems.length > 0 ? (resilient.length / habitItems.length) * 100 : 0;

    // 5. Ambición
    const ambition = taskItems.length > 0 
      ? (taskItems.filter(h => h.isCompletedToday).length / taskItems.length) * 100 
      : 0;

    // 6. Vigor
    let totalTargets = 0;
    let totalProgress = 0;
    habitItems.forEach(h => {
      const target = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
      totalTargets += target || 1;
      totalProgress += Math.min(h.completedCountToday || 0, target || 1);
    });
    const vigor = totalTargets > 0 ? (totalProgress / totalTargets) * 100 : 0;

    return [
      { subject: 'Dedicación', value: Math.round(dedication), fullMark: 100 },
      { subject: 'Disciplina', value: Math.round(discipline), fullMark: 100 },
      { subject: 'Enfoque', value: Math.round(focus), fullMark: 100 },
      { subject: 'Resiliencia', value: Math.round(resilience), fullMark: 100 },
      { subject: 'Ambición', value: Math.round(ambition), fullMark: 100 },
      { subject: 'Vigor', value: Math.round(vigor), fullMark: 100 },
    ].map(item => ({
      ...item,
      axisLabel: `${item.subject} ${item.value}%`
    }));
  }, [habits]);

  if (!habits || habits.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Aún no hay datos para mostrar
      </div>
    );
  }

  return (
    <div className="stats-visualization-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div style={{ width: '100%', height: 350, minHeight: 300 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="var(--border-light)" />
            <PolarAngleAxis 
              dataKey="axisLabel" 
              tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--primary)' }}
            />
            <Radar
              name="Nivel"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="var(--primary)"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="metrics-description-box" style={{ 
        minHeight: '60px', 
        width: '100%', 
        padding: '1rem', 
        background: 'rgba(var(--primary-rgb), 0.03)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        {hoveredMetric ? (
          <div className="animate-fade-in">
            <span style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginRight: '0.5rem' }}>
              {hoveredMetric}:
            </span>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {metricDetails[hoveredMetric]}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Pasa el mouse sobre una cualidad para ver su descripción
          </span>
        )}
      </div>

      <div className="radar-legend-wrapper" style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div className="radar-legend" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '0.75rem', 
          minWidth: '600px',
          width: '100%'
        }}>
          {data.map(item => (
            <div 
              key={item.subject} 
              onMouseEnter={() => setHoveredMetric(item.subject)}
              onMouseLeave={() => setHoveredMetric(null)}
              style={{ 
                textAlign: 'center',
                padding: '0.75rem 0.5rem',
                background: hoveredMetric === item.subject ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--primary-rgb), 0.05)',
                borderRadius: '16px',
                border: hoveredMetric === item.subject ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                justifyContent: 'center',
                cursor: 'help'
              }} 
              className="hover-scale"
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.subject}
              </div>
              <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                {item.value}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

HabitRadarChart.propTypes = {
  habits: PropTypes.array.isRequired
};

export default HabitRadarChart;
