import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Champion {
  id: number;
  name: string;
  title: string;
  description: string;
  role: string;
  image_url: string;
  recurso: string;
}

const REGION_MAP: Record<string, string> = {
  "Darius": "Noxus", "Katarina": "Noxus", "Draven": "Noxus", "Sion": "Noxus", "Swain": "Noxus", "Talon": "Noxus", "Vladimir": "Noxus", "Cassiopeia": "Noxus", "Kled": "Noxus", "Samira": "Noxus", "Rell": "Noxus", "Briar": "Noxus",
  "Garen": "Demacia", "Lux": "Demacia", "JarvanIV": "Demacia", "XinZhao": "Demacia", "Fiora": "Demacia", "Vayne": "Demacia", "Lucian": "Demacia", "Quinn": "Demacia", "Sylas": "Demacia", "Kayle": "Demacia", "Morgana": "Demacia", "Galio": "Demacia", "Sona": "Demacia", "Poppy": "Demacia", "Shyvana": "Demacia",
  "Ahri": "Ionia", "Akali": "Ionia", "Irelia": "Ionia", "Yasuo": "Ionia", "Yone": "Ionia", "Zed": "Ionia", "Shen": "Ionia", "Kennen": "Ionia", "LeeSin": "Ionia", "MasterYi": "Ionia", "Wukong": "Ionia", "Karma": "Ionia", "Syndra": "Ionia", "Varus": "Ionia", "Xayah": "Ionia", "Rakan": "Ionia", "Sett": "Ionia", "Lillia": "Ionia", "Ivern": "Ionia", "Jhin": "Ionia",
  "Caitlyn": "Piltover", "Vi": "Piltover", "Jayce": "Piltover", "Ezreal": "Piltover", "Orianna": "Piltover", "Heimerdinger": "Piltover", "Seraphine": "Piltover",
  "Jinx": "Zaun", "Ekko": "Zaun", "Warwick": "Zaun", "Singed": "Zaun", "Twitch": "Zaun", "DrMundo": "Zaun", "Urgot": "Zaun", "Viktor": "Zaun", "Zac": "Zaun", "Zeri": "Zaun", "Renata": "Zaun",
  "Ashe": "Freljord", "Sejuani": "Freljord", "Lissandra": "Freljord", "Braum": "Freljord", "Nunu": "Freljord", "Ornn": "Freljord", "Volibear": "Freljord", "Trundle": "Freljord", "Tryndamere": "Freljord", "Udyr": "Freljord", "Anivia": "Freljord",
  "Thresh": "Shadow Isles", "Viego": "Shadow Isles", "Hecarim": "Shadow Isles", "Karthus": "Shadow Isles", "Kalista": "Shadow Isles", "Gwen": "Shadow Isles", "Maokai": "Shadow Isles", "Yorick": "Shadow Isles", "Evelynn": "Shadow Isles",
  "Azir": "Shurima", "Nasus": "Shurima", "Renekton": "Shurima", "Sivir": "Shurima", "Amumu": "Shurima", "Rammus": "Shurima", "Xerath": "Shurima", "Taliyah": "Shurima", "KSante": "Shurima", "Akshan": "Shurima",
  "Leona": "Targon", "Diana": "Targon", "Pantheon": "Targon", "Zoe": "Targon", "Taric": "Targon", "Aphelios": "Targon", "AurelionSol": "Targon", "Soraka": "Targon",
  "MissFortune": "Bilgewater", "Gangplank": "Bilgewater", "Graves": "Bilgewater", "TwistedFate": "Bilgewater", "Pyke": "Bilgewater", "Nilah": "Bilgewater", "Illaoi": "Bilgewater", "Nautilus": "Bilgewater", "TahmKench": "Bilgewater",
  "Qiyana": "Ixtal", "Nidalee": "Ixtal", "Neeko": "Ixtal", "Rengar": "Ixtal", "Zyra": "Ixtal", "Malphite": "Ixtal", "Milio": "Ixtal",
  "KhaZix": "Void", "KaiSa": "Void", "Kassadin": "Void", "Malzahar": "Void", "ChoGath": "Void", "KogMaw": "Void", "RekSai": "Void", "VelKoz": "Void", "BelVeth": "Void",
  "Teemo": "Bandle City", "Tristana": "Bandle City", "Lulu": "Bandle City", "Veigar": "Bandle City", "Rumble": "Bandle City", "Corki": "Bandle City", "Yuumi": "Bandle City", "Vex": "Bandle City",
};

const LANE_MAP: Record<string, string[]> = {
  "Aatrox": ["Top"], "Camille": ["Top"], "Darius": ["Top"], "Fiora": ["Top"], "Garen": ["Top"], "Gnar": ["Top"], "Gwen": ["Top"], "Illaoi": ["Top"], "Irelia": ["Top", "Mid"], "Jax": ["Top", "Jungle"], "Jayce": ["Top", "Mid"], "KSante": ["Top"], "Kayle": ["Top"], "Kennen": ["Top"], "Kled": ["Top"], "Malphite": ["Top"], "Mordekaiser": ["Top"], "Nasus": ["Top"], "Ornn": ["Top"], "Pantheon": ["Top", "Mid", "Support"], "Poppy": ["Top", "Jungle"], "Quinn": ["Top"], "Renekton": ["Top"], "Riven": ["Top"], "Rumble": ["Top", "Mid"], "Sett": ["Top"], "Shen": ["Top"], "Singed": ["Top"], "Sion": ["Top"], "TahmKench": ["Top", "Support"], "Teemo": ["Top"], "Trundle": ["Top", "Jungle"], "Tryndamere": ["Top"], "Urgot": ["Top"], "Vayne": ["ADC", "Top"], "Volibear": ["Top", "Jungle"], "Wukong": ["Top", "Jungle"], "Yasuo": ["Mid", "Top"], "Yone": ["Mid", "Top"], "Yorick": ["Top"],
  "Amumu": ["Jungle"], "BelVeth": ["Jungle"], "Briar": ["Jungle"], "Diana": ["Jungle", "Mid"], "Evelynn": ["Jungle"], "Fiddlesticks": ["Jungle"], "Gragas": ["Jungle", "Top"], "Graves": ["Jungle"], "Hecarim": ["Jungle"], "Ivern": ["Jungle"], "JarvanIV": ["Jungle"], "Karthus": ["Jungle", "ADC"], "Kayn": ["Jungle"], "KhaZix": ["Jungle"], "Kindred": ["Jungle"], "LeeSin": ["Jungle"], "Lillia": ["Jungle"], "MasterYi": ["Jungle"], "Nidalee": ["Jungle"], "Nocturne": ["Jungle"], "Nunu": ["Jungle"], "Rammus": ["Jungle"], "RekSai": ["Jungle"], "Rengar": ["Jungle"], "Sejuani": ["Jungle"], "Shaco": ["Jungle"], "Shyvana": ["Jungle"], "Skarner": ["Jungle"], "Talon": ["Mid", "Jungle"], "Udyr": ["Jungle"], "Vi": ["Jungle"], "Viego": ["Jungle"], "Warwick": ["Jungle", "Top"], "XinZhao": ["Jungle"], "Zac": ["Jungle"],
  "Ahri": ["Mid"], "Akali": ["Mid", "Top"], "Akshan": ["Mid", "Top"], "Anivia": ["Mid"], "Annie": ["Mid", "Support"], "AurelionSol": ["Mid"], "Azir": ["Mid"], "Cassiopeia": ["Mid"], "Corki": ["Mid"], "Ekko": ["Mid", "Jungle"], "Fizz": ["Mid"], "Galio": ["Mid", "Support"], "Heimerdinger": ["Mid"], "Hwei": ["Mid"], "Kassadin": ["Mid"], "Katarina": ["Mid"], "LeBlanc": ["Mid"], "Lissandra": ["Mid"], "Lux": ["Mid", "Support"], "Malzahar": ["Mid"], "Naafiri": ["Mid"], "Neeko": ["Mid", "Support"], "Orianna": ["Mid"], "Qiyana": ["Mid"], "Ryze": ["Mid", "Top"], "Smolder": ["ADC", "Mid"], "Sylas": ["Mid", "Top"], "Syndra": ["Mid"], "Taliyah": ["Mid", "Jungle"], "TwistedFate": ["Mid"], "Veigar": ["Mid"], "VelKoz": ["Mid", "Support"], "Vex": ["Mid"], "Viktor": ["Mid"], "Vladimir": ["Mid", "Top"], "Xerath": ["Mid", "Support"], "Zed": ["Mid"], "Ziggs": ["Mid", "ADC"], "Zoe": ["Mid"],
  "Aphelios": ["ADC"], "Ashe": ["ADC", "Support"], "Caitlyn": ["ADC"], "Draven": ["ADC"], "Ezreal": ["ADC"], "Jhin": ["ADC"], "Jinx": ["ADC"], "KaiSa": ["ADC"], "Kalista": ["ADC"], "KogMaw": ["ADC"], "Lucian": ["ADC", "Mid"], "MissFortune": ["ADC"], "Nilah": ["ADC"], "Samira": ["ADC"], "Sivir": ["ADC"], "Tristana": ["ADC", "Mid"], "Twitch": ["ADC"], "Varus": ["ADC"], "Xayah": ["ADC"], "Zeri": ["ADC"],
  "Alistar": ["Support"], "Bard": ["Support"], "Blitzcrank": ["Support"], "Braum": ["Support"], "Janna": ["Support"], "Karma": ["Support"], "Leona": ["Support"], "Lulu": ["Support"], "Milio": ["Support"], "Morgana": ["Support", "Jungle"], "Nami": ["Support"], "Nautilus": ["Support"], "Pyke": ["Support"], "Rakan": ["Support"], "Rell": ["Support"], "Renata": ["Support"], "Senna": ["Support", "ADC"], "Seraphine": ["Support", "Mid"], "Sona": ["Support"], "Soraka": ["Support"], "Swain": ["Support", "Mid"], "Taric": ["Support"], "Thresh": ["Support"], "Yuumi": ["Support"], "Zilean": ["Support", "Mid"], "Zyra": ["Support", "Mid"],
};

export default function Home() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [regionFilter, setRegionFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [laneFilter, setLaneFilter] = useState('Todos');

  // Modal State
  const [selectedChamp, setSelectedChamp] = useState<Champion | null>(null);
  const [champDetails, setChampDetails] = useState<any>(null);
  const [champDetailsError, setChampDetailsError] = useState(false);
  const [activeSpellIdx, setActiveSpellIdx] = useState<number>(0); // 0-3 for Spells, 4 for Passive
  const [activeSkinIdx, setActiveSkinIdx] = useState<number>(0);
  const [modalMode, setModalMode] = useState<'habilidades' | 'skins'>('habilidades');

  useEffect(() => {
    axios.get('/api/champions')
      .then(res => setChampions(res.data))
      .catch(err => console.error("Error fetching champions: ", err))
      .finally(() => setLoading(false));
      
    if (user) {
      axios.get('/api/favorites')
        .then(res => setFavoriteIds(res.data.map((f: any) => f.id)))
        .catch(err => console.error("Error fetching favorites: ", err));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 h-64">
         <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6"></div>
         <div className="text-gold font-bold text-2xl animate-pulse tracking-widest">CARGANDO CAMPEONES...</div>
      </div>
    );
  }

  const handleToggleFavorite = async (e: React.MouseEvent, champId: number) => {
    e.stopPropagation(); // Prevenir que se abra el modal
    if (!user) {
      return alert("Inicia sesión para añadir favoritos.");
    }
    
    try {
      if (favoriteIds.includes(champId)) {
        await axios.delete(`/api/favorites/${champId}`);
        setFavoriteIds(prev => prev.filter(id => id !== champId));
      } else {
        await axios.post('/api/favorites', { champ_id: champId }, { withCredentials: true });
        setFavoriteIds(prev => [...prev, champId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetails = async (c: Champion, defaultMode: 'habilidades' | 'skins' = 'habilidades') => {
    setSelectedChamp(c);
    setChampDetails(null);
    setChampDetailsError(false);
    setActiveSpellIdx(0);
    setActiveSkinIdx(0);
    setModalMode(defaultMode);
    
    // Extract exact identifier used in DataDragon JSON from our local image filename (e.g. Aatrox_centered.jpg -> Aatrox)
    const ddragonId = c.image_url.split('_')[0].split('.')[0];
    
    try {
       // Use fetch to avoid axios globally appending withCredentials=true, which breaks CORS on Ddragon
       const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/16.6.1/data/es_ES/champion/${ddragonId}.json`);
       if (!res.ok) throw new Error('Network response was not ok');
       const data = await res.json();
       setChampDetails(data.data[ddragonId]);
    } catch (err) {
       console.error(err);
       setChampDetailsError(true);
    }
  };

  const closeModal = () => {
    setSelectedChamp(null);
    setChampDetails(null);
    setChampDetailsError(false);
  };

  const getSpellVideoUrl = () => {
    if (!champDetails) return '';
    const paddedKey = champDetails.key.toString().padStart(4, '0');
    // For abilities Array [Q, W, E, R]. Index 4 is Passive.
    const suffixes = ['Q1', 'W1', 'E1', 'R1', 'P1'];
    return `https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${paddedKey}/ability_${paddedKey}_${suffixes[activeSpellIdx]}.webm`;
  };

  const filteredChampions = champions
    .filter(c => {
      // Name Search
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Role Filter (Riot tags API)
      if (roleFilter !== 'Todos' && !c.role.includes(roleFilter)) return false;
      
      // Region Filter (Static Map)
      if (regionFilter !== 'Todos') {
        const charNameKey = c.name.replace(/\s+/g, '').replace(/'/g, ''); // K'Sante -> KSante
        const charRegion = REGION_MAP[charNameKey] || "Runaterra / Otros";
        if (regionFilter === "Runaterra / Otros" && Object.values(REGION_MAP).includes(charRegion)) return false; // si no es runaterra pero filtramos por runaterra
        if (regionFilter !== "Runaterra / Otros" && charRegion !== regionFilter) return false;
      }
      
      // Lane Filter (Static Map)
      if (laneFilter !== 'Todos') {
        const charNameKey = c.name.replace(/\s+/g, '').replace(/'/g, '');
        const charLanes = LANE_MAP[charNameKey] || [];
        if (!charLanes.includes(laneFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b border-border-color pb-4">
        <h1 className="text-3xl font-black text-gold tracking-wide">Todos los Campeones</h1>
        <button onClick={() => window.open('/api/update-db/es_ES')} className="bg-medium-blue border-2 border-gold/50 text-gold font-bold hover:bg-gold hover:text-dark-blue px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-[0_0_15px_rgba(255,215,0,0.4)]">
          Actualizar BDD
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-gradient-to-br from-dark-blue to-medium-blue border-2 border-gold/40 rounded-3xl p-6 md:p-8 mb-10 shadow-[0_15px_35px_-5px_rgba(201,170,113,0.15)] flex flex-wrap gap-5 items-end relative overflow-hidden transition-all duration-300 hover:border-gold/60">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-[40px] -mr-10 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-bright-blue/10 rounded-full blur-2xl -mb-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>

        <div className="flex-1 w-full min-w-[200px] z-10 transition-transform hover:-translate-y-1 duration-300">
          <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-md">🔍 Buscar Invocador o Campeón</label>
          <input 
            type="text" 
            placeholder="Ej: Aatrox" 
            className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold focus:ring-4 focus:ring-gold/20 outline-none transition-all placeholder-gray-500 font-bold backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-[130px] z-10 transition-transform hover:-translate-y-1 duration-300">
          <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-md">✨ Orden</label>
          <select 
            className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold focus:ring-4 focus:ring-gold/20 outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">A - Z</option>
            <option value="desc">Z - A</option>
          </select>
        </div>

        <div className="w-full sm:w-[150px] z-10 transition-transform hover:-translate-y-1 duration-300">
          <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-md">⚔️ Clase</label>
          <select 
            className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold focus:ring-4 focus:ring-gold/20 outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Todos">Todas</option>
            <option value="Tank">🛡️ Tanque</option>
            <option value="Fighter">💪 Bruiser</option>
            <option value="Marksman">🏹 Tirador</option>
            <option value="Mage">🔮 Mago</option>
            <option value="Assassin">🗡️ Asesino</option>
            <option value="Support">💖 Apoyo</option>
          </select>
        </div>

        <div className="w-full sm:w-[140px] z-10 transition-transform hover:-translate-y-1 duration-300">
          <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-md">🗺️ Línea</label>
          <select 
            className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold focus:ring-4 focus:ring-gold/20 outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm"
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
          >
            <option value="Todos">Cualquiera</option>
            <option value="Top">Top</option>
            <option value="Jungle">Jungla</option>
            <option value="Mid">Mid</option>
            <option value="ADC">ADC</option>
            <option value="Support">Supp</option>
          </select>
        </div>

        <div className="w-full sm:w-[180px] z-10 transition-transform hover:-translate-y-1 duration-300">
          <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-md">🌍 Región</label>
          <select 
            className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold focus:ring-4 focus:ring-gold/20 outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="Todos">Cualquiera</option>
            <option value="Demacia">Demacia</option>
            <option value="Noxus">Noxus</option>
            <option value="Ionia">Ionia</option>
            <option value="Piltover">Piltover</option>
            <option value="Zaun">Zaun</option>
            <option value="Freljord">Freljord</option>
            <option value="Shadow Isles">Islas de la Sombra</option>
            <option value="Shurima">Shurima</option>
            <option value="Targon">Targon</option>
            <option value="Bilgewater">Aguas Estancadas</option>
            <option value="Ixtal">Ixtal</option>
            <option value="Void">El Vacío</option>
            <option value="Bandle City">C. de Bandle</option>
            <option value="Runaterra / Otros">Otras</option>
          </select>
        </div>
      </div>

      {/* Champions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredChampions.map(c => (
          <div 
            key={c.id} 
            onClick={() => handleOpenDetails(c, 'habilidades')}
            className="bg-medium-blue border-2 border-transparent hover:border-gold/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all cursor-pointer group flex flex-col h-full relative"
          >
            {/* Star Favorite Button */}
            <button 
              onClick={(e) => handleToggleFavorite(e, c.id)}
              className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 hover:scale-110 transition-all text-2xl backdrop-blur-sm border border-white/5 pb-1"
              title={favoriteIds.includes(c.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              {favoriteIds.includes(c.id) ? (
                <span className="text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-none">★</span>
              ) : (
                <span className="text-white/50 hover:text-gold transition-colors leading-none">☆</span>
              )}
            </button>

            <div className="relative overflow-hidden w-full pt-[56.25%] bg-dark-blue">
               <img 
                 src={`/img/champions/${c.image_url}`} 
                 alt={c.name} 
                 className="absolute top-0 left-0 w-full h-full object-cover object-top group-hover:scale-110 transition duration-500"
                 onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x225?text=No+Image' }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-transparent to-transparent opacity-90"></div>
               <h3 className="absolute bottom-3 left-4 text-2xl font-black text-white drop-shadow-md tracking-wide group-hover:text-gold transition-colors">{c.name}</h3>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <p className="text-sm italic text-gray-400 mb-4 font-bold truncate">{c.title}</p>
              
              <div className="flex justify-between items-center text-xs mb-4">
                <span className="bg-black/40 px-3 py-1.5 rounded-lg text-bright-blue font-black tracking-wider">{c.role}</span>
                <span className="bg-black/40 px-3 py-1.5 rounded-lg text-gray-300 font-bold uppercase tracking-wider truncate max-w-[50%] text-right">{c.recurso}</span>
              </div>
              
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed flex-1 mb-5">{c.description}</p>
              
              <div className="mt-auto border-t border-white/5 pt-4 flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenDetails(c, 'habilidades'); }}
                  className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-bright-blue hover:border-bright-blue hover:text-white font-black py-2.5 rounded-xl text-xs sm:text-sm transition-all tracking-wider uppercase"
                >
                  Habilidades
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenDetails(c, 'skins'); }}
                  className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-gold hover:border-gold hover:text-dark-blue font-black py-2.5 rounded-xl text-xs sm:text-sm transition-all tracking-wider uppercase"
                >
                  Skins
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredChampions.length === 0 && (
        <div className="text-center font-bold text-gray-400 mt-16 text-xl">
          No se encontraron campeones con esos filtros.
        </div>
      )}

      {/* Champion Details Modal */}
      {selectedChamp && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-6" onClick={closeModal}>
          <div className="bg-dark-blue border-2 border-gold/30 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(255,215,0,0.1)] relative" onClick={e => e.stopPropagation()}>
            
            {/* TABS HEADER */}
            <div className="absolute top-0 w-full z-30 flex justify-between items-start pt-6 px-6 pointer-events-none">
              <div className="flex gap-4 bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
                <button 
                  className={`px-6 py-2 rounded-xl font-black uppercase tracking-wider text-sm transition-colors ${modalMode === 'habilidades' ? 'bg-gold text-dark-blue' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  onClick={() => setModalMode('habilidades')}
                >
                  Habilidades
                </button>
                <button 
                  className={`px-6 py-2 rounded-xl font-black uppercase tracking-wider text-sm transition-colors ${modalMode === 'skins' ? 'bg-gold text-dark-blue' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  onClick={() => setModalMode('skins')}
                >
                  Skins
                </button>
              </div>
              <button onClick={closeModal} className="bg-black/60 backdrop-blur-xl border border-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl hover:bg-red-500 hover:text-white transition-colors pointer-events-auto">X</button>
            </div>

            {/* ERROR O CARGA (solo importante para las requests) */}
            {champDetailsError ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                   <span className="text-5xl mb-4">⚠️</span>
                   <p className="font-bold text-red-400 text-xl">Error al cargar la API oficial de Riot Games.</p>
                   <p className="text-gray-500 text-sm mt-2">Intenta cerrando y abriendo de nuevo.</p>
                </div>
              ) : !champDetails ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                   <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6"></div>
                   <p className="font-bold text-gold tracking-widest text-xl animate-pulse">CARGANDO...</p>
                </div>
              ) : (

              <>
              {/* VISTA HABILIDADES */}
              {modalMode === 'habilidades' && (
                <div className="flex flex-col h-full max-h-full">
                  {/* Hero Image Habilidades */}
                  <div className="h-56 sm:h-72 relative shrink-0">
                     <img 
                       src={`/img/champions/${selectedChamp.image_url}`} 
                       alt={selectedChamp.name} 
                       className="w-full h-full object-cover object-top"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/80 to-transparent"></div>
                     <div className="absolute inset-0 bg-black/20"></div>
                     <div className="absolute bottom-0 left-0 p-8 w-full z-10 flex items-end">
                       <div>
                          <h2 className="text-5xl font-black text-white drop-shadow-xl tracking-tight leading-none">{selectedChamp.name}</h2>
                          <p className="text-xl text-gold italic font-bold tracking-wide mt-2 drop-shadow-md">{selectedChamp.title}</p>
                       </div>
                     </div>
                  </div>

                  {/* Contenido Habilidades */}
                  <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 pb-10">
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 xl:gap-12">
                      {/* Menu */}
                      <div className="xl:col-span-2 flex flex-col gap-3">
                        {/* Pasiva */}
                        <button 
                          onClick={() => setActiveSpellIdx(4)}
                          className={`flex items-center gap-5 p-4 rounded-2xl transition-all border-2 text-left ${activeSpellIdx === 4 ? 'bg-gradient-to-r from-gold/20 to-transparent border-gold/50 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'bg-black/40 border-transparent hover:bg-black/60'}`}
                        >
                           <img src={`https://ddragon.leagueoflegends.com/cdn/16.6.1/img/passive/${champDetails.passive.image.full}`} alt="Pasiva" className="w-14 h-14 rounded-xl shadow-md border border-black" />
                           <div>
                             <span className={`text-[11px] font-black uppercase tracking-widest ${activeSpellIdx === 4 ? 'text-gold' : 'text-gray-500'}`}>Pasiva</span>
                             <h4 className={`font-bold text-lg leading-tight truncate ${activeSpellIdx === 4 ? 'text-white' : 'text-gray-300'}`}>{champDetails.passive.name}</h4>
                           </div>
                        </button>

                        {/* Spells Q W E R */}
                        {['Q', 'W', 'E', 'R'].map((key, idx) => {
                          const spell = champDetails.spells[idx];
                          const isActive = activeSpellIdx === idx;
                          return (
                            <button 
                              key={key}
                              onClick={() => setActiveSpellIdx(idx)}
                              className={`flex items-center gap-5 p-4 rounded-2xl transition-all border-2 text-left ${isActive ? 'bg-gradient-to-r from-gold/20 to-transparent border-gold/50 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'bg-black/40 border-transparent hover:bg-black/60'}`}
                            >
                              <div className="relative shrink-0">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.6.1/img/spell/${spell.image.full}`} alt={key} className="w-14 h-14 rounded-xl shadow-md border border-black" />
                                <div className={`absolute -bottom-2 -right-2 border-2 ${isActive ? 'bg-gold border-dark-blue text-dark-blue' : 'bg-dark-blue border-bright-blue text-bright-blue'} w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg transition-colors`}>{key}</div>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h4 className={`font-bold text-lg leading-tight truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{spell.name}</h4>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Video & Desc */}
                      <div className="xl:col-span-3 flex flex-col gap-6">
                         <div className="bg-black rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative aspect-[16/9] group">
                            {/* Loading Placeholder underlying video */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                               <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                            </div>
                            <video 
                              key={getSpellVideoUrl()} 
                              autoPlay 
                              loop 
                              muted 
                              playsInline
                              className="absolute inset-0 w-full h-full object-cover z-10"
                              poster={`/img/champions/${selectedChamp.image_url}`}
                            >
                              <source src={getSpellVideoUrl()} type="video/webm" />
                              <source src={getSpellVideoUrl().replace('.webm', '.mp4')} type="video/mp4" />
                            </video>
                         </div>
                         
                         <div className="bg-gradient-to-br from-white/5 to-transparent p-6 sm:p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                              {activeSpellIdx === 4 ? champDetails.passive.name : champDetails.spells[activeSpellIdx].name}
                            </h3>
                            <div className="w-12 h-1 bg-gold rounded-full mb-6"></div>
                            <p 
                              className="text-gray-300 leading-relaxed text-base format-riot-html"
                              dangerouslySetInnerHTML={{ 
                                __html: activeSpellIdx === 4 ? champDetails.passive.description : champDetails.spells[activeSpellIdx].description 
                              }}
                            ></p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA SKINS */}
              {modalMode === 'skins' && (() => {
                const validSkins = champDetails.skins.filter((s: any) => {
                  if (s.name === 'default') return true;
                  const n = s.name.toLowerCase();
                  // Si tiene paréntesis, sospechamos que es un Chroma (ej: "Ahri florecer espiritual (zafiro)")
                  // Las excepciones suelen ser las Ediciones de Prestigio que SÍ tienen splash art.
                  if (n.includes('(')) {
                    if (n.includes('prestigio') || n.includes('prestige') || n.includes('2022') || n.includes('edición')) {
                      return true;
                    }
                    return false; // Descartamos chromas con colores en paréntesis
                  }
                  return true;
                });
                const activeSkin = validSkins[activeSkinIdx] || validSkins[0];
                const skinDdragonId = selectedChamp.image_url.split('_')[0].split('.')[0];
                
                return (
                <div className="flex flex-col h-full max-h-full">
                   {/* Main Splah Art View */}
                   <div className="flex-1 relative bg-black shrink-0 min-h-[40vh] md:min-h-[60vh] overflow-hidden rounded-t-3xl border-b border-white/10 group">
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-0">
                         <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <img 
                        key={activeSkin.id}
                        src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${skinDdragonId}_${activeSkin.num}.jpg`}
                        alt={activeSkin.name}
                        className="absolute inset-0 w-full h-full object-cover object-top z-10 transition-transform duration-[10s] ease-linear group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/40 to-transparent z-20 pointer-events-none"></div>
                      
                      <div className="absolute bottom-10 left-10 z-30">
                         <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] tracking-tight">
                            {activeSkin.name === 'default' ? selectedChamp.name : activeSkin.name}
                         </h2>
                      </div>
                   </div>

                   {/* Thumbnails bar */}
                   <div className="h-40 md:h-48 bg-dark-blue p-6 shrink-0 overflow-x-auto custom-scrollbar flex gap-4 snap-x">
                      {validSkins.map((skin: any, idx: number) => {
                         const isActive = activeSkinIdx === idx;
                         return (
                           <div 
                             key={skin.id}
                             onClick={() => setActiveSkinIdx(idx)}
                             className={`relative h-full aspect-[16/9] rounded-xl overflow-hidden cursor-pointer shrink-0 snap-center transition-all ${isActive ? 'ring-4 ring-gold scale-100 opacity-100 shadow-[0_0_30px_rgba(255,215,0,0.4)]' : 'ring-2 ring-white/10 hover:ring-white/30 scale-95 opacity-60 hover:opacity-100'}`}
                           >
                             <img 
                               src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${skinDdragonId}_${skin.num}.jpg`}
                               alt={skin.name}
                               className="w-full h-full object-cover"
                               loading="lazy"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             <span className="absolute bottom-2 left-3 right-3 text-[10px] md:text-xs font-bold text-white truncate text-center">
                               {skin.name === 'default' ? 'Clásico' : skin.name}
                             </span>
                           </div>
                         );
                      })}
                   </div>
                </div>
                );
              })()}
              </>
              )}
          </div>
        </div>
      )}

    </div>
  );
}
