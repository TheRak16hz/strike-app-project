import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { trainingService } from '../services/trainingService';
import TrainingHeader from '../components/training/TrainingHeader';
import RoutineList from '../components/training/RoutineList';
import RoutineModal from '../components/training/modals/RoutineModal';
import LogWorkoutModal from '../components/training/modals/LogWorkoutModal';
import ExerciseLibraryModal from '../components/training/modals/ExerciseLibraryModal';
import TrainingStats from '../components/training/TrainingStats';
import { Activity, Flame, CalendarSync } from 'lucide-react';

export default function Training() {
  const [routines, setRoutines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedRoutineToLog, setSelectedRoutineToLog] = useState(null);
  
  const [activeTab, setActiveTab] = useState('routines'); // 'routines' or 'history'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routinesData, logsData, libData] = await Promise.all([
        trainingService.getRoutines(),
        trainingService.getLogs(),
        trainingService.getLibrary()
      ]);
      setRoutines(routinesData);
      setLogs(logsData);
      setLibrary(libData);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos del gimnasio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!logs.length) return { totalCalories: 0, totalWorkouts: 0 };
    
    const totalCalories = logs.reduce((acc, log) => acc + Number(log.total_calories_burned), 0);
    
    return {
      totalWorkouts: logs.length,
      totalCalories: Math.round(totalCalories)
    };
  }, [logs]);

  const handleCreateRoutine = async (routineData) => {
    try {
      await trainingService.createRoutine(routineData);
      toast.success('Rutina creada');
      setShowRoutineModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la rutina');
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (!window.confirm('¿Eliminar esta rutina permanentemente?')) return;
    try {
      await trainingService.deleteRoutine(id);
      toast.success('Rutina eliminada');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar rutina');
    }
  };

  const handleLogWorkout = async (logData) => {
    try {
      await trainingService.logWorkout(logData);
      toast.success('¡Entrenamiento registrado! 🔥');
      setSelectedRoutineToLog(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el entrenamiento');
    }
  };

  const handleCreateExercise = async (exerciseData) => {
    try {
      await trainingService.createLibraryExercise(exerciseData);
      toast.success('Ejercicio añadido a la librería');
      fetchData(); // Refresh library
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el ejercicio');
    }
  };

  const handleUpdateExercise = async (id, exerciseData) => {
    try {
      await trainingService.updateLibraryExercise(id, exerciseData);
      toast.success('Ejercicio actualizado');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar ejercicio');
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!window.confirm('¿Eliminar este ejercicio? Las rutinas que lo incluyan podrían verse afectadas.')) return;
    try {
      await trainingService.deleteLibraryExercise(id);
      toast.success('Ejercicio eliminado');
      fetchData(); // Refresh library
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar ejercicio');
    }
  };

  if (loading) return <div className="loading-state">Cargando tus rutinas...</div>;

  return (
    <div className="training-page animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}>
      
      <TrainingHeader 
        onNewRoutine={() => setShowRoutineModal(true)} 
        onManageLibrary={() => setShowLibraryModal(true)}
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel animate-scale" style={{ padding: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <div style={{ padding: '0.8rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '14px' }}>
            <Activity size={24} color="var(--primary)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>ENTRENAMIENTOS REALIZADOS</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalWorkouts}</h3>
          </div>
        </div>

        <div className="glass-panel animate-scale" style={{ padding: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'center', animationDelay: '0.1s' }}>
          <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px' }}>
            <Flame size={24} color="#10b981" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>CALORÍAS TOTALES QUEMADAS</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalCalories.toLocaleString()} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>kcal</span></h3>
          </div>
        </div>
      </div>

      <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('routines')}
          className={activeTab === 'routines' ? 'btn-primary' : ''}
          style={{ 
            padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
            background: activeTab === 'routines' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'routines' ? 'white' : 'var(--text-secondary)',
            border: activeTab === 'routines' ? 'none' : '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer'
          }}
        >
          Mis Rutinas
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'btn-primary' : ''}
          style={{ 
            padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
            background: activeTab === 'history' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'history' ? 'white' : 'var(--text-secondary)',
            border: activeTab === 'history' ? 'none' : '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer'
          }}
        >
          Historial & Calorías
        </button>
      </div>

      {activeTab === 'routines' ? (
        <RoutineList 
            routines={routines} 
            onDelete={handleDeleteRoutine} 
            onExecute={(routine) => setSelectedRoutineToLog(routine)} 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <TrainingStats logs={logs} />
            
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarSync size={20} color="var(--primary)" />
                    Historial de Entrenamientos
                </h3>
            {logs.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Aún no has registrado ningún entrenamiento.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {logs.map(log => (
                        <div key={log.id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {log.icon || '💪'} {log.routine_name || 'Rutina Personalizada'}
                                </h4>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
                                <span>🔥 Calorías: <strong style={{ color: '#10b981' }}>{log.total_calories_burned} kcal</strong></span>
                                <span>⚡ Esfuerzo: <strong>{log.perceived_effort}/10</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
      )}

      {showRoutineModal && (
        <RoutineModal 
          show={showRoutineModal} 
          onClose={() => setShowRoutineModal(false)}
          onSubmit={handleCreateRoutine}
          library={library}
        />
      )}

      {selectedRoutineToLog && (
        <LogWorkoutModal
            show={!!selectedRoutineToLog}
            routine={selectedRoutineToLog}
            onClose={() => setSelectedRoutineToLog(null)}
            onSubmit={(logData) => handleLogWorkout({ ...logData, routine_id: selectedRoutineToLog.id })}
        />
      )}

      {showLibraryModal && (
        <ExerciseLibraryModal
            show={showLibraryModal}
            onClose={() => setShowLibraryModal(false)}
            library={library}
            onCreateExercise={handleCreateExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
        />
      )}

    </div>
  );
}
