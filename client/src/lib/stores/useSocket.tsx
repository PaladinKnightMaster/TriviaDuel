import { create } from 'zustand';
import { socketClient } from '../socket';
import { Player, GameRoom, Question, Answer } from '../../types/game';

interface SocketState {
  isConnected: boolean;
  playerId: string | null;
  currentRoom: GameRoom | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinMatchmaking: (mode: 'pvp' | 'pve', category: string, difficulty: string) => void;
  leaveMatchmaking: () => void;
  answerQuestion: (questionId: string, selectedAnswer: number) => void;
  readyUp: () => void;
}

export const useSocket = create<SocketState>((set, get) => ({
  isConnected: false,
  playerId: null,
  currentRoom: null,

  connect: () => {
    const socket = socketClient.connect();
    
    socket.on('connect', () => {
      set({ isConnected: true, playerId: socket.id });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, playerId: null, currentRoom: null });
    });

    socket.on('roomJoined', (room: GameRoom) => {
      set({ currentRoom: room });
    });

    socket.on('roomUpdated', (room: GameRoom) => {
      set({ currentRoom: room });
    });

    socket.on('roomLeft', () => {
      set({ currentRoom: null });
    });
  },

  disconnect: () => {
    socketClient.disconnect();
    set({ isConnected: false, playerId: null, currentRoom: null });
  },

  joinMatchmaking: (mode, category, difficulty) => {
    socketClient.emit('joinMatchmaking', { mode, category, difficulty });
  },

  leaveMatchmaking: () => {
    socketClient.emit('leaveMatchmaking');
    set({ currentRoom: null });
  },

  answerQuestion: (questionId, selectedAnswer) => {
    const { playerId } = get();
    if (playerId) {
      socketClient.emit('submitAnswer', {
        playerId,
        questionId,
        selectedAnswer,
        timeToAnswer: Date.now()
      });
    }
  },

  readyUp: () => {
    socketClient.emit('playerReady');
  }
}));
