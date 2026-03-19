import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { AuthContext } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { toast } from 'react-hot-toast';
import { Bell, BellOff } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleHardReset = async () => {
    if (window.confirm('¿ESTÁS SEGURO? Esta acción eliminará TODO el historial de todos tus hábitos permanentemente. No se puede deshacer.')) {
      try {
        await habitService.hardReset();
        toast.success('Todos los hábitos han sido reiniciados');
      } catch (err) {
        console.error(err);
        toast.error('Error al realizar el reinicio total');
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header animate-slide" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/')} 
          className="theme-toggle" 
          aria-label="Volver"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Ajustes</h1>
      </header>

      <main className="animate-slide" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section className="settings-section">
            <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Personalización</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Tema Visual</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cambia entre modo claro y oscuro</p>
              </div>
              <button 
                onClick={toggleTheme} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Notificaciones</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recordatorios de tus hábitos en el navegador</p>
              </div>
              <button 
                onClick={toggleNotifications} 
                className={`btn-primary ${!notificationsEnabled ? 'btn-secondary' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.6rem 1.2rem',
                  background: notificationsEnabled ? 'var(--primary)' : 'rgba(var(--primary-rgb), 0.1)',
                  color: notificationsEnabled ? 'white' : 'var(--primary)',
                  border: notificationsEnabled ? 'none' : '1px solid var(--primary)'
                }}
              >
                {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                {notificationsEnabled ? 'Activadas' : 'Desactivadas'}
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--danger)' }}>Zona de Peligro</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Hard Reset</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reinicia todos tus hábitos a cero (borra historial)</p>
              </div>
              <button 
                onClick={handleHardReset} 
                className="btn-primary" 
                style={{ background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
              >
                <RefreshCw size={18} />
                Reiniciar Todo
              </button>
            </div>
          </section>

          <section className="settings-section" style={{ marginTop: '1rem' }}>
             <button 
                onClick={logout} 
                className="btn-primary" 
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.8rem' }}
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
          </section>
        </div>
      </main>
    </div>
  );
}
