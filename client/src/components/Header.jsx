import { useContext } from 'react';
import PropTypes from 'prop-types';
import { 
  Activity, Settings, Bell, BellOff, Wallet, Home, Plus, Dumbbell
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export default function Header({ onNewHabitClick, onFinanceAction }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationsEnabled, toggleNotifications } = useNotifications();

  const isFinance = location.pathname === '/finance';
  const isHabits = location.pathname === '/';

  return (
    <header className="app-header animate-slide" style={{ 
      padding: '0.4rem 1.25rem', 
      marginBottom: '1rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'rgba(var(--surface-rgb), 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="logo-group" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Activity size={24} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Strike</h1>
        </div>

        {user && (
          <nav className="desktop-only" style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem', borderRadius: '10px' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', borderRadius: '8px',
                background: isHabits ? 'var(--primary)' : 'transparent',
                color: isHabits ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              <Home size={16} /> Hábitos
            </button>
            <button 
              onClick={() => navigate('/finance')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', borderRadius: '8px',
                background: isFinance ? 'var(--primary)' : 'transparent',
                color: isFinance ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              <Wallet size={16} /> Finanzas
            </button>
            <button 
              onClick={() => navigate('/training')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', borderRadius: '8px',
                background: location.pathname === '/training' ? 'var(--primary)' : 'transparent',
                color: location.pathname === '/training' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              <Dumbbell size={16} /> Gym
            </button>
          </nav>
        )}
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user && (
          <>
            <div className="desktop-only" style={{ display: 'flex', gap: '0.4rem', marginRight: '0.5rem' }}>
              {isHabits && onNewHabitClick && (
                <button className="btn-primary" onClick={onNewHabitClick} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Nuevo Hábito
                </button>
              )}
              {isFinance && onFinanceAction && (
                <button className="btn-primary" onClick={onFinanceAction} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--brand-green)' }}>
                  <Plus size={14} /> Movimiento
                </button>
              )}
            </div>

            <div style={{ width: '1px', height: '16px', background: 'var(--border-light)' }}></div>

            <button 
              onClick={toggleNotifications} 
              className={`theme-toggle ${notificationsEnabled ? 'active-bell' : ''}`}
              title="Notificaciones"
              style={{ padding: '0.4rem' }}
            >
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            <button 
              onClick={() => navigate('/settings')} 
              className="theme-toggle" 
              title="Ajustes"
              style={{ padding: '0.4rem' }}
            >
              <Settings size={16} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
               <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                 {user.username[0].toUpperCase()}
               </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  onNewHabitClick: PropTypes.func,
  onFinanceAction: PropTypes.func
};
