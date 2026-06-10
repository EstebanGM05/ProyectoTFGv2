import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface LFGPost {
  id: number;
  user_id: number;
  username: string;
  riot_name: string | null;
  riot_tag: string | null;
  profile_picture: string;
  role: string;
  rank: string;
  message: string;
  timestamp: string;
}

export default function LFG() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<LFGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [role, setRole] = useState('CUALQUIERA');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/lfg', { withCredentials: true });
      setPosts(response.data);
    } catch (err: any) {
      setError('Error al cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      await axios.post('/api/lfg', { role, message }, { withCredentials: true });
      setMessage('');
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al publicar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Borrar publicación?')) return;
    try {
      await axios.delete(`/api/lfg/${id}`, { withCredentials: true });
      fetchPosts();
    } catch (err: any) {
      alert('Error al borrar');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString + 'Z');
    return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-black text-white font-serif tracking-wide uppercase">
          Buscador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">Duo</span>
        </h1>
        <div className="h-px bg-gradient-to-r from-gold/50 to-transparent flex-grow"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LFG Board */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-medium-blue border border-border-color rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-700 rounded"></div>
                      <div className="w-24 h-3 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-16 bg-gray-700/50 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 p-4 border border-red-500/20 rounded-xl">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-400 py-12 bg-medium-blue rounded-xl border border-border-color">
              No hay nadie buscando duo actualmente. ¡Sé el primero!
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-medium-blue border border-border-color rounded-xl p-5 hover:border-gold/30 transition shadow-lg flex gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[80px] rounded-full group-hover:bg-gold/10 transition"></div>
                
                <Link to={`/user/${post.user_id}`} className="shrink-0 flex flex-col items-center gap-2 group-hover:scale-105 transition">
                  <div className="w-16 h-16 rounded-full border-2 border-gold overflow-hidden shadow-md">
                    <img 
                      src={post.profile_picture.startsWith('user_') ? `/uploads/${post.profile_picture}` : `/img/champions/${post.profile_picture}`} 
                      alt={post.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex-grow z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/user/${post.user_id}`} className="font-bold text-lg text-white hover:text-gold transition">
                        {post.riot_name ? `${post.riot_name} #${post.riot_tag}` : post.username}
                      </Link>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                        <span className="bg-dark-blue px-2 py-0.5 rounded border border-white/10">{post.role}</span>
                        <span className="bg-dark-blue px-2 py-0.5 rounded border border-white/10 text-gold">{post.rank}</span>
                        <span>• {formatTime(post.timestamp)}</span>
                      </div>
                    </div>
                    
                    {(user?.id === post.user_id || user?.is_admin) && (
                      <button onClick={() => handleDelete(post.id)} className="text-loss-border hover:text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded">
                        Eliminar
                      </button>
                    )}
                  </div>
                  
                  <p className="mt-3 text-gray-300 whitespace-pre-wrap">{post.message || "Busco duo para jugar unas partidas."}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Post Form */}
        <div>
          {user ? (
            <div className="bg-medium-blue border border-gold/30 rounded-xl p-6 shadow-[0_0_20px_rgba(200,155,60,0.1)] sticky top-24">
              <h3 className="text-xl font-bold text-gold mb-4 border-b border-border-color pb-2">Publicar Anuncio</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rol que juegas/buscas</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-dark-blue text-white border border-border-color rounded px-3 py-2 focus:outline-none focus:border-gold transition"
                  >
                    <option value="CUALQUIERA">Cualquiera</option>
                    <option value="TOP">Top</option>
                    <option value="JUNGLE">Jungla</option>
                    <option value="MIDDLE">Mid</option>
                    <option value="BOTTOM">ADC</option>
                    <option value="UTILITY">Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Mensaje (opcional)</label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={200}
                    placeholder="E.g., Busco duo tryhard para subir a platino..."
                    className="w-full bg-dark-blue text-white border border-border-color rounded px-3 py-2 h-24 resize-none focus:outline-none focus:border-gold transition"
                  />
                  <div className="text-xs text-right text-gray-500 mt-1">{message.length}/200</div>
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-gold text-dark-blue font-bold rounded py-3 hover:bg-gold-hover transition disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Publicando...' : 'Publicar Anuncio'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-medium-blue border border-border-color rounded-xl p-6 text-center shadow-lg sticky top-24">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-white mb-2">Inicia Sesión</h3>
              <p className="text-gray-400 text-sm mb-4">Necesitas una cuenta para publicar en el buscador de duo.</p>
              <Link to="/login" className="inline-block bg-gold text-dark-blue font-bold px-6 py-2 rounded hover:bg-gold-hover transition">
                Entrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
