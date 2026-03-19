# SPEC — HIBIKI
**Versão:** 1.0.0  
**Data:** 2026-03-18  
**Status:** Em desenvolvimento ativo  
**Repositório atual:** `hibiki-web` (monolito React, migração para monorepo prevista)

---

## 1. Contexto

**Hibiki** é uma aplicação web pessoal de gerenciamento e execução de sons ambientes, inspirada em ferramentas como [Noisli](https://www.noisli.com) e [MyNoise](https://mynoise.net), porém com foco em centralizar em um único lugar toda a experiência de áudio ambiental do usuário — sons locais, presets de mixagem e, futuramente, integrações com plataformas de streaming como Spotify e YouTube Music.

O projeto existe para resolver uma dor real: apps similares no mercado foram abandonados, apresentam bugs de layout para resoluções menores e não oferecem flexibilidade de mixagem e gestão de presets. O Hibiki nasce como solução pessoal, porém com arquitetura preparada para escalar.

**Usuário primário:** uso pessoal do criador, em ambiente de trabalho remoto e presencial.  
**Horizonte futuro:** expansão para múltiplos usuários, autenticação, Kanban/Task Manager integrado e integrações com streaming.

---

## 2. Escopo

### ✅ Must-Have (MVP)
- Listagem de sons disponíveis (biblioteca local)
- Seleção e adição de sons a uma fila de execução ativa
- Mixagem simultânea de múltiplos sons
- Controle de volume individual por som (slider 0–100)
- Mute/unmute individual com restauração de volume anterior
- Mute/unmute global de todos os sons ativos
- Reprodução em loop infinito de todos os sons
- Remoção de som da execução ativa
- Favoritar sons (aparecem no topo da listagem)
- CRUD completo de presets (criar, carregar, atualizar, soft delete)
- Popup de confirmação para todas as ações destrutivas
- Upload de novos áudios (.mp3, .wav, .mp4 — limite 5MB)
- Interface dark/light mode
- Design responsivo mobile-first
- Backend Node.js com API REST
- Banco de dados PostgreSQL com Drizzle ORM
- Deploy local via Docker

### 🔵 Should-Have (próxima iteração)
- Histórico de presets utilizados
- Busca/filtro na biblioteca de sons
- Indicador visual de qual preset está ativo no momento
- Exportação/importação de presets em JSON

### ⚫ Won't-Have (fora do escopo atual)
- Autenticação de usuários
- Deploy em nuvem
- Integração com Spotify / YouTube Music (planejada, não implementada)
- Módulo Kanban/Task Manager
- Edição de metadados dos áudios (waveform, equalizer)
- Compartilhamento de presets entre usuários

---

## 3. Regras de Negócio

### RN-01 — Unicidade de sons na execução
Um mesmo som não pode ser adicionado mais de uma vez à fila de execução ativa. Tentativas de duplicação devem ser bloqueadas silenciosamente ou com feedback visual (toast/badge).

### RN-02 — Controle de volume individual
Cada som possui um slider de volume de `0` a `100`. O valor padrão ao adicionar é `50`.

### RN-03 — Comportamento do mute individual
- Se o slider for arrastado até `0`, o som é automaticamente marcado como mutado.
- Ao desmutar um som que estava com volume `0`, o volume é restaurado para `50` (padrão).
- Ao desmutar um som que foi mutado via botão (com volume > 0), o volume retorna ao valor anterior ao mute.

### RN-04 — Mute global
O botão "Mutar todos" muta todos os sons simultaneamente. Cada som mantém seu volume individual salvo internamente. Ao desmutar global, cada som retorna ao seu volume pré-mute.

### RN-05 — Reprodução em loop
Todos os sons são reproduzidos em loop contínuo enquanto estiverem na fila de execução ativa e não mutados.

### RN-06 — Favoritos
Sons marcados como favoritos aparecem sempre no topo da listagem da biblioteca. O status de favorito persiste no banco de dados.

### RN-07 — Presets
- Um preset armazena a lista de sons e seus respectivos volumes no momento do salvamento.
- Um preset pode ser atualizado (sobrescrever o estado atual).
- Um preset pode ser deletado via soft delete (campo `deleted_at`).
- O usuário pode ter múltiplos presets.
- Ao carregar um preset, a fila de execução ativa é substituída pelos sons do preset com seus volumes salvos.
- Na página de execução, o usuário pode trocar de preset sem sair da tela.

### RN-08 — Upload de áudio
- Formatos aceitos: `.mp3`, `.wav`, `.mp4`
- Tamanho máximo: 5MB por arquivo
- O arquivo é salvo na pasta `public/sounds` do servidor
- Metadados (nome, path, duração estimada) são persistidos no banco

### RN-09 — Soft delete
Toda exclusão de preset usa soft delete (`deleted_at` preenchido). Registros deletados não aparecem nas listagens, mas permanecem no banco para histórico.

### RN-10 — Confirmação de ações destrutivas
Qualquer ação de delete ou inativação deve exibir um modal de confirmação antes de prosseguir.

---

## 4. Dependências Externas

| Dependência | Uso | Status |
|---|---|---|
| PostgreSQL | Banco de dados principal | Ativo (local via Docker) |
| Drizzle ORM | Mapeamento e migrations do banco | Ativo |
| Node.js (Express ou Fastify) | Backend API REST | A implementar |
| Docker | Orquestração local (app + banco) | A implementar |
| Vite | Bundler do frontend | Ativo |
| React 19 | Framework frontend | Ativo |
| Zustand | Gerenciamento de estado global | Ativo |
| TailwindCSS | Estilização | A implementar |
| Lucide React | Ícones | Ativo |
| Vitest | Testes unitários (frontend, futuro) | Planejado |
| Vitest / Jest (Rust compiler) | Testes backend | A implementar |

**Integrações futuras (fora do escopo atual):**
- Spotify Web API (OAuth 2.0)
- YouTube Music API (a avaliar licenciamento)

---

## 5. Critérios de Sucesso

| Critério | Métrica |
|---|---|
| Mixagem simultânea funcional | ≥ 5 sons tocando ao mesmo tempo sem falha de áudio |
| Mute/unmute consistente | Volume restaurado corretamente em 100% dos cenários |
| Presets operacionais | CRUD completo sem perda de dados |
| Upload de áudio | Arquivo salvo e reproduzível após upload |
| Dark/Light mode | Troca de tema sem reload, persistida entre sessões |
| Responsividade | Layout funcional em 375px (mobile) até 1920px (desktop) |
| Performance | Carregamento inicial < 2s em ambiente local |

---

## 6. Restrições & Constraints

| Restrição | Detalhe |
|---|---|
| Deploy | Apenas local via Docker — sem cloud por ora |
| Autenticação | Nenhuma no MVP — sistema single-user |
| Formatos de áudio | Apenas `.mp3`, `.wav`, `.mp4` |
| Tamanho de upload | Máximo 5MB por arquivo |
| Banco de dados | PostgreSQL local (sem RDS, Supabase ou similar agora) |
| Stack frontend | Vite + React 19 + TypeScript (sem migração para Next.js no MVP) |
| ORM | Drizzle ORM (sem Prisma, TypeORM ou similares) |
| Idioma da UI | Português (BR) como padrão inicial |

---

## 7. User Journeys & Casos de Uso

### UC-01 — Iniciar sessão de sons
```
1. Usuário abre o app → vê a Home com lista de presets salvos no topo
2. Clica em um preset → é redirecionado para a página de execução com os sons do preset já carregados e tocando
3. Ajusta volumes conforme deseja
4. Salva o preset com o novo estado (update) ou cria um novo preset
```

### UC-02 — Montar mixagem do zero
```
1. Usuário vai para a biblioteca de sons
2. Favoritos aparecem no topo
3. Clica em sons desejados → cada um é adicionado à fila de execução
4. Ajusta volumes individualmente via slider
5. Muta/desmuta sons conforme necessidade
6. Salva como novo preset com nome definido
```

### UC-03 — Gerenciar presets
```
1. Na home, lista de presets é exibida
2. Usuário clica em "Editar" → altera o nome do preset
3. Usuário clica em "Excluir" → modal de confirmação → soft delete
4. Na página de execução, usuário troca de preset via dropdown/lista
```

### UC-04 — Upload de novo som
```
1. Usuário acessa a área de upload (biblioteca ou settings)
2. Seleciona arquivo .mp3/.wav/.mp4 ≤ 5MB
3. Sistema valida formato e tamanho
4. Em caso de erro: exibe mensagem específica
5. Em caso de sucesso: som aparece na biblioteca disponível para uso
```

### UC-05 — Favoritar um som
```
1. Na biblioteca, usuário clica no ícone de coração/estrela do som
2. Som é marcado como favorito no banco
3. Na próxima abertura da biblioteca, o som aparece no topo
```

---

## 8. Dados (Entrada & Saída)

### Entrada — Upload de Áudio
```json
{
  "file": "<multipart/form-data>",
  "name": "string (opcional — usa nome do arquivo se omitido)"
}
```
**Validações:** formato .mp3/.wav/.mp4, tamanho ≤ 5MB.

### Entrada — Criar Preset
```json
{
  "name": "string (obrigatório)",
  "sounds": [
    { "soundId": "uuid", "volume": 75 },
    { "soundId": "uuid", "volume": 40 }
  ]
}
```

### Entrada — Atualizar Preset
```json
{
  "name": "string (opcional)",
  "sounds": [
    { "soundId": "uuid", "volume": 60 }
  ]
}
```

### Saída — Listagem de Sons
```json
[
  {
    "id": "uuid",
    "name": "Chuva suave",
    "filePath": "/sounds/rain.mp3",
    "isFavorite": true,
    "createdAt": "2026-03-18T10:00:00Z"
  }
]
```

### Saída — Listagem de Presets
```json
[
  {
    "id": "uuid",
    "name": "Foco profundo",
    "sounds": [
      { "soundId": "uuid", "name": "Chuva suave", "volume": 70 },
      { "soundId": "uuid", "name": "Fogueira", "volume": 45 }
    ],
    "createdAt": "2026-03-18T10:00:00Z",
    "updatedAt": "2026-03-18T12:00:00Z"
  }
]
```

---

## 9. Design System Web

### Paleta de Cores

#### Dark Mode (padrão)
| Token | Valor | Uso |
|---|---|---|
| `--color-bg-base` | `#0f0f1a` | Background principal |
| `--color-bg-surface` | `#1a1a2e` | Cards, painéis |
| `--color-bg-elevated` | `#22223b` | Modais, dropdowns |
| `--color-primary` | `#6c63ff` | Ações principais, botões |
| `--color-primary-hover` | `#574fd6` | Hover de botões primários |
| `--color-secondary` | `#4a4080` | Acentos secundários |
| `--color-accent` | `#9b8fef` | Destaques suaves |
| `--color-text-primary` | `#e8e6f0` | Texto principal |
| `--color-text-secondary` | `#a09bbf` | Texto auxiliar, labels |
| `--color-text-muted` | `#6b6585` | Placeholders, disabled |
| `--color-border` | `#2e2b45` | Bordas de cards/inputs |
| `--color-danger` | `#e05c7a` | Ações destrutivas |
| `--color-success` | `#56cfaa` | Confirmações, sucesso |

#### Light Mode
| Token | Valor | Uso |
|---|---|---|
| `--color-bg-base` | `#f4f3ff` | Background principal |
| `--color-bg-surface` | `#ffffff` | Cards, painéis |
| `--color-bg-elevated` | `#ebebff` | Modais, dropdowns |
| `--color-primary` | `#5a52d5` | Ações principais |
| `--color-primary-hover` | `#4840b8` | Hover |
| `--color-text-primary` | `#1a1a2e` | Texto principal |
| `--color-text-secondary` | `#4a4080` | Texto auxiliar |
| `--color-border` | `#d0cdf0` | Bordas |

### Tipografia
| Uso | Fonte | Peso | Tamanho |
|---|---|---|---|
| Títulos (H1) | Montserrat | 700 | 2rem |
| Títulos (H2) | Montserrat | 600 | 1.5rem |
| Subtítulos (H3) | Montserrat | 600 | 1.125rem |
| Corpo | Montserrat | 400 | 1rem |
| Labels/Caption | Montserrat | 500 | 0.875rem |
| Botões | Montserrat | 600 | 0.875rem |

### Componentes Principais
- **SoundCard** — card da biblioteca com nome, ícone, botão de favorito e botão de adicionar
- **ActiveSoundItem** — item da fila de execução com nome, slider de volume, botão mute e botão remover
- **PresetCard** — card de preset na home com nome, lista de sons resumida, botões de ação
- **VolumeSlider** — slider customizado com Tailwind (range input estilizado)
- **ConfirmModal** — modal reutilizável de confirmação com título, descrição e botões Cancelar/Confirmar
- **ThemeToggle** — botão de alternância dark/light com ícone (lua/sol)
- **Toast/Notification** — feedback visual para ações (sucesso, erro, aviso)
- **UploadArea** — área de drag & drop + botão para upload de áudios

### Layout
- **Mobile-first**, breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Sidebar de navegação colapsável em mobile (hamburguer menu)
- Grid de 1 coluna em mobile, 2–3 colunas em desktop para a biblioteca

---

## 10. APIs & Integração (Endpoints)

Base URL: `http://localhost:3000/api`

### Sounds

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/sounds` | Lista todos os sons disponíveis |
| `POST` | `/sounds/upload` | Upload de novo arquivo de áudio |
| `PATCH` | `/sounds/:id/favorite` | Toggle de favorito |
| `DELETE` | `/sounds/:id` | Soft delete de um som |

**GET /sounds — Response**
```json
[
  {
    "id": "uuid",
    "name": "Chuva suave",
    "filePath": "/sounds/rain.mp3",
    "isFavorite": true,
    "createdAt": "2026-03-18T10:00:00Z"
  }
]
```

**POST /sounds/upload — Request**
```
Content-Type: multipart/form-data
Body: file (binary), name (string, opcional)
```

**POST /sounds/upload — Response 201**
```json
{
  "id": "uuid",
  "name": "Chuva suave",
  "filePath": "/sounds/rain.mp3",
  "isFavorite": false,
  "createdAt": "2026-03-18T10:00:00Z"
}
```

---

### Presets

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/presets` | Lista todos os presets ativos |
| `GET` | `/presets/:id` | Detalhes de um preset |
| `POST` | `/presets` | Cria novo preset |
| `PUT` | `/presets/:id` | Atualiza preset (nome + sons) |
| `DELETE` | `/presets/:id` | Soft delete de preset |

**POST /presets — Request**
```json
{
  "name": "Foco profundo",
  "sounds": [
    { "soundId": "uuid", "volume": 75 },
    { "soundId": "uuid", "volume": 40 }
  ]
}
```

**GET /presets — Response**
```json
[
  {
    "id": "uuid",
    "name": "Foco profundo",
    "sounds": [
      { "soundId": "uuid", "name": "Chuva suave", "volume": 75 },
      { "soundId": "uuid", "name": "Fogueira", "volume": 40 }
    ],
    "createdAt": "2026-03-18T10:00:00Z",
    "updatedAt": "2026-03-18T12:00:00Z"
  }
]
```

---

### Padrão de Erros
```json
{
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Formato de arquivo não suportado. Use .mp3, .wav ou .mp4",
    "statusCode": 422
  }
}
```

| Código | Significado |
|---|---|
| `INVALID_FILE_FORMAT` | Formato não aceito |
| `FILE_TOO_LARGE` | Arquivo acima de 5MB |
| `SOUND_ALREADY_ACTIVE` | Som já está na fila de execução |
| `PRESET_NOT_FOUND` | Preset não encontrado ou deletado |
| `SOUND_NOT_FOUND` | Som não encontrado |

---

## 11. Banco de Dados (DDL + Migrations)

### Modelagem proposta com Drizzle ORM

```typescript
// schema.ts — Drizzle ORM (PostgreSQL)

import { pgTable, uuid, varchar, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

// Tabela de sons
export const sounds = pgTable('sounds', {
  id:         uuid('id').defaultRandom().primaryKey(),
  name:       varchar('name', { length: 255 }).notNull(),
  filePath:   varchar('file_path', { length: 500 }).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  deletedAt:  timestamp('deleted_at'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de presets
export const presets = pgTable('presets', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de relação preset <-> sons (com volume salvo)
export const presetSounds = pgTable('preset_sounds', {
  presetId:  uuid('preset_id').references(() => presets.id).notNull(),
  soundId:   uuid('sound_id').references(() => sounds.id).notNull(),
  volume:    integer('volume').default(50).notNull(), // 0–100
}, (table) => ({
  pk: primaryKey({ columns: [table.presetId, table.soundId] }),
}));
```

### Estratégia de Migrations
- Usar `drizzle-kit generate` para gerar arquivos de migration
- Migrations versionadas em `src/db/migrations/`
- Executar via `drizzle-kit migrate` no startup do container

---

## 12. Tratamento de Erros & Edge Cases

| Cenário | Comportamento esperado |
|---|---|
| Adicionar som já ativo | Bloqueado — feedback visual (toast de aviso) |
| Upload com formato inválido | Erro 422 com mensagem clara |
| Upload acima de 5MB | Erro 422 com mensagem de tamanho |
| Slider arrastado para 0 | Som mutado automaticamente |
| Desmutar com volume em 0 | Volume restaurado para 50 (padrão) |
| Desmutar após mute por botão | Volume restaurado ao valor anterior |
| Mute global → ajustar volume individual | Volume individual salvo, mute global mantido até desmutar global |
| Deletar preset em uso | Modal de confirmação → soft delete → fila de execução mantida |
| Carregar preset com som deletado | Sons deletados ignorados, preset carrega os válidos restantes |
| Preset sem sons | Permitido — preset vazio é válido |
| Banco indisponível | Erro 503 com mensagem genérica para o usuário |

---

## 13. Testes

### Backend — Vitest (compilador Rust via Vite)

**Unitários**
- `SoundService.addSound()` — valida formato e tamanho antes de persistir
- `SoundService.toggleFavorite()` — alterna `isFavorite` corretamente
- `PresetService.createPreset()` — persiste sons com volumes corretos
- `PresetService.updatePreset()` — substitui lista de sons e volumes
- `PresetService.softDelete()` — preenche `deletedAt`, não aparece nas listagens

**Integração**
- `POST /sounds/upload` com arquivo válido → 201 + registro no banco
- `POST /sounds/upload` com formato inválido → 422
- `POST /sounds/upload` acima de 5MB → 422
- `GET /presets` → retorna apenas presets sem `deletedAt`
- `DELETE /presets/:id` → soft delete confirmado via GET subsequente
- `GET /presets/:id` com som deletado → retorna preset sem o som inválido

**Cenários críticos de negócio**
- Mute individual: mutar sound_A não afeta sound_B
- Mute global: todos os sounds são mutados simultaneamente
- Desmutar após volume 0: volume retorna para 50
- Desmutar após mute por botão: volume retorna ao valor anterior
- Duplicata na fila: segundo `addSound(id)` com mesmo id retorna erro `SOUND_ALREADY_ACTIVE`

### Frontend — Planejado para iteração futura
- Testes de componentes com Vitest + Testing Library
- Foco em: VolumeSlider, ConfirmModal, ActiveSoundItem

---

## 14. Roadmap & Timeline

### Fase 1 — Infraestrutura (atual → semana 1–2)
- [ ] Criar estrutura de monorepo (`hibiki-web` + `hibiki-api`)
- [ ] Configurar Docker Compose (app + PostgreSQL)
- [ ] Criar schema Drizzle + primeira migration
- [ ] Setup Express/Fastify com rotas base
- [ ] Adicionar TailwindCSS ao frontend

### Fase 2 — Core Features (semana 3–5)
- [ ] Implementar endpoints de sounds e presets
- [ ] Conectar frontend à API (substituir dados estáticos)
- [ ] Implementar mixagem com controle de volume (Zustand)
- [ ] Implementar lógica de mute/unmute com restauração de volume
- [ ] Implementar loop infinito de áudio

### Fase 3 — UX & Polish (semana 6–7)
- [ ] Aplicar design system (dark/light mode, Montserrat, paleta azul/roxo)
- [ ] Implementar upload de áudios com validação
- [ ] Implementar CRUD de presets com soft delete
- [ ] Adicionar modais de confirmação e sistema de toasts
- [ ] Responsividade mobile-first

### Fase 4 — Testes & Estabilização (semana 8)
- [ ] Testes unitários e de integração no backend
- [ ] Correção de edge cases identificados
- [ ] Documentação do README atualizada

### Fase 5 — Futuro (sem data definida)
- [ ] Autenticação (JWT ou similar)
- [ ] Integração Spotify / YouTube Music
- [ ] Módulo Kanban/Task Manager
- [ ] Deploy em nuvem (quando necessário)

---

## 15. Stack Técnico & Arquitetura

### Estrutura de Monorepo (proposta)
```
hibiki/
├── apps/
│   ├── web/          # hibiki-web (React + Vite + TypeScript)
│   └── api/          # hibiki-api (Node.js + Express/Fastify + Drizzle)
├── packages/
│   └── shared/       # tipos TypeScript compartilhados
├── docker-compose.yml
└── README.md
```

### Frontend (`apps/web`)
| Tecnologia | Versão | Função |
|---|---|---|
| React | 19.x | Framework UI |
| TypeScript | 5.8.x | Tipagem |
| Vite | 7.x | Bundler |
| Zustand | 5.x | Estado global |
| TailwindCSS | 3.x | Estilização |
| Lucide React | 0.536.x | Ícones |

### Backend (`apps/api`)
| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 22.x LTS | Runtime |
| Express ou Fastify | latest | Framework HTTP |
| TypeScript | 5.8.x | Tipagem |
| Drizzle ORM | latest | ORM + Migrations |
| PostgreSQL | 16.x | Banco de dados |
| Multer (se Express) | latest | Upload de arquivos |
| Vitest | latest | Testes (Rust compiler) |

### Infraestrutura Local
```yaml
# docker-compose.yml (proposta)
services:
  api:
    build: ./apps/api
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://hibiki:hibiki@db:5432/hibiki

  web:
    build: ./apps/web
    ports:
      - "5173:5173"
    depends_on:
      - api

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hibiki
      POSTGRES_PASSWORD: hibiki
      POSTGRES_DB: hibiki
    volumes:
      - hibiki_db:/var/lib/postgresql/data

volumes:
  hibiki_db:
```

### Diagrama de Arquitetura
```
┌─────────────────────────────────────────────────┐
│                  DOCKER LOCAL                   │
│                                                 │
│  ┌──────────────┐      ┌──────────────────────┐ │
│  │  hibiki-web  │─────▶│    hibiki-api        │ │
│  │  React/Vite  │ HTTP │  Node.js + Drizzle   │ │
│  │  :5173       │      │  :3000               │ │
│  └──────────────┘      └──────────┬───────────┘ │
│                                   │             │
│                         ┌─────────▼──────────┐  │
│                         │    PostgreSQL 16    │  │
│                         │    :5432           │  │
│                         └────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 16. Histórico de Versões & Changelog

| Versão | Data | Descrição |
|---|---|---|
| 0.0.0 | — | Repositório inicial `hibiki-web` — React + Vite sem estilo, 3 áudios locais |
| 1.0.0 | 2026-03-18 | Spec gerada — definição completa de arquitetura, banco, API e design system |

---

*Gerado por SDD Spec Generator — Hibiki v1.0.0 — 2026-03-18*