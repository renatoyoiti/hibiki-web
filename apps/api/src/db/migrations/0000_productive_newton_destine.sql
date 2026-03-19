CREATE TABLE "preset_sounds" (
	"preset_id" uuid NOT NULL,
	"sound_id" uuid NOT NULL,
	"volume" integer DEFAULT 50 NOT NULL,
	CONSTRAINT "preset_sounds_preset_id_sound_id_pk" PRIMARY KEY("preset_id","sound_id")
);
--> statement-breakpoint
CREATE TABLE "presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preset_sounds" ADD CONSTRAINT "preset_sounds_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_sounds" ADD CONSTRAINT "preset_sounds_sound_id_sounds_id_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sounds"("id") ON DELETE no action ON UPDATE no action;