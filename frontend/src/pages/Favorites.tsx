import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';

interface Champion {
  id: number;
  name: string;
  title: string;
  role: string;
  image_url: string;
  skin_num?: number;
}

function MasteryBadge({ mastery }: { mastery?: { level: number, points: number } }) {
  if (!mastery || (mastery.level === 0 && mastery.points === 0)) return null;

  return (
    <div className="mt-3 bg-black/60 border border-gold/30 rounded-lg p-2.5 flex items-center justify-between shadow-inner backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(200,170,110,0.5)]">
          <span className="text-black font-black text-sm">{mastery.level}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-gold/80 uppercase font-black tracking-widest leading-none">Nivel</span>
          <span className="text-gray-200 font-bold text-xs leading-tight mt-0.5">Maestría</span>
        </div>
      </div>
      <div className="text-right flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none">Puntos</span>
        <span className="text-white font-mono font-black text-sm leading-tight mt-0.5">{mastery.points.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function Favorites() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skinModal, setSkinModal] = useState<{ champId: number, champIdString: string, champName: string } | null>(null);
  const [availableSkins, setAvailableSkins] = useState<any[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<number, { level: number, points: number }>>({});
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("recientes");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  useEffect(() => {
    if (skinModal) {
      setLoadingSkins(true);
      fetch(`https://ddragon.leagueoflegends.com/cdn/16.11.1/data/es_ES/champion/${skinModal.champIdString}.json`)
        .then(res => res.json())
        .then(data => {
           if (data && data.data && data.data[skinModal.champIdString]) {
             const allSkins = data.data[skinModal.champIdString].skins;
             const validSkins = allSkins.filter((s: any) => {
               if (s.name === 'default') return true;
               const n = s.name.toLowerCase();
               if (n.includes('(')) {
                 if (n.includes('prestigio') || n.includes('prestige') || n.includes('2022') || n.includes('edición')) {
                   return true;
                 }
                 return false;
               }
               return true;
             });
             setAvailableSkins(validSkins);
           }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingSkins(false));
    } else {
      setAvailableSkins([]);
    }
  }, [skinModal]);

  const selectSkin = async (skinNum: number) => {
    if (!skinModal) return;
    try {
      await axios.put(`/api/favorites/${skinModal.champId}/skin`, { skin_num: skinNum });
      setChampions(champions.map(c => c.id === skinModal.champId ? { ...c, skin_num: skinNum } : c));
      setSkinModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = () => {
    axios.get('/api/favorites')
      .then(res => {
        setChampions(res.data);
        if (user?.riot_name && user?.riot_tag) {
          axios.get('/api/favorites/masteries')
            .then(mRes => setMasteryData(mRes.data))
            .catch(err => console.error(err));
        }
      })
      .catch(err => console.error("Error fetching favorites: ", err))
      .finally(() => setLoading(false));
  };

  const removeFavorite = async (id: number) => {
    try {
      await axios.delete(`/api/favorites/${id}`);
      setChampions(champions.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center text-gold text-2xl mt-10">Cargando favoritos...</div>;
  }

  const filteredChampions = champions.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "Todos" || c.role.includes(roleFilter);
    return matchSearch && matchRole;
  }).sort((a, b) => {
    if (sortBy === "nombre") return a.name.localeCompare(b.name);
    if (sortBy === "maestria") {
      const pA = masteryData[a.id]?.points || 0;
      const pB = masteryData[b.id]?.points || 0;
      return pB - pA;
    }
    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-border-color pb-4">
        <h1 className="text-3xl font-bold text-gold">Mis Campeones Favoritos</h1>
      </div>

      {(!user?.riot_name || !user?.riot_tag) && (
        <div className="mb-8 bg-dark-blue/80 border border-gold/30 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-gold font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">⚠️</span> ¡Vincula tu cuenta de Riot!
            </h3>
            <p className="text-gray-300 text-sm mt-1">Conecta tu Riot ID en tu perfil para desbloquear tus estadísticas de maestría y poder ver cómo juegas con tus favoritos.</p>
          </div>
          <button onClick={() => navigate('/profile')} className="bg-gradient-to-r from-gold to-yellow-500 text-black font-black px-6 py-2.5 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(200,170,110,0.4)] whitespace-nowrap">
            Ir al Perfil
          </button>
        </div>
      )}

      {/* Buscador y Filtros */}
      {champions.length > 0 && (
        <div className="relative z-50 bg-medium-blue/80 border border-gold/30 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg backdrop-blur-sm">
          <div className="w-full md:w-1/3 relative">
            <input 
              type="text" 
              placeholder="Buscar campeón..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-dark-blue border border-border-color rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-gold transition pl-11 shadow-inner"
            />
            <span className="absolute left-3.5 top-3 text-gray-400">🔍</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-[400px]">
            <div className="w-full md:w-1/2 relative z-50">
               <CustomSelect 
                 value={roleFilter}
                 onChange={(val) => setRoleFilter(val)}
                 options={[
                   { value: 'Todos', label: 'Todos los roles' },
                   { value: 'Assassin', label: 'Asesino' },
                   { value: 'Fighter', label: 'Luchador' },
                   { value: 'Mage', label: 'Mago' },
                   { value: 'Marksman', label: 'Tirador' },
                   { value: 'Support', label: 'Apoyo' },
                   { value: 'Tank', label: 'Tanque' }
                 ]}
               />
            </div>
            <div className="w-full md:w-1/2 relative z-40">
               <CustomSelect 
                 value={sortBy}
                 onChange={(val) => setSortBy(val)}
                 options={[
                   { value: 'recientes', label: 'Recientes' },
                   { value: 'nombre', label: 'Nombre (A-Z)' },
                   { value: 'maestria', label: 'Mayor Maestría' }
                 ]}
               />
            </div>
          </div>
        </div>
      )}

      {champions.length === 0 ? (
        <div className="text-center bg-medium-blue border border-border-color p-12 rounded-lg">
          <p className="text-gray-400 text-lg">Aún no tienes campeones en tus favoritos.</p>
        </div>
      ) : filteredChampions.length === 0 ? (
        <div className="text-center bg-medium-blue border border-border-color p-12 rounded-lg">
          <p className="text-gray-400 text-lg">No hay campeones que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredChampions.map(c => {
            const champIdString = c.image_url.split('_centered')[0].split('.png')[0];
            const imgUrl = (c.skin_num && c.skin_num > 0) 
              ? `https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${champIdString}_${c.skin_num}.jpg`
              : `/img/champions/${c.image_url}`;
              
            return (
              <div key={c.id} className="relative bg-medium-blue border border-gold rounded-lg overflow-hidden shadow-[0_0_15px_rgba(200,170,110,0.3)] hover:shadow-gold/60 transition group">
                <button 
                  onClick={() => removeFavorite(c.id)}
                  className="absolute top-2 right-2 bg-loss text-white w-8 h-8 rounded-full z-10 opacity-0 group-hover:opacity-100 hover:bg-loss-border transition flex items-center justify-center font-bold"
                  title="Eliminar"
                >
                  ✕
                </button>
                <button 
                  onClick={() => setSkinModal({ champId: c.id, champIdString, champName: c.name })}
                  className="absolute top-2 left-2 bg-black/60 text-gold border border-gold/30 px-3 py-1.5 rounded-lg text-xs z-10 opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-black transition-all font-black shadow-lg backdrop-blur-sm"
                >
                  🖌️ Aspecto
                </button>
                <img 
                  src={imgUrl} 
                  alt={c.name} 
                  className="w-full h-64 object-cover object-top group-hover:scale-105 transition duration-300"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Image' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pt-16">
                <h3 className="text-2xl font-black text-gold mt-2 shadow-black drop-shadow-md">{c.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs italic text-gray-300 drop-shadow-md truncate font-medium mr-2">{c.title}</p>
                  <span className="bg-medium-blue/90 px-2 py-0.5 rounded text-bright-blue text-[10px] uppercase font-bold tracking-wider border border-border-color">{c.role}</span>
                </div>
                {user?.riot_name && user?.riot_tag && <MasteryBadge mastery={masteryData[c.id]} />}
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Skin Selector Modal */}
      {skinModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-medium-blue to-dark-blue border-2 border-gold/50 rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(200,170,110,0.2)]">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-medium-blue/90 backdrop-blur-md p-4 rounded-xl border border-white/10 z-20">
              <h2 className="text-3xl font-black text-gold drop-shadow-md">Skins de {skinModal.champName}</h2>
              <button onClick={() => setSkinModal(null)} className="text-gray-400 hover:text-white text-4xl leading-none font-bold transition-transform hover:rotate-90">&times;</button>
            </div>
            
            {loadingSkins ? (
              <div className="text-center text-gold py-20 text-xl font-bold animate-pulse">Cargando skins...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableSkins.map(skin => (
                  <div key={skin.id} onClick={() => selectSkin(skin.num)} className="relative group cursor-pointer border-2 border-white/5 hover:border-gold rounded-xl overflow-hidden transition-all shadow-lg bg-black">
                    <img src={`https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${skinModal.champIdString}_${skin.num}.jpg`} alt={skin.name} className="w-full h-48 object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                      <span className="font-bold text-white group-hover:text-gold transition-colors text-lg drop-shadow-lg">
                        {skin.name === 'default' ? 'Aspecto Original' : skin.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
