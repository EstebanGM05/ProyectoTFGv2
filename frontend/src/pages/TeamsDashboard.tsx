import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: number;
  user_id: number;
  username: string;
  profile_picture: string;
  role: string;
  riot_name: string | null;
  riot_tag: string | null;
}

interface Application {
  id: number;
  user_id: number;
  username: string;
  profile_picture: string;
  message: string;
  status: string;
}

interface TeamVacancy {
  id: number;
  role: string;
  min_rank: string | null;
  message: string | null;
  applications: Application[];
}

interface Team {
  id: number;
  name: string;
  tag: string;
  captain_id: number;
  members: TeamMember[];
  vacancies: TeamVacancy[];
}

export default function TeamsDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create Team Form
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  
  // Create Vacancy Form
  const [showVacancyForm, setShowVacancyForm] = useState(false);
  const [vacancyRole, setVacancyRole] = useState('ANY');
  const [vacancyRank, setVacancyRank] = useState('Cualquiera');
  const [vacancyMessage, setVacancyMessage] = useState('');

  const fetchTeam = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams/my-team', { withCredentials: true });
      setTeam(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/teams', { name: teamName, tag: teamTag }, { withCredentials: true });
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear el equipo');
    }
  };

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/teams/vacancies', {
        role: vacancyRole,
        min_rank: vacancyRank,
        message: vacancyMessage
      }, { withCredentials: true });
      setShowVacancyForm(false);
      setVacancyMessage('');
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear vacante');
    }
  };

  const handleApplication = async (appId: number, action: 'ACCEPT' | 'REJECT') => {
    try {
      await axios.put(`http://localhost:5000/api/teams/applications/${appId}`, { action }, { withCredentials: true });
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al procesar solicitud');
    }
  };

  const handleKick = async (memberId: number) => {
    if (!confirm('¿Seguro que quieres expulsar o salir?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/teams/members/${memberId}`, { withCredentials: true });
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;
    if (!confirm('¿ESTÁS SEGURO? Esta acción disolverá el equipo por completo y eliminará todas las vacantes.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/teams/${team.id}`, { withCredentials: true });
      setTeam(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al disolver equipo');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="w-64 h-10 bg-gray-700 rounded mx-auto animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-medium-blue border border-border-color rounded-2xl p-8 animate-pulse">
              <div className="w-48 h-8 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-4">
                <div>
                  <div className="w-32 h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="w-full h-10 bg-gray-700/50 rounded"></div>
                </div>
                <div>
                  <div className="w-32 h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="w-full h-10 bg-gray-700/50 rounded"></div>
                </div>
                <div className="w-full h-12 bg-gray-700 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-4xl font-black text-white font-serif mb-8 text-center">Torneos <span className="text-gold">Qlash</span></h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-medium-blue border border-border-color rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gold mb-4">Crea tu Equipo</h2>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del Equipo</label>
                <input 
                  type="text" 
                  value={teamName} 
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full bg-dark-blue border border-border-color rounded px-4 py-2 text-white focus:border-gold outline-none transition"
                  placeholder="Ej: Los Tryhards"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Etiqueta (Tag)</label>
                <input 
                  type="text" 
                  value={teamTag} 
                  onChange={e => setTeamTag(e.target.value)}
                  className="w-full bg-dark-blue border border-border-color rounded px-4 py-2 text-white focus:border-gold outline-none transition"
                  placeholder="Ej: TRY"
                  maxLength={5}
                  required
                />
              </div>
              <button type="submit" className="mt-4 w-full bg-gold text-dark-blue font-bold rounded py-3 hover:bg-gold-hover transition">
                Fundar Equipo
              </button>
            </form>
          </div>

          <div className="bg-medium-blue border border-border-color rounded-2xl p-8 shadow-xl flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-bold text-white mb-4">¿No tienes equipo?</h2>
            <p className="text-gray-400 mb-6">Únete a un equipo existente como Agente Libre en nuestro tablón de vacantes.</p>
            <Link to="/teams/board" className="bg-dark-blue border border-gold text-gold font-bold rounded-xl px-6 py-3 hover:bg-gold/10 transition w-full">
              Buscar Equipos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCaptain = team.captain_id === user?.id;
  const slots = Array.from({ length: 5 });

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-black text-white font-serif uppercase">
          {team.name} <span className="text-gold text-2xl">[{team.tag}]</span>
        </h1>
        <div className="h-px bg-gradient-to-r from-gold/50 to-transparent flex-grow"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gold mb-2">Roster (5v5)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((_, i) => {
              const member = team.members[i];
              
              if (member) {
                return (
                  <div key={member.id} className="bg-medium-blue border border-border-color rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
                    <div className="w-12 h-12 rounded-full border-2 border-gold overflow-hidden shrink-0">
                      <img src={member.profile_picture.startsWith('user_') ? `/uploads/${member.profile_picture}` : `/img/champions/${member.profile_picture}`} alt={member.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <Link to={`/user/${member.user_id}`} className="font-bold text-white hover:text-gold transition">
                          {member.riot_name ? `${member.riot_name} #${member.riot_tag}` : member.username}
                        </Link>
                        {team.captain_id === member.user_id && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30">Capitán</span>}
                      </div>
                      <div className="text-sm text-gray-400">{member.role}</div>
                    </div>
                    {(isCaptain && member.user_id !== team.captain_id) || member.user_id === user?.id ? (
                      <button onClick={() => handleKick(member.id)} className="text-loss-border hover:text-red-400 text-xs absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                        {member.user_id === user?.id ? 'Salir' : 'Expulsar'}
                      </button>
                    ) : null}
                  </div>
                );
              } else {
                return (
                  <div key={`empty-${i}`} className="bg-dark-blue/50 border border-dashed border-gray-600 rounded-xl p-4 flex items-center justify-center gap-4 h-[84px]">
                    <span className="text-gray-500 font-bold">Hueco Libre</span>
                  </div>
                );
              }
            })}
          </div>

          {isCaptain && team.members.length < 5 && (
            <div className="mt-8">
              {!showVacancyForm ? (
                <button onClick={() => setShowVacancyForm(true)} className="w-full border border-gold/50 text-gold hover:bg-gold/10 transition rounded-xl py-3 font-bold border-dashed">
                  + Reclutar Agente Libre
                </button>
              ) : (
                <div className="bg-medium-blue border border-gold/30 rounded-xl p-6">
                  <h3 className="font-bold text-gold mb-4">Publicar Vacante en el Tablón</h3>
                  <form onSubmit={handleCreateVacancy} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Rol Buscado</label>
                        <select value={vacancyRole} onChange={e => setVacancyRole(e.target.value)} className="w-full bg-dark-blue text-white border border-border-color rounded px-3 py-2">
                          <option value="TOP">Top</option>
                          <option value="JUNGLE">Jungla</option>
                          <option value="MIDDLE">Mid</option>
                          <option value="BOTTOM">ADC</option>
                          <option value="UTILITY">Support</option>
                          <option value="ANY">Cualquiera</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Rango Mínimo</label>
                        <select value={vacancyRank} onChange={e => setVacancyRank(e.target.value)} className="w-full bg-dark-blue text-white border border-border-color rounded px-3 py-2">
                          <option>Cualquiera</option>
                          <option>Oro</option>
                          <option>Platino</option>
                          <option>Esmeralda</option>
                          <option>Diamante</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Mensaje para los candidatos</label>
                      <input type="text" value={vacancyMessage} onChange={e => setVacancyMessage(e.target.value)} className="w-full bg-dark-blue text-white border border-border-color rounded px-3 py-2" placeholder="Ej: Buscamos OTP Ornn para jugar chill" maxLength={100} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-gold text-dark-blue font-bold rounded py-2 hover:bg-gold-hover transition">Publicar</button>
                      <button type="button" onClick={() => setShowVacancyForm(false)} className="flex-1 border border-border-color text-gray-400 hover:text-white transition rounded py-2">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {isCaptain && (
            <div className="mt-8 border-t border-red-500/20 pt-6">
              <h3 className="text-red-400 font-bold mb-2">Zona Peligrosa</h3>
              <button 
                onClick={handleDeleteTeam} 
                className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 transition rounded-xl py-3 font-bold"
              >
                Disolver Equipo Definitivamente
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gold mb-4">Solicitudes ({team.vacancies.reduce((acc, v) => acc + v.applications.filter(a => a.status === 'PENDING').length, 0)})</h2>
          <div className="bg-medium-blue border border-border-color rounded-xl p-4 flex flex-col gap-4">
            {team.vacancies.length === 0 ? (
              <p className="text-gray-400 text-sm italic text-center py-4">No hay vacantes activas publicadas.</p>
            ) : (
              team.vacancies.map(v => (
                <div key={v.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-300">Vacante: {v.role}</span>
                    <span className="text-xs text-gray-500">{v.applications.length} sol.</span>
                  </div>
                  <div className="space-y-3">
                    {v.applications.filter(a => a.status === 'PENDING').length === 0 && <div className="text-xs text-gray-500 italic">Nadie ha aplicado aún.</div>}
                    {v.applications.filter(a => a.status === 'PENDING').map(app => (
                      <div key={app.id} className="bg-dark-blue p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={app.profile_picture.startsWith('user_') ? `/uploads/${app.profile_picture}` : `/img/champions/${app.profile_picture}`} className="w-6 h-6 rounded-full border border-gold" alt={app.username} />
                          <Link to={`/user/${app.user_id}`} className="text-sm font-bold text-white hover:text-gold transition">{app.username}</Link>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">"{app.message}"</p>
                        {isCaptain && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApplication(app.id, 'ACCEPT')} className="flex-1 bg-green-500/20 text-green-400 text-xs py-1 rounded border border-green-500/30 hover:bg-green-500/40 transition">Aceptar</button>
                            <button onClick={() => handleApplication(app.id, 'REJECT')} className="flex-1 bg-red-500/20 text-red-400 text-xs py-1 rounded border border-red-500/30 hover:bg-red-500/40 transition">Rechazar</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
