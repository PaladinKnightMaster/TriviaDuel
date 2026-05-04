import { GameLogic } from './gameLogic';
import { Player } from '../shared/schema';
import { storage } from './storage';

interface MatchmakingQueue {
  mode: 'pvp' | 'pve';
  category: string;
  difficulty: string;
  players: (Player & { joinTime: number; rating: number })[];
}

const RATING_RANGES = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 1499 },
  gold: { min: 1500, max: 1999 },
  platinum: { min: 2000, max: 2499 },
  diamond: { min: 2500, max: 3000 }
};

function calculateRatingChange(playerRating: number, opponentRating: number, won: boolean): number {
  const K = 32; // K-factor for Elo rating system
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = won ? 1 : 0;
  return Math.round(K * (actualScore - expectedScore));
}

function getTierFromRating(rating: number): string {
  for (const [tier, range] of Object.entries(RATING_RANGES)) {
    if (rating >= range.min && rating <= range.max) {
      return tier;
    }
  }
  return 'bronze';
}

export class MatchmakingService {
  private queues: Map<string, MatchmakingQueue>;
  private gameLogic: GameLogic;

  constructor(gameLogic: GameLogic) {
    this.queues = new Map();
    this.gameLogic = gameLogic;
  }

  async joinQueue(player: Player, mode: 'pvp' | 'pve', category: string, difficulty: string): Promise<string | null> {
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

    // Get player stats for skill-based matching
    const playerStats = await storage.getPlayerStats(player.id);
    const playerWithRating = {
      ...player,
      rating: playerStats?.rating || 1000,
      tier: playerStats?.tier || 'bronze',
      joinTime: Date.now()
    };
    
    queue.players.push(playerWithRating);

    // For PvE, immediately create a room
    if (mode === 'pve') {
      const roomId = this.createRoom(queue);
      return roomId;
    }

    // For PvP, use skill-based matchmaking
    if (mode === 'pvp' && queue.players.length >= 2) {
      const matchedPlayers = this.findSkillBasedMatch(queue.players);
      if (matchedPlayers.length >= 2) {
        // Remove matched players from queue
        matchedPlayers.forEach(matchedPlayer => {
          const index = queue.players.findIndex(p => p.id === matchedPlayer.id);
          if (index > -1) queue.players.splice(index, 1);
        });
        
        // Create room with matched players
        const roomId = this.createRoomWithPlayers(matchedPlayers, mode, category, difficulty);
        return roomId;
      }
    }

    return null; // Still waiting for more players
  }

  leaveQueue(playerId: string): void {
    for (const [queueKey, queue] of Array.from(this.queues.entries())) {
      const playerIndex = queue.players.findIndex((p: Player) => p.id === playerId);
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

  private findSkillBasedMatch(players: (Player & { joinTime: number; rating: number })[]): (Player & { joinTime: number; rating: number })[] {
    if (players.length < 2) return [];
    
    // Sort by join time to prioritize earlier players
    players.sort((a, b) => a.joinTime - b.joinTime);
    
    const matchedPlayers = [];
    const firstPlayer = players[0];
    matchedPlayers.push(firstPlayer);
    
    // Find players within rating range (±200 initially, expanding over time)
    const waitTime = Date.now() - firstPlayer.joinTime;
    const ratingRange = Math.min(200 + (waitTime / 1000) * 10, 500); // Expand range over time
    
    for (let i = 1; i < players.length && matchedPlayers.length < 4; i++) {
      const player = players[i];
      const ratingDiff = Math.abs(player.rating - firstPlayer.rating);
      
      if (ratingDiff <= ratingRange) {
        matchedPlayers.push(player);
      }
    }
    
    return matchedPlayers.length >= 2 ? matchedPlayers : [];
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
  
  private createRoomWithPlayers(players: (Player & { joinTime: number })[], mode: 'pvp' | 'pve', category: string, difficulty: string): string {
    const roomId = Math.random().toString(36).substr(2, 9);
    const room = this.gameLogic.createRoom(roomId, mode, category, difficulty);

    players.forEach(player => {
      this.gameLogic.addPlayerToRoom(roomId, {
        ...player,
        score: 0,
        streak: 0,
        isReady: false
      });
    });

    return roomId;
  }

  getQueueStatus(): Array<{key: string, playerCount: number, avgRating?: number}> {
    return Array.from(this.queues.entries()).map(([key, queue]) => ({
      key,
      playerCount: queue.players.length,
      avgRating: queue.players.length > 0 
        ? Math.round(queue.players.reduce((sum, p) => sum + (p.rating || 1000), 0) / queue.players.length)
        : undefined
    }));
  }
  
  async updatePlayerRating(playerId: string, won: boolean, opponentRating: number): Promise<void> {
    const playerStats = await storage.getPlayerStats(playerId);
    if (!playerStats) return;
    
    const ratingChange = calculateRatingChange(playerStats.rating || 1000, opponentRating, won);
    const newRating = Math.max(0, (playerStats.rating || 1000) + ratingChange);
    const newTier = getTierFromRating(newRating);
    
    await storage.updatePlayerStats(playerId, {
      ...playerStats,
      rating: newRating,
      tier: newTier,
      totalGames: (playerStats.totalGames || 0) + 1,
      wins: won ? (playerStats.wins || 0) + 1 : playerStats.wins,
      losses: !won ? (playerStats.losses || 0) + 1 : playerStats.losses
    });
  }
}
