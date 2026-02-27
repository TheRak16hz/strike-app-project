import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import PropTypes from 'prop-types';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('strike_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const userData = await authService.getMe(token);
          setUser(userData);
        } catch {
          console.error('Sesión expirada o inválida');
          logout();
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [token]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    localStorage.setItem('strike_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username, password) => {
    const data = await authService.register(username, password);
    localStorage.setItem('strike_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('strike_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
