import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Changed from plaintext password
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  totalGames: integer("total_games").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  averageScore: integer("average_score").default(0),
  bestStreak: integer("best_streak").default(0),
  favoriteCategory: text("favorite_category").default("general"),
  rating: integer("rating").default(1000),
  tier: text("tier").default("bronze"),
});

export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  playerName: text("player_name").notNull(),
  totalScore: integer("total_score").default(0),
  gamesWon: integer("games_won").default(0),
  bestStreak: integer("best_streak").default(0),
  rank: integer("rank").default(1),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true,
});

// Tournament tables
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  maxPlayers: integer("max_players").default(8),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("registration"), // registration, in_progress, completed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  winnerId: text("winner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  prizePool: integer("prize_pool").default(0)
});

export const tournamentParticipants = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  playerId: text("player_id").notNull(),
  playerName: text("player_name").notNull(),
  seed: integer("seed"),
  currentRound: integer("current_round").default(0),
  eliminated: boolean("eliminated").default(false),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const tournamentMatches = pgTable("tournament_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  player1Id: text("player1_id"),
  player2Id: text("player2_id"),
  player1Score: integer("player1_score").default(0),
  player2Score: integer("player2_score").default(0),
  winnerId: text("winner_id"),
  status: text("status").default("pending"), // pending, in_progress, completed
  roomId: text("room_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at")
});

// Custom Categories tables
export const customCategories = pgTable("custom_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isPublic: boolean("is_public").default(false),
  questionCount: integer("question_count").default(0),
  plays: integer("plays").default(0),
  rating: integer("rating").default(0) // Average rating out of 5 stars
});

export const customQuestions = pgTable("custom_questions", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  question: text("question").notNull(),
  option1: text("option1").notNull(),
  option2: text("option2").notNull(),
  option3: text("option3").notNull(),
  option4: text("option4").notNull(),
  correctAnswer: integer("correct_answer").notNull(), // 0-3 index
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  createdAt: timestamp("created_at").defaultNow(),
  explanation: text("explanation")
});

export const categoryRatings = pgTable("category_ratings", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  playerId: text("player_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow()
});

// Social Features tables
export const playerProfiles = pgTable("player_profiles", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  location: text("location"),
  favoriteCategories: text("favorite_categories"), // JSON array of category names
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  addresseeId: text("addressee_id").notNull(),
  status: text("status").default("pending"), // pending, accepted, declined, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const playerMessages = pgTable("player_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const gameInvites = pgTable("game_invites", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  gameMode: text("game_mode").notNull(), // pvp, pve, tournament
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  message: text("message"),
  status: text("status").default("pending"), // pending, accepted, declined, expired
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Achievement system tables
export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  achievementId: text("achievement_id").notNull(),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").notNull(),
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow()
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
  rating?: number;
  tier?: string;
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
  questionIndex: number;
  maxQuestions: number;
  currentQuestionAnswers: Record<string, boolean>;
  correctAnswersPerPlayer: Record<string, number>;
  fastestAnswerMsPerPlayer: Record<string, number>;
  maxStreakPerPlayer: Record<string, number>;
  tournamentMatchId?: number;
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
  rating?: number;
  tier?: string;
}

// Tournament interfaces
export interface Tournament {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'registration' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  winnerId?: string;
  prizePool: number;
  participants: TournamentParticipant[];
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number;
  playerId: string;
  playerName: string;
  seed?: number;
  currentRound: number;
  eliminated: boolean;
}

export interface TournamentMatch {
  id: number;
  tournamentId: number;
  round: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  roomId?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'social' | 'progression';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

// Custom Category interfaces
export interface CustomCategory {
  id: number;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  questionCount: number;
  plays: number;
  rating: number;
  questions?: CustomQuestion[];
}

export interface CustomQuestion {
  id: number;
  categoryId: number;
  question: string;
  options: string[]; // [option1, option2, option3, option4]
  correctAnswer: number; // 0-3 index
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface CategoryRating {
  id: number;
  categoryId: number;
  playerId: string;
  rating: number; // 1-5 stars
  review?: string;
  createdAt: Date;
}

// Social Features interfaces
export interface PlayerProfile {
  id: number;
  playerId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  favoriteCategories: string[];
  isPublic: boolean;
  stats?: {
    totalGames: number;
    wins: number;
    winRate: number;
    bestStreak: number;
    rating: number;
    tier: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: number;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  requesterProfile?: PlayerProfile;
  addresseeProfile?: PlayerProfile;
}

export interface PlayerMessage {
  id: number;
  senderId: string;
  recipientId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  senderProfile?: PlayerProfile;
}

export interface GameInvite {
  id: number;
  senderId: string;
  recipientId: string;
  gameMode: 'pvp' | 'pve' | 'tournament';
  category: string;
  difficulty: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt?: Date;
  createdAt: Date;
  senderProfile?: PlayerProfile;
}

// Enhanced Achievement interface
export interface PlayerAchievement {
  id: number;
  playerId: string;
  achievementId: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
  achievement?: AchievementDefinition;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'social' | 'progression' | 'special';
  maxProgress: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
