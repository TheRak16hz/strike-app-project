import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, Clock } from 'lucide-react';
import './HabitForm.css';

const EMOJI_LIST = [
  '🎯', '💧', '🏃', '📚', '🧘', '🚭', '🥦', '💤', '💻', '💡', '💰', '💊',
  '💪', '🎧', '🎸', '🎨', '✈️', '🚗', '🍔', '🍎', '🍵', '☕', '🍷', '🍺',
  '🥤', '🧁', '🍽️', '🛒', '🛒', '🏋️', '🚴', '🏊', '🪥', '🧼', '🇬🇧', '🇫🇷',
  '🇰🇷', '🇯🇵', '🇪🇸', '🇺🇸', '🐶', '🐱', '🪴', '🌻', '🌞', '🌙', '⭐', '🔥',
  '⚡', '✨', '🧠', '❤️', '⏱️', '📅', '📝', '🧹', '🧺', '🚿', '🛁', '🛌',
  '🎮', '🧩', '🎲'
];

const TAG_OPTIONS = [
  'Higiene', 'Comida', 'Salud', 'Descanso', 'Vicio', 'Aprendizaje', 'Productividad', 'Social', 'Deporte'
];

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
    reminder_time: initialData?.reminder_time || '',
    reminder_date: initialData?.reminder_date || '',
    tags: initialData?.tags || '',
    is_one_time: initialData?.is_one_time || false
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);

  // Parse legacy is_quantifiable prop if editing an old habit
  useEffect(() => {
    if (initialData && initialData.is_quantifiable && !initialData.type) {
      setFormData(prev => ({ ...prev, type: 'quantifiable' }));
    }
    // Update reminder_date if initialData changes and it's present
    if (initialData && initialData.reminder_date !== undefined) {
      setFormData(prev => ({ ...prev, reminder_date: initialData.reminder_date }));
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
          color: 'var(--primary)', target_days: [], target_value: 1, unit: '', icon: '🎯', reminder_time: '', reminder_date: '',
          tags: '', is_one_time: false
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
          <div>
            <h2 className="modal-title">{initialData ? 'Editar' : 'Crear Nueva'}</h2>
            <p className="modal-subtitle">{formData.is_one_time ? 'Tarea puntual para tu lista' : 'Hábito recurrente para tu racha'}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="close-modal-btn">
              <X size={20} />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="habit-form">
          {/* Main Type Toggle */}
          <div className="main-toggle-wrapper">
            <button
              type="button"
              className={`main-toggle-btn ${!formData.is_one_time ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, is_one_time: false })}
            >
              🔄 Hábito Diario
            </button>
            <button
              type="button"
              className={`main-toggle-btn ${formData.is_one_time ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, is_one_time: true, type: 'regular' })}
            >
              ✅ Tarea Única
            </button>
          </div>

          <div className="form-section">
            <div className="form-group title-input-group">
              <label>¿Qué vas a lograr?</label>
              <div className="premium-input-wrapper">
                <div className="emoji-selector-wrapper" ref={emojiRef}>
                  <button
                    type="button"
                    className="emoji-picker-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {formData.icon}
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-grid-popup animate-pop">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="emoji-item"
                          onClick={() => {
                            setFormData({ ...formData, icon: emoji });
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  className="premium-input"
                  placeholder={formData.is_one_time ? "Ej: Comprar el regalo de Ana" : "Ej: Meditación matutina"}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Descripción (Opcional)</label>
              <textarea
                className="premium-textarea"
                placeholder="Escribe algunos detalles aquí..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
              />
            </div>
          </div>

          {!formData.is_one_time && (
            <div className="form-section animate-fade-in">
              <label className="section-label">Configuración del Hábito</label>
              <div className="habit-types-grid">
                {[
                  { id: 'regular', icon: '✅', title: 'Regular', desc: 'Sí/No' },
                  { id: 'quantifiable', icon: '⚙️', title: 'Meta', desc: 'Cantidad' },
                  { id: 'inverse', icon: '🔄', title: 'Inverso', desc: 'Evitar' }
                ].map(t => (
                  <div 
                    key={t.id}
                    className={`habit-type-option ${formData.type === t.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: t.id })}
                  >
                    <span className="type-icon">{t.icon}</span>
                    <div className="type-info">
                      <span className="type-title">{t.title}</span>
                      <span className="type-desc">{t.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="config-grid">
                <div className="form-group">
                  <label>Frecuencia</label>
                  <select
                    className="premium-select"
                    value={formData.frequency_type}
                    onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value })}
                  >
                    <option value="daily">Todos los días</option>
                    <option value="specific_days">Días específicos</option>
                  </select>
                </div>

                {formData.type === 'quantifiable' ? (
                  <div className="form-group">
                    <label>Objetivo</label>
                    <div className="goal-input-row">
                      <input
                        type="number"
                        className="premium-input small-input"
                        min="1"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })}
                      />
                      <input
                        type="text"
                        className="premium-input"
                        placeholder="km, l, etc"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Veces por día</label>
                    <input
                      type="number"
                      className="premium-input"
                      min="1"
                      value={formData.frequency_count}
                      onChange={(e) => setFormData({ ...formData, frequency_count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>

              {formData.frequency_type === 'specific_days' && (
                <div className="form-group animate-slide-down">
                  <label>Selecciona los días</label>
                  <div className="modern-days-selector">
                    {DAYS.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`modern-day-btn ${formData.target_days.includes(index) ? 'active' : ''}`}
                        onClick={() => toggleDay(index)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-section">
            <label className="section-label">Preferencias y Alertas</label>
            <div className="config-grid">
              {formData.is_one_time && (
                <div className="form-group">
                  <label>Fecha de alerta</label>
                  <input
                    type="date"
                    className="premium-input"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Hora de alerta</label>
                <div className="premium-input-wrapper">
                  <Clock size={16} className="input-icon-left" />
                  <input
                    type="time"
                    className="premium-input with-left-icon"
                    value={formData.reminder_time}
                    onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Etiquetas</label>
              <div className="modern-tags-cloud">
                {TAG_OPTIONS.map(tag => {
                  const isSelected = (formData.tags || '').split(',').filter(Boolean).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`modern-tag-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        const currentTags = (formData.tags || '').split(',').filter(Boolean);
                        let newTags = isSelected ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
                        setFormData({ ...formData, tags: newTags.join(',') });
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Color visual</label>
              <div className="modern-color-grid">
                {colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`modern-color-circle ${formData.color === color.value ? 'active' : ''}`}
                    style={{ '--option-color': color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="premium-btn-secondary">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="premium-btn-primary" 
              disabled={!formData.is_one_time && formData.frequency_type === 'specific_days' && formData.target_days.length === 0}
            >
              <Plus size={18} />
              {initialData ? 'Guardar cambios' : `Crear ${formData.is_one_time ? 'Tarea' : 'Hábito'}`}
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
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    frequency_type: PropTypes.string,
    frequency_count: PropTypes.number,
    color: PropTypes.string,
    target_days: PropTypes.array,
    type: PropTypes.string,
    target_value: PropTypes.number,
    unit: PropTypes.string,
    icon: PropTypes.string,
    reminder_time: PropTypes.string,
    reminder_date: PropTypes.string,
    tags: PropTypes.string,
    is_one_time: PropTypes.bool
  }),
  onClose: PropTypes.func
};
