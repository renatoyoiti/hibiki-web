# Contexto — Fase 3: Frontend Core

## O que foi feito

### Serviços HTTP (`apps/web/src/services/`)
- `api.ts` — cliente HTTP base com tratamento de erros; usa `VITE_API_URL` como base URL
- `soundService.ts` — `list`, `upload`, `toggleFavorite`, `delete`
- `presetService.ts` — `list`, `get`, `create`, `update`, `delete`

### Tipos (`apps/web/src/types/index.ts`)
- Interfaces locais: `Sound`, `Preset`, `PresetSoundItem`, `ActiveSound`, DTOs
- `ActiveSound` inclui: `id`, `name`, `filePath`, `volume` (0–100), `isMuted`, `previousVolume`

### Store refatorado (`soundStore.ts`)
- **RN-01**: `addSound()` retorna `false` sem adicionar duplicatas
- **RN-02**: Volume padrão ao adicionar = 50
- **RN-03**: `setVolume(id, 0)` muta automaticamente; `toggleMute(id)` salva/restaura `previousVolume`
- **RN-04**: `toggleGlobalMute()` salva volumes individuais em `globalPreMuteVolumes` e restaura ao desmutar
- `loadActiveSounds()` prepara a API para carregar presets (Fase 4)

### Componentes
- `VolumeSlider.tsx` — range estilizado 0–100, desabilitado quando global muted
- `SoundCard.tsx` — card de biblioteca com botão favorito (Heart) e botão "+ Adicionar" (desabilitado se ativo)
- `ActiveSoundItem.tsx` — item do mixer com VolumeSlider, botão mute individual e botão remover
- `AudioEngine.tsx` — componente sem UI; gerencia instâncias de `new Audio()` sincronizadas com o store
- `SoundPlayer.tsx` — mantido como stub (legado, não utilizado)

### Componentes compartilhados
- `PlayerBar.tsx` — barra flutuante fixa no bottom; exibe ActiveSoundItems + botão "Mutar todos"

### Páginas
- `Library.tsx` — lista sons da API, favoritos no topo, busca por nome, SoundCards em grid responsivo
- `Home.tsx` — reescrita; exibe ActiveSoundItems ou CTA para ir à Biblioteca

### Roteamento (`App.tsx`)
- `react-router-dom` instalado
- Header fixo com `NavLink` para `/` (Mixer) e `/library` (Biblioteca)
- `AudioEngine` montado na raiz da aplicação

### Design tokens (`tailwind.config.js`)
- Renomeado de `bg-base`/`bg-surface` para `base`/`surface` (tokens mais limpos)
- Adicionados: `surface-muted`, `border`, `warning`
- Atualizado `index.css` para usar novos tokens

## Validação
- `tsc --noEmit` → 0 erros
- `npm run build` → build limpo (239kB JS / 12.6kB CSS)

## Observações técnicas
- `AudioEngine` cria/destrói instâncias de `Audio` via `useRef<Record<string, HTMLAudioElement>>`
- Volume é sempre tratado internamente como 0–100 no store; dividido por 100 ao setar em `audio.volume`
- Autoplay pode ser bloqueado pelo browser; o `.play()` usa `.catch(() => {})` para evitar crash
- A PlayerBar só renderiza quando há sons ativos (`activeSounds.length > 0`)
