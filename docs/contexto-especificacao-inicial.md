# Contexto — Especificação Inicial do Hibiki (v1.0.0)

**Data:** 2026-03-18  
**Referência:** `docs/spec.md`

---

## O que é o Hibiki

Hibiki é uma aplicação web pessoal de gerenciamento e mixagem de sons ambientes — inspirada em Noisli e MyNoise, porém com foco em centralizar toda a experiência de áudio do usuário em um único lugar. Resolve uma dor real: apps similares no mercado foram abandonados ou apresentam bugs de layout e sem flexibilidade de mixagem.

**Usuário primário:** uso pessoal do criador, em ambiente de trabalho remoto e presencial.

---

## O que foi definido nesta especificação

### Escopo do MVP

Foram definidos os seguintes requisitos obrigatórios:

- Biblioteca de sons local com suporte a favoritos (aparecem no topo)
- Adição de sons a uma fila de execução ativa (sem duplicatas — RN-01)
- Mixagem simultânea de múltiplos sons com controle de volume individual por slider (0–100, padrão 50 — RN-02)
- Mute/unmute individual com restauração de volume anterior (RN-03)
- Mute/unmute global com restauração de volumes individuais (RN-04)
- Reprodução em loop infinito (RN-05)
- CRUD completo de presets com soft delete (RN-07, RN-09)
- Modal de confirmação para ações destrutivas (RN-10)
- Upload de áudios `.mp3`, `.wav`, `.mp4` com limite de 5MB (RN-08)
- Interface dark/light mode com design responsivo mobile-first
- Backend Node.js com API REST, PostgreSQL via Drizzle ORM e deploy local via Docker

### Arquitetura

A spec define uma migração do monolito atual (`hibiki-web`) para um **monorepo**:

```
hibiki/
├── apps/
│   ├── web/    # React 19 + Vite + TypeScript + Zustand + TailwindCSS
│   └── api/    # Node.js (Express ou Fastify) + TypeScript + Drizzle ORM
├── packages/
│   └── shared/ # tipos TypeScript compartilhados
└── docker-compose.yml
```

Infraestrutura local orquestrada via Docker Compose com três serviços: `web` (:5173), `api` (:3000) e `db` (PostgreSQL 16, :5432).

### Banco de Dados

Três tabelas principais definidas com Drizzle ORM:

- **`sounds`** — id, name, filePath, isFavorite, deletedAt, createdAt, updatedAt
- **`presets`** — id, name, deletedAt, createdAt, updatedAt
- **`preset_sounds`** — presetId + soundId (PK composta) + volume (0–100)

Migrations versionadas em `src/db/migrations/`, geradas via `drizzle-kit generate` e executadas no startup do container.

### API REST

Base URL: `http://localhost:3000/api`

**Sounds:**
- `GET /sounds` — lista sons disponíveis
- `POST /sounds/upload` — upload de novo áudio (multipart/form-data)
- `PATCH /sounds/:id/favorite` — toggle de favorito
- `DELETE /sounds/:id` — soft delete

**Presets:**
- `GET /presets` — lista presets ativos
- `GET /presets/:id` — detalhes de um preset
- `POST /presets` — cria novo preset
- `PUT /presets/:id` — atualiza preset (nome + sons)
- `DELETE /presets/:id` — soft delete

Erros seguem padrão JSON com campos `code`, `message` e `statusCode`.

### Design System

- **Fonte:** Montserrat em todos os pesos (400, 500, 600, 700)
- **Paleta dark mode:** base `#0f0f1a`, surface `#1a1a2e`, primary `#6c63ff`, accent `#9b8fef`, danger `#e05c7a`, success `#56cfaa`
- **Paleta light mode:** base `#f4f3ff`, primary `#5a52d5`
- **Layout:** mobile-first, breakpoints `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

Componentes principais especificados: `SoundCard`, `ActiveSoundItem`, `PresetCard`, `VolumeSlider`, `ConfirmModal`, `ThemeToggle`, `Toast`, `UploadArea`.

---

## Regras de negócio críticas

| ID | Regra |
|---|---|
| RN-01 | Um som não pode ser adicionado duas vezes à fila de execução |
| RN-02 | Volume padrão ao adicionar é 50; range 0–100 |
| RN-03 | Slider em 0 = mute automático; desmutar com vol=0 restaura para 50; desmutar com vol>0 restaura valor anterior |
| RN-04 | Mute global mantém volumes individuais; desmutar global restaura cada volume |
| RN-07 | Carregar preset substitui a fila de execução ativa completa |
| RN-09 | Todo delete de preset usa soft delete (`deleted_at`) |
| RN-10 | Toda ação destrutiva exige modal de confirmação |

---

## Estado atual do projeto

- Repositório: `hibiki-web` — monolito React + Vite, sem estilo aplicado, com 3 áudios locais
- A migração para monorepo ainda **não foi realizada**
- TailwindCSS ainda **não foi adicionado**
- Backend ainda **não existe** — API e banco a implementar
- Docker Compose ainda **não configurado**

---

## Próximas etapas previstas (Roadmap)

1. **Fase 1 — Infraestrutura:** monorepo, Docker Compose, schema Drizzle, setup do backend, TailwindCSS
2. **Fase 2 — Core Features:** endpoints de sounds/presets, integração frontend-API, mixagem com Zustand, lógica de mute/loop
3. **Fase 3 — UX & Polish:** design system completo, upload, CRUD de presets, modais, toasts, responsividade
4. **Fase 4 — Testes & Estabilização:** unitários e integração no backend, edge cases, documentação
5. **Fase 5 — Futuro:** autenticação, Spotify/YouTube Music, Kanban, deploy em nuvem
