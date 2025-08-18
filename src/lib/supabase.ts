import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface LeaderboardEntry {
  id?: number;
  player_name: string;
  score: number;
  game_duration: number;
  created_at?: string;
}

export interface PlayerStats {
  id?: number;
  player_name: string;
  total_games: number;
  best_score: number;
  total_score: number;
  average_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface AddressSyncEntry {
  id?: number;
  email: string;
  nadilo_address: string;
  monad_games_id_address?: string;
  last_sync_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at?: string;
  updated_at?: string;
}