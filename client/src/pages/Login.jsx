import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import './Auth.css'; // Estilos compartidos

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="app-container">
      <Header />
      <div className="auth-container">
        <h2>Iniciar Sesión</h2>
        <form className="auth-form animate-slide" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-submit-btn">Entrar</button>
          
          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
