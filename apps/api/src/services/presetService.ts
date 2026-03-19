import { eq, isNull, desc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { presets, presetSounds, sounds } from '../db/schema';
import { Errors } from '../lib/errors';

export interface PresetSoundDTO {
  soundId: string;
  volume: number;
}

export class PresetService {
  async list() {
    const rows = await db
      .select({
        id: presets.id,
        name: presets.name,
        createdAt: presets.createdAt,
        updatedAt: presets.updatedAt,
        soundId: presetSounds.soundId,
        volume: presetSounds.volume,
        soundName: sounds.name,
        soundDeletedAt: sounds.deletedAt,
      })
      .from(presets)
      .leftJoin(presetSounds, eq(presetSounds.presetId, presets.id))
      .leftJoin(
        sounds,
        eq(sounds.id, presetSounds.soundId),
      )
      .where(isNull(presets.deletedAt))
      .orderBy(desc(presets.createdAt));

    return this.groupPresets(rows);
  }

  async findById(id: string) {
    // Primeiro verificar se o preset existe e não está deletado
    const [preset] = await db
      .select()
      .from(presets)
      .where(eq(presets.id, id))
      .limit(1);

    if (!preset || preset.deletedAt) throw Errors.presetNotFound();

    const rows = await db
      .select({
        id: presets.id,
        name: presets.name,
        createdAt: presets.createdAt,
        updatedAt: presets.updatedAt,
        soundId: presetSounds.soundId,
        volume: presetSounds.volume,
        soundName: sounds.name,
        soundDeletedAt: sounds.deletedAt,
      })
      .from(presets)
      .leftJoin(presetSounds, eq(presetSounds.presetId, presets.id))
      .leftJoin(sounds, eq(sounds.id, presetSounds.soundId))
      .where(eq(presets.id, id));

    return this.groupPresets(rows)[0];
  }

  async create(name: string, soundList: PresetSoundDTO[]) {
    const [created] = await db
      .insert(presets)
      .values({ name })
      .returning();

    if (soundList.length > 0) {
      await this.upsertSounds(created.id, soundList);
    }

    return this.findById(created.id);
  }

  async update(id: string, data: { name?: string; sounds?: PresetSoundDTO[] }) {
    const [preset] = await db
      .select()
      .from(presets)
      .where(eq(presets.id, id))
      .limit(1);

    if (!preset || preset.deletedAt) throw Errors.presetNotFound();

    if (data.name !== undefined) {
      await db
        .update(presets)
        .set({ name: data.name, updatedAt: new Date() })
        .where(eq(presets.id, id));
    }

    if (data.sounds !== undefined) {
      // Substituir completamente a lista de sons
      await db.delete(presetSounds).where(eq(presetSounds.presetId, id));
      if (data.sounds.length > 0) {
        await this.upsertSounds(id, data.sounds);
      }
      await db
        .update(presets)
        .set({ updatedAt: new Date() })
        .where(eq(presets.id, id));
    }

    return this.findById(id);
  }

  async softDelete(id: string) {
    const [preset] = await db
      .select()
      .from(presets)
      .where(eq(presets.id, id))
      .limit(1);

    if (!preset || preset.deletedAt) throw Errors.presetNotFound();

    await db
      .update(presets)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(presets.id, id));
  }

  private async upsertSounds(presetId: string, soundList: PresetSoundDTO[]) {
    // Filtrar soundIds que existem e não estão deletados
    const soundIds = soundList.map((s) => s.soundId);
    const validSounds = await db
      .select({ id: sounds.id })
      .from(sounds)
      .where(inArray(sounds.id, soundIds));

    const validIds = new Set(validSounds.map((s) => s.id));
    const validList = soundList.filter((s) => validIds.has(s.soundId));

    if (validList.length > 0) {
      await db.insert(presetSounds).values(
        validList.map((s) => ({
          presetId,
          soundId: s.soundId,
          volume: s.volume,
        })),
      );
    }
  }

  private groupPresets(
    rows: Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      soundId: string | null;
      volume: number | null;
      soundName: string | null;
      soundDeletedAt: Date | null;
    }>,
  ) {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sounds: Array<{ soundId: string; name: string; volume: number }>;
      }
    >();

    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          sounds: [],
        });
      }

      // Incluir som apenas se existe, não está deletado e tem volume
      if (
        row.soundId &&
        row.soundName !== null &&
        row.volume !== null &&
        row.soundDeletedAt === null
      ) {
        map.get(row.id)!.sounds.push({
          soundId: row.soundId,
          name: row.soundName,
          volume: row.volume,
        });
      }
    }

    return Array.from(map.values());
  }
}

export const presetService = new PresetService();

