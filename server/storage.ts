import { LeaderboardEntry } from '../shared/schema';

export interface SimpleGameStats {
  playerId: string;
  totalGames: number;
  wins: number;
  losses: number;
  averageScore: number;
  bestStreak: number;
  favoriteCategory: string;
}

export interface IStorage {
  getPlayerStats(playerId: string): Promise<SimpleGameStats | undefined>;
  updatePlayerStats(playerId: string, stats: Partial<SimpleGameStats>): Promise<SimpleGameStats>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  updateLeaderboard(playerId: string, playerName: string, score: number, gamesWon: number, bestStreak: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private playerStats: Map<string, SimpleGameStats>;
  private leaderboard: Map<string, LeaderboardEntry>;

  constructor() {
    this.playerStats = new Map();
    this.leaderboard = new Map();
    
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
      this.leaderboard.set(entry.playerId, {
        ...entry,
        rank: index + 1
      });
    });
  }


  async getPlayerStats(playerId: string): Promise<SimpleGameStats | undefined> {
    return this.playerStats.get(playerId);
  }

  async updatePlayerStats(playerId: string, stats: Partial<SimpleGameStats>): Promise<SimpleGameStats> {
    const existing = this.playerStats.get(playerId) || {
      playerId,
      totalGames: 0,
      wins: 0,
      losses: 0,
      averageScore: 0,
      bestStreak: 0,
      favoriteCategory: 'general'
    };

    const updated = { ...existing, ...stats };
    this.playerStats.set(playerId, updated);
    
    return updated;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboard.values());
    return entries.sort((a, b) => b.totalScore - a.totalScore);
  }

  async updateLeaderboard(playerId: string, playerName: string, score: number, gamesWon: number, bestStreak: number): Promise<void> {
    const existing = this.leaderboard.get(playerId);
    
    if (existing) {
      existing.totalScore = Math.max(existing.totalScore, score);
      existing.gamesWon = Math.max(existing.gamesWon, gamesWon);
      existing.bestStreak = Math.max(existing.bestStreak, bestStreak);
    } else {
      this.leaderboard.set(playerId, {
        playerId,
        playerName,
        totalScore: score,
        gamesWon,
        bestStreak,
        rank: 1 // Will be recalculated
      });
    }

    // Recalculate ranks
    const entries = Array.from(this.leaderboard.values()).sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }
}

export const storage = new MemStorage();
