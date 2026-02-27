const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/auth`; // Y en el otro archivo: /api/habits

const getHeaders = () => {
  const token = localStorage.getItem('strike_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const habitService = {
  async getAll() {
    // Se eliminó el /habits extra
    const res = await fetch(API_URL, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error fetching habits');
    return res.json();
  },

  async create(habit) {
    // Se eliminó el /habits extra
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error creating habit');
    return res.json();
  },

  async update(id, habit) {
    // Se cambió a /${id}
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error updating habit');
    return res.json();
  },

  async delete(id) {
    // Se cambió a /${id}
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error deleting habit');
    return res.json();
  },

  async toggle(id, amount = undefined) {
    // Se cambió a /${id}/toggle
    const res = await fetch(`${API_URL}/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Error toggling habit');
    return res.json();
  }
};