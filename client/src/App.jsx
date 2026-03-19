import { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { Plus, Activity, Search, Tag, Filter } from 'lucide-react';
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
import Finance from './pages/Finance';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';
import HabitRadarChart from './components/HabitRadarChart';
import MotivationalQuote, { getQuote } from './components/MotivationalQuote';
import './App.css';

function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('habitos'); // 'habitos' o 'tareas'
  const [selectedTag, setSelectedTag] = useState('all');
  const [showQuote, setShowQuote] = useState(true);
  const { notificationsEnabled } = useNotifications();

  const habitsRef = useRef(habits);
  const lastTriggeredTimeRef = useRef(null);

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    if (!notificationsEnabled || Notification.permission !== 'granted' || habitsRef.current.length === 0) return;
    
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    // Evitar que se dispare varias veces en el mismo minuto
    if (lastTriggeredTimeRef.current === currentTimeStr) return;

    let hasTriggeredSomething = false;

    // 1. Revisar Hábitos/Tareas con hora específica
    habitsRef.current.forEach(h => {
      const target = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
      const isPending = h.completedCountToday < target;
      
      const currentTimeObj = new Date();
      const currentDateStr = getLocalDateString(currentTimeObj);
      
      // Chequear si es la hora
      const hReminder = h.reminder_time ? h.reminder_time.substring(0, 5) : null;
      
      // Si tiene fecha, solo notificar ese día. Si no, notificar diario (hábitos).
      const dateMatches = !h.reminder_date || h.reminder_date === currentDateStr;

      if (isPending && hReminder === currentTimeStr && dateMatches) {
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Revisión por minuto para alarmas (Midiendo cada 10 segundos)
    const interval = setInterval(() => {
      checkReminders();
    }, 1000 * 10);

    // Initial check (para ver si pasamos recién)
    setTimeout(() => checkReminders(), 3000);

    return () => {
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [checkNotificationStatus, registerServiceWorker, checkReminders]);

  useEffect(() => {
    const handleNewHabitEvent = () => {
      setEditingHabit(null);
      setIsFormOpen(true);
    };
    window.addEventListener('nav-action-new-habit', handleNewHabitEvent);
    return () => window.removeEventListener('nav-action-new-habit', handleNewHabitEvent);
  }, []);

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

  const { habitProgress, taskProgress } = useMemo(() => {
    const habitItems = habits.filter(h => !h.is_one_time);
    const taskItems = habits.filter(h => h.is_one_time);

    const calculateProgress = (items) => {
      if (items.length === 0) return 0;
      let totalGoals = 0;
      let totalCompleted = 0;

      items.forEach(h => {
        if (h.type === 'inverse') {
          totalGoals += 1;
          totalCompleted += h.completedCountToday === 0 ? 1 : 0;
        } else {
          const goal = h.type === 'quantifiable' ? h.target_value : h.frequency_count;
          totalGoals += goal;
          totalCompleted += Math.min(h.completedCountToday, goal);
        }
      });
      return Math.round((totalCompleted / totalGoals) * 100);
    };

    return {
      habitProgress: calculateProgress(habitItems),
      taskProgress: calculateProgress(taskItems)
    };
  }, [habits]);

  const activeProgress = activeTab === 'habitos' ? habitProgress : taskProgress;
  const currentQuote = useMemo(() => {
    if (!showQuote) return null;
    return getQuote(activeProgress, new Date().getHours());
  }, [activeProgress, showQuote]);

  const handleCloseQuote = () => {
    setShowQuote(false);
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    habits.forEach(h => {
      if (h.tags) {
        h.tags.split(',').filter(Boolean).forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [habits]);

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          habit.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || habit.tags?.split(',').includes(selectedTag);
    const matchesTab = activeTab === 'habitos' ? !habit.is_one_time : habit.is_one_time;
    
    return matchesSearch && matchesTag && matchesTab;
  });

  return (
    <div className="app-container">
        <div className="dashboard-card glass-panel animate-scale">
          <div className="stats-container">
            {activeTab === 'habitos' ? (
              <div className="stat-section animate-fade-in">
                <div className="stats-header">
                  <h2>Progreso de Hábitos</h2>
                  <span className="stats-text">{habitProgress}% completado</span>
                </div>
                {showQuote && <MotivationalQuote message={currentQuote} onClose={handleCloseQuote} />}
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${habitProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="stat-section animate-fade-in">
                <div className="stats-header">
                  <h2>Progreso de Tareas</h2>
                  <span className="stats-text" style={{ color: 'var(--brand-green)' }}>{taskProgress}% completado</span>
                </div>
                {showQuote && <MotivationalQuote message={currentQuote} onClose={handleCloseQuote} />}
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${taskProgress}%`, background: 'var(--brand-green)' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

      <main className="app-main">
        <div className="list-header animate-slide" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2>{activeTab === 'habitos' ? 'Mis Hábitos' : 'Mis Tareas'}</h2>
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
                style={{ 
                  background: activeTab === 'habitos' ? 'var(--primary)' : 'transparent', 
                  border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, 
                  color: activeTab === 'habitos' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveTab('habitos')}
              >
                🔄 Hábitos
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tareas' ? 'active' : ''}`}
                style={{ 
                  background: activeTab === 'tareas' ? 'var(--primary)' : 'transparent', 
                  border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, 
                  color: activeTab === 'tareas' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveTab('tareas')}
              >
                ✅ Tareas
              </button>
              <button 
                className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                style={{ 
                  background: activeTab === 'stats' ? 'var(--primary)' : 'transparent', 
                  border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, 
                  color: activeTab === 'stats' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveTab('stats')}
              >
                📊 Estadísticas
              </button>
            </div>
          </div>

        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar hábito..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {activeTab === 'habitos' && (
              <div className="filter-group">
                <Filter size={18} className="filter-icon" />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tipos: Todos</option>
                  <option value="regular">✅ Regulares</option>
                  <option value="quantifiable">⚙️ Cuantificables</option>
                  <option value="inverse">🔄 Inversos</option>
                </select>
              </div>
            )}

            <div className="filter-group">
              <Tag size={18} className="filter-icon" />
              <select 
                value={selectedTag} 
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="all">Etiquetas: Todas</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

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
          ) : activeTab === 'stats' ? (
            <div className="stats-tab-content animate-scale glass-panel" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div className="stats-header-info">
                 <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Análisis Strike</h2>
                 <p style={{ color: 'var(--text-secondary)' }}>Métricas de rendimiento en tiempo real</p>
               </div>
               
               <HabitRadarChart habits={habits} />
               
               <div style={{ 
                 marginTop: '1rem', 
                 padding: '1.5rem', 
                 background: 'rgba(var(--primary-rgb), 0.05)', 
                 borderRadius: '20px', 
                 border: '1px dashed var(--primary)', 
                 textAlign: 'left',
                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
               }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  💡 <b>Consejo:</b> Tu hexágono refleja tu desempeño actual. La <b>Dedicación</b> mide tus completaciones de hoy, mientras que la <b>Disciplina</b> premia la constancia de tus rachas acumuladas. ¡Sigue así para expandir tu potencial!
                </p>
              </div>
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="empty-state animate-scale glass-panel">
              <Activity size={48} style={{ color: 'var(--border-light)', marginBottom: '1rem' }} />
              <h3>{activeTab === 'habitos' ? 'Aún no tienes hábitos' : 'Aún no tienes tareas'}</h3>
              <p>
                {activeTab === 'habitos' 
                  ? 'Comienza creando un hábito y no rompas tu racha.' 
                  : 'Añade una tarea puntual para organizar tu día.'}
              </p>
              <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                {activeTab === 'habitos' ? 'Crear el primer hábito' : 'Crear la primera tarea'}
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
          path="*" 
          element={
            <PrivateRoute>
              <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header 
                  onNewHabitClick={() => window.dispatchEvent(new CustomEvent('nav-action-new-habit'))}
                  onFinanceAction={() => window.dispatchEvent(new CustomEvent('nav-action-finance'))}
                />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </PrivateRoute>
          } 
        />
      </Routes>
    </>
  );
}
