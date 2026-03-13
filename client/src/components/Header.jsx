import { useState, useEffect, useContext } from 'react';
import { Activity, Settings, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  return (
    <header className="app-header animate-slide" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Activity size={40} color="var(--primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Strike</h1>
      </div>
      
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Hola, <strong>{user.username}</strong>
            </span>
          </div>
        )}
        <button 
          onClick={requestNotificationPermission} 
          className={`theme-toggle ${notificationsEnabled ? 'active-bell' : ''}`}
          title="Recordatorios diarios"
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
        <button 
          onClick={() => navigate('/settings')} 
          className="theme-toggle" 
          title="Ajustes"
          aria-label="Ajustes"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
