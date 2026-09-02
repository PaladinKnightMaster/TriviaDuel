import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GamePhase, Player, Question, LeaderboardEntry, GameStats } from '../../types/game';

interface GameResults {
  finalScores: Player[];
  winner: Player | null;
  totalQuestions: number;
  correctAnswersPerPlayer: Record<string, number>;
  maxStreakPerPlayer: Record<string, number>;
  tournamentMatchId?: number;
  category?: string;
  difficulty?: string;
  playerAuthIds?: Record<string, string>;
}

interface TriviaState {
  phase: GamePhase;
  playerName: string;
  currentQuestion: Question | null;
  questionStartTime: number | null;
  timeRemaining: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  players: Player[];
  leaderboard: LeaderboardEntry[];
  gameStats: GameStats;
  gameResults: GameResults | null;
  questionNumber: number;
  totalQuestions: number;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setPlayerName: (name: string) => void;
  setCurrentQuestion: (question: Question | null) => void;
  selectAnswer: (answer: number) => void;
  setTimeRemaining: (time: number) => void;
  updatePlayers: (players: Player[]) => void;
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setGameResults: (results: GameResults) => void;
  resetGame: () => void;
}

export const useTrivia = create<TriviaState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'menu',
    playerName: localStorage.getItem('triviaPlayerName') || '',
    currentQuestion: null,
    questionStartTime: null,
    timeRemaining: 0,
    selectedAnswer: null,
    isAnswered: false,
    players: [],
    leaderboard: [],
    gameResults: null,
    questionNumber: 0,
    totalQuestions: 10,
    gameStats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      averageScore: 0,
      bestStreak: 0,
      favoriteCategory: 'general'
    },

    setPhase: (phase) => set({ phase }),

    setPlayerName: (name) => {
      localStorage.setItem('triviaPlayerName', name);
      set({ playerName: name });
    },

    setCurrentQuestion: (question) => {
      set({
        currentQuestion: question,
        questionStartTime: question ? Date.now() : null,
        timeRemaining: question ? question.timeLimit : 0,
        selectedAnswer: null,
        isAnswered: false,
        questionNumber: (question as any)?.questionNumber ?? get().questionNumber,
        totalQuestions: (question as any)?.totalQuestions ?? get().totalQuestions,
      });
    },

    selectAnswer: (answer) => {
      const { isAnswered } = get();
      if (!isAnswered) {
        set({ selectedAnswer: answer, isAnswered: true });
      }
    },

    setTimeRemaining: (time) => set({ timeRemaining: time }),

    updatePlayers: (players) => set({ players }),

    updateLeaderboard: (leaderboard) => set({ leaderboard }),

    setGameResults: (results) => set({ gameResults: results }),

    resetGame: () => set({
      phase: 'menu',
      currentQuestion: null,
      questionStartTime: null,
      timeRemaining: 0,
      selectedAnswer: null,
      isAnswered: false,
      players: [],
      gameResults: null,
      questionNumber: 0,
    })
  }))
);
