import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Vacancy {
  id: number;
  team_id: number;
  team_name: string;
  team_tag: string;
  captain: string;
  role: string;
  min_rank: string;
  message: string;
  members_count: number;
}

export default function ClashBoard() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [applyingTo, setApplyingTo] = useState<number | null>(null);
  const [applyMessage, setApplyMessage] = useState('');

  const fetchVacancies = async () => {
    try {
      const res = await axios.get('/api/teams/vacancies', { withCredentials: true });
      setVacancies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const handleApply = async (e: React.FormEvent, vid: number) => {
    e.preventDefault();
    try {
      await axios.post(`/api/teams/vacancies/${vid}/apply`, { message: applyMessage }, { withCredentials: true });
      alert('Solicitud enviada al capitán del equipo.');
      setApplyingTo(null);
      setApplyMessage('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-64 h-10 bg-gray-700 rounded animate-pulse"></div>
          <div className="hidden md:block h-px bg-gray-700 w-48"></div>
        </div>
        <div className="w-full max-w-2xl h-12 bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-medium-blue border border-border-color rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 w-full">
                  <div className="w-2/3 h-6 bg-gray-700 rounded"></div>
                  <div className="w-1/2 h-4 bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="bg-dark-blue rounded-lg p-3 mb-4 space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="w-full h-10 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black text-white font-serif tracking-wide uppercase">
            Agencia Libre <span className="text-gold">Qlash</span>
          </h1>
          <div className="hidden md:block h-px bg-gradient-to-r from-gold/50 to-transparent w-48"></div>
        </div>
        <Link to="/teams" className="bg-dark-blue border border-gold text-gold font-bold px-4 py-2 rounded hover:bg-gold hover:text-dark-blue transition">
          Mi Equipo
        </Link>
      </div>

      <p className="text-gray-400 mb-8 max-w-2xl">
        Equipos de toda la plataforma están buscando agentes libres para completar sus rosters antes del próximo torneo. ¡Encuentra tu equipo ideal y demuestra tu nivel!
      </p>

      {vacancies.length === 0 ? (
        <div className="text-center bg-medium-blue border border-border-color rounded-2xl py-16 px-4">
          <div className="text-6xl mb-4 opacity-50">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sin Vacantes</h2>
          <p className="text-gray-400">Todos los equipos están completos actualmente. ¡Crea el tuyo propio!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map(v => (
            <div key={v.id} className="bg-medium-blue border border-border-color rounded-2xl p-6 hover:border-gold/30 transition shadow-lg relative group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/5 blur-[50px] rounded-full group-hover:bg-gold/20 transition"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {v.team_name} <span className="text-sm text-gold border border-gold/30 px-1.5 rounded">[{v.team_tag}]</span>
                    </h3>
                    <div className="text-xs text-gray-500 mt-1">Capitán: {v.captain} • {v.members_count}/5 Miembros</div>
                  </div>
                </div>

                <div className="bg-dark-blue border border-white/5 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Rol buscado:</span>
                    <span className="font-bold text-gold">{v.role}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rango Mínimo:</span>
                    <span className="font-bold text-white">{v.min_rank}</span>
                  </div>
                </div>

                {v.message && (
                  <p className="text-sm text-gray-300 italic mb-6">"{v.message}"</p>
                )}

                {applyingTo === v.id ? (
                  <form onSubmit={(e) => handleApply(e, v.id)} className="animate-fade-in">
                    <textarea 
                      value={applyMessage} 
                      onChange={e => setApplyMessage(e.target.value)}
                      placeholder="Escribe un breve mensaje de por qué encajas..."
                      className="w-full bg-dark-blue text-white text-sm border border-border-color rounded p-2 mb-2 resize-none h-16 focus:border-gold outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-gold text-dark-blue font-bold rounded py-1 hover:bg-gold-hover transition">Enviar</button>
                      <button type="button" onClick={() => setApplyingTo(null)} className="flex-1 border border-border-color text-gray-400 rounded py-1 hover:text-white transition">Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => {
                      if (!user) {
                        alert('Inicia sesión para aplicar');
                        return;
                      }
                      setApplyingTo(v.id);
                    }} 
                    className="w-full border border-gold text-gold font-bold rounded py-2 hover:bg-gold hover:text-dark-blue transition"
                  >
                    Postularse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
