import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GamePhase, Player, Question, LeaderboardEntry, GameStats } from '../../types/game';

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
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setPlayerName: (name: string) => void;
  setCurrentQuestion: (question: Question | null) => void;
  selectAnswer: (answer: number) => void;
  setTimeRemaining: (time: number) => void;
  updatePlayers: (players: Player[]) => void;
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
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
        isAnswered: false
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

    resetGame: () => set({
      phase: 'menu',
      currentQuestion: null,
      questionStartTime: null,
      timeRemaining: 0,
      selectedAnswer: null,
      isAnswered: false,
      players: []
    })
  }))
);
