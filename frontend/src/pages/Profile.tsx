import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Info State
  const [riotName, setRiotName] = useState(user?.riot_name || '');
  const [riotTag, setRiotTag] = useState(user?.riot_tag || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [champions, setChampions] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setRiotName(user.riot_name || '');
      setRiotTag(user.riot_tag || '');
      setEmail(user.email || '');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isPhotoModalOpen && champions.length === 0) {
      axios.get('/api/champions').then(res => setChampions(res.data));
    }
  }, [isPhotoModalOpen]);

  if (!user) return null;

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg); setSuccess('');
    } else {
      setSuccess(msg); setError('');
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showMessage('Las contraseñas no coinciden', true);
    }
    try {
      await axios.put('/api/profile', {
        action: 'change_password',
        current_password: currentPassword,
        new_password: newPassword
      });
      showMessage('Contraseña actualizada correctamente');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al actualizar', true);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('/api/profile', {
        action: 'update_info',
        riot_name: riotName,
        riot_tag: riotTag,
        email: email
      });
      updateUser({ riot_name: riotName, riot_tag: riotTag, email: email });
      showMessage('Información actualizada correctamente');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al actualizar', true);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return showMessage('Selecciona un archivo', true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      const res = await axios.post('/api/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ profile_picture: res.data.image });
      setIsPhotoModalOpen(false);
      showMessage('Foto actualizada con éxito');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al subir foto', true);
    }
  };

  const handleSelectChampion = async (imgName: string) => {
    try {
      const res = await axios.put('/api/profile', {
        action: 'set_profile_champion',
        champ_image: imgName
      });
      updateUser({ profile_picture: res.data.image });
      setIsPhotoModalOpen(false);
      showMessage('Foto actualizada con éxito');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al cambiar foto', true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar tu cuenta permanentemente? Perderás todos tus amigos y favoritos.")) return;
    try {
      await axios.delete('/api/profile');
      logout();
      navigate('/');
    } catch (err) {
      showMessage('No se pudo eliminar la cuenta', true);
    }
  };

  const avatarUrl = user.profile_picture && user.profile_picture !== 'default.png' 
    ? (user.profile_picture.startsWith('user_') ? `/uploads/${user.profile_picture}` : `/img/champions/${user.profile_picture}`)
    : null;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      
      {/* Messages */}
      {success && <div className="bg-win/20 border-2 border-win-border text-win-border p-4 rounded-xl mb-6 text-center font-bold text-lg animate-pulse">{success}</div>}
      {error && <div className="bg-loss/20 border-2 border-loss-border text-loss-border p-4 rounded-xl mb-6 text-center font-bold text-lg animate-pulse">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Danger Zone */}
        <div className="flex flex-col gap-6">
          <div className="bg-medium-blue/80 p-6 rounded-2xl shadow-xl border-2 border-border-color flex flex-col items-center">
            
            <div className="relative group cursor-pointer mb-6 mt-4">
              <div className="w-40 h-40 bg-dark-blue rounded-full overflow-hidden border-4 border-gold mx-auto flex items-center justify-center text-5xl text-white font-black shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-transform group-hover:scale-105">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div 
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center m-1 border-4 border-transparent"
                onClick={() => setIsPhotoModalOpen(true)}
              >
                <span className="text-white font-bold tracking-wider drop-shadow-md">✏️ Editar</span>
              </div>
            </div>
            
            <h2 className="font-black text-2xl text-gold mb-1 text-center truncate w-full">{user.username}</h2>
            <p className="text-gray-400 font-medium text-sm">Miembro de NexusStats</p>
          </div>

          <div className="bg-loss/10 p-6 rounded-2xl shadow-xl border-2 border-loss-border/50">
            <h3 className="text-loss-border font-black text-xl mb-2 flex items-center gap-2"><span>⚠️</span> Zona de Peligro</h3>
            <p className="text-gray-400 text-xs mb-6 font-medium leading-relaxed">Una vez elimines tu cuenta, perderás todos tus datos y configuraciones permanentemente.</p>
            <button onClick={handleDeleteAccount} className="w-full bg-loss/80 text-white font-bold py-3 px-6 rounded-xl border border-loss-border hover:bg-loss hover:scale-105 transition-all outline-none">
              Eliminar Cuenta
            </button>
          </div>
        </div>
        
        {/* Right Column: Forms */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Info Section */}
          <div className="bg-medium-blue/80 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-border-color">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><span className="text-sky-400">🎮</span> Información y Cuenta de Riot</h3>
            <form onSubmit={handleUpdateInfo}>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-sky-400 outline-none transition-all font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Nombre en el juego</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Faker"
                    className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-sky-400 outline-none transition-all font-bold"
                    value={riotName}
                    onChange={(e) => setRiotName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Tag (Sin #)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: KR1"
                    className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-sky-400 outline-none transition-all font-bold uppercase"
                    value={riotTag}
                    onChange={(e) => setRiotTag(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="bg-sky-500/20 text-sky-400 font-black px-6 py-2.5 rounded-xl border-2 border-sky-500/50 hover:bg-sky-500/40 transition-colors">
                Guardar Cambios
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-medium-blue/80 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-border-color mb-8 md:mb-0">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><span className="text-green-400">🔒</span> Cambiar Contraseña</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Contraseña Actual</label>
                <input 
                  type="password" 
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-green-400 outline-none transition-all font-bold"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-green-400 outline-none transition-all font-bold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-black tracking-wider">Confirmar Nueva</label>
                  <input 
                    type="password" 
                    className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-green-400 outline-none transition-all font-bold"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="bg-green-500/20 text-green-400 font-black px-6 py-2.5 rounded-xl border-2 border-green-500/50 hover:bg-green-500/40 transition-colors mt-2">
                Actualizar Contraseña
              </button>
            </form>
          </div>
          
        </div>
      </div>

      {/* Photo Selection Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="bg-dark-blue border-2 border-border-color rounded-2xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-medium-blue/80 backdrop-blur-md z-10">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">🖼️ Actualizar Foto de Perfil</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-gray-400 hover:text-white font-black text-2xl transition-colors bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center">&times;</button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="mb-8 p-4 sm:p-6 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                <h4 className="text-sm text-gold font-black uppercase tracking-wider mb-4 flex items-center gap-2"><span>📁</span> Subir archivo personalizado</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-gold file:text-dark-blue hover:file:bg-yellow-500 transition-colors w-full bg-black/20 rounded-xl border border-white/10"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <button 
                    onClick={handleUploadPhoto}
                    className="w-full sm:w-auto bg-white/10 text-white font-black px-8 py-2.5 rounded-xl hover:bg-white/20 transition-colors border border-white/10 disabled:opacity-50"
                    disabled={!selectedFile}
                  >
                    Subir y Guardar
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gold font-black uppercase tracking-wider mb-4 flex items-center gap-2"><span>⚔️</span> O elige un Campeón</h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
                  {champions.map(c => (
                    <div 
                      key={c.id} 
                      className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-gold cursor-pointer transition-all hover:scale-110 shadow-lg relative group"
                      onClick={() => handleSelectChampion(c.image_url)}
                      title={c.name}
                    >
                      <img src={`/img/champions/${c.image_url}`} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-black truncate px-1">{c.name}</span>
                      </div>
                    </div>
                  ))}
                  {champions.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center">
                       <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                       <p className="text-gray-400 font-bold">Cargando campeones...</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
