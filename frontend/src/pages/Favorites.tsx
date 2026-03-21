import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Champion {
  id: number;
  name: string;
  title: string;
  role: string;
  image_url: string;
}

export default function Favorites() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = () => {
    axios.get('/api/favorites')
      .then(res => setChampions(res.data))
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-border-color pb-4">
        <h1 className="text-3xl font-bold text-gold">Mis Campeones Favoritos</h1>
      </div>

      {champions.length === 0 ? (
        <div className="text-center bg-medium-blue border border-border-color p-12 rounded-lg">
          <p className="text-gray-400 text-lg">Aún no tienes campeones en tus favoritos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {champions.map(c => (
            <div key={c.id} className="relative bg-medium-blue border border-gold rounded-lg overflow-hidden shadow-[0_0_15px_rgba(200,170,110,0.3)] hover:shadow-gold/60 transition group">
              <button 
                onClick={() => removeFavorite(c.id)}
                className="absolute top-2 right-2 bg-loss text-white w-8 h-8 rounded-full z-10 opacity-0 group-hover:opacity-100 hover:bg-loss-border transition flex items-center justify-center font-bold"
                title="Eliminar"
              >
                ✕
              </button>
              <img 
                src={`/img/champions/${c.image_url}`} 
                alt={c.name} 
                className="w-full h-64 object-cover object-top group-hover:scale-105 transition duration-300"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Image' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-blue to-transparent p-4 pt-12">
                <h3 className="text-2xl font-bold text-gold mt-2 shadow-black drop-shadow-md">{c.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm italic text-gray-300 drop-shadow-md">{c.title}</p>
                  <span className="bg-dark-blue/80 px-2 py-1 rounded text-bright-blue text-xs border border-border-color">{c.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
