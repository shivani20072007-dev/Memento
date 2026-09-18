export interface Profile {
  id: string;
  patient_name: string;
  patient_birthdate: string | null;
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_email: string;
  caregiver_relation: string;
  games_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  created_at: string;
}

export type MediaType = 'photo' | 'video' | 'song';

export type PhotoRelation = 'spouse' | 'son' | 'daughter' | 'grandson' | 'granddaughter' | 'sibling' | 'parent' | 'friend' | 'other';

export interface MediaItem {
  id: string;
  type: MediaType;
  caption: string;
  storage_path: string | null;
  external_url: string | null;
  relation: string | null;
  created_at: string;
}

export type GameType = 'family_tree' | 'jigsaw';

export interface GameSession {
  id: string;
  game_type: GameType;
  difficulty: number;
  completed: boolean;
  completion_seconds: number | null;
  mistakes: number;
  played_at: string;
}

export interface NeurologistContact {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  notes: string;
  created_at: string;
}

export type ReminderType = 'pill' | 'appointment' | 'water';

export interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  time: string;
  days: string;
  active: boolean;
  created_at: string;
}

export interface SavedGameState {
  id: string;
  game_type: GameType;
  state_data: Record<string, unknown>;
  elapsed_seconds: number;
  mistakes: number;
  difficulty: number;
  created_at: string;
  updated_at: string;
}

export type Language = 'en' | 'bn' | 'as' | 'hi';
