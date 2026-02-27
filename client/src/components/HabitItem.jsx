import { useState } from 'react';
import { Check, Edit2, Trash2, Flame, Minus, Plus, ChevronDown, ChevronUp, Clock, XSquare } from 'lucide-react';
import PropTypes from 'prop-types';
import './HabitItem.css';

export default function HabitItem({ habit, onToggle, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    id, title, description, color, type,
    target_value, unit, icon, reminder_time,
    completedCountToday, currentStreak, historyDates 
  } = habit;
  
  const is_quantifiable = type === 'quantifiable';
  const is_inverse = type === 'inverse';
  
  // Calcular meta diaria
  const target = is_quantifiable ? target_value : habit.frequency_count;
  const isFullyCompleted = completedCountToday >= target;

  // Textos
  const progressText = is_quantifiable 
    ? `${completedCountToday} / ${target} ${unit || ''}`
    : is_inverse ? 'Automático' : `${completedCountToday} / ${target} HOY`;

  const progressPercentage = Math.min((completedCountToday / target) * 100, 100);

  // Generar últimos 7 días para el mini-calendario
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const isToday = i === 6;
    const dateStr = d.toISOString().split('T')[0];
    const isCompleted = historyDates && historyDates.includes(dateStr);
    const dayLabel = ['D','L','M','X','J','V','S'][d.getDay()];
    return { dayLabel, isCompleted, isToday };
  });
  // Generar próximos 90 días para el mapa de calor
  const heatMapDays = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isCompleted = historyDates && historyDates.includes(dateStr);
    return { dateStr, isCompleted };
  });

  return (
    <div className={`habit-item animate-slide ${isFullyCompleted ? 'completed' : ''}`} style={{ '--habit-color': color }}>
      <div className="habit-content">
        <div className="habit-header">
          <div className="habit-title-group">
            <span className="habit-icon">{icon || '🎯'}</span>
            <h3>{title}</h3>
          </div>
          
          {is_quantifiable && (
            <div className="quant-controls">
              <button 
                className="quant-btn" 
                onClick={() => onToggle(id, -1)}
                disabled={completedCountToday <= 0}
                aria-label="Restar progreso"
              >
                <Minus size={16} />
              </button>
              <span className="quant-value">{completedCountToday} {unit}</span>
              <button 
                className={`quant-btn ${isFullyCompleted ? 'active' : ''}`}
                onClick={() => onToggle(id, 1)}
                aria-label="Sumar progreso"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
        
        {description && <p className="habit-description">{description}</p>}
        {reminder_time && (
          <div className="habit-reminder-badge">
            <Clock size={12} />
            <span>{reminder_time}</span>
          </div>
        )}
        
        <div className="habit-progress-bar-container">
          <div className="habit-progress-bar-fill" style={{ width: `${progressPercentage}%`, backgroundColor: color }}></div>
          <span className="habit-progress-text">{progressText}</span>
        </div>
        
        <div className="habit-bottom-row">
          <div className="stat-badge">
            <Flame size={16} className={currentStreak > 0 ? 'streak-active' : ''} />
            <span>{currentStreak} {currentStreak === 1 ? 'día' : 'días'} racha</span>
          </div>

          <div className="mini-calendar">
            {last7Days.map((day, idx) => (
              <div 
                key={idx} 
                className={`calendar-day ${day.isCompleted ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
                title={day.isToday ? 'Hoy' : ''}
              >
                <span className="day-label">{day.dayLabel}</span>
                <div className="day-dot" style={{ backgroundColor: day.isCompleted ? color : 'var(--border-light)' }}></div>
              </div>
            ))}
          </div>
          
          <button 
            className="expand-btn stat-badge" 
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Ocultar historial' : 'Ver historial'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{isExpanded ? 'Ocultar' : 'Ver más'}</span>
          </button>
        </div>

        {isExpanded && (
          <div className="habit-calendar-extended animate-slide">
            <h4>Actividad (Próximos 90 días)</h4>
            <div className="heatmap-grid">
              {heatMapDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`heatmap-cell ${day.isCompleted ? 'active' : ''}`}
                  title={`${day.dateStr}${day.isCompleted ? ' (Completado)' : ''}`}
                  style={{ backgroundColor: day.isCompleted ? color : 'var(--border-light)' }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="habit-actions">
        {!is_quantifiable && (
          <button 
            className={`action-btn toggle-btn ${is_inverse ? 'inverse-btn' : ''} ${isFullyCompleted ? 'active' : ''}`}
            onClick={() => onToggle(id)}
            aria-label={isFullyCompleted ? 'Desmarcar hábito' : 'Marcar hábito'}
          >
            {is_inverse && !isFullyCompleted ? <XSquare size={24} /> : <Check size={24} />}
          </button>
        )}
        
        <div className="secondary-actions">
          <button className="action-btn edit-btn" onClick={() => onEdit(habit)} aria-label="Editar">
            <Edit2 size={16} />
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(id)} aria-label="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

HabitItem.propTypes = {
  habit: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
