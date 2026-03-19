# Contexto — Fase 1: Infraestrutura

**Data:** 2026-03-18  
**Status:** ✅ Concluída

---

## O que foi feito

### Monorepo

O repositório `hibiki-web` foi convertido em monorepo com npm workspaces:

```
hibiki/
├── apps/
│   ├── web/          # @hibiki/web — React 19 + Vite + TypeScript
│   └── api/          # @hibiki/api — Node.js + Express + TypeScript + Drizzle
├── packages/
│   └── shared/       # @hibiki/shared — tipos TypeScript compartilhados
├── docker-compose.yml
├── Makefile
└── README.md
```

O conteúdo anterior da raiz (src/, public/, index.html, vite.config.ts, tsconfigs) foi movido para `apps/web/`. A raiz agora contém apenas o `package.json` de orquestração de workspaces.

### Backend (`apps/api`)

- **Framework:** Express 4 + TypeScript (CommonJS, target ES2022)
- **ORM:** Drizzle ORM com PostgreSQL (`drizzle-orm` + `pg`)
- **Upload:** Multer (pré-instalado, implementado na Fase 2)
- **Dev:** `tsx watch` para hot reload sem transpilação
- **Health check:** `GET /health` → `{ status: "ok" }`
- **Middleware de erros:** padrão `{ error: { code, message, statusCode } }`
- **Lib de erros:** `src/lib/errors.ts` com `AppError` e factory `Errors.*`
- **Estrutura:** routes/, services/, middlewares/, lib/, db/

### Banco de Dados

Schema Drizzle criado em `apps/api/src/db/schema.ts` com três tabelas:
- `sounds` — id, name, file_path, is_favorite, deleted_at, created_at, updated_at
- `presets` — id, name, deleted_at, created_at, updated_at
- `preset_sounds` — preset_id + sound_id (PK composta) + volume (0–100)

Migration inicial gerada em `apps/api/src/db/migrations/0000_productive_newton_destine.sql`.

Config Drizzle em `apps/api/drizzle.config.ts` lendo `DATABASE_URL` do ambiente.

### Docker

`docker-compose.yml` com três serviços:
- `web` (:5173) — frontend React com hot reload
- `api` (:3000) — backend Express com `tsx`
- `db` — PostgreSQL 16 Alpine com healthcheck

Volume `hibiki_db` para persistência do banco. Volume bind-mount para `public/sounds/` da API.

Dockerfiles em `apps/api/Dockerfile` e `apps/web/Dockerfile`.

### Frontend (`apps/web`)

- **TailwindCSS 3** instalado com `postcss` e `autoprefixer`
- **`tailwind.config.js`:** design system completo com tokens de cores dark/light, `darkMode: 'class'`, fonte Montserrat como padrão
- **`src/index.css`:** diretivas `@tailwind base/components/utilities` + base styles
- **`index.html`:** classe `dark` no `<html>`, import Montserrat (400/500/600/700 via Google Fonts), lang `pt-BR`
- `main.tsx` atualizado para importar `index.css`

### Tipos compartilhados (`packages/shared`)

`packages/shared/src/index.ts` exporta: `Sound`, `PresetSoundItem`, `Preset`, `CreatePresetDTO`, `UpdatePresetDTO`, `ApiError`.

### Makefile

Targets na raiz: `dev`, `up`, `down`, `build`, `migrate`, `lint`, `test`. README atualizado com instruções completas.

---

## Validações realizadas

- `tsc --noEmit` sem erros em `apps/api` e `apps/web`
- `npm run build` em `apps/web` produz bundle com Tailwind (6.35 kB CSS, 194 kB JS)
- Migration Drizzle gerada com sucesso (3 tabelas, sem erros)
- `npm install` no workspace root resolve todas as dependências
