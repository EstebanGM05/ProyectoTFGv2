import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: number;
  author_id: number;
  author_username: string;
  author_picture: string;
  comment: string;
  is_positive: boolean;
  timestamp: string;
}

interface Favorite {
  id: number;
  name: string;
  image_url: string;
  role: string;
}

interface PublicProfileData {
  id: number;
  username: string;
  riot_name: string | null;
  riot_tag: string | null;
  profile_picture: string;
  favorites: Favorite[];
  comments: Comment[];
  reputation: number;
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [commentText, setCommentText] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/${id}`);
      setProfile(res.data);
    } catch (err: any) {
      setError('No se pudo encontrar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/users/${id}/comments`, {
        comment: commentText,
        is_positive: isPositive
      }, { withCredentials: true });
      setCommentText('');
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al enviar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString + 'Z');
    return date.toLocaleDateString('es-ES');
  };

  if (loading) return <div className="text-center text-gold py-12">Cargando perfil...</div>;
  if (error || !profile) return <div className="text-center text-red-400 py-12">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header Profile */}
      <div className="bg-medium-blue border border-border-color rounded-2xl p-8 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-dark-blue to-transparent opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 rounded-full border-4 border-gold shadow-[0_0_20px_rgba(200,155,60,0.3)] overflow-hidden shrink-0 bg-dark-blue">
            <img 
              src={profile.profile_picture.startsWith('user_') ? `/uploads/${profile.profile_picture}` : `/img/champions/${profile.profile_picture}`} 
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-4xl font-black text-white font-serif">{profile.riot_name ? `${profile.riot_name} #${profile.riot_tag}` : profile.username}</h1>
            <p className="text-gray-400 text-lg mt-1">@{profile.username}</p>
            
            <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
              <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${profile.reputation >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                Reputación: {profile.reputation > 0 ? `+${profile.reputation}` : profile.reputation}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Favorites */}
        <div className="bg-medium-blue border border-border-color rounded-xl p-6">
          <h2 className="text-xl font-bold text-gold mb-4 border-b border-white/5 pb-2">Campeones Favoritos</h2>
          {profile.favorites.length === 0 ? (
            <p className="text-gray-400 italic text-sm">Este usuario no tiene campeones favoritos aún.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {profile.favorites.map(fav => (
                <div key={fav.id} className="relative group cursor-pointer" title={fav.name}>
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gold/50 group-hover:border-gold transition group-hover:scale-110">
                    <img src={`/img/champions/${fav.image_url}`} alt={fav.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muro de comentarios */}
        <div className="bg-medium-blue border border-border-color rounded-xl p-6 flex flex-col h-[500px]">
          <h2 className="text-xl font-bold text-gold mb-4 border-b border-white/5 pb-2">Muro de Reputación</h2>
          
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
            {profile.comments.length === 0 ? (
              <p className="text-gray-400 italic text-sm text-center mt-8">Sin comentarios. Sé el primero.</p>
            ) : (
              profile.comments.map(c => (
                <div key={c.id} className="bg-dark-blue rounded-lg p-3 border border-white/5 relative">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/user/${c.author_id}`} className="flex items-center gap-2 hover:opacity-80 transition">
                      <img 
                        src={c.author_picture.startsWith('user_') ? `/uploads/${c.author_picture}` : `/img/champions/${c.author_picture}`}
                        className="w-6 h-6 rounded-full object-cover border border-gold/30"
                        alt={c.author_username}
                      />
                      <span className="text-sm font-bold text-white">{c.author_username}</span>
                    </Link>
                    <span className="text-xs text-gray-500">{formatTime(c.timestamp)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${c.is_positive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {c.is_positive ? '+1' : '-1'}
                    </div>
                    <p className="text-sm text-gray-300 break-words">{c.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          {user ? (
            user.id !== profile.id ? (
              <form onSubmit={handleComment} className="border-t border-white/10 pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPositive(true)}
                    className={`flex-1 py-1 rounded border text-sm font-bold transition ${isPositive ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-dark-blue text-gray-400 border-white/10 hover:border-white/30'}`}
                  >
                    +1 Positivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPositive(false)}
                    className={`flex-1 py-1 rounded border text-sm font-bold transition ${!isPositive ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-dark-blue text-gray-400 border-white/10 hover:border-white/30'}`}
                  >
                    -1 Negativo
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-grow bg-dark-blue border border-border-color rounded px-3 py-2 text-sm text-white focus:border-gold outline-none"
                    maxLength={100}
                  />
                  <button 
                    type="submit" 
                    disabled={submitting || !commentText.trim()}
                    className="bg-gold text-dark-blue px-4 rounded font-bold hover:bg-gold-hover transition disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-sm text-gray-500 border-t border-white/10 pt-4">
                Este es tu propio perfil.
              </div>
            )
          ) : (
            <div className="text-center text-sm text-gray-500 border-t border-white/10 pt-4">
              <Link to="/login" className="text-gold hover:underline">Inicia sesión</Link> para comentar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
