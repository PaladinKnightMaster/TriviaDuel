import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  totalGames: integer("total_games").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  averageScore: integer("average_score").default(0),
  bestStreak: integer("best_streak").default(0),
  favoriteCategory: text("favorite_category").default("general"),
});

export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  playerName: text("player_name").notNull(),
  totalScore: integer("total_score").default(0),
  gamesWon: integer("games_won").default(0),
  bestStreak: integer("best_streak").default(0),
  rank: integer("rank").default(1),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats);
export const insertLeaderboardSchema = createInsertSchema(leaderboards);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameStats = typeof gameStats.$inferSelect;

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;

// Game-specific types
export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  isReady: boolean;
  avatar?: string;
}

export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentQuestion?: Question;
  questionStartTime?: number;
  gameState: 'waiting' | 'playing' | 'finished';
  mode: 'pvp' | 'pve';
  category: string;
  difficulty: string;
  maxPlayers: number;
}

export interface Answer {
  playerId: string;
  questionId: string;
  selectedAnswer: number;
  timeToAnswer: number;
  isCorrect?: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalScore: number;
  gamesWon: number;
  bestStreak: number;
  rank: number;
}
