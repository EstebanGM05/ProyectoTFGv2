
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Favorites from './pages/Favorites';
import MatchHistory from './pages/MatchHistory';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function NavLinks() {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-medium-blue border-b border-border-color p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-gold text-2xl font-bold font-serif hover:text-gold-hover transition">
          LeagueStats
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/" className="text-text-color hover:text-gold transition">Campeones</Link>
          <Link to="/match-history" className="text-text-color hover:text-gold transition">Historial</Link>
          <Link to="/friends" className="text-text-color hover:text-gold transition">Amigos</Link>
          <Link to="/favorites" className="text-text-color hover:text-gold transition">Favoritos</Link>
          
          {user && user.is_admin && (
            <Link to="/admin" className="text-red-400 font-bold hover:text-red-300 transition flex items-center gap-1">
              <span className="text-xs">🛡️</span> Admin
            </Link>
          )}

          <div className="h-6 w-px bg-border-color mx-2"></div>
          
          {user ? (
            <>
              <Link to="/profile" className="text-gold hover:text-white flex items-center gap-2 group">
                 <div className="w-8 h-8 bg-dark-blue rounded-full overflow-hidden border border-gold flex items-center justify-center text-xs group-hover:scale-110 transition-transform shadow-md">
                    {user.profile_picture && user.profile_picture !== 'default.png' ? (
                      <img 
                        src={user.profile_picture.startsWith('user_') ? `/uploads/${user.profile_picture}` : `/img/champions/${user.profile_picture}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                 </div>
                 {user.username}
              </Link>
              <button onClick={logout} className="text-loss-border hover:text-red-400 text-sm">Salir</button>
            </>
          ) : (
            <Link to="/login" className="bg-gold text-dark-blue px-4 py-2 rounded font-bold hover:bg-gold-hover transition">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-blue flex flex-col font-sans">
          <NavLinks />
          <main className="flex-grow container mx-auto p-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/match-history" element={<MatchHistory />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <footer className="bg-medium-blue p-6 text-center text-sm text-gray-500 border-t border-border-color">
            LeagueStats TFG © 2026. Data based on Riot Games API.
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
