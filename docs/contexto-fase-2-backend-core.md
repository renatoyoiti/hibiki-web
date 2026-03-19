# Contexto — Fase 2: Backend Core

**Data:** 2026-03-18  
**Status:** ✅ Concluída

---

## O que foi feito

### SoundService (`apps/api/src/services/soundService.ts`)

- **`list()`** — retorna sons sem `deletedAt`, ordenados por `isFavorite DESC, createdAt DESC`
- **`upload(file, name?)`** — valida extensão (`.mp3/.wav/.mp4`) e tamanho (≤5MB) antes de persistir; salva arquivo em `public/sounds/`; remove arquivo do disco caso validação falhe
- **`toggleFavorite(id)`** — alterna `isFavorite`; lança `SOUND_NOT_FOUND` se não encontrado/deletado
- **`softDelete(id)`** — preenche `deletedAt`; lança `SOUND_NOT_FOUND` se não encontrado/deletado

### PresetService (`apps/api/src/services/presetService.ts`)

- **`list()`** — retorna presets sem `deletedAt` com sons via JOIN; sons com `deletedAt` são filtrados no `groupPresets()`
- **`findById(id)`** — verifica soft delete antes do JOIN; retorna 404 se preset deletado
- **`create(name, sounds[])`** — insere preset + `preset_sounds`; aceita `sounds: []`
- **`update(id, data)`** — substitui `preset_sounds` completamente se `sounds` fornecido; atualiza nome se fornecido
- **`softDelete(id)`** — preenche `deletedAt`; mantém `preset_sounds` intacto (histórico)
- **`upsertSounds()`** — filtra `soundId`s inválidos ou inexistentes antes de inserir
- **`groupPresets()`** — agrupa rows de JOIN em objetos com array `sounds`; filtra sons com `soundDeletedAt !== null`

### Routes

- `GET /api/sounds` — 200 com array
- `POST /api/sounds/upload` — 201 criado / 422 formato inválido / 422 tamanho
- `PATCH /api/sounds/:id/favorite` — 200 com registro atualizado / 404
- `DELETE /api/sounds/:id` — 204 / 404
- `GET /api/presets` — 200 com array
- `GET /api/presets/:id` — 200 / 404
- `POST /api/presets` — 201 / 422 (name obrigatório)
- `PUT /api/presets/:id` — 200 / 404
- `DELETE /api/presets/:id` — 204 / 404

### Padrão de erros

Todos os erros seguem `{ error: { code, message, statusCode } }` via `AppError` + `errorHandler` middleware.

---

## Validações realizadas

- `tsc --noEmit` sem erros
- `GET /health` → `{ status: "ok" }`
- `GET /api/sounds` e `GET /api/presets` → `[]` com banco vazio
- `POST /api/sounds/upload` (.mp3) → 201 com registro
- `POST /api/sounds/upload` (.ogg) → 422 `INVALID_FILE_FORMAT`
- `PATCH /api/sounds/:id/favorite` → toggle correto
- `DELETE /api/sounds/:id` → 204; GET posterior retorna `[]`
- `POST /api/presets` com sons → 201 com array de sons e volumes
- `POST /api/presets` sem name → 422 `VALIDATION_ERROR`
- `GET /api/presets/:id` com som deletado → retorna preset sem o som
- `PUT /api/presets/:id` → substitui lista e atualiza nome
- `DELETE /api/presets/:id` → 204; GET posterior retorna `[]`; GET/:id retorna 404

---

## Decisões técnicas

- **Framework:** Express 4 (Multer é específico para Express, conforme previsto na spec)
- **Upload:** Multer com `diskStorage` — arquivo salvo antes da validação de extensão; removido do disco se inválido
- **Sons deletados em presets:** filtrados via `soundDeletedAt` no `groupPresets()`, não via condição de JOIN, para preservar o LEFT JOIN e suportar presets sem sons
- **Substituição de sons em update:** delete + re-insert (não upsert) para garantir limpeza completa
