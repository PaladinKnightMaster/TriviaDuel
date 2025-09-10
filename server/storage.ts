import { users, gameStats, leaderboards, type User, type InsertUser, type GameStats, type InsertGameStats, type Leaderboard, type InsertLeaderboard } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPlayerStats(playerId: string): Promise<GameStats | undefined>;
  updatePlayerStats(playerId: string, stats: Partial<GameStats>): Promise<GameStats>;
  getLeaderboard(): Promise<Leaderboard[]>;
  updateLeaderboard(playerId: string, score: number, gamesWon: number, bestStreak: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playerStats: Map<string, GameStats>;
  private leaderboard: Map<string, Leaderboard>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.playerStats = new Map();
    this.leaderboard = new Map();
    this.currentId = 1;
    
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

    sampleLeaderboard.forEach(entry => {
      this.leaderboard.set(entry.playerId, entry);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPlayerStats(playerId: string): Promise<GameStats | undefined> {
    return this.playerStats.get(playerId);
  }

  async updatePlayerStats(playerId: string, stats: Partial<GameStats>): Promise<GameStats> {
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

  async getLeaderboard(): Promise<Leaderboard[]> {
    const entries = Array.from(this.leaderboard.values());
    return entries.sort((a, b) => b.totalScore - a.totalScore);
  }

  async updateLeaderboard(playerId: string, score: number, gamesWon: number, bestStreak: number): Promise<void> {
    const existing = this.leaderboard.get(playerId);
    
    if (existing) {
      existing.totalScore = Math.max(existing.totalScore, score);
      existing.gamesWon = Math.max(existing.gamesWon, gamesWon);
      existing.bestStreak = Math.max(existing.bestStreak, bestStreak);
    } else {
      // Get player name from users or use default
      const playerName = `Player${playerId.substr(0, 6)}`;
      
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
