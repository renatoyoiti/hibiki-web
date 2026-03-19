# Design — Fase 4: Frontend Presets

**Data:** 2026-03-19  
**Status:** Aprovado  
**Ref. spec:** `docs/fase-4-frontend-presets.md`

---

## Problema

A aplicação possui backend de presets completo (Fase 2) e frontend de sons ativos (Fase 3), mas não há integração entre eles. O usuário não consegue salvar, listar ou carregar presets na interface. Além disso, a `Home.tsx` atual exibe apenas o Mixer, sem separação clara entre a biblioteca de sons e a execução ativa.

---

## Abordagem

**Store separado + páginas desacopladas.**

`presetStore.ts` é criado independentemente de `soundStore.ts`. A comunicação entre eles é unidirecional: `presetStore.loadPreset()` chama `soundStore.loadActiveSounds()`. A página `/player` (nova) centraliza a execução ativa. A `Home` é refatorada com duas seções: presets e biblioteca.

---

## Estrutura de arquivos

```
apps/web/src/
├── features/
│   ├── sound-control/          (existente)
│   │   ├── components/
│   │   └── store/soundStore.ts  ← adicionar isGlobalPaused + pauseAll/resumeAll + clearActiveSounds
│   └── presets/                (novo)
│       ├── components/
│       │   ├── PresetCard.tsx
│       │   └── PresetForm.tsx
│       └── store/
│           └── presetStore.ts
├── components/
│   └── shared/
│       ├── PlayerBar.tsx       (existente — mantida)
│       └── ConfirmModal.tsx    (novo)
└── pages/
    ├── Home.tsx    ← refatorada: seção Presets + seção Biblioteca
    ├── Library.tsx (mantida sem alteração)
    └── Player.tsx  (nova)
```

**Nova rota em `App.tsx`:**
```tsx
<Route path="/player" element={<Player />} />
```

---

## Fluxos de navegação

| Ação | Resultado |
|------|-----------|
| Home → clicar "+ Adicionar" em um som | `soundStore.addSound()` → `navigate('/player')` |
| Home → clicar "Carregar" em um preset | `presetStore.loadPreset(preset)` → `navigate('/player')` |
| Home → clicar "Renomear" em um preset | Abre `PresetForm` com `initialName` → `presetStore.updatePreset(id, { name })` |
| /player → "Salvar como preset" | Abre `PresetForm` → `presetStore.createPreset(name)` |
| /player → "Salvar alterações" (só se `activePresetId !== null`) | `presetStore.updatePreset(activePresetId)` (captura sons atuais da fila) |
| /player → "Parar execução" | `soundStore.clearActiveSounds()` + `presetStore.setActivePresetId(null)` + `navigate('/')` |

---

## soundStore — adições

Novos campos e ações adicionados ao `soundStore.ts` existente:

```typescript
// Estado novo
isGlobalPaused: boolean;

// Ações existentes (já implementadas na Fase 3)
loadActiveSounds(items: Array<{ sound: Sound; volume: number }>): void;
  // Substitui COMPLETAMENTE activeSounds; reseta isGlobalMuted e globalPreMuteVolumes

// Ações novas
toggleGlobalPause(): void;  // toggle isGlobalPaused
resumeAll(): void;          // seta isGlobalPaused = false (usado por loadPreset)
clearActiveSounds(): void;  // limpa activeSounds, reseta isGlobalMuted, isGlobalPaused = false
```

**`AudioEngine.tsx`** precisa escutar `isGlobalPaused` e chamar `audio.pause()` / `audio.play()` nos sons ativos conforme estado.

---

## presetStore

```typescript
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
```

**Regras:**

- `loadPreset(preset)` — chama `soundStore.loadActiveSounds()` com sons válidos do preset; seta `activePresetId = preset.id`; chama `soundStore.resumeAll()` para garantir `isGlobalPaused = false`
- `createPreset(name)` — lê `soundStore.activeSounds`, mapeia para `{ soundId, volume }`, chama `presetService.create()`, re-fetch lista
- `updatePreset(id, { name? })` — se `name` fornecido: só atualiza nome; se sem data: captura `soundStore.activeSounds` e atualiza sons; re-fetch lista
- `deletePreset(id)` — **apenas se `id !== activePresetId`**; soft delete via API; re-fetch lista; **não altera `activeSounds`**
- `setActivePresetId(null)` — chamado junto com `clearActiveSounds()` ao parar execução

---

## Componentes

### `ConfirmModal.tsx` (shared)

Modal reutilizável para ações destrutivas.

```typescript
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;   // padrão: "Confirmar"
  cancelLabel?: string;    // padrão: "Cancelar"
  variant?: 'danger' | 'warning';  // padrão: 'danger'
  onConfirm: () => void;
  onCancel: () => void;
}
```

- Overlay `rgba(0,0,0,0.6)`, fecha com `Escape` ou clique no overlay
- Background `bg-surface`, border-radius `12px`
- Botão confirmar: `bg-danger` (danger) ou `bg-warning` (warning)
- Animação: fade-in ao abrir, fade-out ao fechar

### `PresetCard.tsx`

```typescript
interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}
```

- Background `bg-surface`, borda `primary` quando `isActive`
- Nome: Montserrat 700
- Sons resumidos: máx 3 nomes + "e mais N" se houver mais
- Botão "Carregar": cor `primary`; mostra estado diferente (ex: "Em execução") quando `isActive`
- Botão "Renomear": ícone lápis, `text-secondary`
- Botão "Excluir": ícone lixeira, **desabilitado** quando `isActive` (tooltip explicativo); abre `ConfirmModal` antes de deletar

### `PresetForm.tsx`

Modal de nome + preview dos sons. Usado tanto para criar quanto para renomear.

```typescript
interface PresetFormProps {
  isOpen: boolean;
  initialName?: string;       // pré-preenchido ao renomear
  activeSounds?: ActiveSound[];  // exibidos como preview somente-leitura ao criar
  onConfirm: (name: string) => void;
  onCancel: () => void;
}
```

- Input de nome obrigatório (não permite confirmar com campo vazio)
- Lista somente-leitura dos sons ativos (somente ao criar; ao renomear, apenas o input de nome)

### `Home.tsx` (refatorada)

Duas seções com scroll vertical:

**Seção 1 — "Seus Presets"**
- `presetStore.fetchPresets()` no mount
- Grid: 1 col (mobile) / 2 (md) / 3 (lg)
- Estado vazio: "Nenhum preset salvo ainda" + CTA para biblioteca
- Estado loading: skeleton/spinner

**Seção 2 — "Biblioteca de Sons"**
- `soundStore.fetchSounds()` no mount (se ainda não carregado)
- Idêntica à `/library` atual: SoundCards em grid, busca por nome, favoritos no topo
- Clicar "+ Adicionar" → `soundStore.addSound()` → `navigate('/player')`

### `Player.tsx` (nova)

Página de execução ativa. Layout:

- **Header da página:** nome do preset ativo (se houver) ou "Execução livre"
- **Controles globais (topo):**
  - Toggle "Pausar/Retomar" → `soundStore.toggleGlobalPause()`
  - "Mutar todos" → `soundStore.toggleGlobalMute()`
  - "Parar execução" → `soundStore.clearActiveSounds()` + `presetStore.setActivePresetId(null)` + `navigate('/')`
- **Ações de preset (topo, lado direito):**
  - "Salvar como preset" → abre `PresetForm` (sempre visível)
  - "Salvar alterações" → `presetStore.updatePreset(activePresetId)` (só se `activePresetId !== null`)
- **Lista de sons ativos:** `ActiveSoundItem` para cada som (slider volume, mute individual, remover)
- **Estado vazio:** "Nenhum som em execução" + CTA para Home
- **Painel de sons disponíveis** (seção abaixo ou lateral em desktop): sons da biblioteca para adicionar diretamente ao mixer. Clicar em "+ Adicionar" chama `soundStore.addSound()` e permanece na página `/player` (sem navegação, pois o usuário já está na execução)

---

## Regras de negócio

| ID | Regra |
|----|-------|
| RN-01 | `addSound()` bloqueia duplicatas (já implementado) |
| RN-07 | `loadPreset()` substitui COMPLETAMENTE a fila ativa |
| RN-09 | Todo delete de preset usa soft delete |
| RN-10 | Toda ação destrutiva (delete preset) exige `ConfirmModal` |
| **RN-NEW-01** | Preset ativo **não pode ser deletado** — botão desabilitado |
| **RN-NEW-02** | Toggle Pausar/Retomar pausa/retoma áudio sem remover sons da fila |

---

## Ordem de implementação sugerida

1. `soundStore` — adicionar `isGlobalPaused`, `toggleGlobalPause`, `clearActiveSounds`
2. `AudioEngine` — escutar `isGlobalPaused`
3. `ConfirmModal.tsx`
4. `presetStore.ts`
5. `PresetForm.tsx`
6. `PresetCard.tsx`
7. `Player.tsx`
8. `Home.tsx` (refatoração)
9. `App.tsx` — adicionar rota `/player`

---

## Critérios de conclusão

- [ ] `presetStore.fetchPresets()` popula lista da API
- [ ] `presetStore.loadPreset()` substitui fila ativa (RN-07) e navega para `/player`
- [ ] `presetStore.createPreset()` salva fila atual como preset com preview de confirmação
- [ ] `presetStore.updatePreset()` atualiza sons ou nome do preset
- [ ] `presetStore.deletePreset()` faz soft delete; botão desabilitado para preset ativo (RN-NEW-01)
- [ ] `ConfirmModal` abre antes de qualquer delete (RN-10)
- [ ] `PresetCard` com borda destacada quando ativo
- [ ] Toggle Pausar/Retomar funcional no `/player` (RN-NEW-02)
- [ ] Botão "Parar execução" limpa fila e reseta `activePresetId`
- [ ] Home com duas seções: presets e biblioteca
- [ ] `/library` mantida sem alteração
