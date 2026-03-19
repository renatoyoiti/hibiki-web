# Fase 1 — Infraestrutura

**Status:** Pendente  
**Pré-requisito para:** todas as demais fases  
**Ref. spec:** seções 4, 11, 14 (Fase 1), 15

---

## Objetivo

Preparar toda a base estrutural do projeto: organização em monorepo, orquestração via Docker, schema do banco de dados, setup inicial do backend e configuração do design system no frontend. Nenhuma feature de negócio é implementada aqui — apenas a fundação técnica.

---

## Contexto atual do repositório

O projeto existe hoje como `hibiki-web`: monolito React + Vite sem TailwindCSS, sem backend e com 3 áudios locais em `public/sounds/`. O estado da aplicação é gerenciado localmente via Zustand + localStorage. Toda essa estrutura será preservada em `apps/web` após a migração para monorepo.

---

## Tarefas

### 🏗️ Estrutura — Monorepo

**`infra-monorepo`**

Converter o repositório atual em monorepo com a seguinte estrutura:

```
hibiki/
├── apps/
│   ├── web/          # conteúdo atual de hibiki-web
│   └── api/          # novo projeto Node.js (a criar)
├── packages/
│   └── shared/       # tipos TypeScript compartilhados entre web e api
├── docker-compose.yml
├── Makefile
└── README.md
```

- Mover todo o conteúdo atual (`src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `package.json` do frontend) para `apps/web/`
- Criar `apps/api/` como novo projeto Node.js + TypeScript
- Criar `packages/shared/` com `package.json` básico para tipos compartilhados (ex.: interfaces de `Sound`, `Preset`, `PresetSound`)
- Ajustar imports relativos quebrados após a movimentação

---

### 🐳 Infraestrutura — Docker

**`infra-docker`**

Criar `docker-compose.yml` na raiz do monorepo:

```yaml
services:
  api:
    build: ./apps/api
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://hibiki:hibiki@db:5432/hibiki
      - NODE_ENV=development

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
    ports:
      - "5432:5432"

volumes:
  hibiki_db:
```

- Criar `Dockerfile` em `apps/api/` para build da API
- Criar `Dockerfile` em `apps/web/` para build do frontend (dev com hot reload)
- Adicionar `.dockerignore` em ambos (`node_modules`, `dist`, `.env`)

---

### 🗄️ Backend — Schema Drizzle + Migration

**`infra-drizzle-schema`**

Criar `apps/api/src/db/schema.ts` com as três tabelas definidas na spec:

```typescript
import { pgTable, uuid, varchar, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const sounds = pgTable('sounds', {
  id:         uuid('id').defaultRandom().primaryKey(),
  name:       varchar('name', { length: 255 }).notNull(),
  filePath:   varchar('file_path', { length: 500 }).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  deletedAt:  timestamp('deleted_at'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});

export const presets = pgTable('presets', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const presetSounds = pgTable('preset_sounds', {
  presetId: uuid('preset_id').references(() => presets.id).notNull(),
  soundId:  uuid('sound_id').references(() => sounds.id).notNull(),
  volume:   integer('volume').default(50).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.presetId, table.soundId] }),
}));
```

- Criar `apps/api/drizzle.config.ts` apontando para `DATABASE_URL`
- Gerar migration inicial: `drizzle-kit generate`
- Migrations versionadas em `apps/api/src/db/migrations/`
- Executar migration no startup do container via script de entrypoint

---

### ⚙️ Backend — Setup da API

**`infra-api-setup`**

Inicializar `apps/api` com Node.js + TypeScript:

- **Runtime:** Node.js 22.x LTS
- **Framework:** Express ou Fastify (a definir — ambos suportados pela spec)
- **Dependências base:** `drizzle-orm`, `pg`, `typescript`, `ts-node` / `tsx`
- Estrutura de pastas:

```
apps/api/src/
├── db/
│   ├── schema.ts
│   ├── migrations/
│   └── index.ts          # instância do cliente Drizzle
├── routes/
│   ├── sounds.ts
│   └── presets.ts
├── services/
│   ├── soundService.ts
│   └── presetService.ts
├── middlewares/
│   └── errorHandler.ts
└── server.ts
```

- Implementar rota de health check: `GET /health` retorna `{ status: "ok" }`
- Configurar conexão com PostgreSQL via variável `DATABASE_URL`
- Configurar `tsconfig.json` para Node.js (target ES2022, module CommonJS ou ESM)

---

### 🛠️ Makefile

**`infra-makefile`**

Criar `Makefile` na raiz com os seguintes targets:

```makefile
dev         ## Inicia frontend e backend em modo desenvolvimento (sem Docker)
up          ## Sobe todos os serviços via Docker Compose
down        ## Para todos os serviços Docker
build       ## Gera build de produção (web + api)
migrate     ## Executa migrations do banco via drizzle-kit
lint        ## Executa ESLint em apps/web e apps/api
test        ## Executa testes do backend (Vitest)
```

Atualizar `README.md` na raiz referenciando todos os targets.

---

### 🎨 Frontend — TailwindCSS

**`infra-tailwind`**

Instalar e configurar TailwindCSS 3.x em `apps/web`:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Criar arquivo de tokens de design em `tailwind.config.js` com base na paleta da spec:

**Dark mode:**
```js
colors: {
  'bg-base':      '#0f0f1a',
  'bg-surface':   '#1a1a2e',
  'bg-elevated':  '#22223b',
  'primary':      '#6c63ff',
  'primary-hover':'#574fd6',
  'secondary':    '#4a4080',
  'accent':       '#9b8fef',
  'text-primary': '#e8e6f0',
  'text-secondary':'#a09bbf',
  'text-muted':   '#6b6585',
  'border':       '#2e2b45',
  'danger':       '#e05c7a',
  'success':      '#56cfaa',
}
```

Configurar `darkMode: 'class'` para alternância via classe no `<html>`.

Breakpoints da spec: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` (já são os padrões do Tailwind — confirmar apenas).

---

### 🔤 Frontend — Fonte Montserrat

**`infra-montserrat`**

Importar Montserrat via Google Fonts em `apps/web/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Configurar como fonte padrão no Tailwind:

```js
fontFamily: {
  sans: ['Montserrat', 'sans-serif'],
}
```

Escala tipográfica da spec:

| Uso | Peso | Tamanho |
|---|---|---|
| H1 | 700 | 2rem |
| H2 | 600 | 1.5rem |
| H3 | 600 | 1.125rem |
| Corpo | 400 | 1rem |
| Labels | 500 | 0.875rem |
| Botões | 600 | 0.875rem |

---

## Critérios de conclusão

- [ ] Estrutura de monorepo criada e funcionando (`apps/web`, `apps/api`, `packages/shared`)
- [ ] `docker-compose up` sobe web, api e banco sem erros
- [ ] `GET http://localhost:3000/health` retorna `{ status: "ok" }`
- [ ] Migration inicial executada — tabelas `sounds`, `presets`, `preset_sounds` existem no banco
- [ ] TailwindCSS funcionando em `apps/web` com tokens de cores do design system
- [ ] Fonte Montserrat aplicada globalmente
- [ ] `Makefile` com todos os targets documentados
- [ ] `README.md` atualizado com instruções de setup

---

## Dependências

Nenhuma fase anterior. Esta é a fase raiz.
