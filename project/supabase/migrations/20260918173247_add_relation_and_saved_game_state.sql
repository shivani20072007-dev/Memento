/*
# Add relation column to media_items + saved game state table

## Changes
1. `media_items` — add `relation` text column (nullable, for photos used in Family Tree game)
2. New table `saved_game_states` — stores in-progress game state so it can be resumed
   - id (uuid PK), game_type, state_data (jsonb), elapsed_seconds (int), mistakes (int),
     difficulty (int), created_at, updated_at

## Security
- `saved_game_states`: RLS enabled, TO anon/authenticated CRUD (single-tenant, no auth)
*/

-- Add relation column to media_items
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS relation text;

-- Saved game state table
CREATE TABLE IF NOT EXISTS saved_game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL CHECK (game_type IN ('family_tree','jigsaw')),
  state_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  elapsed_seconds int NOT NULL DEFAULT 0,
  mistakes int NOT NULL DEFAULT 0,
  difficulty int NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_game_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_saved_game_states" ON saved_game_states;
CREATE POLICY "anon_select_saved_game_states" ON saved_game_states FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_saved_game_states" ON saved_game_states;
CREATE POLICY "anon_insert_saved_game_states" ON saved_game_states FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_saved_game_states" ON saved_game_states;
CREATE POLICY "anon_update_saved_game_states" ON saved_game_states FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_saved_game_states" ON saved_game_states;
CREATE POLICY "anon_delete_saved_game_states" ON saved_game_states FOR DELETE
  TO anon, authenticated USING (true);