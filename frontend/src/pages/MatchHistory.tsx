import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Match {
  gameMode: string;
  gameDuration: number;
  game_timestamp: number;
  game_date: string;
  win: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  cs?: number;
  gold?: number;
  teams?: TeamData[];
  items?: number[];
}

interface TeamData {
  id: string;
  color_class: string;
  players: PlayerData[];
  objectives: {
    baron: number;
    dragon: number;
    horde: number;
    riftHerald: number;
    tower: number;
  };
  total_kills: number;
}

interface PlayerData {
  name: string;
  tag: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  gold: number;
  gpm: string;
  damage: number;
  items?: number[];
}

const getDisplayMode = (mode: string) => {
  if (!mode) return 'Desconocido';
  const m = mode.toUpperCase();
  if (m === 'CHERRY') return 'Arena';
  if (m === 'ARAM_MAYHEM') return 'ARAM Caos';
  if (m === 'CLASSIC') return 'Grieta del Invocador';
  return m;
};

const hasObjectives = (mode: string) => {
  if (!mode) return false;
  const m = mode.toUpperCase();
  return m !== 'CHERRY' && m !== 'ARAM' && m !== 'ARAM_MAYHEM';
};

const getTeamStyle = (colorClass: string) => {
  switch (colorClass) {
    case 'team-blue': return 'bg-gradient-to-br from-blue-900/60 to-blue-900/20 border-2 border-blue-500/30';
    case 'team-red': return 'bg-gradient-to-br from-red-900/60 to-red-900/20 border-2 border-red-500/30';
    case 'pool-yellow': return 'bg-gradient-to-br from-yellow-900/60 to-yellow-900/20 border-2 border-yellow-500/30';
    case 'pool-blue': return 'bg-gradient-to-br from-sky-900/60 to-sky-900/20 border-2 border-sky-500/30';
    case 'pool-red': return 'bg-gradient-to-br from-rose-900/60 to-rose-900/20 border-2 border-rose-500/30';
    case 'pool-green': return 'bg-gradient-to-br from-green-900/60 to-green-900/20 border-2 border-green-500/30';
    case 'pool-orange': return 'bg-gradient-to-br from-orange-900/60 to-orange-900/20 border-2 border-orange-500/30';
    case 'pool-purple': return 'bg-gradient-to-br from-purple-900/60 to-purple-900/20 border-2 border-purple-500/30';
    case 'pool-pink': return 'bg-gradient-to-br from-pink-900/60 to-pink-900/20 border-2 border-pink-500/30';
    case 'pool-aquamarine': return 'bg-gradient-to-br from-teal-900/60 to-teal-900/20 border-2 border-teal-500/30';
    default: return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600/30';
  }
};

const getTeamHeaderColor = (colorClass: string) => {
  switch (colorClass) {
    case 'team-blue': return 'text-blue-300';
    case 'team-red': return 'text-red-300';
    case 'pool-yellow': return 'text-yellow-300';
    case 'pool-blue': return 'text-sky-300';
    case 'pool-red': return 'text-rose-300';
    case 'pool-green': return 'text-green-300';
    case 'pool-orange': return 'text-orange-300';
    case 'pool-purple': return 'text-purple-300';
    case 'pool-pink': return 'text-pink-300';
    case 'pool-aquamarine': return 'text-teal-300';
    default: return 'text-gray-300';
  }
};

const getChampionImage = (champName: string) => {
  const name = champName === 'FiddleSticks' ? 'Fiddlesticks' : champName;
  return `https://ddragon.leagueoflegends.com/cdn/16.11.1/img/champion/${name}.png`;
};

const ItemIcon = ({ itemId }: { itemId: number }) => {
  if (!itemId || itemId === 0) {
    return <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black/50 border border-white/10 rounded-md"></div>;
  }
  return (
    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black/50 border border-white/10 rounded-md overflow-hidden flex items-center justify-center shadow-md relative group/item">
      <img 
        src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/item/${itemId}.png`} 
        alt={`Item ${itemId}`}
        className="w-full h-full object-cover"
        onError={(e) => { 
          if (!e.currentTarget.src.includes('communitydragon')) {
            e.currentTarget.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/${itemId}.png`;
          } else {
            e.currentTarget.style.display = 'none'; 
          }
        }}
      />
      <div className="absolute inset-0 hidden group-hover/item:flex items-center justify-center bg-black/80 text-[8px] font-bold text-white text-center break-words opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5">
        {itemId}
      </div>
    </div>
  );
};

const RANK_AVERAGES: Record<string, { kda: number; csPerMin: number; goldPerMin: number }> = {
  'Hierro': { kda: 1.8, csPerMin: 4.5, goldPerMin: 350 },
  'Bronce': { kda: 2.0, csPerMin: 5.0, goldPerMin: 370 },
  'Plata': { kda: 2.2, csPerMin: 5.5, goldPerMin: 390 },
  'Oro': { kda: 2.4, csPerMin: 6.0, goldPerMin: 410 },
  'Platino': { kda: 2.6, csPerMin: 6.5, goldPerMin: 430 },
  'Esmeralda': { kda: 2.8, csPerMin: 7.0, goldPerMin: 440 },
  'Diamante': { kda: 3.0, csPerMin: 7.5, goldPerMin: 450 },
  'Maestro+': { kda: 3.3, csPerMin: 8.2, goldPerMin: 480 },
};
const RANKS = Object.keys(RANK_AVERAGES);

export default function MatchHistory() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      axios.get('/api/friends', { withCredentials: true })
        .then(res => setFriends(res.data))
        .catch(err => console.error("Error fetching friends:", err));
    }
  }, [user]);
  
  React.useEffect(() => {
    const pName = searchParams.get('name');
    const pTag = searchParams.get('tag');
    if (pName && pTag && !data && !loading && gameName === '') {
      setGameName(pName);
      setTagLine(pTag);
      performSearch(pName, pTag);
    }
  }, [searchParams]);
  
  // Expanded & Filters State
  const [expandedMatchIndex, setExpandedMatchIndex] = useState<number | null>(null);
  const [isWinrateOpen, setIsWinrateOpen] = useState(false);
  const [filterChampion, setFilterChampion] = useState('');
  const [filterResult, setFilterResult] = useState('Todos');
  const [filterMode, setFilterMode] = useState('Todos');
  const [selectedRank, setSelectedRank] = useState('Oro');

  const toggleMatch = (idx: number) => {
    setExpandedMatchIndex(expandedMatchIndex === idx ? null : idx);
  };

  const performSearch = async (name: string, tag: string) => {
    if (!name || !tag) return;
    
    setGameName(name);
    setTagLine(tag);
    setLoading(true);
    setError('');
    setData(null);
    setExpandedMatchIndex(null);
    setIsWinrateOpen(false);
    
    try {
      const res = await axios.post('/api/match-history', {
        game_name: name,
        tag_line: tag
      });
      setData(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al buscar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(gameName, tagLine);
  };

  const winrateKeys = data ? Object.keys(data.winrates).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()) : [];

  const uniqueModes = useMemo(() => {
    if (!data?.matches) return [];
    return Array.from(new Set(data.matches.map((m: Match) => m.gameMode))) as string[];
  }, [data]);

  const filteredMatches = useMemo(() => {
    if (!data?.matches) return [];
    return data.matches.filter((m: Match) => {
      if (filterChampion && !m.championName.toLowerCase().includes(filterChampion.toLowerCase())) return false;
      if (filterResult === 'Victoria' && !m.win) return false;
      if (filterResult === 'Derrota' && m.win) return false;
      if (filterMode !== 'Todos' && m.gameMode !== filterMode) return false;
      return true;
    });
  }, [data, filterChampion, filterResult, filterMode]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20">
      <h1 className="text-3xl font-bold text-gold mb-8 text-center border-b border-border-color pb-4">
        Buscar Historial de Invocador
      </h1>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
        <input 
          type="text" 
          placeholder="Nombre (ej: Hide on bush)" 
          className="bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold w-full sm:w-64 font-bold outline-none transition-all"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          required
        />
        <div className="flex items-center text-gray-500 font-black px-2 text-xl">#</div>
        <input 
          type="text" 
          placeholder="Tag (ej: KR1)" 
          className="bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold w-full sm:w-32 font-bold outline-none transition-all"
          value={tagLine}
          onChange={e => setTagLine(e.target.value)}
          required
        />
        <button type="submit" className="bg-gradient-to-r from-gold to-yellow-500 text-dark-blue font-black px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* QUICK SEARCH */}
      {user && (
        <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-4xl mx-auto">
          {user.riot_name && user.riot_tag && (
            <button 
              onClick={() => performSearch(user.riot_name, user.riot_tag)}
              className="bg-medium-blue border border-gold/50 text-gold px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold hover:text-dark-blue transition-colors flex items-center gap-2 shadow-md"
            >
              <span>👤</span> Mi Perfil ({user.riot_name})
            </button>
          )}
          {friends.map(f => (
            <button 
              key={f.id}
              onClick={() => performSearch(f.name, f.tag)}
              className="bg-dark-blue/80 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold hover:border-gold hover:text-gold transition-colors flex items-center gap-2 shadow-md"
            >
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/16.11.1/img/profileicon/${f.profile_icon_id || 1}.png`} 
                className="w-5 h-5 rounded-full border border-gray-500"
                alt=""
              />
              {f.name}
            </button>
          ))}
        </div>
      )}

      {error && <div className="bg-loss/80 border-2 border-loss-border text-white font-bold p-4 rounded-xl mb-8 text-center">{error}</div>}

      {data && (
        <div className="space-y-8">
          {/* Player Header */}
          <div className="bg-gradient-to-r from-dark-blue to-medium-blue border-2 border-border-color p-6 rounded-2xl text-center shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h2 className="text-3xl font-black text-white tracking-wide relative z-10">
              {data.player.game_name} <span className="text-gray-400 text-xl font-medium">#{data.player.tag_line}</span>
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Winrate Collapsible */}
            <div className="bg-dark-blue/80 border border-border-color rounded-xl overflow-hidden transition-all duration-300 shadow-lg">
              <button 
                onClick={() => setIsWinrateOpen(!isWinrateOpen)}
                className="w-full flex justify-between items-center p-4 bg-medium-blue/50 hover:bg-medium-blue transition text-gold font-bold text-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span> 
                  <span>Winrate Diario</span>
                </div>
                <span className="text-sm bg-black/30 px-3 py-1 rounded-full">{isWinrateOpen ? 'Ocultar ▲' : 'Desplegar ▼'}</span>
              </button>
              
              {isWinrateOpen && (
                <div className="p-4 sm:p-6 bg-black/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {winrateKeys.map(date => (
                      <div key={date} className="flex justify-between items-center border border-white/5 bg-black/40 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] hover:bg-black/60 transition-colors">
                        <span className="text-gray-300 font-mono text-sm">{date}</span>
                        <div className="text-right">
                          <span className={`font-black tracking-wider text-xl ${data.winrates[date].pct >= 50 ? 'text-win-border' : 'text-loss-border'}`}>
                            {data.winrates[date].pct}%
                          </span>
                          <p className="text-xs text-gray-400 font-medium tracking-wide">{data.winrates[date].wins}W / {data.winrates[date].total - data.winrates[date].wins}L</p>
                        </div>
                      </div>
                    ))}
                    {winrateKeys.length === 0 && <p className="text-gray-500 text-center col-span-full">No hay datos suficientes.</p>}
                  </div>
                </div>
              )}
            </div>

            {/* KDA Trend Graph */}
            {data.matches && data.matches.length > 0 && (
              <div className="bg-gradient-to-br from-dark-blue/80 to-medium-blue/80 border border-gold/30 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <h3 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span> Tendencia de KDA (Últimas 10 partidas)
                </h3>
                <div className="flex items-end h-40 gap-2 overflow-x-auto pb-2">
                  {data.matches.slice(0, 10).reverse().map((m: Match, idx: number) => {
                    const kda = parseFloat(m.kda) || 0;
                    const heightPct = Math.min((kda / 15) * 100, 100);
                    const isWin = m.win;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 min-w-[40px] group">
                        <span className="text-xs text-white mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{kda.toFixed(1)}</span>
                        <div 
                          className={`w-full rounded-t-md transition-all duration-500 hover:opacity-80 ${isWin ? 'bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                          style={{ height: `${Math.max(5, heightPct)}%` }}
                        ></div>
                        <img 
                          src={getChampionImage(m.championName)} 
                          className="w-6 h-6 mt-2 rounded-full border border-white/20"
                          alt="champ"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-gradient-to-br from-dark-blue/80 to-medium-blue/80 border-2 border-gold/30 rounded-2xl p-5 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] flex flex-wrap gap-4 items-end relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

              <div className="flex-1 min-w-[200px] z-10 transition-transform hover:-translate-y-1 duration-300">
                <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-sm">🔍 Filtrar por Campeón</label>
                <input 
                  type="text" 
                  placeholder="Ej: Yone" 
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none transition-all placeholder-gray-500 font-bold backdrop-blur-sm focus:ring-4 focus:ring-gold/20"
                  value={filterChampion}
                  onChange={(e) => setFilterChampion(e.target.value)}
                />
              </div>
              
              <div className="w-[140px] z-10 transition-transform hover:-translate-y-1 duration-300">
                <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-sm">🏆 Resultado</label>
                <select 
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm focus:ring-4 focus:ring-gold/20"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Victoria">Victoria</option>
                  <option value="Derrota">Derrota</option>
                </select>
              </div>

              <div className="w-[150px] z-10 transition-transform hover:-translate-y-1 duration-300">
                <label className="block text-xs text-gold mb-2 uppercase font-black tracking-wider drop-shadow-sm">🎮 Modo</label>
                <select 
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none transition-all font-bold appearance-none cursor-pointer backdrop-blur-sm focus:ring-4 focus:ring-gold/20"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  {uniqueModes.map((m) => (
                    <option key={m} value={m}>{getDisplayMode(m)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Match List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gold border-b border-border-color pb-2 flex justify-between items-center">
                <span>Historial de Partidas</span>
                <span className="text-sm bg-black/30 px-3 py-1 rounded-full text-white">{filteredMatches.length} Resultados</span>
              </h3>
              
              {filteredMatches.length === 0 && (
                <div className="bg-black/30 border border-white/10 rounded-xl p-10 text-center">
                  <p className="text-gray-400 font-bold text-lg mb-2">No hay partidas que coincidan con los filtros.</p>
                  <button type="button" onClick={() => {setFilterChampion(''); setFilterResult('Todos'); setFilterMode('Todos');}} className="text-gold underline hover:text-white transition-colors cursor-pointer">Limpiar Filtros</button>
                </div>
              )}

              {filteredMatches.map((m: Match, idx: number) => (
                <div key={idx} className={`flex flex-col border-l-4 rounded-xl shadow-lg transition-transform ${m.win ? 'bg-win/20 border-win-border hover:bg-win/30' : 'bg-loss/20 border-loss-border hover:bg-loss/30'}`}>
                  {/* Default Header - Make it clickable */}
                  <div 
                    className="flex flex-col sm:flex-row items-start sm:items-center p-4 cursor-pointer transition-colors" 
                    onClick={() => toggleMatch(idx)}
                  >
                    <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
                      <img 
                        src={getChampionImage(m.championName)} 
                        alt={m.championName}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow-md border-2 border-black/50 mr-4"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64?text=?' }}
                      />
                      <div>
                        <h4 className="font-black text-lg text-gold tracking-wide drop-shadow-sm">{m.championName}</h4>
                        <p className={`font-black tracking-wider text-sm ${m.win ? 'text-win-border' : 'text-loss-border'}`}>
                          {m.win ? 'VICTORIA' : 'DERROTA'} <span className="text-gray-400 font-medium text-xs ml-2 py-0.5 px-2 bg-black/30 rounded-full">({getDisplayMode(m.gameMode)})</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="sm:ml-auto w-full sm:w-auto text-left sm:text-right bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                      <p className="text-gray-200 font-mono text-lg font-bold">
                        {m.kills} <span className="text-gray-600 font-normal">/</span> <span className="text-loss-border">{m.deaths}</span> <span className="text-gray-600 font-normal">/</span> {m.assists}
                      </p>
                      <p className="text-sm text-gray-400 font-medium">{m.kda} <span className="text-gray-500">KDA</span></p>
                      <p className="text-xs text-gray-500 mt-1">{m.game_date} - {Math.floor(m.gameDuration/60)}m</p>
                    </div>
                  </div>

                  {/* Main Player Items Block */}
                  <div className="px-4 pb-4 sm:px-6 sm:pb-5">
                    <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                      {m.items?.slice(0,6).map((itemId: number, i: number) => (
                        <ItemIcon key={i} itemId={itemId} />
                      ))}
                      {/* Trinket */}
                      <div className="ml-1 sm:ml-2">
                        <ItemIcon itemId={m.items?.[6] || 0} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {expandedMatchIndex === idx && m.teams && (
                    <div className="bg-black/60 p-4 sm:p-6 border-t font-sans border-white/5 text-sm rounded-b-xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]">
                      
                      {/* Comparativa Panel */}
                      {(() => {
                         const matchMinutes = m.gameDuration / 60;
                         const playerCsPerMin = matchMinutes > 0 ? (m.cs || 0) / matchMinutes : 0;
                         const playerGoldPerMin = matchMinutes > 0 ? (m.gold || 0) / matchMinutes : 0;
                         const playerKda = parseFloat(m.kda) || 0;
                         const avg = RANK_AVERAGES[selectedRank] || RANK_AVERAGES['Oro'];
                         
                         const getBarColor = (val: number, avgVal: number) => {
                            if (val >= avgVal * 1.1) return 'bg-emerald-500';
                            if (val >= avgVal) return 'bg-green-400';
                            if (val >= avgVal * 0.9) return 'bg-yellow-500';
                            return 'bg-red-500/80';
                         };
                         const getTextColor = (val: number, avgVal: number) => {
                            if (val >= avgVal * 1.1) return 'text-emerald-400';
                            if (val >= avgVal) return 'text-green-400';
                            if (val >= avgVal * 0.9) return 'text-yellow-400';
                            return 'text-red-400/90';
                         };

                         return (
                           <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-xl p-4 mb-6 relative overflow-hidden">
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 relative z-10">
                               <h5 className="text-gold font-bold flex items-center gap-2">
                                 <span className="text-xl">📊</span> Comparativa de Rendimiento
                               </h5>
                               <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 border border-white/5 hover:border-gold/30 transition-colors">
                                 <span className="text-xs text-gray-400 font-medium">vs</span>
                                 <select 
                                   className="bg-transparent text-sm text-gray-200 focus:outline-none py-1.5 cursor-pointer font-bold appearance-none pl-1 pr-6"
                                   style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A0AEC0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.2rem top 50%', backgroundSize: '0.65rem auto' }}
                                   value={selectedRank}
                                   onChange={(e) => setSelectedRank(e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   {RANKS.map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
                                 </select>
                               </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                               {/* KDA */}
                               <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                 <div className="flex justify-between text-xs mb-1">
                                   <span className="text-gray-400 font-medium">KDA</span>
                                   <span className="text-gray-500">Media: {avg.kda.toFixed(1)}</span>
                                 </div>
                                 <div className="flex items-end gap-2 mb-2">
                                   <span className={`text-xl font-bold ${getTextColor(playerKda, avg.kda)}`}>{playerKda.toFixed(2)}</span>
                                 </div>
                                 <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                                   <div className={`h-full ${getBarColor(playerKda, avg.kda)}`} style={{ width: `${Math.min(100, (playerKda / avg.kda) * 50)}%` }}></div>
                                 </div>
                               </div>

                               {/* CS/Min */}
                               <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                 <div className="flex justify-between text-xs mb-1">
                                   <span className="text-gray-400 font-medium">CS/Min</span>
                                   <span className="text-gray-500">Media: {avg.csPerMin.toFixed(1)}</span>
                                 </div>
                                 <div className="flex items-end gap-2 mb-2">
                                   <span className={`text-xl font-bold ${getTextColor(playerCsPerMin, avg.csPerMin)}`}>{playerCsPerMin.toFixed(1)}</span>
                                 </div>
                                 <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                                   <div className={`h-full ${getBarColor(playerCsPerMin, avg.csPerMin)}`} style={{ width: `${Math.min(100, (playerCsPerMin / avg.csPerMin) * 50)}%` }}></div>
                                 </div>
                               </div>

                               {/* Gold/Min */}
                               <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                 <div className="flex justify-between text-xs mb-1">
                                   <span className="text-gray-400 font-medium">Oro/Min</span>
                                   <span className="text-gray-500">Media: {avg.goldPerMin}</span>
                                 </div>
                                 <div className="flex items-end gap-2 mb-2">
                                   <span className={`text-xl font-bold ${getTextColor(playerGoldPerMin, avg.goldPerMin)}`}>{Math.round(playerGoldPerMin)}</span>
                                 </div>
                                 <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                                   <div className={`h-full ${getBarColor(playerGoldPerMin, avg.goldPerMin)}`} style={{ width: `${Math.min(100, (playerGoldPerMin / avg.goldPerMin) * 50)}%` }}></div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                      })()}

                      <div className={`grid gap-4 sm:gap-6 ${m.gameMode === 'CHERRY' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 xl:grid-cols-2'}`}>
                        {m.teams.map((team, tIdx) => (
                          <div key={tIdx} className={`flex-1 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden ${getTeamStyle(team.color_class)}`}>
                            
                            {/* Team Header */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 gap-3 relative z-10 w-full">
                              <h5 className={`text-xl font-black tracking-wider drop-shadow-md ${getTeamHeaderColor(team.color_class)}`}>
                                {team.id} <span className="text-white ml-3 py-1 px-4 bg-black/60 rounded-full text-sm font-bold shadow-sm">{team.total_kills} Kills</span>
                              </h5>
                              {hasObjectives(m.gameMode) && (
                                <div className="text-xs sm:text-sm font-bold bg-black/60 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-gray-200 flex flex-wrap gap-2 sm:gap-4 shadow-sm border border-white/10 backdrop-blur-md">
                                  <span title="Torretas" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🗼</span> <span className="text-white">{team.objectives.tower || 0}</span></span>
                                  <span title="Dragones" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🐉</span> <span className="text-white">{team.objectives.dragon || 0}</span></span>
                                  <span title="Barones" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">👾</span> <span className="text-white">{team.objectives.baron || 0}</span></span>
                                  <span title="Heraldos/Hordas" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🐛</span> <span className="text-white">{(team.objectives.riftHerald || 0) + (team.objectives.horde || 0)}</span></span>
                                </div>
                              )}
                            </div>
                            
                            {/* Team Table */}
                            <div className="overflow-x-auto pb-2 relative z-10 w-full flex-grow">
                              <table className={`w-full text-left border-collapse ${m.gameMode === 'CHERRY' ? 'min-w-0' : 'min-w-[450px]'}`}>
                                <thead>
                                  <tr className="text-gray-400 border-b-2 border-white/10 text-xs uppercase tracking-widest bg-black/40">
                                    <th className={`py-3 pl-3 rounded-tl-xl ${m.gameMode === 'CHERRY' ? 'w-7/12' : 'w-5/12'}`}>Jugador</th>
                                    <th className={`py-3 text-center ${m.gameMode === 'CHERRY' ? 'w-5/12 rounded-tr-xl pr-3' : 'w-3/12'}`}>KDA</th>
                                    {m.gameMode !== 'CHERRY' && (
                                      <>
                                        <th className="py-3 text-center w-2/12">Daño</th>
                                        <th className="py-3 text-right pr-3 rounded-tr-xl w-2/12">Oro/Min</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.players.map((p, pIdx) => (
                                    <React.Fragment key={pIdx}>
                                      <tr className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                      <td 
                                        className="py-3 pl-3 flex items-center gap-2 sm:gap-4 cursor-pointer group/player hover:bg-white/5 transition-colors rounded-l-xl"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (p.name) performSearch(p.name, p.tag || 'EUW');
                                        }}
                                        title={`Ver historial de ${p.name}`}
                                      >
                                        <div className="relative group shrink-0">
                                          <img 
                                            src={getChampionImage(p.champion)} 
                                            alt={p.champion}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-black/80 shadow-lg group-hover/player:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/48?text=?' }}
                                          />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                          <span className="text-white font-bold text-sm sm:text-base truncate drop-shadow-md group-hover/player:text-gold transition-colors">{p.name || 'Desconocido'}</span>
                                          <span className="text-gray-400 text-xs font-medium">#{p.tag || '???'}</span>
                                        </div>
                                      </td>
                                      <td className={`py-3 text-center ${m.gameMode === 'CHERRY' ? 'pr-3' : ''}`}>
                                        <div className="font-mono text-xs sm:text-sm font-black tracking-tight text-white whitespace-nowrap">{p.kills}<span className="text-gray-500 font-bold mx-0.5">/</span>{p.deaths}<span className="text-gray-500 font-bold mx-0.5">/</span>{p.assists}</div>
                                        <div className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-bold">{p.kda} <span className="font-normal text-gray-500">KDA</span></div>
                                      </td>
                                      {m.gameMode !== 'CHERRY' && (
                                        <>
                                          <td className="py-3 text-center">
                                            <span className="font-mono text-xs sm:text-sm text-gray-200 font-bold drop-shadow-md">{(p.damage || 0).toLocaleString()}</span>
                                          </td>
                                          <td className="py-3 pr-3 text-right flex flex-col items-end justify-center h-full">
                                            <div className="text-gold font-black bg-yellow-900/50 border border-yellow-500/30 inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm mt-1 whitespace-nowrap text-xs sm:text-sm">
                                              {p.gpm}
                                            </div>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                    {/* Sub-row for items */}
                                    <tr className="border-b border-white/5 last:border-0 bg-black/20">
                                      <td colSpan={m.gameMode === 'CHERRY' ? 2 : 4} className="py-2 pl-3 sm:pl-16">
                                        <div className="flex gap-1">
                                          {p.items?.slice(0,6).map((itemId: number, i: number) => (
                                            <ItemIcon key={i} itemId={itemId} />
                                          ))}
                                          <div className="ml-2">
                                            <ItemIcon itemId={p.items?.[6] || 0} />
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                    </React.Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
