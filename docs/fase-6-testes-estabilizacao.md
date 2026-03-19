# Fase 6 — Testes & Estabilização

**Status:** Pendente  
**Pré-requisito:** Todas as fases anteriores (1–5) concluídas  
**Ref. spec:** seções 5 (critérios de sucesso), 12 (edge cases), 13 (testes)

---

## Objetivo

Cobrir com testes automatizados as regras de negócio críticas do backend, validar os edge cases mapeados na spec e finalizar a documentação do projeto. O foco desta fase é **backend**: unitários nos services e integração nos endpoints. Testes de componentes frontend estão planejados para uma iteração futura (spec seção 13).

---

## Stack de testes

- **Backend:** Vitest (compilador Rust via Vite) — já previsto na spec
- **Banco de dados (integração):** banco PostgreSQL dedicado para testes, ou `pg-mem` para mocks em memória
- **Frontend:** planejado para iteração futura com Vitest + Testing Library (spec seção 13 — "Frontend — Planejado para iteração futura")

---

## Estrutura de arquivos esperada

```
apps/api/
├── src/
│   ├── services/
│   │   ├── soundService.ts
│   │   └── presetService.ts
│   └── ...
└── tests/
    ├── unit/
    │   ├── soundService.test.ts
    │   └── presetService.test.ts
    └── integration/
        ├── sounds.test.ts
        └── presets.test.ts
```

---

## Tarefa: Testes unitários

**`test-be-unit`**

Testar isoladamente a lógica dos services, mockando o banco de dados.

### `soundService.test.ts`

**`SoundService.addSound()` — validação antes de persistir:**

```typescript
describe('SoundService.addSound', () => {
  it('deve rejeitar arquivo com formato inválido', async () => {
    const file = mockFile('audio.ogg', 'audio/ogg', 1_000_000);
    await expect(soundService.upload(file)).rejects.toMatchObject({
      code: 'INVALID_FILE_FORMAT'
    });
  });

  it('deve rejeitar arquivo acima de 5MB', async () => {
    const file = mockFile('audio.mp3', 'audio/mpeg', 6 * 1024 * 1024);
    await expect(soundService.upload(file)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE'
    });
  });

  it('deve aceitar .mp3 dentro do limite', async () => {
    const file = mockFile('audio.mp3', 'audio/mpeg', 2_000_000);
    const result = await soundService.upload(file);
    expect(result).toHaveProperty('id');
    expect(result.isFavorite).toBe(false);
  });

  it('deve aceitar .wav e .mp4', async () => {
    // testar os três formatos permitidos
  });
});
```

**`SoundService.toggleFavorite()` — alterna `isFavorite` corretamente:**

```typescript
describe('SoundService.toggleFavorite', () => {
  it('deve marcar como favorito quando era false', async () => {
    const sound = await soundService.toggleFavorite(soundId);
    expect(sound.isFavorite).toBe(true);
  });

  it('deve desmarcar favorito quando era true', async () => {
    // ...
  });

  it('deve retornar SOUND_NOT_FOUND para id inexistente', async () => {
    await expect(soundService.toggleFavorite('id-invalido')).rejects.toMatchObject({
      code: 'SOUND_NOT_FOUND'
    });
  });
});
```

### `presetService.test.ts`

**`PresetService.createPreset()` — persiste sons com volumes corretos:**

```typescript
describe('PresetService.createPreset', () => {
  it('deve criar preset com sons e volumes', async () => {
    const result = await presetService.create({
      name: 'Foco',
      sounds: [{ soundId: validSoundId, volume: 75 }]
    });
    expect(result.sounds[0].volume).toBe(75);
    expect(result.sounds[0].soundId).toBe(validSoundId);
  });

  it('deve permitir criar preset sem sons (sons: [])', async () => {
    const result = await presetService.create({ name: 'Vazio', sounds: [] });
    expect(result.sounds).toHaveLength(0);
  });

  it('deve rejeitar soundId inexistente', async () => {
    // ...
  });
});
```

**`PresetService.updatePreset()` — substitui lista de sons e volumes:**

```typescript
describe('PresetService.updatePreset', () => {
  it('deve substituir completamente a lista de sons', async () => {
    // criar preset com 2 sons
    // atualizar com 1 novo som
    // verificar que os 2 anteriores foram removidos
  });

  it('deve manter nome atual se name não for fornecido', async () => {
    // ...
  });
});
```

**`PresetService.softDelete()` — preenche `deletedAt`, não aparece nas listagens:**

```typescript
describe('PresetService.softDelete', () => {
  it('deve preencher deletedAt', async () => {
    await presetService.delete(presetId);
    const preset = await db.query.presets.findFirst({
      where: eq(presets.id, presetId)
    });
    expect(preset?.deletedAt).not.toBeNull();
  });

  it('não deve aparecer em listagem após soft delete', async () => {
    await presetService.delete(presetId);
    const list = await presetService.list();
    expect(list.find(p => p.id === presetId)).toBeUndefined();
  });

  it('deve retornar PRESET_NOT_FOUND se já deletado', async () => {
    await presetService.delete(presetId);
    await expect(presetService.delete(presetId)).rejects.toMatchObject({
      code: 'PRESET_NOT_FOUND'
    });
  });
});
```

---

## Tarefa: Testes de integração

**`test-be-integration`**

Testar os endpoints HTTP end-to-end com banco de dados real (ou em memória).

### `sounds.test.ts`

```typescript
describe('POST /api/sounds/upload', () => {
  it('arquivo válido → 201 + registro no banco', async () => {
    const response = await request(app)
      .post('/api/sounds/upload')
      .attach('file', mockMp3Buffer, 'chuva.mp3');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.isFavorite).toBe(false);

    // verificar no banco
    const dbRecord = await db.query.sounds.findFirst({
      where: eq(sounds.id, response.body.id)
    });
    expect(dbRecord).not.toBeNull();
  });

  it('formato inválido → 422 com INVALID_FILE_FORMAT', async () => {
    const response = await request(app)
      .post('/api/sounds/upload')
      .attach('file', mockOggBuffer, 'audio.ogg');

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_FILE_FORMAT');
  });

  it('arquivo acima de 5MB → 422 com FILE_TOO_LARGE', async () => {
    const response = await request(app)
      .post('/api/sounds/upload')
      .attach('file', largeMp3Buffer, 'grande.mp3'); // > 5MB

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
  });
});
```

### `presets.test.ts`

```typescript
describe('GET /api/presets', () => {
  it('retorna apenas presets sem deletedAt', async () => {
    // criar 2 presets, deletar 1
    const response = await request(app).get('/api/presets');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});

describe('DELETE /api/presets/:id', () => {
  it('soft delete confirmado via GET subsequente', async () => {
    await request(app).delete(`/api/presets/${presetId}`);
    const response = await request(app).get('/api/presets');
    expect(response.body.find((p: any) => p.id === presetId)).toBeUndefined();
  });
});

describe('GET /api/presets/:id com som deletado', () => {
  it('retorna preset sem o som inválido', async () => {
    // criar preset com 2 sons
    // deletar 1 dos sons
    const response = await request(app).get(`/api/presets/${presetId}`);
    expect(response.body.sounds).toHaveLength(1);
  });
});
```

---

## Tarefa: Edge cases de negócio

**`test-be-edge-cases`**

Cenários críticos definidos na spec (seções 12 e 13):

```typescript
describe('Regras de negócio críticas', () => {
  // RN-03 / RN-04 — testados via API ou service
  it('mute individual: mutar sound_A não afeta sound_B', () => {
    // via store ou service: verificar que volumes são independentes
  });

  it('mute global: todos os sounds são afetados simultaneamente', () => {
    // todos os sons devem ter isMuted = true após toggleGlobalMute
  });

  it('desmutar após volume 0: volume retorna para 50', () => {
    // setVolume(id, 0) → isMuted = true
    // toggleMute(id) → volume = 50
  });

  it('desmutar após mute por botão: volume retorna ao valor anterior', () => {
    // setVolume(id, 75) → volume = 75
    // toggleMute(id) → isMuted = true, previousVolume = 75
    // toggleMute(id) → volume = 75
  });

  // RN-01 — duplicata na fila
  it('segundo addSound() com mesmo id retorna SOUND_ALREADY_ACTIVE', async () => {
    const response = await request(app)
      .post('/api/sounds/active')
      .send({ soundId: existingActiveId });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SOUND_ALREADY_ACTIVE');
  });
});
```

> **Nota:** Os testes de mute (RN-03, RN-04) podem ser unitários de frontend (soundStore) ou de backend, dependendo de onde a lógica de mute for centralizada.

---

## Tarefa: Atualizar README

**`test-readme-update`**

Atualizar `README.md` na raiz do monorepo com:

```markdown
## Pré-requisitos
- Node.js 22.x LTS
- Docker e Docker Compose

## Como rodar

### Com Docker (recomendado)
make up       # Sobe web, api e banco
make migrate  # Executa migrations do banco

### Desenvolvimento local
make dev      # Inicia frontend e backend sem Docker

## Comandos disponíveis
make up       # Sobe todos os serviços Docker
make down     # Para os serviços Docker
make dev      # Modo desenvolvimento (sem Docker)
make build    # Build de produção
make migrate  # Executa migrations do banco
make lint     # Linting (web + api)
make test     # Testes do backend

## Estrutura do projeto
hibiki/
├── apps/
│   ├── web/   # React 19 + Vite + TypeScript + Zustand + TailwindCSS
│   └── api/   # Node.js + TypeScript + Drizzle ORM
└── packages/
    └── shared/ # Tipos TypeScript compartilhados
```

---

## Critérios de conclusão da fase (e do MVP)

### Testes
- [ ] Todos os testes unitários passando: `SoundService`, `PresetService`
- [ ] Todos os testes de integração passando: endpoints de sounds e presets
- [ ] Edge cases de negócio cobertos: mute individual/global, restauração de volume, duplicata

### Critérios de sucesso da spec (seção 5)
- [ ] ≥ 5 sons tocando simultaneamente sem falha de áudio
- [ ] Volume restaurado corretamente em 100% dos cenários de mute/unmute
- [ ] CRUD de presets sem perda de dados
- [ ] Upload: arquivo salvo e reproduzível após upload
- [ ] Dark/light mode: troca sem reload, persistida entre sessões
- [ ] Layout funcional em 375px até 1920px
- [ ] Carregamento inicial < 2s em ambiente local

### Documentação
- [ ] `README.md` atualizado com instruções completas
- [ ] `Makefile` com todos os targets documentados

---

## Dependências

- **Todas as fases anteriores** (1–5) concluídas
