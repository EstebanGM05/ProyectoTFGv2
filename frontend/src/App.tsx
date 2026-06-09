
import { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-medium-blue border-b border-border-color shadow-lg sticky top-0 z-[999]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-gold text-2xl font-bold font-serif hover:text-gold-hover transition z-50">
          LeagueStats
        </Link>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white hover:text-gold transition text-2xl z-50"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 items-center">
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
              <button onClick={logout} className="text-loss-border hover:text-red-400 text-sm font-bold">Salir</button>
            </>
          ) : (
            <Link to="/login" className="bg-gold text-dark-blue px-4 py-2 rounded font-bold hover:bg-gold-hover transition">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-[#111827] border-b border-gold/20 shadow-[0_30px_60px_rgba(0,0,0,0.9)] z-[999] transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col p-4 gap-4 relative z-[1000]">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-text-color hover:text-gold transition block py-2 border-b border-white/5">Campeones</Link>
          <Link to="/match-history" onClick={() => setIsMobileMenuOpen(false)} className="text-text-color hover:text-gold transition block py-2 border-b border-white/5">Historial</Link>
          <Link to="/friends" onClick={() => setIsMobileMenuOpen(false)} className="text-text-color hover:text-gold transition block py-2 border-b border-white/5">Amigos</Link>
          <Link to="/favorites" onClick={() => setIsMobileMenuOpen(false)} className="text-text-color hover:text-gold transition block py-2 border-b border-white/5">Favoritos</Link>
          
          {user && user.is_admin && (
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-red-400 font-bold hover:text-red-300 transition flex items-center gap-2 py-2 border-b border-white/5">
              <span>🛡️</span> Panel Admin
            </Link>
          )}
          
          <div className="pt-2">
            {user ? (
              <div className="flex items-center justify-between">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-gold hover:text-white flex items-center gap-3">
                   <div className="w-10 h-10 bg-dark-blue rounded-full overflow-hidden border-2 border-gold flex items-center justify-center text-sm shadow-md">
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
                   <span className="font-bold">{user.username}</span>
                </Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30">Cerrar Sesión</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-gold text-dark-blue px-4 py-3 rounded-xl font-black text-center block w-full hover:bg-gold-hover transition">
                Entrar / Registrarse
              </Link>
            )}
          </div>
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
