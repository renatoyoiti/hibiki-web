import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Music2, Library, Play } from 'lucide-react';
import Home from './pages/Home';
import LibraryPage from './pages/Library';
import Player from './pages/Player';
import PlayerBar from './components/shared/PlayerBar';
import AudioEngine from './features/sound-control/components/AudioEngine';

function AppContent() {
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';

  return (
    <>
      <AudioEngine />

      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-base/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-primary" />
            <span className="font-bold text-text-primary tracking-tight">hibiki</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
                }`
              }
            >
              <Music2 size={14} />
              Home
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
                }`
              }
            >
              <Library size={14} />
              Biblioteca
            </NavLink>
            <NavLink
              to="/player"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
                }`
              }
            >
              <Play size={14} />
              Player
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className={`pt-14 min-h-screen ${isPlayerPage ? 'pb-8' : 'pb-64'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/player" element={<Player />} />
        </Routes>
      </main>

      {/* PlayerBar visível apenas fora do /player */}
      {!isPlayerPage && <PlayerBar />}
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
