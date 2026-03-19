import PropTypes from 'prop-types';
import { X, Sparkles, Zap } from 'lucide-react';

const QUOTES = {
  morning: [
    "¡Buen día! Una mañana productiva es el primer paso hacia una racha imparable.",
    "El secreto para avanzar es simplemente comenzar. ¿Qué primer paso darás hoy?",
    "Cada día es una nueva oportunidad para ser un 1% mejor que ayer."
  ],
  evening: [
    "El día aún no termina. Un último esfuerzo puede marcar la diferencia.",
    "No te vayas a dormir con tareas pendientes. Tu yo del futuro te lo agradecerá.",
    "Incluso un pequeño avance es un avance. ¡Tú puedes terminar con éxito!"
  ],
  low_progress: [
    "No te abrumes por la meta, enfócate en la próxima acción pequeña.",
    "La disciplina es hacer lo que debes, incluso cuando no tienes ganas.",
    "Recuerda por qué empezaste. Dale una oportunidad a tu mejor versión hoy."
  ],
  high_progress: [
    "¡Estás en la recta final! Mantén el foco para completar el día.",
    "¡Increíble progreso! Estás demostrando una disciplina de acero.",
    "Casi lo tienes. La sensación de completar todo será tu mejor recompensa."
  ],
  completed: [
    "¡Día perfecto! Has dominado tus metas. Disfruta de tu merecido descanso.",
    "Misión cumplida. Un día más de consistencia que suma a tu éxito.",
    "Eres imparable. Otra victoria para tu colección de rachas."
  ],
  general: [
    "La consistencia es el motor de la transformación. No te detengas.",
    "No busques la perfección, busca el progreso constante.",
    "Tu racha es el reflejo de tu compromiso contigo mismo."
  ]
};

export const getQuote = (progress, hour) => {
  if (progress >= 100) return QUOTES.completed[Math.floor(Math.random() * QUOTES.completed.length)];
  if (progress >= 70) return QUOTES.high_progress[Math.floor(Math.random() * QUOTES.high_progress.length)];
  if (hour >= 18 && progress < 50) return QUOTES.evening[Math.floor(Math.random() * QUOTES.evening.length)];
  if (hour < 11) return QUOTES.morning[Math.floor(Math.random() * QUOTES.morning.length)];
  if (progress < 30) return QUOTES.low_progress[Math.floor(Math.random() * QUOTES.low_progress.length)];
  return QUOTES.general[Math.floor(Math.random() * QUOTES.general.length)];
};

export default function MotivationalQuote({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="motivational-quote animate-slide" style={{
      padding: '1rem 1.5rem',
      margin: '1rem 0',
      background: 'rgba(var(--primary-rgb), 0.08)',
      borderRadius: '16px',
      border: '1px solid rgba(var(--primary-rgb), 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)'
      }}>
        <Sparkles size={16} />
      </div>
      
      <p style={{ 
        margin: 0, 
        fontSize: '0.95rem', 
        fontWeight: 500, 
        lineHeight: 1.4,
        color: 'var(--text-primary)',
        paddingRight: '1.5rem'
      }}>
        {message}
      </p>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'rgba(0,0,0,0.05)',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 5
        }}
        onMouseEnter={(e) => {
          if (e.currentTarget) e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget) e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
        }}
        title="Ocultar mensaje"
      >
        <X size={18} />
      </button>

      <div style={{
        position: 'absolute',
        right: '-10px',
        bottom: '-10px',
        opacity: 0.05,
        transform: 'rotate(-15deg)'
      }}>
        <Zap size={60} color="var(--primary)" />
      </div>
    </div>
  );
}

MotivationalQuote.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired
};
