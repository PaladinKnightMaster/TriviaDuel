import { GameLogic } from './gameLogic';
import { Player } from '../shared/schema';

interface MatchmakingQueue {
  mode: 'pvp' | 'pve';
  category: string;
  difficulty: string;
  players: Player[];
}

export class MatchmakingService {
  private queues: Map<string, MatchmakingQueue>;
  private gameLogic: GameLogic;

  constructor(gameLogic: GameLogic) {
    this.queues = new Map();
    this.gameLogic = gameLogic;
  }

  joinQueue(player: Player, mode: 'pvp' | 'pve', category: string, difficulty: string): string | null {
    const queueKey = `${mode}_${category}_${difficulty}`;
    
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, {
        mode,
        category,
        difficulty,
        players: []
      });
    }

    const queue = this.queues.get(queueKey)!;
    
    // Check if player is already in queue
    if (queue.players.find(p => p.id === player.id)) {
      return null;
    }

    queue.players.push(player);

    // For PvE, immediately create a room
    if (mode === 'pve') {
      const roomId = this.createRoom(queue);
      return roomId;
    }

    // For PvP, wait for at least 2 players
    if (mode === 'pvp' && queue.players.length >= 2) {
      const roomId = this.createRoom(queue);
      return roomId;
    }

    return null; // Still waiting for more players
  }

  leaveQueue(playerId: string): void {
    for (const [queueKey, queue] of this.queues) {
      const playerIndex = queue.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        queue.players.splice(playerIndex, 1);
        
        // Clean up empty queues
        if (queue.players.length === 0) {
          this.queues.delete(queueKey);
        }
        break;
      }
    }
  }

  private createRoom(queue: MatchmakingQueue): string {
    const roomId = Math.random().toString(36).substr(2, 9);
    const room = this.gameLogic.createRoom(roomId, queue.mode, queue.category, queue.difficulty);

    // Add players to room
    const playersToMatch = queue.mode === 'pvp' ? 
      queue.players.splice(0, Math.min(4, queue.players.length)) : 
      queue.players.splice(0, 1);

    playersToMatch.forEach(player => {
      this.gameLogic.addPlayerToRoom(roomId, {
        ...player,
        score: 0,
        streak: 0,
        isReady: false
      });
    });

    return roomId;
  }

  getQueueStatus(): Array<{key: string, playerCount: number}> {
    return Array.from(this.queues.entries()).map(([key, queue]) => ({
      key,
      playerCount: queue.players.length
    }));
  }
}
