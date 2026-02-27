import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, Clock } from 'lucide-react';
import './HabitForm.css';

const EMOJI_LIST = ['🎯', '💧', '🏃', '📚', '🧘', '🚭', '🥦', '💤', '💻', '💡', '💰', '💊'];

export default function HabitForm({ onSubmit, initialData = null, onClose }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'regular',
    frequency_type: initialData?.frequency_type || 'daily',
    frequency_count: initialData?.frequency_count || 1,
    color: initialData?.color || 'var(--primary)',
    target_days: initialData?.target_days || [],
    target_value: initialData?.target_value || 1,
    unit: initialData?.unit || '',
    icon: initialData?.icon || '🎯',
    reminder_time: initialData?.reminder_time || ''
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);

  // Parse legacy is_quantifiable prop if editing an old habit
  useEffect(() => {
    if (initialData && initialData.is_quantifiable && !initialData.type) {
      setFormData(prev => ({ ...prev, type: 'quantifiable' }));
    }
  }, [initialData]);

  // Click outside listener for emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
      if (!initialData) {
        setFormData({
          title: '', description: '', type: 'regular', frequency_type: 'daily', frequency_count: 1, 
          color: 'var(--primary)', target_days: [], target_value: 1, unit: '', icon: '🎯', reminder_time: ''
        });
      }
    }
  };

  const toggleDay = (dayIndex) => {
    setFormData(prev => {
      const days = [...prev.target_days];
      if (days.includes(dayIndex)) {
        return { ...prev, target_days: days.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, target_days: [...days, dayIndex] };
      }
    });
  };

  const colors = [
    { value: 'var(--primary)', label: 'Azul Strike' },
    { value: 'var(--brand-green)', label: 'Verde Éxito' },
    { value: 'hsl(280, 80%, 60%)', label: 'Púrpura' },
    { value: 'hsl(348, 83%, 55%)', label: 'Rosa' },
    { value: 'hsl(40, 90%, 55%)', label: 'Naranja' }
  ];

  const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <div className="habit-modal-overlay">
      <div className="habit-modal animate-scale glass-panel">
        <div className="modal-header">
          <h2>{initialData ? 'Editar Hábito' : 'Nuevo Hábito'}</h2>
          {onClose && (
            <button onClick={onClose} className="btn-icon">
              <X size={24} />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="habit-form">
          <div className="form-group type-selector-group">
            <label>Tipo de Hábito</label>
            <div className="type-cards">
              <div 
                className={`type-card ${formData.type === 'regular' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, type: 'regular'})}
              >
                <h4>✅ Regular</h4>
                <p>Marcar manualmente cada vez</p>
              </div>
              <div 
                 className={`type-card ${formData.type === 'quantifiable' ? 'active' : ''}`}
                 onClick={() => setFormData({...formData, type: 'quantifiable'})}
              >
                <h4>⚙️ Cuantificable</h4>
                <p>Medir con un objetivo numérico (+/-)</p>
              </div>
              <div 
                 className={`type-card ${formData.type === 'inverse' ? 'active' : ''}`}
                 onClick={() => setFormData({...formData, type: 'inverse'})}
              >
                <h4>🔄 Inverso</h4>
                <p>Se marca solo, deshabilita si fallas</p>
              </div>
            </div>
          </div>

          <div className="form-row align-bottom">
            <div className="form-group flex-1">
              <label>Título del hábito</label>
              <div className="input-with-icon">
                <div className="emoji-picker-container" ref={emojiRef}>
                  <button 
                    type="button" 
                    className="emoji-trigger"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {formData.icon}
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-popup animate-scale">
                      {EMOJI_LIST.map(emoji => (
                        <button 
                          key={emoji} 
                          type="button" 
                          onClick={() => { setFormData({...formData, icon: emoji}); setShowEmojiPicker(false); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej. Leer, Correr, Ahorrar"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group flex-1">
              <label>Recordatorio (Opcional)</label>
              <div className="input-with-icon">
                <Clock size={16} className="icon-muted" />
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({...formData, reminder_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Frecuencia de Repetición</label>
            <select 
              value={formData.frequency_type}
              onChange={(e) => setFormData({...formData, frequency_type: e.target.value})}
            >
              <option value="daily">Todos los días</option>
              <option value="specific_days">Días Específicos</option>
            </select>
          </div>

          {formData.frequency_type === 'specific_days' && (
            <div className="form-group">
              <label>Selecciona los días</label>
              <div className="days-selector">
                {DAYS.map((d, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`day-btn ${formData.target_days.includes(index) ? 'active' : ''}`}
                    onClick={() => toggleDay(index)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.type === 'quantifiable' && (
            <div className="form-row animate-slide">
              <div className="form-group">
                <label>Objetivo Numérico</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.target_value}
                  onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Unidad (Ej. $, ml, pág)</label>
                <input
                  type="text"
                  placeholder="Ej. $, páginas"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
          )}
          
          {formData.type === 'regular' && (
            <div className="form-group animate-slide">
              <label>Veces por día que debes completarlo</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.frequency_count}
                onChange={(e) => setFormData({...formData, frequency_count: parseInt(e.target.value)})}
              />
            </div>
          )}

          <div className="form-group">
            <label>Color representativo</label>
            <div className="color-picker">
              {colors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({...formData, color: color.value})}
                  aria-label={color.label}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            {onClose && (
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancelar
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={formData.frequency_type === 'specific_days' && formData.target_days.length === 0}>
              <Plus size={20} />
              {initialData ? 'Guardar Cambios' : 'Crear Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

HabitForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    frequency_type: PropTypes.string,
    frequency_count: PropTypes.number,
    color: PropTypes.string,
    target_days: PropTypes.array,
    is_quantifiable: PropTypes.bool,
    target_value: PropTypes.number,
    unit: PropTypes.string
  }),
  onClose: PropTypes.func
};
