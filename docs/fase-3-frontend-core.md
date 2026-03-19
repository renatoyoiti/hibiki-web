# Fase 3 — Frontend Core

**Status:** Pendente  
**Pré-requisito:** Fase 1 concluída (monorepo, TailwindCSS, Montserrat)  
**Pode rodar em paralelo com:** Fase 2 (Backend Core)  
**Ref. spec:** seções 3 (RN-01 a RN-05), 7 (UC-01, UC-02, UC-05), 9, 10, 12

---

## Objetivo

Implementar o núcleo funcional do frontend: cliente HTTP para a API, refatoração do store Zustand com as regras de negócio de áudio, componentes de biblioteca de sons, fila de execução ativa com controle de volume, mute individual e global, e reprodução em loop infinito.

> **Nota:** Durante o desenvolvimento desta fase, a API pode ainda não estar pronta (Fase 2 em paralelo). Usar dados mockados nos serviços até a integração real.

---

## Contexto atual do store

O `soundStore.ts` existente usa `file` (string de caminho local) como chave, persiste em localStorage e tem `togglePlay`, `setVolume`, `playAll`, `pauseAll`, `loadState`. Ele **não** implementa:

- Mute com restauração de volume (RN-03)
- Mute global com restauração (RN-04)
- Bloqueio de duplicatas (RN-01)
- Integração com API
- Volume padrão 50 ao adicionar (RN-02)

Este store será refatorado integralmente nesta fase.

---

## Estrutura de arquivos esperada

```
apps/web/src/
├── services/
│   ├── soundService.ts     # chamadas HTTP para /sounds
│   └── presetService.ts    # chamadas HTTP para /presets (usado na Fase 4)
├── features/
│   └── sound-control/
│       ├── components/
│       │   ├── SoundCard.tsx
│       │   ├── ActiveSoundItem.tsx
│       │   ├── VolumeSlider.tsx
│       │   └── SoundPlayer.tsx    # refatorar existente
│       ├── store/
│       │   └── soundStore.ts      # refatorar existente
│       └── types/
│           └── types.ts           # atualizar
├── pages/
│   ├── Home.tsx
│   └── Library.tsx         # nova
└── App.tsx
```

---

## Tarefa: Cliente HTTP

**`fe-api-client`**

Criar módulo de serviços em `apps/web/src/services/`:

### `soundService.ts`
```typescript
// Funções tipadas para cada endpoint de sons:
getSounds(): Promise<Sound[]>
uploadSound(file: File, name?: string): Promise<Sound>
toggleFavorite(id: string): Promise<Sound>
deleteSound(id: string): Promise<void>
```

### `presetService.ts` *(usado na Fase 4)*
```typescript
getPresets(): Promise<Preset[]>
getPreset(id: string): Promise<Preset>
createPreset(data: CreatePresetDTO): Promise<Preset>
updatePreset(id: string, data: UpdatePresetDTO): Promise<Preset>
deletePreset(id: string): Promise<void>
```

**Tipos compartilhados** (em `packages/shared/` ou `src/types/`):

```typescript
interface Sound {
  id: string;
  name: string;
  filePath: string;
  isFavorite: boolean;
  createdAt: string;
}

interface Preset {
  id: string;
  name: string;
  sounds: Array<{ soundId: string; name: string; volume: number }>;
  createdAt: string;
  updatedAt: string;
}
```

- Usar `fetch` nativo ou `axios`
- Base URL configurável via `import.meta.env.VITE_API_URL` (padrão: `http://localhost:3000/api`)
- Tratar erros HTTP: lançar erro com `code` e `message` do padrão da API

---

## Tarefa: Refatoração do Zustand Store

**`fe-refactor-store`**

Refatorar `soundStore.ts` para gerenciar a fila de execução ativa com as regras de negócio completas.

**Estado:**
```typescript
interface ActiveSound {
  id: string;
  name: string;
  filePath: string;
  volume: number;       // 0–100
  isMuted: boolean;
  previousVolume: number | null; // volume antes do mute por botão
}

interface SoundState {
  sounds: Sound[];           // biblioteca completa (da API)
  activeSounds: ActiveSound[]; // fila de execução ativa
  isGlobalMuted: boolean;
  globalPreMuteVolumes: Record<string, number>; // volumes antes do mute global

  // Ações
  fetchSounds(): Promise<void>;
  addSound(sound: Sound): void;
  removeSound(id: string): void;
  setVolume(id: string, volume: number): void;
  toggleMute(id: string): void;
  toggleGlobalMute(): void;
  toggleFavorite(id: string): Promise<void>;
}
```

**Regras implementadas:**

**RN-01 — Unicidade na fila:**
```typescript
addSound(sound) {
  if (activeSounds.find(s => s.id === sound.id)) {
    // disparar toast de aviso (Fase 5) ou ignorar silenciosamente
    return;
  }
  activeSounds.push({ ...sound, volume: 50, isMuted: false, previousVolume: null });
}
```

**RN-02 — Volume padrão 50:**
- Volume inicial ao adicionar = `50`

**RN-03 — Mute individual com restauração:**
```typescript
setVolume(id, volume) {
  if (volume === 0) → marcar isMuted = true, previousVolume = null
  else → atualizar volume, isMuted = false
}

toggleMute(id) {
  const sound = activeSounds[id];
  if (sound.isMuted) {
    // desmutar
    const restored = sound.previousVolume ?? 50;
    volume = restored, isMuted = false, previousVolume = null
  } else {
    // mutar
    previousVolume = sound.volume (se > 0), volume = som permanece internamente, isMuted = true
  }
}
```

**RN-04 — Mute global:**
```typescript
toggleGlobalMute() {
  if (!isGlobalMuted) {
    // salvar volumes atuais de cada som não mutado
    globalPreMuteVolumes = { [id]: volume, ... }
    isGlobalMuted = true
  } else {
    // restaurar cada volume salvo
    isGlobalMuted = false
    restaurar globalPreMuteVolumes para cada som
  }
}
```

---

## Tarefa: VolumeSlider

**`fe-volume-slider`**

Componente reutilizável estilizado com Tailwind:

```tsx
interface VolumeSliderProps {
  value: number;       // 0–100
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

- Input `type="range"` customizado com CSS/Tailwind
- Slider em `0` deve acionar mute automático via `onChange` → store `setVolume` → `isMuted = true`
- Visual: thumb arredondado, track com gradiente usando `--color-primary`
- Estado `disabled`: opacidade reduzida, cursor não permitido

---

## Tarefa: SoundCard

**`fe-sound-card`**

Card da biblioteca de sons:

```tsx
interface SoundCardProps {
  sound: Sound;
  isActive: boolean;   // já está na fila de execução
  onAdd: () => void;
  onFavoriteToggle: () => void;
}
```

**Visual (design system):**
- Background: `bg-surface` (`#1a1a2e` dark / `#ffffff` light)
- Border: `border` (`#2e2b45` dark)
- Nome do som: `text-primary`, fonte Montserrat 500
- Botão favorito: ícone de coração/estrela — preenchido se `isFavorite`; cor `accent` (`#9b8fef`)
- Botão adicionar: ícone `+` → cor `primary` (`#6c63ff`); desabilitado (opacidade 40%) se `isActive`
- Hover: leve elevação de background

---

## Tarefa: Biblioteca de Sons

**`fe-sound-library`**

Página `/library` que lista todos os sons da API:

- Buscar via `getSounds()` no mount
- **Favoritos no topo** (RN-06) — a API já retorna ordenado, mas garantir no frontend também
- Grid responsivo: 1 coluna mobile, 2 colunas `md`, 3 colunas `lg`
- Usar `SoundCard` para cada item
- Estado de loading (skeleton ou spinner) enquanto busca
- Estado de erro com mensagem amigável

---

## Tarefa: ActiveSoundItem

**`fe-active-sound-item`**

Item da fila de execução ativa:

```tsx
interface ActiveSoundItemProps {
  sound: ActiveSound;
  isGlobalMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onRemove: () => void;
}
```

**Visual:**
- Nome do som à esquerda
- `VolumeSlider` centralizado — desabilitado se `isMuted || isGlobalMuted`
- Botão mute: ícone de alto-falante — muda para mutado quando `isMuted`; cor `text-secondary` quando ativo, `text-muted` quando mutado
- Botão remover: ícone `X` — cor `danger` (`#e05c7a`) no hover

**Comportamento (RN-03):**
- Ao mover slider para 0 → `setVolume(id, 0)` → store marca como mutado
- Ao clicar mute com volume > 0 → salva `previousVolume`, marca `isMuted = true`
- Ao desmutar com `previousVolume` → restaura volume anterior
- Ao desmutar sem `previousVolume` (veio de volume 0) → restaura para 50

---

## Tarefa: Mute Global

**`fe-global-mute`**

Botão "Mutar todos" no player ativo:

- Ícone de alto-falante com `X` quando mutado globalmente
- Ao ativar mute global: salva volumes individuais de cada som não mutado em `globalPreMuteVolumes`
- Ao desativar: restaura cada volume salvo
- **Sons que estavam individualmente mutados antes do mute global permanecem mutados após desmutar global**
- Ref. spec RN-04

---

## Tarefa: Reprodução em loop infinito

**`fe-audio-loop`**

Implementar reprodução via `<audio>` nativo com `loop`:

```tsx
// Para cada ActiveSound na fila:
<audio
  src={sound.filePath}
  loop
  volume={sound.isMuted || isGlobalMuted ? 0 : sound.volume / 100}
  autoPlay={!sound.isMuted}
/>
```

- Usar `useRef` para controlar cada instância de áudio
- Sincronizar `volume` e `muted` com o estado do store em tempo real
- Ao adicionar som à fila → criar instância de áudio e iniciar reprodução
- Ao remover som → pausar e destruir instância
- Ao mutar → setar `audio.volume = 0` (não pausar — mantém loop sincronizado)
- Ref. spec RN-05

---

## Edge cases mapeados (spec seção 12)

| Cenário | Comportamento no Frontend |
|---|---|
| Adicionar som já ativo | Bloqueado em `addSound()` — toast de aviso (Fase 5) |
| Slider arrastado para 0 | Som marcado como mutado automaticamente |
| Desmutar com volume em 0 | Volume restaurado para 50 |
| Desmutar após mute por botão | Volume restaurado ao valor anterior |
| Mute global → ajustar volume individual | Volume individual salvo, mute global mantido até desmutar global |

---

## Critérios de conclusão

- [ ] `getSounds()` busca sons da API e popula store
- [ ] `addSound()` bloqueia duplicatas (RN-01) e define volume 50 (RN-02)
- [ ] `setVolume(id, 0)` marca som como mutado automaticamente (RN-03)
- [ ] `toggleMute(id)` restaura volume anterior corretamente (RN-03)
- [ ] `toggleGlobalMute()` muta/restaura todos os volumes (RN-04)
- [ ] `SoundCard` exibe favoritos com ícone preenchido; botão adicionar desabilitado se já ativo
- [ ] `ActiveSoundItem` exibe slider desabilitado quando mutado
- [ ] Biblioteca de sons com favoritos no topo, grid responsivo
- [ ] Sons em loop infinito enquanto na fila e não mutados (RN-05)
- [ ] `toggleFavorite()` atualiza API e reflete na biblioteca

---

## Dependências

- **Fase 1** completa: `infra-monorepo`, `infra-tailwind`, `infra-montserrat`
- **Fase 2** (parcial, para integração real): `be-sounds-get`, `be-sounds-favorite` — enquanto não disponíveis, usar mocks
