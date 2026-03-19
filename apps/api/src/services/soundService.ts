import { eq, isNull, desc, sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { sounds } from '../db/schema';
import { Errors } from '../lib/errors';

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.mp4'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export class SoundService {
  async list() {
    return db
      .select()
      .from(sounds)
      .where(isNull(sounds.deletedAt))
      .orderBy(desc(sounds.isFavorite), desc(sounds.createdAt));
  }

  async upload(file: Express.Multer.File, name?: string) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      // Remover arquivo já salvo pelo multer antes de lançar erro
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw Errors.invalidFileFormat();
    }

    if (file.size > MAX_SIZE_BYTES) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw Errors.fileTooLarge();
    }

    const soundName = name?.trim() || path.basename(file.originalname, ext);
    const filePath = `/sounds/${file.filename}`;

    const [created] = await db
      .insert(sounds)
      .values({ name: soundName, filePath })
      .returning();

    return created;
  }

  async toggleFavorite(id: string) {
    const [sound] = await db
      .select()
      .from(sounds)
      .where(eq(sounds.id, id))
      .limit(1);

    if (!sound || sound.deletedAt) throw Errors.soundNotFound();

    const [updated] = await db
      .update(sounds)
      .set({
        isFavorite: !sound.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(sounds.id, id))
      .returning();

    return updated;
  }

  async softDelete(id: string) {
    const [sound] = await db
      .select()
      .from(sounds)
      .where(eq(sounds.id, id))
      .limit(1);

    if (!sound || sound.deletedAt) throw Errors.soundNotFound();

    await db
      .update(sounds)
      .set({ deletedAt: sql`now()`, updatedAt: new Date() })
      .where(eq(sounds.id, id));
  }
}

export const soundService = new SoundService();

