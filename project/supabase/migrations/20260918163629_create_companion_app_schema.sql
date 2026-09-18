/*
# Companion App Schema — Alzheimer's/Dementia Companion

## Overview
Creates the full database for a companion app for Alzheimer's/dementia patients
and their caregivers. Single-tenant (no auth) — all data is shared/local to the app.

## New Tables
1. `profiles` — single row with patient + caregiver info
   - id (uuid PK), patient_name, patient_birthdate, caregiver_name,
     caregiver_phone, caregiver_email, caregiver_relation,
     games_enabled (bool default false), created_at, updated_at

2. `family_contacts` — people the patient knows
   - id (uuid PK), name, relation, phone, created_at

3. `media_items` — photos, videos, and songs uploaded by the user
   - id (uuid PK), type ('photo'|'video'|'song'), caption, storage_path,
     external_url, created_at

4. `game_sessions` — history of game play
   - id (uuid PK), game_type ('family_tree'|'jigsaw'), difficulty,
     completed (bool), completion_seconds (int, nullable), mistakes (int default 0),
     played_at (timestamptz default now())

5. `neurologist_contacts` — doctor contacts (empty by default)
   - id (uuid PK), name, specialty, phone, notes, created_at

6. `reminders` — daily reminders for pills/appointments/water
   - id (uuid PK), title, type ('pill'|'appointment'|'water'),
     time (text HH:MM), days (text, comma-separated or 'daily'),
     active (bool default true), created_at

## Security
- All tables: RLS enabled, TO anon, authenticated with USING(true)/WITH CHECK(true)
  because this is a single-tenant no-auth app where all data is intentionally shared.
- A storage bucket `companion-media` is created for uploads (public).
*/

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL DEFAULT '',
  patient_birthdate date,
  caregiver_name text NOT NULL DEFAULT '',
  caregiver_phone text DEFAULT '',
  caregiver_email text DEFAULT '',
  caregiver_relation text DEFAULT '',
  games_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- 2. family_contacts
CREATE TABLE IF NOT EXISTS family_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  relation text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_family_contacts" ON family_contacts;
CREATE POLICY "anon_select_family_contacts" ON family_contacts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_family_contacts" ON family_contacts;
CREATE POLICY "anon_insert_family_contacts" ON family_contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_family_contacts" ON family_contacts;
CREATE POLICY "anon_update_family_contacts" ON family_contacts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_family_contacts" ON family_contacts;
CREATE POLICY "anon_delete_family_contacts" ON family_contacts FOR DELETE
  TO anon, authenticated USING (true);

-- 3. media_items
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('photo','video','song')),
  caption text DEFAULT '',
  storage_path text,
  external_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_media_items" ON media_items;
CREATE POLICY "anon_select_media_items" ON media_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_media_items" ON media_items;
CREATE POLICY "anon_insert_media_items" ON media_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_media_items" ON media_items;
CREATE POLICY "anon_update_media_items" ON media_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_media_items" ON media_items;
CREATE POLICY "anon_delete_media_items" ON media_items FOR DELETE
  TO anon, authenticated USING (true);

-- 4. game_sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL CHECK (game_type IN ('family_tree','jigsaw')),
  difficulty int DEFAULT 3,
  completed boolean NOT NULL DEFAULT false,
  completion_seconds int,
  mistakes int NOT NULL DEFAULT 0,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_game_sessions" ON game_sessions;
CREATE POLICY "anon_select_game_sessions" ON game_sessions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_game_sessions" ON game_sessions;
CREATE POLICY "anon_insert_game_sessions" ON game_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_game_sessions" ON game_sessions;
CREATE POLICY "anon_update_game_sessions" ON game_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_game_sessions" ON game_sessions;
CREATE POLICY "anon_delete_game_sessions" ON game_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- 5. neurologist_contacts
CREATE TABLE IF NOT EXISTS neurologist_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  specialty text DEFAULT '',
  phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE neurologist_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_neurologist_contacts" ON neurologist_contacts;
CREATE POLICY "anon_select_neurologist_contacts" ON neurologist_contacts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_neurologist_contacts" ON neurologist_contacts;
CREATE POLICY "anon_insert_neurologist_contacts" ON neurologist_contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_neurologist_contacts" ON neurologist_contacts;
CREATE POLICY "anon_update_neurologist_contacts" ON neurologist_contacts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_neurologist_contacts" ON neurologist_contacts;
CREATE POLICY "anon_delete_neurologist_contacts" ON neurologist_contacts FOR DELETE
  TO anon, authenticated USING (true);

-- 6. reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('pill','appointment','water')),
  time text NOT NULL DEFAULT '08:00',
  days text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
CREATE POLICY "anon_select_reminders" ON reminders FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
CREATE POLICY "anon_insert_reminders" ON reminders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
CREATE POLICY "anon_update_reminders" ON reminders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reminders" ON reminders;
CREATE POLICY "anon_delete_reminders" ON reminders FOR DELETE
  TO anon, authenticated USING (true);

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('companion-media', 'companion-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read/write for anon)
DROP POLICY IF EXISTS "anon_upload_media" ON storage.objects;
CREATE POLICY "anon_upload_media" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'companion-media');

DROP POLICY IF EXISTS "anon_read_media" ON storage.objects;
CREATE POLICY "anon_read_media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'companion-media');

DROP POLICY IF EXISTS "anon_delete_media" ON storage.objects;
CREATE POLICY "anon_delete_media" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'companion-media');

-- Indexes for game_sessions (used by insights)
CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played ON game_sessions(played_at);