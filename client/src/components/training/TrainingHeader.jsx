import PropTypes from 'prop-types';
import { Plus, Dumbbell, List } from 'lucide-react';

export default function TrainingHeader({ onNewRoutine, onManageLibrary }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          Training <span style={{ color: 'var(--primary)' }}>Routines</span>
        </h1>
        <div style={{ height: '3px', width: '40px', background: 'var(--primary)', borderRadius: '10px', marginTop: '2px' }}></div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-secondary" onClick={onManageLibrary} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', height: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <List size={18} /> Ejercicios
        </button>
        <button className="btn-primary" onClick={onNewRoutine} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', height: 'auto' }}>
            <Plus size={18} /> <Dumbbell size={18} /> Crear Rutina
        </button>
      </div>
    </div>
  );
}

TrainingHeader.propTypes = {
  onNewRoutine: PropTypes.func.isRequired,
  onManageLibrary: PropTypes.func.isRequired,
};
