const API_BASE = import.meta.env.VITE_API_URL || 
                (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
const API_URL = `${API_BASE}/api/finance`;

const getAuthHeader = () => {
  const token = localStorage.getItem('strike_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const financeService = {
  getFinanceData: async () => {
    const res = await fetch(`${API_URL}/`, {
      headers: getAuthHeader()
    });
    return res.json();
  },

  getMetadata: async () => {
    const res = await fetch(`${API_URL}/metadata`, {
      headers: getAuthHeader()
    });
    return res.json();
  },

  createGoal: async (goalData) => {
    const res = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(goalData)
    });
    return res.json();
  },

  updateGoal: async (id, goalData) => {
    const res = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(goalData)
    });
    return res.json();
  },

  deleteGoal: async (id) => {
    const res = await fetch(`${API_URL}/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return res.json();
  },

  createTransaction: async (transData) => {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(transData)
    });
    return res.json();
  },

  updateTransaction: async (id, transData) => {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(transData)
    });
    return res.json();
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return res.json();
  },

  deleteAllTransactions: async () => {
    const res = await fetch(`${API_URL}/transactions/all`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return res.json();
  },

  deleteAllGoals: async () => {
    const res = await fetch(`${API_URL}/goals/all`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ settings })
    });
    return res.json();
  },

  fetchLiveRates: async () => {
    const res = await fetch(`${API_URL}/rates/live`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return res.json();
  }
};
