import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, Dumbbell, Settings, Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import './BottomNav.css';

export default function BottomNav({ onNewHabitClick, onFinanceAction }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isHabits = location.pathname === '/';
  const isFinance = location.pathname === '/finance';
  const isTraining = location.pathname === '/training';
  const isSettings = location.pathname === '/settings';

  const handleFloatingAction = () => {
    if (isHabits && onNewHabitClick) onNewHabitClick();
    if (isFinance && onFinanceAction) onFinanceAction();
  };

  const showFloatingAction = (isHabits && onNewHabitClick) || (isFinance && onFinanceAction);

  return (
    <>
      {showFloatingAction && (
        <button 
          className="bottom-nav-fab animate-scale"
          onClick={handleFloatingAction}
          style={{ background: isFinance ? 'var(--brand-green)' : 'var(--primary)' }}
        >
          <Plus size={24} />
        </button>
      )}
      
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-item ${isHabits ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Home size={20} />
          <span>Hábitos</span>
        </button>
        <button 
          className={`bottom-nav-item ${isFinance ? 'active' : ''}`}
          onClick={() => navigate('/finance')}
        >
          <Wallet size={20} />
          <span>Finanzas</span>
        </button>
        <button 
          className={`bottom-nav-item ${isTraining ? 'active' : ''}`}
          onClick={() => navigate('/training')}
        >
          <Dumbbell size={20} />
          <span>Gym</span>
        </button>
        <button 
          className={`bottom-nav-item ${isSettings ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </nav>
    </>
  );
}

BottomNav.propTypes = {
  onNewHabitClick: PropTypes.func,
  onFinanceAction: PropTypes.func
};
