# Fase 4 — Frontend Presets

**Status:** Pendente  
**Pré-requisito:** Fase 3 (Frontend Core) + `be-presets-*` da Fase 2  
**Ref. spec:** seções 3 (RN-07, RN-09, RN-10), 7 (UC-01, UC-03), 8, 9, 12

---

## Objetivo

Implementar o sistema completo de presets no frontend: store Zustand, componentes de listagem e ação, página Home, fluxo completo de CRUD (criar, carregar, atualizar, excluir) e o modal de confirmação reutilizável para ações destrutivas.

---

## Estrutura de arquivos esperada

```
apps/web/src/
├── features/
│   └── presets/
│       ├── components/
│       │   ├── PresetCard.tsx
│       │   └── PresetForm.tsx     # modal/form para criar/renomear
│       └── store/
│           └── presetStore.ts
├── components/
│   └── shared/
│       └── ConfirmModal.tsx       # reutilizável globalmente
└── pages/
    └── Home.tsx                   # atualizar com listagem de presets
```

---

## Tarefa: Store de Presets

**`fe-preset-store`**

Criar store Zustand em `apps/web/src/features/presets/store/presetStore.ts`:

**Estado:**
```typescript
interface PresetStore {
  presets: Preset[];
  activePresetId: string | null;  // preset atualmente carregado

  // Ações
  fetchPresets(): Promise<void>;
  createPreset(name: string): Promise<void>;
  updatePreset(id: string, data: { name?: string; sounds?: PresetSoundDTO[] }): Promise<void>;
  deletePreset(id: string): Promise<void>;
  loadPreset(preset: Preset): void;
}
```

**Regra RN-07 — `loadPreset`:**
```typescript
loadPreset(preset: Preset) {
  // Substitui COMPLETAMENTE a fila de execução ativa pelo conteúdo do preset
  // Chama soundStore.setActiveSounds(preset.sounds)
  // Sons do preset com deletedAt são ignorados (API já filtra, mas checar no cliente)
  activePresetId = preset.id;
}
```

**Regra RN-07 — `createPreset`:**
```typescript
createPreset(name: string) {
  // Captura o estado atual da fila de execução (soundStore.activeSounds)
  // Mapeia para [{ soundId, volume }]
  // Chama presetService.createPreset({ name, sounds })
  // Recarrega lista de presets
}
```

**Regra RN-07 — `updatePreset`:**
```typescript
updatePreset(id, data) {
  // Se sounds não fornecido: captura estado atual da fila de execução
  // Chama presetService.updatePreset(id, data)
  // Recarrega lista de presets
}
```

---

## Tarefa: ConfirmModal

**`fe-confirm-modal`**

Modal reutilizável para qualquer ação destrutiva no sistema (RN-10):

```tsx
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

**Visual (design system):**
- Background overlay: `rgba(0,0,0,0.6)` sobre o conteúdo
- Modal: background `bg-elevated` (`#22223b` dark / `#ebebff` light), border-radius `12px`
- Título: Montserrat 600, `text-primary`
- Descrição: Montserrat 400, `text-secondary`
- Botão Cancelar: outline, `text-secondary`
- Botão Confirmar (`danger`): background `danger` (`#e05c7a`), texto branco
- Animação: fade in ao abrir, fade out ao fechar
- Fechar ao clicar no overlay ou pressionar `Escape`

**Usos previstos:**
- Deletar preset (Fase 4)
- Deletar som da biblioteca (Fase 5)
- Qualquer ação destrutiva futura

---

## Tarefa: PresetCard

**`fe-preset-card`**

Card exibido na página Home para cada preset:

```tsx
interface PresetCardProps {
  preset: Preset;
  isActive: boolean;    // é o preset atualmente carregado
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}
```

**Visual (design system):**
- Background: `bg-surface` (`#1a1a2e` dark / `#ffffff` light)
- Border: `border` — borda destacada com cor `primary` se `isActive`
- Nome do preset: Montserrat 700, `text-primary`
- Lista resumida de sons: máximo 3 nomes separados por vírgula + "e mais N" se houver mais
- Botão "Carregar": cor `primary`, ícone de play; desabilitado/diferente se `isActive`
- Botão "Renomear": ícone de lápis, `text-secondary`
- Botão "Excluir": ícone de lixeira, `text-muted` → `danger` no hover — abre `ConfirmModal`

---

## Tarefa: Página Home

**`fe-home-presets`**

Atualizar `apps/web/src/pages/Home.tsx`:

**Comportamento (UC-01):**
1. Buscar presets via `presetStore.fetchPresets()` no mount
2. Exibir `PresetCard` para cada preset ativo
3. Ao clicar "Carregar" em um preset → `presetStore.loadPreset(preset)` → redirecionar para `/player`
4. Estado de loading enquanto busca
5. Estado vazio: exibir mensagem "Nenhum preset salvo ainda" com botão para ir à biblioteca

**Layout:**
- Grid: 1 coluna mobile, 2 colunas `md`, 3 colunas `lg`
- Título "Seus presets" com tipografia H2 (Montserrat 600, 1.5rem)

---

## Tarefa: CRUD completo de presets

**`fe-preset-crud`**

### Criar novo preset

Fluxo (UC-02 — etapa final):
1. Na página `/player`, botão "Salvar como preset"
2. Abre modal com campo de nome (input text, obrigatório)
3. Ao confirmar → `presetStore.createPreset(name)` → captura estado atual da fila
4. Toast de sucesso "Preset criado!" (Fase 5)
5. `PresetForm.tsx` — componente de modal/form com input de nome

### Atualizar preset existente

Fluxo (UC-01 — atualizar):
1. Na página `/player`, se há um preset ativo (`activePresetId !== null`), exibir botão "Salvar alterações"
2. Ao clicar → `presetStore.updatePreset(activePresetId, { sounds: [estado atual] })`
3. Toast de sucesso "Preset atualizado!"

### Renomear preset

Fluxo (UC-03):
1. Clicar em "Renomear" no `PresetCard`
2. Abre `PresetForm` com nome atual pré-preenchido
3. Ao confirmar → `presetStore.updatePreset(id, { name: novoNome })`

### Excluir preset

Fluxo (UC-03):
1. Clicar em "Excluir" no `PresetCard`
2. Abre `ConfirmModal` com:
   - Título: "Excluir preset"
   - Descrição: "Tem certeza que deseja excluir o preset **"{nome}"**? Esta ação não pode ser desfeita."
3. Ao confirmar → `presetStore.deletePreset(id)` → soft delete via API
4. **Fila de execução ativa é mantida** (spec seção 12 — "Deletar preset em uso")
5. Toast de sucesso "Preset excluído"

### Trocar preset na página de execução

Fluxo (UC-01 — trocar preset):
1. Na página `/player`, exibir dropdown ou lista lateral com todos os presets
2. Ao selecionar → `presetStore.loadPreset(preset)` → substitui fila ativa
3. Indicador visual do preset ativo no dropdown (ref. spec Should-Have: "Indicador visual de qual preset está ativo")

---

## Edge cases mapeados (spec seção 12)

| Cenário | Comportamento |
|---|---|
| Deletar preset em uso | `ConfirmModal` → soft delete → fila de execução **mantida** (RN-07) |
| Carregar preset com som deletado | Sons deletados ignorados, preset carrega os válidos restantes |
| Preset sem sons | Permitido — fila de execução fica vazia ao carregar |
| Criar preset com fila vazia | Permitido — preset criado com `sounds: []` |

---

## Critérios de conclusão

- [ ] `presetStore.fetchPresets()` busca e popula lista da API
- [ ] `presetStore.loadPreset(preset)` substitui completamente a fila de execução (RN-07)
- [ ] `presetStore.createPreset(name)` salva estado atual da fila como novo preset
- [ ] `presetStore.updatePreset(id)` substitui sons do preset com estado atual da fila
- [ ] `presetStore.deletePreset(id)` realiza soft delete e **mantém** fila ativa
- [ ] `ConfirmModal` abre antes de qualquer delete; exige confirmação explícita (RN-10)
- [ ] `PresetCard` exibe borda destacada quando é o preset ativo
- [ ] Página Home lista presets em grid responsivo
- [ ] Trocar preset no `/player` via dropdown/lista funciona corretamente
- [ ] Toast de feedback em cada ação (criar, atualizar, deletar) — ver Fase 5

---

## Dependências

- **Fase 3** completa: `fe-api-client`, `fe-refactor-store`, `fe-sound-library`
- **Fase 2** (parcial): `be-presets-list`, `be-presets-create`, `be-presets-update`, `be-presets-delete`
