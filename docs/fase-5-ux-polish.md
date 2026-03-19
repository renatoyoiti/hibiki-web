# Fase 5 — UX & Polish

**Status:** Pendente  
**Pré-requisito:** Fases 3 e 4 concluídas  
**Ref. spec:** seções 2 (Must-Have), 5 (critérios de sucesso), 7 (UC-04), 9, 12

---

## Objetivo

Finalizar a experiência do usuário: sistema de toasts para feedback visual, upload de áudios com validação, alternância dark/light mode, navegação entre páginas e garantia de responsividade mobile-first em toda a aplicação.

---

## Estrutura de arquivos esperada

```
apps/web/src/
├── components/
│   └── shared/
│       ├── Toast.tsx           # componente individual de toast
│       ├── ToastContainer.tsx  # container que renderiza lista de toasts
│       ├── ThemeToggle.tsx     # botão dark/light
│       └── UploadArea.tsx      # área de upload drag & drop
├── store/
│   └── toastStore.ts           # store Zustand para toasts
├── hooks/
│   └── useTheme.ts             # hook para gerenciar tema
└── App.tsx                     # atualizar com Router e ToastContainer
```

---

## Tarefa: Sistema de Toasts

**`fe-toast`**

### Store (`toastStore.ts`)

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // ms, padrão: 4000
}

interface ToastStore {
  toasts: Toast[];
  add(toast: Omit<Toast, 'id'>): void;
  remove(id: string): void;
}
```

Helper global para uso em qualquer store/componente:
```typescript
toast.success("Preset criado com sucesso!")
toast.error("Formato de arquivo não suportado.")
toast.warning("Este som já está na fila de execução.")
```

### Componente `Toast.tsx`

**Visual (design system):**
- `success`: borda esquerda `success` (`#56cfaa`), background `bg-surface`
- `error`: borda esquerda `danger` (`#e05c7a`)
- `warning`: borda esquerda amarelo/âmbar
- `info`: borda esquerda `primary` (`#6c63ff`)
- Ícone à esquerda (Lucide React), mensagem ao centro, botão `X` à direita
- Texto: Montserrat 500, 0.875rem, `text-primary`

### Componente `ToastContainer.tsx`

- Posição: canto superior direito, fixo (`fixed top-4 right-4`)
- Stack vertical de toasts, com animação de entrada (slide da direita) e saída (fade)
- Auto-remove após `duration` ms
- Máximo de 4 toasts simultâneos visíveis

### Uso nos stores existentes

Adicionar chamadas de toast nos eventos já implementados:

| Evento | Toast |
|---|---|
| `addSound` com duplicata (RN-01) | `warning("Este som já está na fila de execução.")` |
| `toggleFavorite` sucesso | `success("Favorito atualizado.")` |
| `createPreset` sucesso | `success("Preset criado com sucesso!")` |
| `updatePreset` sucesso | `success("Preset atualizado.")` |
| `deletePreset` sucesso | `success("Preset excluído.")` |
| Qualquer erro de API | `error(error.message)` |

---

## Tarefa: Upload de Áudio

**`fe-upload-area`**

Implementar fluxo completo de upload conforme UC-04 da spec.

### Componente `UploadArea.tsx`

```tsx
interface UploadAreaProps {
  onUploadSuccess: (sound: Sound) => void;
}
```

**Visual:**
- Área com borda tracejada, cor `border`, background `bg-surface`
- Ícone de upload (Lucide), texto "Arraste um arquivo aqui ou clique para selecionar"
- Subtext: ".mp3, .wav ou .mp4 — máximo 5MB"
- Em drag over: destaque com borda `primary` e background levemente elevado
- Em loading: spinner + texto "Enviando..."

**Validação no cliente (antes de enviar para a API):**

```typescript
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'video/mp4', 'audio/mp4'];
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.mp4'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Formato não suportado. Use .mp3, .wav ou .mp4";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "O arquivo excede o limite de 5MB";
  }
  return null; // válido
}
```

**Fluxo (UC-04):**
1. Usuário seleciona ou arrasta arquivo
2. Validação client-side → se inválido: `toast.error(mensagem)` e interrompe
3. Se válido: chama `soundService.uploadSound(file)` com loading visual
4. Sucesso: `toast.success("Som adicionado à biblioteca!")` + `soundStore.fetchSounds()` para atualizar lista
5. Erro da API: `toast.error(error.message)` com código específico (`INVALID_FILE_FORMAT`, `FILE_TOO_LARGE`)

**Onde exibir:** na página `/library` ou em uma seção de settings — a decidir durante implementação.

---

## Tarefa: Dark/Light Mode

**`fe-theme`**

### Hook `useTheme.ts`

```typescript
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return localStorage.getItem('hibiki-theme') as 'dark' | 'light' ?? 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hibiki-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Aplicar classe 'dark' no mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return { theme, toggleTheme };
}
```

**Critério da spec (seção 5):** "Troca de tema sem reload, persistida entre sessões"

### Componente `ThemeToggle.tsx`

```tsx
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} aria-label="Alternar tema">
      {theme === 'dark' ? <Sun /> : <Moon />}  {/* Lucide React */}
    </button>
  );
}
```

**Visual:**
- Ícone Sol (Lucide `Sun`) em dark mode → clica para ir para light
- Ícone Lua (Lucide `Moon`) em light mode → clica para ir para dark
- Cor `text-secondary`, hover `text-primary`
- Posicionar na barra de navegação (header ou sidebar)

### Configuração Tailwind

Garantir `darkMode: 'class'` no `tailwind.config.js` (configurado na Fase 1).

Aplicar variantes dark nas classes dos componentes existentes:
```tsx
// Exemplo em SoundCard:
<div className="bg-bg-surface dark:bg-bg-surface border border-border dark:border-border ...">
```

---

## Tarefa: Navegação (React Router)

**`fe-navigation`**

Instalar e configurar React Router v6+ em `apps/web`:

```bash
npm install react-router-dom
```

**Rotas:**
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/"         element={<Home />} />        {/* Presets */}
    <Route path="/library"  element={<Library />} />     {/* Biblioteca de sons */}
    <Route path="/player"   element={<Player />} />      {/* Execução ativa */}
  </Routes>
</BrowserRouter>
```

**Layout compartilhado** — `AppLayout.tsx` aplicado a todas as rotas:
- Header com logo "Hibiki", `ThemeToggle`, menu hamburguer (mobile)
- Sidebar de navegação com links: Home, Biblioteca, Player
- `<Outlet />` para o conteúdo da rota
- `<ToastContainer />` no nível do layout

**Sidebar:**
- Desktop (`lg+`): sidebar fixa à esquerda, sempre visível
- Mobile (< `lg`): colapsável via hamburguer menu — overlay com slide lateral

---

## Tarefa: Responsividade Mobile-First

**`fe-responsive`**

Garantir layout funcional de **375px (mobile) até 1920px (desktop)** conforme critério da spec (seção 5).

**Checklist de breakpoints:**

| Componente | Mobile (375px) | Tablet (768px) | Desktop (1024px+) |
|---|---|---|---|
| Sidebar | Hamburguer, oculta | Hamburguer, oculta | Visível e fixa |
| Biblioteca de sons | 1 coluna | 2 colunas | 3 colunas |
| Página Home (presets) | 1 coluna | 2 colunas | 3 colunas |
| ActiveSoundItem | Stack vertical | Horizontal | Horizontal |
| VolumeSlider | Full width | Largura fixa | Largura fixa |
| ConfirmModal | Full width com margem | Centralizado | Centralizado (max-w-md) |
| Toast | Full width, topo | Canto superior direito | Canto superior direito |

**Regras gerais:**
- Usar classes Tailwind mobile-first: base sem prefixo → `md:` → `lg:`
- Touch targets mínimo 44px para todos os botões interativos
- Evitar overflow horizontal em qualquer resolução
- Testar breakpoints `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

**Critério da spec (seção 5):** "Layout funcional em 375px (mobile) até 1920px (desktop)"

---

## Critérios de conclusão

- [ ] Toasts aparecem em todas as ações relevantes (sucesso, erro, aviso)
- [ ] Upload valida formato e tamanho no cliente antes de enviar
- [ ] Upload exibe erro específico para cada caso (`INVALID_FILE_FORMAT`, `FILE_TOO_LARGE`)
- [ ] Após upload bem-sucedido, biblioteca atualiza automaticamente
- [ ] Dark/light mode alterna sem reload (RN, spec seção 5)
- [ ] Preferência de tema persiste entre sessões (localStorage)
- [ ] Navegação entre `/`, `/library`, `/player` funciona via React Router
- [ ] Sidebar colapsável em mobile com hamburguer menu
- [ ] Layout funcional em 375px e 1920px
- [ ] Touch targets ≥ 44px em todos os botões
- [ ] `ThemeToggle` visível na navbar com ícone correto (Sol/Lua)

---

## Dependências

- **Fase 3** completa: `fe-refactor-store`, `fe-sound-library`, `fe-active-sound-item`
- **Fase 4** completa: `fe-preset-crud`, `fe-confirm-modal`
- **Fase 2** completa: `be-sounds-upload` (para upload funcionar end-to-end)
