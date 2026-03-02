const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/habits`;

const getHeaders = () => {
  const token = localStorage.getItem('strike_token');
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // fallback
  }

  return {
    'Content-Type': 'application/json',
    'x-timezone': timezone,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const habitService = {
  async getAll() {
    const res = await fetch(API_URL, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error fetching habits');
    return res.json();
  },

  async create(habit) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error creating habit');
    return res.json();
  },

  async update(id, habit) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(habit)
    });
    if (!res.ok) throw new Error('Error updating habit');
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error deleting habit');
    return res.json();
  },

  async toggle(id, amount = undefined) {
    const res = await fetch(`${API_URL}/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Error toggling habit');
    return res.json();
  },

  async reorder(orderData) {
    const res = await fetch(`${API_URL}/reorder/all`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ order: orderData })
    });
    if (!res.ok) throw new Error('Error reordering habits');
    return res.json();
  }
};