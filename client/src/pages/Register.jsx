import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import './Auth.css'; 

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }
    try {
      await register(username, password);
      toast.success('Cuenta creada exitosamente');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Error al registrar usuario');
    }
  };

  return (
    <div className="app-container">
      <Header />
      <div className="auth-container">
        <h2>Crear Cuenta</h2>
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
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-submit-btn">Registrarse</button>
          
          <p className="auth-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
