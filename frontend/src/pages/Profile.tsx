import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar tu cuenta permanentemente? Perderás todos tus amigos y favoritos.")) return;
    try {
      await axios.delete('/api/profile');
      logout();
      navigate('/');
    } catch (err) {
      setError('No se pudo eliminar la cuenta');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-medium-blue p-8 rounded-lg shadow-xl border border-border-color">
      <h2 className="text-3xl font-bold text-gold mb-6 border-b border-border-color pb-4">Mi Perfil</h2>
      
      {success && <div className="bg-win border border-win-border text-win-border p-3 rounded mb-4 text-center">{success}</div>}
      {error && <div className="bg-loss border border-loss-border text-loss-border p-3 rounded mb-4 text-center">{error}</div>}
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-shrink-0 text-center">
           <div className="w-32 h-32 bg-dark-blue rounded-full overflow-hidden border-4 border-gold mx-auto flex items-center justify-center text-4xl text-white font-bold mb-4">
              {user.username.charAt(0).toUpperCase()}
           </div>
           <p className="font-bold text-xl text-white">{user.username}</p>
        </div>
        
        <div className="flex-grow space-y-4">
          <div className="bg-input-bg p-4 rounded border border-input-border">
            <span className="text-gray-500 text-sm block">ID de Usuario</span>
            <span className="text-white font-mono">{user.id}</span>
          </div>
          <div className="bg-input-bg p-4 rounded border border-input-border">
            <span className="text-gray-500 text-sm block">Fecha de Registro</span>
            <span className="text-white font-mono">--</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border-color pt-8 mt-8">
        <h3 className="text-loss-border font-bold text-xl mb-4">Zona de Peligro</h3>
        <p className="text-gray-400 text-sm mb-4">Una vez elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de estar seguro.</p>
        <button onClick={handleDeleteAccount} className="bg-loss text-white font-bold py-2 px-6 rounded hover:bg-loss-border transition">
          Eliminar Cuenta
        </button>
      </div>
    </div>
  );
}
