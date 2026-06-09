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
  profile_icon_id: number;
  winrate: number;
  kda: number;
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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evitar que clicke la tarjeta y redirija
    try {
      await axios.delete(`/api/friends/${id}`, { withCredentials: true });
      setFriends(friends.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const goToHistory = (name: string, tag: string) => {
    navigate(`/match-history?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center mt-20 h-64">
       <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6"></div>
       <div className="text-gold font-bold text-2xl animate-pulse tracking-widest">CARGANDO ALIADOS...</div>
    </div>
  );

  // Calcular Leaderboard (Top 3 por Winrate, con un mínimo de partidas o simplemente el winrate directo)
  const leaderboard = [...friends].sort((a, b) => {
    if (b.winrate !== a.winrate) return b.winrate - a.winrate;
    return b.kda - a.kda;
  }).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="flex justify-between items-end mb-8 border-b border-border-color pb-4">
        <div>
          <h1 className="text-4xl font-black text-gold tracking-wide drop-shadow-md">Centro de Operaciones</h1>
          <p className="text-gray-400 mt-2 font-medium">Gestiona a tus aliados y espía sus estadísticas.</p>
        </div>
      </div>

      {/* LEADERBOARD */}
      {friends.length > 0 && (
        <div className="mb-12 bg-gradient-to-br from-dark-blue to-medium-blue border-2 border-gold/40 rounded-3xl p-6 md:p-8 shadow-[0_15px_35px_-5px_rgba(201,170,113,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <h2 className="text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-3">
            <span className="text-3xl">🏆</span> TOP ALIADOS (SEMANA)
          </h2>
          
          <div className="flex flex-col sm:flex-row justify-center items-end gap-4 sm:gap-8 min-h-[220px]">
            {/* Rank 2 */}
            {leaderboard[1] && (
              <div onClick={() => goToHistory(leaderboard[1].name, leaderboard[1].tag)} className="flex flex-col items-center group cursor-pointer order-2 sm:order-1 transition-transform hover:-translate-y-4">
                <div className="relative">
                  <img src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/profileicon/${leaderboard[1].profile_icon_id || 1}.png`} className="w-20 h-20 rounded-full border-4 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.5)] z-10 relative" alt="Icon" />
                  <div className="absolute -bottom-3 -right-2 bg-gray-400 text-black font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-black z-20">2</div>
                </div>
                <div className="bg-gray-800/80 mt-4 px-4 py-3 rounded-t-xl border-t-2 border-l-2 border-r-2 border-gray-400/50 flex flex-col items-center w-32 h-24 justify-end">
                  <span className="text-white font-bold text-sm truncate w-full text-center">{leaderboard[1].name}</span>
                  <span className="text-gold font-black text-lg">{leaderboard[1].winrate}%</span>
                </div>
              </div>
            )}
            
            {/* Rank 1 */}
            {leaderboard[0] && (
              <div onClick={() => goToHistory(leaderboard[0].name, leaderboard[0].tag)} className="flex flex-col items-center group cursor-pointer order-1 sm:order-2 transition-transform hover:-translate-y-4">
                <div className="relative">
                  <img src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/profileicon/${leaderboard[0].profile_icon_id || 1}.png`} className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)] z-10 relative" alt="Icon" />
                  <div className="absolute -bottom-4 -right-1 bg-yellow-400 text-black font-black w-10 h-10 rounded-full flex items-center justify-center border-2 border-black z-20 text-xl shadow-lg">1</div>
                </div>
                <div className="bg-gradient-to-t from-yellow-900/40 to-transparent mt-4 px-4 py-3 rounded-t-xl border-t-2 border-l-2 border-r-2 border-yellow-400/50 flex flex-col items-center w-36 h-32 justify-end">
                  <span className="text-white font-black text-md truncate w-full text-center">{leaderboard[0].name}</span>
                  <span className="text-yellow-400 font-black text-2xl drop-shadow-md">{leaderboard[0].winrate}%</span>
                  <span className="text-xs text-yellow-200 mt-1 uppercase font-bold tracking-wider">KDA: {leaderboard[0].kda}</span>
                </div>
              </div>
            )}
            
            {/* Rank 3 */}
            {leaderboard[2] && (
              <div onClick={() => goToHistory(leaderboard[2].name, leaderboard[2].tag)} className="flex flex-col items-center group cursor-pointer order-3 sm:order-3 transition-transform hover:-translate-y-4">
                <div className="relative">
                  <img src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/profileicon/${leaderboard[2].profile_icon_id || 1}.png`} className="w-16 h-16 rounded-full border-4 border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.5)] z-10 relative" alt="Icon" />
                  <div className="absolute -bottom-2 -right-2 bg-orange-700 text-white font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-black z-20 text-xs">3</div>
                </div>
                <div className="bg-gray-800/60 mt-4 px-4 py-3 rounded-t-xl border-t-2 border-l-2 border-r-2 border-orange-700/50 flex flex-col items-center w-28 h-20 justify-end">
                  <span className="text-gray-300 font-bold text-xs truncate w-full text-center">{leaderboard[2].name}</span>
                  <span className="text-orange-400 font-black text-md">{leaderboard[2].winrate}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* PANEL AÑADIR */}
        <div className="lg:col-span-1 border-2 border-gold/30 bg-dark-blue/80 p-6 rounded-2xl self-start shadow-xl backdrop-blur-sm sticky top-24">
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
            <span className="text-gold">➕</span> Reclutar
          </h2>
          <p className="text-xs text-gray-400 mb-6 font-medium">Añade a tus amigos para espiar su winrate y ver si son dignos de jugar contigo.</p>
          
          {error && <p className="text-loss-border bg-loss/30 p-3 font-bold text-sm rounded-xl mb-4 text-center border border-loss-border/50">{error}</p>}
          
          <form onSubmit={handleAddFriend} className="space-y-4">
            <div className="relative">
              <input 
                type="text" placeholder="Riot ID (ej. Faker)" 
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:border-gold outline-none transition-colors"
                value={name} onChange={e => setName(e.target.value)} required 
              />
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-500 font-black">#</span>
              <input 
                type="text" placeholder="Tag (ej. T1)" 
                className="w-full bg-black/50 border border-white/10 p-3 pl-8 rounded-xl text-white focus:border-gold outline-none transition-colors"
                value={tag} onChange={e => setTag(e.target.value)} required 
              />
            </div>
            <button type="submit" disabled={addLdg} className="w-full bg-gradient-to-r from-gold to-yellow-500 text-dark-blue font-black py-3 rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(200,170,110,0.3)] disabled:opacity-50 disabled:hover:scale-100 mt-2">
              {addLdg ? 'Localizando...' : 'Añadir Aliado'}
            </button>
          </form>
        </div>

        {/* LISTA DE AMIGOS */}
        <div className="lg:col-span-3">
          {friends.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 bg-medium-blue/50 p-12 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center">
              <span className="text-6xl mb-4 opacity-50">🕵️‍♂️</span>
              <h3 className="text-xl font-bold text-white mb-2">Tu lista está vacía</h3>
              <p>Añade a tus amigos usando el panel de la izquierda para empezar a seguir sus estadísticas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {friends.map(f => {
                // Determine splash art url (fallback to generic if unknown)
                const splashUrl = f.last_champion && f.last_champion !== 'Unknown'
                  ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${f.last_champion}_0.jpg`
                  : 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg';

                return (
                  <div 
                    key={f.id} 
                    onClick={() => goToHistory(f.name, f.tag)}
                    className="relative rounded-2xl overflow-hidden border-2 border-white/10 hover:border-gold/80 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(200,170,110,0.3)] h-40 flex items-end"
                  >
                    {/* Background Splash */}
                    <div className="absolute inset-0 z-0">
                      <img src={splashUrl} alt="Splash" className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/80 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-dark-blue/90 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 w-full p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/profileicon/${f.profile_icon_id || 1}.png`} 
                          className="w-16 h-16 rounded-full border-2 border-gold shadow-md"
                          alt="Icon"
                        />
                        <div>
                          <h3 className="text-2xl font-black text-white group-hover:text-gold transition-colors">{f.name} <span className="text-gray-400 text-sm font-medium">#{f.tag}</span></h3>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="bg-black/60 px-2 py-0.5 rounded text-xs font-bold text-gold uppercase border border-gold/30">{f.role}</span>
                            <span className="text-xs text-gray-300">Main: <span className="text-white font-bold">{f.last_champion}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Micro Stats */}
                      <div className="flex flex-col items-end gap-1">
                        <button 
                          onClick={(e) => handleDelete(e, f.id)} 
                          className="absolute top-3 right-3 text-white/40 hover:text-loss hover:bg-loss/20 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar amigo"
                        >
                          ✕
                        </button>
                        
                        <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg flex flex-col items-end backdrop-blur-sm mt-6">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Winrate</span>
                          <span className={`text-lg font-black leading-none ${f.winrate >= 50 ? 'text-win-border' : 'text-loss-border'}`}>
                            {f.winrate}%
                          </span>
                        </div>
                        <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg flex flex-col items-end backdrop-blur-sm">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">KDA Medio</span>
                          <span className="text-sm font-bold text-white leading-none">
                            {f.kda}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
