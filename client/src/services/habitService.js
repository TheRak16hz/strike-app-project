// En producción (Vercel), siempre usar la ruta relativa /api
// En desarrollo local (PC), usar localhost:5000 a menos que VITE_API_URL especifique otra cosa
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api');

const getHeaders = () => {
  const token = localStorage.getItem('strike_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const habitService = {
  async getAll() {
    const res = await fetch(`${API_URL}/habits`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error fetching habits');
    return res.json();
  },

  async create(habit) {
    const res = await fetch(`${API_URL}/habits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error creating habit');
    return res.json();
  },

  async update(id, habit) {
    const res = await fetch(`${API_URL}/habits/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error updating habit');
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_URL}/habits/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error deleting habit');
    return res.json();
  },

  async toggle(id, amount = undefined) {
    const res = await fetch(`${API_URL}/habits/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Error toggling habit');
    return res.json();
  }
};
