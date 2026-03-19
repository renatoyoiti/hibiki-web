import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

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

export const presetSounds = pgTable(
  'preset_sounds',
  {
    presetId: uuid('preset_id')
      .references(() => presets.id)
      .notNull(),
    soundId: uuid('sound_id')
      .references(() => sounds.id)
      .notNull(),
    volume: integer('volume').default(50).notNull(),
  },
  (table) => [primaryKey({ columns: [table.presetId, table.soundId] })],
);
