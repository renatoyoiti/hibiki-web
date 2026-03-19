import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Volume2, VolumeX, Square, Save, Check, Layers,
} from 'lucide-react';
import { useSoundStore } from '../features/sound-control/store/soundStore';
import { usePresetStore } from '../features/presets/store/presetStore';
import ActiveSoundItem from '../features/sound-control/components/ActiveSoundItem';
import SoundCard from '../features/sound-control/components/SoundCard';
import PresetForm from '../features/presets/components/PresetForm';

export default function Player() {
  const navigate = useNavigate();
  const {
    activeSounds,
    isGlobalMuted,
    isGlobalPaused,
    toggleGlobalMute,
    toggleGlobalPause,
    clearActiveSounds,
    fetchSounds,
    sounds,
    isLoadingSounds,
  } = useSoundStore();
  const {
    presets,
    activePresetId,
    fetchPresets,
    createPreset,
    updatePreset,
    setActivePresetId,
  } = usePresetStore();

  const [saveFormOpen, setSaveFormOpen] = useState(false);

  const activePreset = presets.find((p) => p.id === activePresetId);

  useEffect(() => {
    if (sounds.length === 0) fetchSounds();
  }, [sounds.length, fetchSounds]);

  // Garante que os presets estejam carregados ao navegar direto para /player
  useEffect(() => {
    if (presets.length === 0) fetchPresets();
  }, [presets.length, fetchPresets]);

  function handleStop() {
    clearActiveSounds();
    setActivePresetId(null);
    navigate('/');
  }

  async function handleSaveNew(name: string) {
    try {
      await createPreset(name);
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setSaveFormOpen(false);
    }
  }

  async function handleSaveChanges() {
    if (!activePresetId) return;
    await updatePreset(activePresetId);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {activePreset ? activePreset.name : 'Execução livre'}
          </h1>
          {activeSounds.length > 0 && (
            <p className="text-sm text-text-muted mt-0.5">
              {activeSounds.length} {activeSounds.length === 1 ? 'som ativo' : 'sons ativos'}
            </p>
          )}
        </div>

        {/* Ações de preset */}
        <div className="flex items-center gap-2 shrink-0">
          {activePresetId && (
            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-muted transition-colors"
            >
              <Check size={14} />
              Salvar alterações
            </button>
          )}
          <button
            onClick={() => setSaveFormOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            <Save size={14} />
            Salvar como preset
          </button>
        </div>
      </div>

      {/* Controles globais — só aparecem quando há sons ativos */}
      {activeSounds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={toggleGlobalPause}
            className={[
              'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
              isGlobalPaused
                ? 'bg-primary/20 text-primary'
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted',
            ].join(' ')}
          >
            {isGlobalPaused ? <Play size={14} /> : <Pause size={14} />}
            {isGlobalPaused ? 'Retomar' : 'Pausar'}
          </button>

          <button
            onClick={toggleGlobalMute}
            className={[
              'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
              isGlobalMuted
                ? 'bg-warning/20 text-warning'
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted',
            ].join(' ')}
          >
            {isGlobalMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isGlobalMuted ? 'Reativar todos' : 'Mutar todos'}
          </button>

          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-surface border border-border text-danger hover:bg-danger/10 transition-colors"
          >
            <Square size={14} />
            Parar execução
          </button>
        </div>
      )}

      {/* Sons ativos */}
      {activeSounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-border rounded-2xl mb-10">
          <p className="text-text-muted text-sm">Nenhum som em execução.</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors"
          >
            Ir para a Home
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-10">
          {activeSounds.map((sound) => (
            <ActiveSoundItem key={sound.id} sound={sound} />
          ))}
        </div>
      )}

      {/* Painel de sons disponíveis para adicionar */}
      {!isLoadingSounds && sounds.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-text-muted" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Adicionar sons
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sounds.map((sound) => (
              // Sem onAfterAdd: adicionar na /player não navega
              <SoundCard key={sound.id} sound={sound} />
            ))}
          </div>
        </section>
      )}

      {/* Modal: salvar como novo preset */}
      <PresetForm
        isOpen={saveFormOpen}
        mode="create"
        activeSounds={activeSounds}
        onConfirm={handleSaveNew}
        onCancel={() => setSaveFormOpen(false)}
      />
    </div>
  );
}
