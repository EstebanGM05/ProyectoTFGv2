import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Friend {
  id: number;
  name: string;
  tag: string;
  role: string;
  last_champion: string;
}

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [addLdg, setAddLdg] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchFriends();
  }, [user, navigate]);

  const fetchFriends = () => {
    axios.get('/api/friends', { withCredentials: true })
      .then(res => setFriends(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tag) return;
    setAddLdg(true);
    setError('');
    
    try {
      const res = await axios.post('/api/friends', { name, tag }, { withCredentials: true });
      setFriends([...friends, res.data.friend]);
      setName('');
      setTag('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al añadir amigo');
    } finally {
      setAddLdg(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/friends/${id}`, { withCredentials: true });
      setFriends(friends.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center text-gold mt-10">Cargando amigos...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gold mb-8 border-b border-border-color pb-4">
        Lista de Amigos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border border-border-color bg-medium-blue p-6 rounded-lg self-start">
          <h2 className="text-xl font-bold text-white mb-4">Añadir Nuevo Amigo</h2>
          {error && <p className="text-loss-border bg-loss/30 p-2 text-sm rounded mb-4">{error}</p>}
          <form onSubmit={handleAddFriend} className="space-y-4">
            <div>
              <input 
                type="text" placeholder="Riot ID (ej. Faker)" 
                className="w-full bg-input-bg border border-input-border p-2 rounded text-white"
                value={name} onChange={e => setName(e.target.value)} required 
              />
            </div>
            <div>
              <input 
                type="text" placeholder="Tag (ej. T1)" 
                className="w-full bg-input-bg border border-input-border p-2 rounded text-white"
                value={tag} onChange={e => setTag(e.target.value)} required 
              />
            </div>
            <button type="submit" disabled={addLdg} className="w-full bg-gold text-dark-blue font-bold py-2 rounded hover:bg-gold-hover transition disabled:opacity-50">
              {addLdg ? 'Buscando perfil...' : 'Añadir a la lista'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4 italic">Al añadir un amigo, calcularemos automáticamente su rol preferido según sus últimas partidas.</p>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {friends.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 bg-medium-blue p-8 rounded border border-border-color">
              No has añadido a ningún amigo aún.
            </div>
          ) : (
            friends.map(f => (
              <div key={f.id} className="flex justify-between items-center bg-medium-blue border border-border-color p-4 rounded-lg hover:border-gold transition group">
                <div className="flex items-center gap-4">
                  <img 
                    src={`/img/champions/${f.last_champion}_centered.jpg`} 
                    alt={f.last_champion} 
                    className="w-16 h-16 rounded shadow-md border border-gray-700 object-cover object-top"
                    onError={(e) => { e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${f.last_champion}.png` }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gold group-hover:text-gold-hover">{f.name} <span className="text-gray-500 text-sm">#{f.tag}</span></h3>
                    <p className="text-bright-blue font-mono text-sm mt-1">Main Role: {f.role}</p>
                    <p className="text-gray-400 text-xs">Último pj: {f.last_champion}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(f.id)} className="text-loss-border hover:bg-loss/30 p-2 rounded transition">
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
