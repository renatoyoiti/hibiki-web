import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSoundStore } from '../features/sound-control/store/soundStore';
import SoundCard from '../features/sound-control/components/SoundCard';

export default function Library() {
  const { sounds, isLoadingSounds, fetchSounds } = useSoundStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  const favorites = sounds.filter(
    (s) => s.isFavorite && s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const others = sounds.filter(
    (s) => !s.isFavorite && s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Biblioteca de sons</h1>

      {/* Busca */}
      <div className="relative mb-8">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar sons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {isLoadingSounds && (
        <p className="text-text-muted text-sm">Carregando sons...</p>
      )}

      {!isLoadingSounds && sounds.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted mb-2">Nenhum som cadastrado ainda.</p>
          <p className="text-xs text-text-muted">
            Faça upload via{' '}
            <code className="bg-surface-muted px-1 py-0.5 rounded text-xs">POST /api/sounds/upload</code>
          </p>
        </div>
      )}

      {favorites.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Favoritos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {favorites.map((sound) => (
              <SoundCard key={sound.id} sound={sound} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          {favorites.length > 0 && (
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
              Todos os sons
            </h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {others.map((sound) => (
              <SoundCard key={sound.id} sound={sound} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
