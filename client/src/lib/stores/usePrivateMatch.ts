import { create } from 'zustand';

export interface MatchInvite {
  fromName: string;
  roomCode: string;
}

interface PrivateMatchState {
  incomingInvite: MatchInvite | null;
  setIncomingInvite: (invite: MatchInvite | null) => void;
}

export const usePrivateMatch = create<PrivateMatchState>((set) => ({
  incomingInvite: null,
  setIncomingInvite: (invite) => set({ incomingInvite: invite }),
}));
