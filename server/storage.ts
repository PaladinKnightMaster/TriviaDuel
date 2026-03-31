import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, gameStats, leaderboards, type User, type InsertUser, type GameStats, type InsertGameStats, type Leaderboard, type InsertLeaderboard, LeaderboardEntry } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface SimpleGameStats {
  playerId: string;
  totalGames: number;
  wins: number;
  losses: number;
  averageScore: number;
  bestStreak: number;
  favoriteCategory: string;
  rating: number;
  tier: string;
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Export database connection for other services
export { db };

export interface IStorage {
  getPlayerStats(playerId: string): Promise<SimpleGameStats | undefined>;
  updatePlayerStats(playerId: string, stats: Partial<SimpleGameStats>): Promise<SimpleGameStats>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  updateLeaderboard(playerId: string, playerName: string, score: number, gamesWon: number, bestStreak: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private fallbackStats: Map<string, SimpleGameStats>;
  private fallbackLeaderboard: Map<string, LeaderboardEntry>;

  constructor() {
    this.fallbackStats = new Map();
    this.fallbackLeaderboard = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample leaderboard data
    const sampleLeaderboard = [
      { playerId: '1', playerName: 'TriviaKing', totalScore: 15420, gamesWon: 87, bestStreak: 12, rank: 1 },
      { playerId: '2', playerName: 'QuizMaster', totalScore: 14230, gamesWon: 76, bestStreak: 15, rank: 2 },
      { playerId: '3', playerName: 'BrainBox', totalScore: 13180, gamesWon: 69, bestStreak: 9, rank: 3 },
      { playerId: '4', playerName: 'Smarty', totalScore: 12890, gamesWon: 64, bestStreak: 11, rank: 4 },
      { playerId: '5', playerName: 'Genius', totalScore: 11750, gamesWon: 58, bestStreak: 8, rank: 5 }
    ];

    sampleLeaderboard.forEach((entry, index) => {
      this.fallbackLeaderboard.set(entry.playerId, {
        ...entry,
        rank: index + 1
      });
    });
  }


  async getPlayerStats(playerId: string): Promise<SimpleGameStats | undefined> {
    try {
      const result = await db.select().from(gameStats).where(eq(gameStats.playerId, playerId)).limit(1);
      if (result.length > 0) {
        const stats = result[0];
        return {
          playerId: stats.playerId,
          totalGames: stats.totalGames || 0,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          averageScore: stats.averageScore || 0,
          bestStreak: stats.bestStreak || 0,
          favoriteCategory: stats.favoriteCategory || 'general',
          rating: stats.rating || 1000,
          tier: stats.tier || 'bronze'
        };
      }
    } catch (error) {
      console.error('Database error, using fallback:', error);
    }
    return this.fallbackStats.get(playerId);
  }

  async updatePlayerStats(playerId: string, stats: Partial<SimpleGameStats>): Promise<SimpleGameStats> {
    try {
      // Try to get existing stats from database
      const existing = await this.getPlayerStats(playerId) || {
        playerId,
        totalGames: 0,
        wins: 0,
        losses: 0,
        averageScore: 0,
        bestStreak: 0,
        favoriteCategory: 'general',
        rating: 1000,
        tier: 'bronze'
      };

      const updated = { ...existing, ...stats };

      // Try to upsert to database
      await db.insert(gameStats)
        .values({
          playerId,
          totalGames: updated.totalGames,
          wins: updated.wins,
          losses: updated.losses,
          averageScore: updated.averageScore,
          bestStreak: updated.bestStreak,
          favoriteCategory: updated.favoriteCategory,
          rating: updated.rating,
          tier: updated.tier
        })
        .onConflictDoUpdate({
          target: gameStats.playerId,
          set: {
            totalGames: updated.totalGames,
            wins: updated.wins,
            losses: updated.losses,
            averageScore: updated.averageScore,
            bestStreak: updated.bestStreak,
            favoriteCategory: updated.favoriteCategory,
            rating: updated.rating,
            tier: updated.tier
          }
        });

      return updated;
    } catch (error) {
      console.error('Database error, using fallback:', error);
      // Fallback to memory storage
      const existing = this.fallbackStats.get(playerId) || {
        playerId,
        totalGames: 0,
        wins: 0,
        losses: 0,
        averageScore: 0,
        bestStreak: 0,
        favoriteCategory: 'general',
        rating: 1000,
        tier: 'bronze'
      };
      const updated = { ...existing, ...stats };
      this.fallbackStats.set(playerId, updated);
      return updated;
    }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const result = (await db.select().from(leaderboards).orderBy(desc(leaderboards.totalScore)).limit(100)) ?? [];
      return result.map((entry, index) => ({
        playerId: entry.playerId,
        playerName: entry.playerName,
        totalScore: entry.totalScore || 0,
        gamesWon: entry.gamesWon || 0,
        bestStreak: entry.bestStreak || 0,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Database error, using fallback:', error);
      const entries = Array.from(this.fallbackLeaderboard.values());
      return entries.sort((a, b) => b.totalScore - a.totalScore);
    }
  }

  async updateLeaderboard(playerId: string, playerName: string, score: number, gamesWon: number, bestStreak: number): Promise<void> {
    try {
      // Get existing entry so we can accumulate (not replace) scores
      const existing = await db.select().from(leaderboards).where(eq(leaderboards.playerId, playerId)).limit(1);
      const prev = existing[0];

      await db.insert(leaderboards)
        .values({
          playerId,
          playerName,
          totalScore: score,
          gamesWon,
          bestStreak,
          rank: 1
        })
        .onConflictDoUpdate({
          target: leaderboards.playerId,
          set: {
            playerName,
            totalScore: prev ? (prev.totalScore || 0) + score : score,
            gamesWon: prev ? (prev.gamesWon || 0) + gamesWon : gamesWon,
            bestStreak: prev ? Math.max(prev.bestStreak || 0, bestStreak) : bestStreak
          }
        });

      // Recalculate ranks
      const allEntries = await db.select().from(leaderboards).orderBy(desc(leaderboards.totalScore));
      for (let i = 0; i < allEntries.length; i++) {
        await db.update(leaderboards)
          .set({ rank: i + 1 })
          .where(eq(leaderboards.playerId, allEntries[i].playerId));
      }
    } catch (error) {
      console.error('Database error, using fallback:', error);
      // Fallback to memory storage
      const existing = this.fallbackLeaderboard.get(playerId);
      
      if (existing) {
        existing.totalScore = Math.max(existing.totalScore, score);
        existing.gamesWon = Math.max(existing.gamesWon, gamesWon);
        existing.bestStreak = Math.max(existing.bestStreak, bestStreak);
      } else {
        this.fallbackLeaderboard.set(playerId, {
          playerId,
          playerName,
          totalScore: score,
          gamesWon,
          bestStreak,
          rank: 1
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
