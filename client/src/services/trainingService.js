const API_BASE = import.meta.env.VITE_API_URL || 
                (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
const API_URL = `${API_BASE}/api/training`;

const getAuthHeader = () => {
  const token = localStorage.getItem('strike_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const trainingService = {
  getLibrary: async () => {
    const res = await fetch(`${API_URL}/library`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Error al obtener la librería');
    return res.json();
  },
  
  createLibraryExercise: async (exerciseData) => {
    const res = await fetch(`${API_URL}/library`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(exerciseData)
    });
    if (!res.ok) throw new Error('Error al crear ejercicio personalizado');
    return res.json();
  },

  updateLibraryExercise: async (id, exerciseData) => {
    const res = await fetch(`${API_URL}/library/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(exerciseData)
    });
    if (!res.ok) throw new Error('Error al actualizar ejercicio personalizado');
    return res.json();
  },

  deleteLibraryExercise: async (id) => {
    const res = await fetch(`${API_URL}/library/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Error al eliminar ejercicio personalizado');
    return res.json();
  },

  getRoutines: async () => {
    const res = await fetch(`${API_URL}/routines`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Error al obtener las rutinas');
    return res.json();
  },

  createRoutine: async (routineData) => {
    const res = await fetch(`${API_URL}/routines`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(routineData)
    });
    if (!res.ok) throw new Error('Error al crear rutina');
    return res.json();
  },

  deleteRoutine: async (id) => {
    const res = await fetch(`${API_URL}/routines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Error al eliminar rutina');
    return res.json();
  },

  getLogs: async () => {
    const res = await fetch(`${API_URL}/logs`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Error al obtener el historial');
    return res.json();
  },

  logWorkout: async (logData) => {
    const res = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(logData)
    });
    if (!res.ok) throw new Error('Error al guardar el entrenamiento');
    return res.json();
  }
};
