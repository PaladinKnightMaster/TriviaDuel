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
  isPrivate?: boolean;
  privateCode?: string;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  averageScore: number;
  bestStreak: number;
  favoriteCategory: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalScore: number;
  gamesWon: number;
  bestStreak: number;
  rank: number;
}

export type GamePhase = 'menu' | 'matchmaking' | 'playing' | 'results' | 'tournament';

export interface Answer {
  playerId: string;
  questionId: string;
  selectedAnswer: number;
  timeToAnswer: number;
  isCorrect: boolean;
}
