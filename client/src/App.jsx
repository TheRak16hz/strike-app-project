import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Plus, Activity } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { habitService } from './services/habitService';
import HabitItem from './components/HabitItem';
import HabitForm from './components/HabitForm';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { useTheme } from './hooks/useTheme';
import './App.css';

function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [loading, setLoading] = useState(true);

  const habitsRef = useRef(habits);
  const lastTriggeredTimeRef = useRef(null);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // Envolvemos las funciones que no dependen de estado en useCallback o las sacamos de las dependencias problemáticas
  const checkNotificationStatus = useCallback(() => {
    // Only kept for tracking notification permission if needed elsewhere
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (err) {
        console.error('SW registration failed:', err);
      }
    }
  }, []);


  const checkReminders = useCallback(() => {
    if (Notification.permission !== 'granted' || habitsRef.current.length === 0) return;
    
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    // Evitar que se dispare varias veces en el mismo minuto
    if (lastTriggeredTimeRef.current === currentTimeStr) return;

    let hasTriggeredSomething = false;

    // 1. Revisar Hábitos con hora específica (Reminder_time)
    habitsRef.current.forEach(h => {
      const target = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
      const isPending = h.completedCountToday < target;
      
      // Chequear si es la hora y asegurarnos de truncar los segundos (HH:MM:SS de Postgres a HH:MM)
      const hReminder = h.reminder_time ? h.reminder_time.substring(0, 5) : null;
      
      if (isPending && hReminder === currentTimeStr) {
        hasTriggeredSomething = true;
        // Enviar in-app toast notification
        toast(
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span><b>¡Es hora de {h.title}!</b></span>
            <span style={{ fontSize: '0.85rem' }}>Programado para las {hReminder}</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => { 
                  toast.dismiss();
                  handleToggle(h.id); 
                }}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >Completar ✅</button>
              <button
                onClick={() => toast.dismiss()}
                style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >Cerrar</button>
            </div>
          </div>
        , { duration: 20000, icon: h.icon || '⏰' });

        if (navigator.serviceWorker && navigator.serviceWorker.ready && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(`¡Es hora de ${h.title}!`, {
              body: `Tienes programado este hábito para las ${hReminder}.`,
              icon: '/vite.svg',
              tag: `reminder-${h.id}`,
              vibrate: [200, 100, 200],
              data: { habitId: h.id, url: window.location.origin },
              actions: [
                { action: 'complete', title: 'Completar Hábito ✅' },
                { action: 'snooze', title: 'Posponer 15m 💤' }
              ]
            });
          });
        }
      }
    });

    // 2. Revisar Hábitos de fin de día (a las 20:00 exactas)
    if (currentTimeStr === '20:00') {
      const pendingHabits = habitsRef.current.filter(h => {
        const target = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
        return h.completedCountToday < target;
      });

      if (pendingHabits.length > 0) {
        hasTriggeredSomething = true;
        toast(
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span><b>¡El día está por acabar! 🌙</b></span>
            <span style={{ fontSize: '0.85rem' }}>Aún tienes {pendingHabits.length} hábitos pendientes por completar hoy.</span>
          </div>
        , { duration: 10000, icon: '⚠️' });

        if (navigator.serviceWorker && navigator.serviceWorker.ready && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('¡El día está por acabar! 🌙', {
              body: `Aún tienes ${pendingHabits.length} hábitos pendientes por completar hoy. ¡No rompas tu racha!`,
              icon: '/vite.svg',
              tag: 'end-of-day',
              vibrate: [200, 100, 200]
            });
          });
        }
      }
    }

    if (hasTriggeredSomething) {
      lastTriggeredTimeRef.current = currentTimeStr;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadHabits();
    checkNotificationStatus();
    registerServiceWorker();

    // Setup de communication con Service Worker para botones de acción (Completar / Posponer)
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'ACTION_COMPLETE') {
        const hId = event.data.habitId;
        // Utilizamos referer directo de la función para el optimimistic rendering o recarga
        // Lo pondré asumiendo scope para dispatch.
        habitService.toggle(hId).then(() => loadHabits());
      }
      if (event.data && event.data.type === 'ACTION_SNOOZE') {
        console.log('Hábito pospuesto 15 minutos.');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Revisión por minuto para alarmas (Midiendo cada 10 segundos)
    const interval = setInterval(() => {
      checkReminders();
    }, 1000 * 10);

    // Initial check (para ver si pasamos recién)
    setTimeout(() => checkReminders(), 3000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [checkNotificationStatus, registerServiceWorker, checkReminders]);

  // (Estas funciones ya fueron subidas y envueltas más arriba en el componente)

  const loadHabits = async () => {
    try {
      const data = await habitService.getAll();
      setHabits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (habitData) => {
    try {
      if (editingHabit) {
        await habitService.update(editingHabit.id, habitData);
      } else {
        await habitService.create(habitData);
      }
      setIsFormOpen(false);
      setEditingHabit(null);
      loadHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este hábito y todo su historial?')) {
      try {
        await habitService.delete(id);
        loadHabits();
      } catch (err) {
        console.error(err);
      }
    }
  };
  
  const handleReset = async (id) => {
    if (window.confirm('¿Quieres reiniciar el progreso de hoy para este hábito?')) {
      try {
        await habitService.reset(id);
        loadHabits();
        toast.success('Hábito reiniciado');
      } catch (err) {
        console.error(err);
        toast.error('Error al reiniciar hábito');
      }
    }
  };

  const handleToggle = async (id, amount = undefined) => {
    try {
      // Optimistic Update
      const updatedHabits = habits.map(h => {
        if (h.id === id) {
          const target = h.is_quantifiable ? h.target_value : h.frequency_count;
          let newCount = h.completedCountToday;
          
          if (amount !== undefined) {
             newCount += amount;
          } else {
             const isFullyCompleted = h.completedCountToday >= target;
             newCount = isFullyCompleted ? 0 : h.completedCountToday + 1;
          }
          
          if (newCount < 0) newCount = 0;
          const completedToday = newCount >= target;
          
          return {
            ...h,
            completedCountToday: newCount,
            isCompletedToday: completedToday
          };
        }
        return h;
      });
      setHabits(updatedHabits);

      // Actual API call
      await habitService.toggle(id, amount);
      loadHabits(); // sync with server to ensure streaks are accurate
    } catch (err) {
      console.error(err);
      loadHabits(); // revert on error
    }
  };

  const handleMove = async (id, direction) => {
    if (filterType !== 'all') {
      toast.error("Para reordenar, cambia el filtro a 'Todos'");
      return;
    }
    const idx = habits.findIndex(h => h.id === id);
    if (idx < 0) return;
    
    const newHabits = [...habits];
    if (direction === 'up' && idx > 0) {
      [newHabits[idx - 1], newHabits[idx]] = [newHabits[idx], newHabits[idx - 1]];
    } else if (direction === 'down' && idx < habits.length - 1) {
      [newHabits[idx + 1], newHabits[idx]] = [newHabits[idx], newHabits[idx + 1]];
    } else {
      return;
    }
    
    setHabits(newHabits);
    const orderPayload = newHabits.map((h, i) => ({ id: h.id, position: i }));
    try {
      await habitService.reorder(orderPayload);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar orden");
      loadHabits();
    }
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const calculateTotalProgress = () => {
    if (habits.length === 0) return 0;
    
    let totalExpected = 0;
    let totalCompleted = 0;

    habits.forEach(h => {
      const target = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
      totalExpected += target;
      totalCompleted += Math.min(h.completedCountToday, target);
    });

    return Math.round((totalCompleted / totalExpected) * 100) || 0;
  };

  const progressPercentage = calculateTotalProgress();
  const filteredHabits = habits.filter(h => filterType === 'all' || h.type === filterType);

  return (
    <div className="app-container">
      <Header />
        
      <div className="dashboard-card glass-panel">
        <div className="stats-header">
          <h2>Progreso Diario</h2>
          <span className="stats-text">{progressPercentage}% del día completado</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <main className="app-main">
        <div className="list-header animate-slide" style={{ animationDelay: '0.1s' }}>
          <h2>Mis Hábitos</h2>
          <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos</option>
              <option value="regular">✅ Regulares</option>
              <option value="quantifiable">⚙️ Cuantificables</option>
              <option value="inverse">🔄 Inversos</option>
            </select>
            <button 
              className="btn-primary" 
              onClick={() => { setEditingHabit(null); setIsFormOpen(true); }}
            >
              <Plus size={20} /> Nuevo
            </button>
          </div>
        </div>

        <div className="habits-list">
          {loading ? (
            <div className="loading-state">Cargando hábitos...</div>
          ) : filteredHabits.length === 0 ? (
            <div className="empty-state animate-scale glass-panel">
              <Activity size={48} color="var(--border-light)" />
              <h3>Aún no tienes hábitos</h3>
              <p>Comienza creando un hábito y no rompas tu racha.</p>
              <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                Crear el primer hábito
              </button>
            </div>
          ) : (
            filteredHabits.map((habit, index) => (
              <div key={habit.id} style={{ animationDelay: `${0.1 + (index * 0.05)}s` }} className="animate-slide">
                <HabitItem 
                  habit={habit}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onReset={handleReset}
                  onMove={(direction) => handleMove(habit.id, direction)}
                  canMove={filterType === 'all'}
                />
              </div>
            ))
          )}
        </div>
      </main>

      {isFormOpen && (
        <HabitForm 
          onSubmit={handleCreateOrUpdate}
          initialData={editingHabit}
          onClose={() => { setIsFormOpen(false); setEditingHabit(null); }}
        />
      )}
    </div>
  );
}

// Private Route Wrapper
// eslint-disable-next-line react/prop-types
const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) return <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}><h2>Cargando...</h2></div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return children;
};

export default function App() {
  useTheme(); // Inicializar tema desde el componente raíz
  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-light)'
        }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
