import { supabase } from '../lib/supabase';
import type { LeaderboardEntry, PlayerStats } from '../lib/supabase';

export class LeaderboardService {
  // Submit a new score
  static async submitScore(playerName: string, score: number, gameDuration: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .insert({
          player_name: playerName,
          score: score,
          game_duration: gameDuration
        });

      if (error) {
        console.error('Error submitting score:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error submitting score:', error);
      return false;
    }
  }

  // Get top scores for leaderboard
  static async getTopScores(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Get player's personal best and stats
  static async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', playerName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching player stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }

  // Get player's rank on leaderboard
  static async getPlayerRank(playerName: string): Promise<number | null> {
    try {
      // Get player's best score
      const playerStats = await this.getPlayerStats(playerName);
      if (!playerStats) return null;

      // Count how many players have higher scores
      const { count, error } = await supabase
        .from('player_stats')
        .select('*', { count: 'exact', head: true })
        .gt('best_score', playerStats.best_score);

      if (error) {
        console.error('Error fetching player rank:', error);
        return null;
      }

      return (count || 0) + 1; // +1 because rank starts from 1
    } catch (error) {
      console.error('Error fetching player rank:', error);
      return null;
    }
  }

  // Subscribe to real-time leaderboard updates
  static subscribeToLeaderboard(callback: (payload: any) => void) {
    return supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard'
        },
        callback
      )
      .subscribe();
  }

  // Get recent games (last 24 hours)
  static async getRecentGames(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent games:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent games:', error);
      return [];
    }
  }
}