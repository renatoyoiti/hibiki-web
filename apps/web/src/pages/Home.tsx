import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Layers, BookMarked } from 'lucide-react';
import { useSoundStore } from '../features/sound-control/store/soundStore';
import { usePresetStore } from '../features/presets/store/presetStore';
import SoundCard from '../features/sound-control/components/SoundCard';
import PresetCard from '../features/presets/components/PresetCard';
import PresetForm from '../features/presets/components/PresetForm';
import ConfirmModal from '../components/shared/ConfirmModal';

export default function Home() {
  const navigate = useNavigate();
  const { sounds, isLoadingSounds, fetchSounds } = useSoundStore();
  const {
    presets,
    activePresetId,
    fetchPresets,
    loadPreset,
    updatePreset,
    deletePreset,
  } = usePresetStore();

  const [query, setQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchSounds();
    fetchPresets();
  }, [fetchSounds, fetchPresets]);

  const favorites = sounds.filter(
    (s) => s.isFavorite && s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const others = sounds.filter(
    (s) => !s.isFavorite && s.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleRenameConfirm(name: string) {
    if (!renameTarget) return;
    await updatePreset(renameTarget.id, { name });
    setRenameTarget(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deletePreset(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Seção 1: Presets ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <BookMarked size={20} className="text-primary" />
          Seus presets
        </h2>

        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-border rounded-2xl">
            <p className="text-text-muted text-sm">Nenhum preset salvo ainda.</p>
            <Link to="/library" className="text-sm text-primary hover:underline">
              Explorar sons →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={preset.id === activePresetId}
                onLoad={() => {
                  loadPreset(preset);
                  navigate('/player');
                }}
                onRename={() => setRenameTarget({ id: preset.id, name: preset.name })}
                onDelete={() => setDeleteTarget({ id: preset.id, name: preset.name })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Seção 2: Biblioteca de sons ── */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Biblioteca de sons
        </h2>

        <div className="relative mb-6">
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

        {isLoadingSounds && <p className="text-text-muted text-sm">Carregando sons...</p>}

        {!isLoadingSounds && sounds.length === 0 && (
          <p className="text-text-muted text-sm">Nenhum som cadastrado ainda.</p>
        )}

        {favorites.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
              Favoritos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {favorites.map((s) => (
                <SoundCard key={s.id} sound={s} onAfterAdd={() => navigate('/player')} />
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            {favorites.length > 0 && (
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                Todos os sons
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {others.map((s) => (
                <SoundCard key={s.id} sound={s} onAfterAdd={() => navigate('/player')} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Modais ── */}
      <PresetForm
        isOpen={!!renameTarget}
        mode="rename"
        initialName={renameTarget?.name ?? ''}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir preset"
        message={`Tem certeza que deseja excluir o preset "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

