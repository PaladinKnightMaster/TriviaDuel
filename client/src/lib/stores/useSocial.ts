import { create } from 'zustand';
import { socketClient } from '../socket';
import { PlayerProfile, Friendship } from '../../../../shared/schema';

export interface FriendEntry extends PlayerProfile {
  isOnline: boolean;
}

interface SocialState {
  friends: FriendEntry[];
  friendRequests: Friendship[];
  pendingRequestCount: number;

  setFriends: (friends: FriendEntry[]) => void;
  setFriendRequests: (requests: Friendship[]) => void;
  incrementPendingRequests: () => void;
  clearPendingRequests: () => void;
  setFriendOnlineStatus: (playerId: string, isOnline: boolean) => void;

  loadFriends: () => void;
  loadFriendRequests: () => void;
  sendFriendRequest: (targetPlayerId: string) => void;
  respondToFriendRequest: (friendshipId: number, response: 'accepted' | 'declined') => void;
}

export const useSocial = create<SocialState>((set) => ({
  friends: [],
  friendRequests: [],
  pendingRequestCount: 0,

  setFriends: (friends) => set({ friends }),

  setFriendRequests: (requests) => set({ friendRequests: requests }),

  incrementPendingRequests: () =>
    set((s) => ({ pendingRequestCount: s.pendingRequestCount + 1 })),

  clearPendingRequests: () => set({ pendingRequestCount: 0 }),

  setFriendOnlineStatus: (playerId, isOnline) =>
    set((s) => ({
      friends: s.friends.map((f) =>
        f.playerId === playerId ? { ...f, isOnline } : f
      ),
    })),

  loadFriends: () => socketClient.emit('getFriends'),

  loadFriendRequests: () => socketClient.emit('getFriendRequests'),

  sendFriendRequest: (targetPlayerId) =>
    socketClient.emit('sendFriendRequest', { targetPlayerId }),

  respondToFriendRequest: (friendshipId, response) =>
    socketClient.emit('respondToFriendRequest', { friendshipId, response }),
}));
