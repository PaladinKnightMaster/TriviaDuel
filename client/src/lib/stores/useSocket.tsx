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
  setPlayerName: (name: string) => void;
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
    socketClient.connect();

    // Register via socketClient.on() so these handlers are stored in the
    // listeners map and automatically re-attached after every reconnect.
    socketClient.on('connect', () => {
      set({ isConnected: true, playerId: socketClient.id || null });
    });

    socketClient.on('disconnect', () => {
      set({ isConnected: false, playerId: null, currentRoom: null });
    });

    socketClient.on('roomJoined', (room: GameRoom) => {
      set({ currentRoom: room });
    });

    socketClient.on('roomUpdated', (room: GameRoom) => {
      set({ currentRoom: room });
    });

    socketClient.on('roomLeft', () => {
      set({ currentRoom: null });
    });
  },

  disconnect: () => {
    socketClient.disconnect();
    set({ isConnected: false, playerId: null, currentRoom: null });
  },

  setPlayerName: (name) => {
    socketClient.emit('setPlayerName', name);
  },

  joinMatchmaking: (mode, category, difficulty) => {
    socketClient.emit('joinMatchmaking', { mode, category, difficulty });
  },

  leaveMatchmaking: () => {
    socketClient.emit('leaveMatchmaking');
    set({ currentRoom: null });
  },

  answerQuestion: (questionId, selectedAnswer) => {
    // Always use the live socket.id — never the potentially-stale store value.
    const currentId = socketClient.id;
    if (currentId) {
      socketClient.emit('submitAnswer', {
        playerId: currentId,
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
