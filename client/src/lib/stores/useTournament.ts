import { create } from 'zustand';
import { socketClient } from '../socket';
import { Tournament, TournamentMatch } from '../../../../shared/schema';

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  bracketMatches: TournamentMatch[];
  pendingMatchId: number | null;
  pendingRoomId: string | null;
  isLoading: boolean;

  setTournaments: (t: Tournament[]) => void;
  setCurrentTournament: (t: Tournament | null) => void;
  setBracketMatches: (m: TournamentMatch[]) => void;
  setPendingMatch: (matchId: number | null, roomId: string | null) => void;
  setLoading: (v: boolean) => void;
  clearTournament: () => void;

  fetchTournaments: () => void;
  createTournament: (name: string, category: string, difficulty: string, maxPlayers: number, prizePool: number) => void;
  joinTournament: (tournamentId: number, playerName: string) => void;
  joinTournamentMatch: (matchId: number) => void;
  refreshBracket: (tournamentId: number) => void;
}

export const useTournament = create<TournamentState>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  bracketMatches: [],
  pendingMatchId: null,
  pendingRoomId: null,
  isLoading: false,

  setTournaments: (tournaments) => set({ tournaments }),
  setCurrentTournament: (currentTournament) => set({ currentTournament }),
  setBracketMatches: (bracketMatches) => set({ bracketMatches }),
  setPendingMatch: (pendingMatchId, pendingRoomId) => set({ pendingMatchId, pendingRoomId }),
  setLoading: (isLoading) => set({ isLoading }),
  clearTournament: () => set({
    currentTournament: null,
    bracketMatches: [],
    pendingMatchId: null,
    pendingRoomId: null,
  }),

  fetchTournaments: () => {
    socketClient.emit('getTournaments');
  },

  createTournament: (name, category, difficulty, maxPlayers, prizePool) => {
    socketClient.emit('createTournament', { name, category, difficulty, maxPlayers, prizePool });
  },

  joinTournament: (tournamentId, playerName) => {
    socketClient.emit('joinTournament', { tournamentId, playerName });
  },

  joinTournamentMatch: (matchId) => {
    socketClient.emit('joinTournamentMatch', { matchId });
  },

  refreshBracket: (tournamentId) => {
    socketClient.emit('getTournamentMatches', { tournamentId });
    socketClient.emit('getTournament', { tournamentId });
  },
}));
