import React, { useState, useMemo } from 'react';
import axios from 'axios';

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
  teams?: TeamData[];
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
}

export default function MatchHistory() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  
  // Expanded & Filters State
  const [expandedMatchIndex, setExpandedMatchIndex] = useState<number | null>(null);
  const [isWinrateOpen, setIsWinrateOpen] = useState(false);
  const [filterChampion, setFilterChampion] = useState('');
  const [filterResult, setFilterResult] = useState('Todos');
  const [filterMode, setFilterMode] = useState('Todos');

  const toggleMatch = (idx: number) => {
    setExpandedMatchIndex(expandedMatchIndex === idx ? null : idx);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName || !tagLine) return;
    
    setLoading(true);
    setError('');
    setData(null);
    setExpandedMatchIndex(null);
    setIsWinrateOpen(false);
    
    try {
      const res = await axios.post('/api/match-history', {
        game_name: gameName,
        tag_line: tagLine
      });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al buscar el historial');
    } finally {
      setLoading(false);
    }
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
                    <option key={m} value={m}>{m === 'CHERRY' ? 'Arena' : m}</option>
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
                        src={`https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${m.championName}.png`} 
                        alt={m.championName}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow-md border-2 border-black/50 mr-4"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64?text=?' }}
                      />
                      <div>
                        <h4 className="font-black text-lg text-gold tracking-wide drop-shadow-sm">{m.championName}</h4>
                        <p className={`font-black tracking-wider text-sm ${m.win ? 'text-win-border' : 'text-loss-border'}`}>
                          {m.win ? 'VICTORIA' : 'DERROTA'} <span className="text-gray-400 font-medium text-xs ml-2 py-0.5 px-2 bg-black/30 rounded-full">({m.gameMode === 'CHERRY' ? 'Arena' : m.gameMode})</span>
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

                  {/* Expanded Section */}
                  {expandedMatchIndex === idx && m.teams && (
                    <div className="bg-black/60 p-4 sm:p-6 border-t font-sans border-white/5 text-sm rounded-b-xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]">
                      <div className="flex flex-col xl:flex-row gap-6">
                        {m.teams.map((team, tIdx) => (
                          <div key={tIdx} className={`flex-1 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden ${team.color_class === 'team-blue' ? 'bg-gradient-to-br from-blue-900/60 to-blue-900/20 border-2 border-blue-500/30' : team.color_class === 'team-red' ? 'bg-gradient-to-br from-red-900/60 to-red-900/20 border-2 border-red-500/30' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600/30'}`}>
                            
                            {/* Team Header */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 gap-3 relative z-10 w-full">
                              <h5 className={`text-xl font-black tracking-wider drop-shadow-md ${team.color_class === 'team-blue' ? 'text-blue-300' : team.color_class === 'team-red' ? 'text-red-300' : 'text-gray-300'}`}>
                                {team.id} <span className="text-white ml-3 py-1 px-4 bg-black/60 rounded-full text-sm font-bold shadow-sm">{team.total_kills} Kills</span>
                              </h5>
                              <div className="text-xs sm:text-sm font-bold bg-black/60 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-gray-200 flex flex-wrap gap-2 sm:gap-4 shadow-sm border border-white/10 backdrop-blur-md">
                                <span title="Torretas" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🗼</span> <span className="text-white">{team.objectives.tower || 0}</span></span>
                                <span title="Dragones" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🐉</span> <span className="text-white">{team.objectives.dragon || 0}</span></span>
                                <span title="Barones" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">👾</span> <span className="text-white">{team.objectives.baron || 0}</span></span>
                                <span title="Heraldos/Hordas" className="flex items-center gap-1.5"><span className="text-base sm:text-lg">🐛</span> <span className="text-white">{(team.objectives.riftHerald || 0) + (team.objectives.horde || 0)}</span></span>
                              </div>
                            </div>
                            
                            {/* Team Table */}
                            <div className="overflow-x-auto pb-2 relative z-10 w-full">
                              <table className="w-full text-left border-collapse min-w-[450px]">
                                <thead>
                                  <tr className="text-gray-400 border-b-2 border-white/10 text-xs uppercase tracking-widest bg-black/40">
                                    <th className="py-3 pl-3 rounded-tl-xl w-5/12">Jugador</th>
                                    <th className="py-3 text-center w-3/12">KDA</th>
                                    <th className="py-3 text-center w-2/12">Daño</th>
                                    <th className="py-3 text-right pr-3 rounded-tr-xl w-2/12">Oro/Min</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.players.map((p, pIdx) => (
                                    <tr key={pIdx} className="border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors">
                                      <td className="py-3 pl-3 flex items-center gap-2 sm:gap-4">
                                        <div className="relative group shrink-0">
                                          <img 
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${p.champion}.png`} 
                                            alt={p.champion}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-black/80 shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/48?text=?' }}
                                          />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                          <span className="text-white font-bold text-sm sm:text-base truncate drop-shadow-md" title={p.name}>{p.name || 'Desconocido'}</span>
                                          <span className="text-gray-400 text-xs font-medium">#{p.tag || '???'}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 text-center">
                                        <div className="font-mono text-xs sm:text-sm font-black tracking-tight text-white whitespace-nowrap">{p.kills}<span className="text-gray-500 font-bold mx-0.5">/</span>{p.deaths}<span className="text-gray-500 font-bold mx-0.5">/</span>{p.assists}</div>
                                        <div className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-bold">{p.kda} <span className="font-normal text-gray-500">KDA</span></div>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className="font-mono text-xs sm:text-sm text-gray-200 font-bold drop-shadow-md">{(p.damage || 0).toLocaleString()}</span>
                                      </td>
                                      <td className="py-3 pr-3 text-right flex flex-col items-end justify-center h-full">
                                        <div className="text-gold font-black bg-yellow-900/50 border border-yellow-500/30 inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm mt-1 whitespace-nowrap text-xs sm:text-sm">
                                          {p.gpm}
                                        </div>
                                      </td>
                                    </tr>
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
