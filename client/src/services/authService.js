// En producción (Vercel), siempre usar la ruta relativa /api/auth
// En desarrollo local (PC), usar localhost:5000 a menos que VITE_API_URL especifique otra cosa
const API_URL = import.meta.env.PROD 
  ? '/api/auth' 
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth` : 'http://localhost:5000/api/auth');

export const authService = {
  async register(username, password) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error en registro');
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error en login');
    return data;
  },

  async getMe(token) {
    const res = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error validando token');
    return data;
  }
};
