import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [regionFilter, setRegionFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [laneFilter, setLaneFilter] = useState('Todos');

  useEffect(() => {
    axios.get('/api/champions')
      .then(res => setChampions(res.data))
      .catch(err => console.error("Error fetching champions: ", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-gold text-2xl mt-10">Cargando campeones...</div>;
  }

  const handleAddFavorite = async (champId: number, name: string) => {
    try {
      await axios.post('/api/favorites', { champ_id: champId }, { withCredentials: true });
      alert(`¡${name} añadido a tus favoritos!`);
    } catch (err) {
      alert("Inicia sesión para añadir favoritos.");
    }
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
        <h1 className="text-3xl font-bold text-gold">Campeones Disponibles</h1>
        <button onClick={() => window.open('/api/update-db/es_ES')} className="bg-medium-blue border border-gold text-gold hover:bg-gold hover:text-dark-blue px-4 py-2 rounded transition">
          Actualizar Base de Datos
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-gradient-to-br from-dark-blue to-medium-blue border-2 border-gold/40 rounded-3xl p-6 md:p-8 mb-10 shadow-[0_15px_35px_-5px_rgba(201,170,113,0.15)] flex flex-wrap gap-5 items-end relative overflow-hidden transition-all duration-300 hover:border-gold/60">
        {/* Playful background element */}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredChampions.map(c => (
          <div key={c.id} className="bg-medium-blue border border-border-color rounded-lg overflow-hidden shadow-lg hover:shadow-gold/20 transition group">
             {/* Note: In Vite, images from public folder are accessed relative to root, but Flask downloaded them to frontend/public/img/champions */}
            <img 
              src={`/img/champions/${c.image_url}`} 
              alt={c.name} 
              className="w-full h-48 object-cover object-top group-hover:scale-105 transition duration-300"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Image' }}
            />
            <div className="p-4">
              <h3 className="text-xl font-bold text-gold">{c.name}</h3>
              <p className="text-sm italic text-gray-400 mb-2">{c.title}</p>
              <div className="flex justify-between text-xs mb-3">
                <span className="bg-dark-blue px-2 py-1 rounded text-bright-blue border border-border-color">{c.role}</span>
                <span className="bg-dark-blue px-2 py-1 rounded text-gray-300 border border-border-color">{c.recurso}</span>
              </div>
              <p className="text-sm text-text-color line-clamp-3">{c.description}</p>
              <div className="flex justify-between items-center mt-3 border-t border-border-color pt-3">
                <button 
                  onClick={() => handleAddFavorite(c.id, c.name)}
                  className="w-full bg-border-color text-gold hover:bg-gold hover:text-dark-blue font-bold py-2 rounded text-sm transition"
                >
                  ★ Añadir a Favoritos
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredChampions.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No se encontraron campeones con esos filtros.
        </div>
      )}
    </div>
  );
}
