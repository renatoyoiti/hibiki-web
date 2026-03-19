# Fase 2 — Backend Core

**Status:** Pendente  
**Pré-requisito:** Fase 1 concluída (monorepo, Docker, Drizzle schema, API setup)  
**Pode rodar em paralelo com:** Fase 3 (Frontend Core)  
**Ref. spec:** seções 3 (RN-01, RN-06, RN-07, RN-08, RN-09, RN-10), 8, 10, 11, 12, 13

---

## Objetivo

Implementar todos os endpoints da API REST no backend, incluindo validações de negócio, tratamento de erros padronizado e persistência via Drizzle ORM. Ao fim desta fase, a API deve estar completamente funcional e testável via cliente HTTP.

---

## Estrutura de arquivos esperada

```
apps/api/src/
├── db/
│   ├── schema.ts          # definido na Fase 1
│   ├── migrations/        # gerado na Fase 1
│   └── index.ts
├── routes/
│   ├── sounds.ts          # rotas de sons
│   └── presets.ts         # rotas de presets
├── services/
│   ├── soundService.ts    # lógica de negócio de sons
│   └── presetService.ts   # lógica de negócio de presets
├── middlewares/
│   └── errorHandler.ts    # middleware global de erros
├── lib/
│   └── errors.ts          # classes de erro customizadas e códigos
└── server.ts
```

---

## Padrão de erros (obrigatório em todos os endpoints)

Todos os erros devem seguir o padrão definido na spec:

```json
{
  "error": {
    "code": "PRESET_NOT_FOUND",
    "message": "Preset não encontrado ou removido.",
    "statusCode": 404
  }
}
```

**Códigos de erro mapeados:**

| Código | Status | Trigger |
|---|---|---|
| `INVALID_FILE_FORMAT` | 422 | Upload com formato diferente de `.mp3`, `.wav`, `.mp4` |
| `FILE_TOO_LARGE` | 422 | Upload com arquivo acima de 5MB |
| `SOUND_ALREADY_ACTIVE` | 409 | Tentativa de adicionar som duplicado à fila (RN-01) |
| `PRESET_NOT_FOUND` | 404 | Preset não encontrado ou com `deletedAt` preenchido |
| `SOUND_NOT_FOUND` | 404 | Som não encontrado ou com `deletedAt` preenchido |
| `INTERNAL_ERROR` | 500 | Erros inesperados |
| `SERVICE_UNAVAILABLE` | 503 | Banco de dados indisponível |

---

## Tarefa: Middleware de erros

**`be-error-handling`**

Criar middleware global em `apps/api/src/middlewares/errorHandler.ts`:

- Capturar erros lançados nos controllers/services
- Mapear para o padrão `{error: {code, message, statusCode}}`
- Tratar erros de conexão com banco (503)
- Logar erros inesperados no console em desenvolvimento
- Nunca expor stack traces ao cliente em produção

---

## Tarefas: Sounds

Base URL: `http://localhost:3000/api`

---

### `be-sounds-get` — GET /sounds

**Descrição:** Lista todos os sons disponíveis, excluindo os soft-deletados.

**Regras:**
- Retornar apenas registros onde `deleted_at IS NULL`
- Ordenação: favoritos (`is_favorite = true`) primeiro, depois por `created_at DESC`
- Ref. spec RN-06

**Response 200:**
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

---

### `be-sounds-upload` — POST /sounds/upload

**Descrição:** Faz upload de um novo arquivo de áudio e persiste metadados no banco.

**Regras (RN-08):**
- `Content-Type: multipart/form-data`
- Campos: `file` (binário, obrigatório), `name` (string, opcional — usa nome do arquivo se omitido)
- Formatos aceitos: `.mp3`, `.wav`, `.mp4`
- Tamanho máximo: 5MB por arquivo
- Salvar o arquivo em `public/sounds/` no servidor
- Persistir `{ name, filePath, isFavorite: false }` no banco

**Validações (antes de salvar):**
1. Verificar MIME type ou extensão do arquivo
2. Verificar tamanho (`file.size <= 5 * 1024 * 1024`)
3. Retornar `INVALID_FILE_FORMAT` (422) se formato inválido
4. Retornar `FILE_TOO_LARGE` (422) se tamanho excedido

**Response 201:**
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

### `be-sounds-favorite` — PATCH /sounds/:id/favorite

**Descrição:** Alterna o status de favorito de um som (toggle).

**Regras (RN-06):**
- Verificar se o som existe e não está deletado → 404 `SOUND_NOT_FOUND` se não
- Inverter o valor atual de `is_favorite`
- Atualizar `updated_at`

**Response 200:** retornar o registro atualizado (mesmo formato do GET /sounds item).

---

### `be-sounds-delete` — DELETE /sounds/:id

**Descrição:** Soft delete de um som.

**Regras (RN-09):**
- Verificar se existe e não está deletado → 404 `SOUND_NOT_FOUND` se não
- Preencher `deleted_at = NOW()`
- Atualizar `updated_at`
- Não remover o arquivo físico (pode ser necessário para presets existentes)

**Response:** 204 No Content.

---

## Tarefas: Presets

---

### `be-presets-list` — GET /presets

**Descrição:** Lista todos os presets ativos com seus sons e volumes.

**Regras:**
- Retornar apenas presets onde `deleted_at IS NULL`
- Fazer JOIN com `preset_sounds` e `sounds` para incluir nome e volume de cada som
- Sons com `deleted_at` preenchido devem ser **ignorados** na listagem dos sons do preset (Ref. spec seção 12 — "Carregar preset com som deletado")
- Ordenar por `created_at DESC`

**Response 200:**
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

### `be-presets-get` — GET /presets/:id

**Descrição:** Retorna detalhes de um preset específico.

**Regras:**
- Retornar 404 `PRESET_NOT_FOUND` se `deleted_at IS NOT NULL` ou não encontrado
- Incluir sons (excluindo sons deletados, como em GET /presets)

**Response 200:** mesmo formato de um item do GET /presets.

---

### `be-presets-create` — POST /presets

**Descrição:** Cria um novo preset com nome e lista de sons + volumes.

**Regras (RN-07):**
- `name` é obrigatório
- `sounds` é um array de `{ soundId: uuid, volume: number (0–100) }` — pode ser vazio (preset sem sons é válido — Ref. spec seção 12)
- Validar que cada `soundId` referenciado existe e não está deletado
- Inserir em `presets` e em `preset_sounds` (uma linha por som)

**Request:**
```json
{
  "name": "Foco profundo",
  "sounds": [
    { "soundId": "uuid", "volume": 75 },
    { "soundId": "uuid", "volume": 40 }
  ]
}
```

**Response 201:** preset criado com sons incluídos.

---

### `be-presets-update` — PUT /presets/:id

**Descrição:** Atualiza nome e/ou lista de sons de um preset.

**Regras (RN-07):**
- Retornar 404 `PRESET_NOT_FOUND` se deletado ou não encontrado
- `name` é opcional — se omitido, mantém o valor atual
- `sounds` é opcional — se fornecido, **substitui completamente** a lista anterior em `preset_sounds` (delete + re-insert)
- Atualizar `updated_at`

**Request:**
```json
{
  "name": "Novo nome (opcional)",
  "sounds": [
    { "soundId": "uuid", "volume": 60 }
  ]
}
```

**Response 200:** preset atualizado com sons.

---

### `be-presets-delete` — DELETE /presets/:id

**Descrição:** Soft delete de um preset.

**Regras (RN-09, RN-10):**
- Retornar 404 `PRESET_NOT_FOUND` se já deletado ou não encontrado
- Preencher `deleted_at = NOW()`
- **Não** remover registros de `preset_sounds` (histórico)
- **Não** afeta a fila de execução ativa do frontend (responsabilidade do cliente — Ref. spec seção 12)

**Response:** 204 No Content.

---

## Edge cases mapeados (spec seção 12)

| Cenário | Comportamento da API |
|---|---|
| Upload com formato inválido | 422 `INVALID_FILE_FORMAT` |
| Upload acima de 5MB | 422 `FILE_TOO_LARGE` |
| GET /presets/:id com som deletado | Retorna preset sem o som deletado |
| Preset sem sons | Permitido — `sounds: []` é válido |
| Banco indisponível | 503 `SERVICE_UNAVAILABLE` |
| DELETE preset já deletado | 404 `PRESET_NOT_FOUND` |

---

## Critérios de conclusão

- [ ] `GET /sounds` retorna sons ordenados (favoritos primeiro), excluindo deletados
- [ ] `POST /sounds/upload` salva arquivo e metadados; rejeita formato inválido (422) e tamanho excedido (422)
- [ ] `PATCH /sounds/:id/favorite` faz toggle correto
- [ ] `DELETE /sounds/:id` realiza soft delete, retorna 204
- [ ] `GET /presets` retorna presets com sons (excluindo sons deletados)
- [ ] `GET /presets/:id` retorna 404 para preset deletado
- [ ] `POST /presets` cria preset com sons e volumes; aceita `sounds: []`
- [ ] `PUT /presets/:id` substitui lista de sons completamente
- [ ] `DELETE /presets/:id` realiza soft delete, retorna 204
- [ ] Todos os erros seguem o padrão `{error: {code, message, statusCode}}`
- [ ] Banco indisponível retorna 503

---

## Dependências

- **Fase 1** completa: monorepo, `infra-api-setup`, `infra-drizzle-schema`
