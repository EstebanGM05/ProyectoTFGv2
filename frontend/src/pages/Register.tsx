import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await axios.post('/api/auth/register', { username, password });
      setSuccess('Registro exitoso. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar la cuenta');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-medium-blue p-8 rounded-lg shadow-xl border border-border-color">
      <h2 className="text-2xl font-bold text-gold mb-6 text-center">Registrar Cuenta</h2>
      
      {error && <div className="bg-loss border border-loss-border text-loss-border p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div className="bg-win border border-win-border text-win-border p-3 rounded mb-4 text-center">{success}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-text-color mb-1">Nombre de Usuario</label>
          <input 
            type="text" 
            className="w-full bg-input-bg border border-input-border rounded p-2 text-white focus:outline-none focus:border-gold"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-text-color mb-1">Contraseña</label>
          <input 
            type="password" 
            className="w-full bg-input-bg border border-input-border rounded p-2 text-white focus:outline-none focus:border-gold"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="w-full bg-gold text-dark-blue font-bold py-3 mt-4 rounded hover:bg-gold-hover transition">
          Crear Cuenta
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        ¿Ya tienes cuenta? <Link to="/login" className="text-bright-blue hover:text-white transition">Inicia sesión</Link>
      </div>
    </div>
  );
}
