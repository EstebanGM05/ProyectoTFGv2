import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: number;
  username: string;
  email: string | null;
  riot_name: string | null;
  riot_tag: string | null;
  profile_picture: string | null;
  is_admin: boolean;
  favorites_count: number;
}

interface AdminStats {
  total_users: number;
  total_favorites: number;
  top_champion: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal Edit
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.is_admin) {
        navigate('/');
        return;
      }
      
      Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users')
      ]).then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
      }).catch(err => {
        console.error("Error cargando panel admin", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 h-64">
         <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6"></div>
         <div className="text-gold font-bold text-2xl animate-pulse tracking-widest">CARGANDO PANEL...</div>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (id === user?.id) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario de forma permanente?')) {
      try {
        await axios.delete(`/api/admin/users/${id}`);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.error || "Error al eliminar");
      }
    }
  };

  const openEditModal = (u: UserData) => {
    setEditingUser(u);
    setEditForm({
      username: u.username,
      email: u.email || '',
      riot_name: u.riot_name || '',
      riot_tag: u.riot_tag || '',
      is_admin: u.is_admin,
      profile_picture: u.profile_picture || 'default.png'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await axios.put(`/api/admin/users/${editingUser.id}`, editForm);
      // Refresh user list
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al actualizar");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-4xl font-black text-gold tracking-wide">Panel de Control</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-medium-blue border border-gold/30 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-gold/20 transition-all"></div>
             <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total Usuarios</p>
             <p className="text-4xl font-black text-white">{stats.total_users}</p>
          </div>
          <div className="bg-medium-blue border border-bright-blue/30 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-bright-blue/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-bright-blue/20 transition-all"></div>
             <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Favoritos Guardados</p>
             <p className="text-4xl font-black text-white">{stats.total_favorites}</p>
          </div>
          <div className="bg-medium-blue border border-purple-500/30 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
             <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Campeón más Popular</p>
             <p className="text-3xl font-black text-white truncate">{stats.top_champion}</p>
          </div>
        </div>
      )}

      <div className="bg-medium-blue/50 rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Gestión de Usuarios</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 text-white pl-10 pr-4 py-2 rounded-xl focus:border-gold outline-none transition-colors w-64 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-gold text-xs uppercase tracking-widest">
                <th className="p-4 pl-6">Usuario</th>
                <th className="p-4">Riot ID</th>
                <th className="p-4 text-center">Favoritos</th>
                <th className="p-4 text-center">Rol</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => 
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (u.riot_name && u.riot_name.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 pl-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                       <img 
                         src={u.profile_picture?.startsWith('user_') ? `/uploads/${u.profile_picture}` : `/img/champions/${u.profile_picture || 'default.png'}`} 
                         alt="avatar"
                         className="w-full h-full object-cover"
                         onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40' }}
                       />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base group-hover:text-gold transition-colors">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.email || 'Sin correo'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.riot_name ? (
                      <span className="bg-black/30 px-3 py-1 rounded-lg text-sm font-bold text-bright-blue border border-bright-blue/20">
                        {u.riot_name}#{u.riot_tag}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No vinculado</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-white font-bold">{u.favorites_count}</span>
                  </td>
                  <td className="p-4 text-center">
                    {u.is_admin ? (
                      <span className="bg-gold/20 text-gold border border-gold/40 px-2 py-1 rounded text-xs font-black tracking-widest uppercase">Admin</span>
                    ) : (
                      <span className="text-gray-500 text-xs uppercase tracking-widest">User</span>
                    )}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="bg-white/10 hover:bg-bright-blue text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user?.id}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${u.id === user?.id ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 hover:bg-red-500 text-white'}`}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-blue border border-gold/40 p-8 rounded-3xl max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">Editar Usuario <span className="text-gold">{editingUser.username}</span></h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs text-gold font-bold uppercase tracking-widest mb-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={editForm.username || ''}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gold font-bold uppercase tracking-widest mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editForm.email || ''}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-gold outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-bright-blue font-bold uppercase tracking-widest mb-1">Riot Name</label>
                  <input 
                    type="text" 
                    value={editForm.riot_name || ''}
                    onChange={e => setEditForm({...editForm, riot_name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-bright-blue outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-bright-blue font-bold uppercase tracking-widest mb-1">Tag</label>
                  <input 
                    type="text" 
                    value={editForm.riot_tag || ''}
                    onChange={e => setEditForm({...editForm, riot_tag: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-bright-blue outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gold font-bold uppercase tracking-widest mb-1">Foto (Nombre Archivo)</label>
                <input 
                  type="text" 
                  value={editForm.profile_picture || ''}
                  onChange={e => setEditForm({...editForm, profile_picture: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-gold outline-none"
                />
              </div>
              {editingUser.id !== user?.id && (
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="is_admin_check"
                    checked={editForm.is_admin || false}
                    onChange={e => setEditForm({...editForm, is_admin: e.target.checked})}
                    className="w-5 h-5 accent-gold"
                  />
                  <label htmlFor="is_admin_check" className="text-white font-bold cursor-pointer">Es Administrador</label>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-6 py-2 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                className="bg-gold text-dark-blue px-6 py-2 rounded-xl font-black hover:bg-white transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
