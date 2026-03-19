# Hibiki 🎵

Hibiki é uma aplicação web pessoal de gerenciamento e mixagem de sons ambientes. Permite selecionar, mixar e controlar múltiplos sons simultaneamente com controle de volume individual, presets salvos e reprodução em loop infinito.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js 22.x LTS](https://nodejs.org/) (para desenvolvimento local sem Docker)

## Como executar

### Com Docker (recomendado)

```bash
make up       # Sobe web (:5173), api (:3000) e banco PostgreSQL (:5432)
make migrate  # Executa migrations do banco de dados
```

Acesse: `http://localhost:5173`

### Desenvolvimento local (sem Docker)

1. Instale as dependências:
```bash
npm install
```

2. Copie e configure o `.env` da API:
```bash
cp apps/api/.env.example apps/api/.env
# Edite DATABASE_URL conforme seu PostgreSQL local
```

3. Execute as migrations:
```bash
make migrate
```

4. Inicie frontend e backend:
```bash
make dev
```

## Comandos disponíveis

| Comando | Descrição |
|---|---|
| `make up` | Sobe todos os serviços via Docker Compose |
| `make down` | Para todos os serviços Docker |
| `make dev` | Inicia frontend e backend em modo desenvolvimento |
| `make build` | Gera build de produção (web + api) |
| `make migrate` | Executa migrations do banco via drizzle-kit |
| `make lint` | Executa ESLint em apps/web e apps/api |
| `make test` | Executa testes do backend (Vitest) |

## Estrutura do projeto

```
hibiki/
├── apps/
│   ├── web/          # React 19 + Vite + TypeScript + Zustand + TailwindCSS
│   └── api/          # Node.js + Express + TypeScript + Drizzle ORM
├── packages/
│   └── shared/       # Tipos TypeScript compartilhados
├── docker-compose.yml
└── Makefile
```

## Stack

**Frontend:** React 19, Vite, TypeScript, Zustand, TailwindCSS, Lucide React  
**Backend:** Node.js 22, Express, TypeScript, Drizzle ORM  
**Banco:** PostgreSQL 16  
**Infra:** Docker Compose

## Recursos de Áudio

Os sons incluídos foram obtidos via [Freesound](https://freesound.org/) sob licença Creative Commons 0 (CC0):

- **Chuva**: ["Under Tree In Rain.mp3" por causative](https://freesound.org/s/102674/)
- **Fogueira**: ["Bonfire HQ.wav" por tosha73](https://freesound.org/s/513280/)
- **Trovão**: ["thunder 2" por elmoustachio](https://freesound.org/s/476736/)

## Licença

[Creative Commons Attribution-NonCommercial 4.0 International](LICENSE)

