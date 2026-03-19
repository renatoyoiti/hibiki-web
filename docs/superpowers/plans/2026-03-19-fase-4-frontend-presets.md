# Fase 4 — Frontend Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de presets no frontend — store Zustand, PresetCard, ConfirmModal, página `/player` como mixer central e refatoração da Home com duas seções (presets + biblioteca).

**Architecture:** `presetStore` separado do `soundStore`, comunicação unidirecional via `soundStore.loadActiveSounds()` e `soundStore.resumeAll()`. Nova página `/player` centraliza a execução ativa. `Home` refatorada exibe presets (topo) e biblioteca de sons (abaixo). Clicar em som ou preset na Home navega para `/player`.

**Tech Stack:** React 19, Zustand 5, TypeScript 5.8, TailwindCSS 3, React Router DOM 7, Lucide React

---

## File Map

| Action | File | Responsabilidade |
|--------|------|------------------|
| Modify | `apps/web/src/features/sound-control/store/soundStore.ts` | Add `isGlobalPaused`, `toggleGlobalPause`, `resumeAll`, `clearActiveSounds` |
| Modify | `apps/web/src/features/sound-control/components/AudioEngine.tsx` | Responde a `isGlobalPaused` |
| Create | `apps/web/src/components/shared/ConfirmModal.tsx` | Modal reutilizável para ações destrutivas |
| Create | `apps/web/src/features/presets/store/presetStore.ts` | CRUD + load de presets |
| Create | `apps/web/src/features/presets/components/PresetForm.tsx` | Modal para criar/renomear preset |
| Create | `apps/web/src/features/presets/components/PresetCard.tsx` | Card de preset com ações |
| Modify | `apps/web/src/features/sound-control/components/SoundCard.tsx` | Adicionar prop opcional `onAfterAdd` |
| Create | `apps/web/src/pages/Player.tsx` | Página de execução: sons ativos + controles + painel de sons |
| Modify | `apps/web/src/pages/Home.tsx` | Duas seções: presets e biblioteca de sons |
| Modify | `apps/web/src/App.tsx` | Adicionar rota `/player`; esconder PlayerBar na rota `/player` |

---

## Task 1: Extend soundStore — pause e clear

**Files:**
- Modify: `apps/web/src/features/sound-control/store/soundStore.ts`

- [ ] **Step 1: Adicionar `isGlobalPaused` ao estado e interface do store**

Abrir `apps/web/src/features/sound-control/store/soundStore.ts`.

Localizar a interface `SoundState` e adicionar logo após `toggleGlobalMute`:

```typescript
toggleGlobalPause: () => void;
resumeAll: () => void;
clearActiveSounds: () => void;
```

Adicionar `isGlobalPaused: boolean` ao estado inicial (junto com `isGlobalMuted`).

A interface completa dos novos campos fica:

```typescript
interface SoundState {
  // ... existente ...
  isGlobalMuted: boolean;
  isGlobalPaused: boolean;          // <-- novo
  globalPreMuteVolumes: Record<string, number>;

  // ... existente ...
  toggleGlobalMute: () => void;
  toggleGlobalPause: () => void;    // <-- novo
  resumeAll: () => void;            // <-- novo
  clearActiveSounds: () => void;    // <-- novo
}
```

- [ ] **Step 2: Implementar as três novas ações no create()**

No objeto passado ao `create<SoundState>((set, get) => ({...}))`, adicionar após `toggleGlobalMute`:

```typescript
isGlobalPaused: false,

// Toggle pausar/retomar todos os sons
toggleGlobalPause: () => set((s) => ({ isGlobalPaused: !s.isGlobalPaused })),

// Forçar retomada (usado por loadPreset)
resumeAll: () => set({ isGlobalPaused: false }),

// Limpar fila completamente (usado por "Parar execução")
clearActiveSounds: () =>
  set({
    activeSounds: [],
    isGlobalMuted: false,
    isGlobalPaused: false,
    globalPreMuteVolumes: {},
  }),
```

- [ ] **Step 3: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 4: Commit**

```bash
cd /path/to/repo
git add apps/web/src/features/sound-control/store/soundStore.ts
git commit -m "feat(web): add isGlobalPaused, toggleGlobalPause, resumeAll, clearActiveSounds to soundStore"
```

---

## Task 2: Update AudioEngine — responder a isGlobalPaused

**Files:**
- Modify: `apps/web/src/features/sound-control/components/AudioEngine.tsx`

O `AudioEngine` precisa pausar/retomar os `HTMLAudioElement` quando `isGlobalPaused` mudar. A solução usa um `ref` para não re-executar o efeito de criação/destruição de instâncias ao pausar.

- [ ] **Step 1: Substituir o conteúdo de AudioEngine.tsx pelo seguinte**

```typescript
import { useEffect, useRef } from 'react';
import { useSoundStore } from '../store/soundStore';

export default function AudioEngine() {
  const audioInstances = useRef<Record<string, HTMLAudioElement>>({});
  const { activeSounds, isGlobalMuted, isGlobalPaused } = useSoundStore();

  // Ref para acessar isGlobalPaused dentro do efeito de criação
  // sem adicioná-lo às deps (evita recriar instâncias ao pausar)
  const isGlobalPausedRef = useRef(isGlobalPaused);
  useEffect(() => {
    isGlobalPausedRef.current = isGlobalPaused;
  }, [isGlobalPaused]);

  // Criar/destruir instâncias conforme a fila muda
  useEffect(() => {
    const currentIds = new Set(activeSounds.map((s) => s.id));
    const existingIds = new Set(Object.keys(audioInstances.current));

    for (const sound of activeSounds) {
      if (!existingIds.has(sound.id)) {
        const audio = new Audio(sound.filePath);
        audio.loop = true;
        if (!isGlobalPausedRef.current) {
          audio.play().catch(() => {});
        }
        audioInstances.current[sound.id] = audio;
      }
    }

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const audio = audioInstances.current[id];
        audio.pause();
        audio.src = '';
        delete audioInstances.current[id];
      }
    }
  }, [activeSounds]);

  // Sincronizar volume e mute
  useEffect(() => {
    for (const sound of activeSounds) {
      const audio = audioInstances.current[sound.id];
      if (!audio) continue;
      const effectivelyMuted = sound.isMuted || isGlobalMuted;
      audio.volume = effectivelyMuted ? 0 : sound.volume / 100;
    }
  }, [activeSounds, isGlobalMuted]);

  // Pausar/retomar todos os sons conforme isGlobalPaused
  useEffect(() => {
    for (const audio of Object.values(audioInstances.current)) {
      if (isGlobalPaused) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    }
  }, [isGlobalPaused]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      for (const audio of Object.values(audioInstances.current)) {
        audio.pause();
        audio.src = '';
      }
      audioInstances.current = {};
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/sound-control/components/AudioEngine.tsx
git commit -m "feat(web): AudioEngine responds to isGlobalPaused"
```

---

## Task 3: Create ConfirmModal

**Files:**
- Create: `apps/web/src/components/shared/ConfirmModal.tsx`

- [ ] **Step 1: Criar o arquivo com o seguinte conteúdo**

```typescript
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-danger hover:bg-danger/80 text-white'
      : 'bg-warning hover:bg-warning/80 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-elevated border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
        <p className="text-sm text-text-secondary mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary border border-border hover:bg-surface-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shared/ConfirmModal.tsx
git commit -m "feat(web): add ConfirmModal reusable component"
```

---

## Task 4: Create presetStore

**Files:**
- Create: `apps/web/src/features/presets/store/presetStore.ts`

Antes de criar o arquivo, criar os diretórios:

```bash
mkdir -p apps/web/src/features/presets/store
mkdir -p apps/web/src/features/presets/components
```

- [ ] **Step 1: Verificar que presetService expõe os métodos necessários**

Abrir `apps/web/src/services/presetService.ts` e confirmar que os métodos `list`, `create`, `update` e `delete` estão implementados e exportados via `presetService`. Esses métodos foram implementados na Fase 2. Só prosseguir para o próximo passo se todos existirem.

- [ ] **Step 2: Criar `apps/web/src/features/presets/store/presetStore.ts`**

```typescript
import { create } from 'zustand';
import type { Preset } from '../../../types';
import { presetService } from '../../../services/presetService';
import { useSoundStore } from '../../sound-control/store/soundStore';

interface PresetStore {
  presets: Preset[];
  activePresetId: string | null;

  fetchPresets(): Promise<void>;
  createPreset(name: string): Promise<void>;
  updatePreset(id: string, data?: { name?: string }): Promise<void>;
  deletePreset(id: string): Promise<void>;
  loadPreset(preset: Preset): void;
  setActivePresetId(id: string | null): void;
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  presets: [],
  activePresetId: null,

  fetchPresets: async () => {
    const presets = await presetService.list();
    set({ presets });
  },

  // Captura o estado atual da fila (activeSounds) e salva como preset
  createPreset: async (name) => {
    const { activeSounds } = useSoundStore.getState();
    const sounds = activeSounds.map((s) => ({ soundId: s.id, volume: s.volume }));
    await presetService.create({ name, sounds });
    await get().fetchPresets();
  },

  // Se data.name fornecido: renomeia. Caso contrário: atualiza sons com fila atual.
  updatePreset: async (id, data) => {
    if (data?.name !== undefined) {
      await presetService.update(id, { name: data.name });
    } else {
      const { activeSounds } = useSoundStore.getState();
      const sounds = activeSounds.map((s) => ({ soundId: s.id, volume: s.volume }));
      await presetService.update(id, { sounds });
    }
    await get().fetchPresets();
  },

  // Guard: não deletar preset ativo. Soft delete via API.
  deletePreset: async (id) => {
    if (id === get().activePresetId) return;
    await presetService.delete(id);
    await get().fetchPresets();
  },

  // Substitui a fila ativa com os sons do preset (RN-07).
  // Sons não encontrados na biblioteca local são ignorados.
  loadPreset: (preset) => {
    const soundStore = useSoundStore.getState();
    const items = preset.sounds
      .map((s) => {
        const sound = soundStore.sounds.find((lib) => lib.id === s.soundId);
        if (!sound) return null;
        return { sound, volume: s.volume };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    soundStore.loadActiveSounds(items);
    soundStore.resumeAll();
    set({ activePresetId: preset.id });
  },

  setActivePresetId: (id) => set({ activePresetId: id }),
}));
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/presets/store/presetStore.ts
git commit -m "feat(web): add presetStore with fetchPresets, createPreset, updatePreset, deletePreset, loadPreset"
```

---

## Task 5: Create PresetForm

**Files:**
- Create: `apps/web/src/features/presets/components/PresetForm.tsx`

Modal com input de nome e preview de sons (somente ao criar). Serve tanto para criar quanto para renomear.

- [ ] **Step 1: Criar `apps/web/src/features/presets/components/PresetForm.tsx`**

```typescript
import { useState, useEffect } from 'react';
import type { ActiveSound } from '../../../types';

interface PresetFormProps {
  isOpen: boolean;
  mode: 'create' | 'rename';
  initialName?: string;
  activeSounds?: ActiveSound[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function PresetForm({
  isOpen,
  mode,
  initialName = '',
  activeSounds = [],
  onConfirm,
  onCancel,
}: PresetFormProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const title = mode === 'create' ? 'Salvar preset' : 'Renomear preset';
  const confirmLabel = mode === 'create' ? 'Salvar' : 'Renomear';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-elevated border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>

        <label className="block text-sm text-text-secondary mb-1">Nome do preset</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Foco profundo"
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
        />

        {mode === 'create' && activeSounds.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Sons incluídos</p>
            <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {activeSounds.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-sm text-text-secondary bg-surface rounded-lg px-3 py-1.5"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-text-muted ml-2 shrink-0">Vol {s.volume}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'create' && activeSounds.length === 0 && (
          <p className="text-sm text-text-muted mb-4 italic">
            Nenhum som ativo — preset será salvo vazio.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary border border-border hover:bg-surface-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/presets/components/PresetForm.tsx
git commit -m "feat(web): add PresetForm modal (create/rename)"
```

---

## Task 6: Create PresetCard

**Files:**
- Create: `apps/web/src/features/presets/components/PresetCard.tsx`

- [ ] **Step 1: Verificar que `PresetSoundItem` possui o campo `name`**

Abrir `apps/web/src/types/index.ts` e confirmar que `PresetSoundItem` tem `name: string`. Isso garante que `soundSummary` acessa `s.name` com segurança. Esperado:

```typescript
export interface PresetSoundItem {
  soundId: string;
  name: string;    // ← deve existir
  volume: number;
}
```

- [ ] **Step 2: Criar `apps/web/src/features/presets/components/PresetCard.tsx`**

```typescript
import { Play, Pencil, Trash2 } from 'lucide-react';
import type { Preset } from '../../../types';

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function soundSummary(sounds: Preset['sounds']): string {
  if (sounds.length === 0) return 'Nenhum som';
  const names = sounds.slice(0, 3).map((s) => s.name);
  const more = sounds.length - 3;
  return more > 0 ? `${names.join(', ')} e mais ${more}` : names.join(', ');
}

export default function PresetCard({
  preset,
  isActive,
  onLoad,
  onRename,
  onDelete,
}: PresetCardProps) {
  return (
    <div
      className={[
        'flex flex-col gap-3 p-4 rounded-2xl border transition-all',
        isActive
          ? 'bg-surface border-primary shadow-md shadow-primary/10'
          : 'bg-surface border-border hover:border-primary/30',
      ].join(' ')}
    >
      {/* Header: nome + botões de ação */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-text-primary truncate flex-1">{preset.name}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRename}
            aria-label="Renomear preset"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={isActive}
            aria-label={isActive ? 'Pare a execução para excluir' : 'Excluir preset'}
            title={isActive ? 'Pare a execução para poder excluir este preset' : undefined}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Resumo dos sons */}
      <p className="text-xs text-text-muted truncate">{soundSummary(preset.sounds)}</p>

      {/* Botão Carregar */}
      <button
        onClick={onLoad}
        className={[
          'flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors self-start',
          isActive
            ? 'bg-primary/20 text-primary cursor-default'
            : 'bg-primary text-white hover:bg-primary-hover',
        ].join(' ')}
      >
        <Play size={12} />
        {isActive ? 'Em execução' : 'Carregar'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/presets/components/PresetCard.tsx
git commit -m "feat(web): add PresetCard component"
```

---

## Task 7: Update SoundCard — add onAfterAdd prop

**Files:**
- Modify: `apps/web/src/features/sound-control/components/SoundCard.tsx`

Adicionar prop opcional `onAfterAdd?: () => void` que é chamada após `addSound()` bem-sucedido. Permite que a Home navegue para `/player` após adicionar um som.

> **Pré-condição:** `addSound()` em `soundStore.ts` já retorna `boolean` (`true` se adicionado, `false` se duplicata — RN-01). Verificar antes de prosseguir:
> ```typescript
> // apps/web/src/features/sound-control/store/soundStore.ts — linha ~20
> addSound: (sound: Sound) => boolean;
> ```
> Se retornar `void`, atualizar o tipo e a implementação no store primeiro (ref. Task 1 já adicionou as outras ações; adicionar o retorno `boolean` lá se necessário).

- [ ] **Step 1: Atualizar a interface e o botão em SoundCard.tsx**

Localizar:

```typescript
interface SoundCardProps {
  sound: Sound;
}
```

Substituir por:

```typescript
interface SoundCardProps {
  sound: Sound;
  onAfterAdd?: () => void;
}
```

Localizar a desestruturação das props:

```typescript
export default function SoundCard({ sound }: SoundCardProps) {
```

Substituir por:

```typescript
export default function SoundCard({ sound, onAfterAdd }: SoundCardProps) {
```

Localizar o onClick do botão Adicionar:

```typescript
onClick={() => addSound(sound)}
```

Substituir por:

```typescript
onClick={() => {
  if (addSound(sound)) onAfterAdd?.();
}}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/sound-control/components/SoundCard.tsx
git commit -m "feat(web): add onAfterAdd optional prop to SoundCard"
```

---

## Task 8: Create Player.tsx

**Files:**
- Create: `apps/web/src/pages/Player.tsx`

Página de execução ativa. Exibe sons ativos com controles individuais, controles globais (pausar/mutar/parar), ações de preset (salvar como novo / salvar alterações) e painel de sons disponíveis para adicionar.

- [ ] **Step 1: Criar `apps/web/src/pages/Player.tsx`**

```typescript
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
    createPreset,
    updatePreset,
    setActivePresetId,
  } = usePresetStore();

  const [saveFormOpen, setSaveFormOpen] = useState(false);

  const activePreset = presets.find((p) => p.id === activePresetId);

  useEffect(() => {
    if (sounds.length === 0) fetchSounds();
  }, [sounds.length, fetchSounds]);

  function handleStop() {
    clearActiveSounds();
    setActivePresetId(null);
    navigate('/');
  }

  async function handleSaveNew(name: string) {
    await createPreset(name);
    setSaveFormOpen(false);
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
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/Player.tsx
git commit -m "feat(web): add Player page with active sounds, global controls and sounds panel"
```

---

## Task 9: Refactor Home.tsx

**Files:**
- Modify: `apps/web/src/pages/Home.tsx`

A Home atual exibe apenas o Mixer. A nova versão tem duas seções: **Seus Presets** (topo) e **Biblioteca de sons** (abaixo). Clicar em "+ Adicionar" em um som navega para `/player`.

- [ ] **Step 1: Substituir completamente o conteúdo de Home.tsx**

```typescript
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
        description={`Tem certeza que deseja excluir o preset "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/Home.tsx
git commit -m "feat(web): refactor Home with presets section + library section"
```

---

## Task 10: Update App.tsx — rota /player e PlayerBar condicional

**Files:**
- Modify: `apps/web/src/App.tsx`

Duas mudanças: (1) adicionar rota `/player`; (2) esconder `PlayerBar` quando o usuário está em `/player` (já que o player tem os controles diretamente na página).

`useLocation` só pode ser chamado dentro do `BrowserRouter`. Por isso, o conteúdo interno precisa ser extraído para um componente filho `AppContent`.

- [ ] **Step 1: Substituir completamente o conteúdo de App.tsx**

```typescript
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
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Build final de verificação**

```bash
cd apps/web && npm run build
```

Esperado: build limpo sem erros de TypeScript ou warnings críticos.

- [ ] **Step 4: Commit final**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): add /player route, conditional PlayerBar, Player NavLink"
```

---

## Verificação manual pós-implementação

Após todos os tasks, verificar os fluxos principais:

| Fluxo | Passos | Resultado esperado |
|-------|--------|--------------------|
| Adicionar som | Home → clicar "+ Adicionar" em um som | Navega para `/player` com som na fila |
| Pausar/retomar | `/player` → botão "Pausar" | Áudio pausa; botão muda para "Retomar" |
| Salvar preset | `/player` (com sons) → "Salvar como preset" → digitar nome → confirmar | Modal mostra sons; preset aparece na Home |
| Carregar preset | Home → "Carregar" no preset card | Navega para `/player` com sons do preset |
| Renomear preset | Home → ícone lápis → digitar novo nome → confirmar | Nome atualizado no card |
| Excluir preset | Home → ícone lixeira → ConfirmModal → confirmar | Preset removido da lista |
| Excluir preset ativo | Home → lixeira em preset com borda primary | Botão desabilitado (sem ação) |
| Parar execução | `/player` → "Parar execução" | Fila limpa, navega para `/`, PlayerBar some |
| Salvar alterações | `/player` (com preset ativo) → "Salvar alterações" | Preset atualizado com sons atuais |
