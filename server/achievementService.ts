import { db } from './storage';
import { playerAchievements } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { Player, GameRoom } from '../shared/schema';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxProgress: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockedAchievement extends AchievementDef {
  unlockedAt: Date;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first trivia game',
    icon: '🏆',
    maxProgress: 1,
    points: 50,
    rarity: 'common'
  },
  {
    id: 'perfect_game',
    name: 'Perfect Mind',
    description: 'Answer all 10 questions correctly in a single game',
    icon: '💯',
    maxProgress: 10,
    points: 200,
    rarity: 'epic'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer a question correctly in under 3 seconds',
    icon: '⚡',
    maxProgress: 1,
    points: 75,
    rarity: 'rare'
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Get a 3-question answer streak',
    icon: '🔥',
    maxProgress: 3,
    points: 30,
    rarity: 'common'
  },
  {
    id: 'streak_5',
    name: 'Hot Streak',
    description: 'Get a 5-question answer streak',
    icon: '🌋',
    maxProgress: 5,
    points: 75,
    rarity: 'rare'
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Get a 10-question answer streak — a perfect game!',
    icon: '🚀',
    maxProgress: 10,
    points: 300,
    rarity: 'legendary'
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Play 10 trivia games',
    icon: '📚',
    maxProgress: 10,
    points: 100,
    rarity: 'common'
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Score 1,000 points or more in a single game',
    icon: '💎',
    maxProgress: 1,
    points: 150,
    rarity: 'rare'
  },
  {
    id: 'pvp_champion',
    name: 'PvP Champion',
    description: 'Win a Player vs Player match',
    icon: '⚔️',
    maxProgress: 1,
    points: 100,
    rarity: 'rare'
  },
  {
    id: 'trivia_master',
    name: 'Trivia Master',
    description: 'Score 2,000+ points in a single game on hard difficulty',
    icon: '👑',
    maxProgress: 1,
    points: 500,
    rarity: 'legendary'
  },
];

export class AchievementService {

  async checkAndAwardAchievements(
    playerId: string,
    room: GameRoom,
    playerResult: Player,
    isWinner: boolean,
    correctAnswers: number,
    fastestAnswerMs?: number
  ): Promise<UnlockedAchievement[]> {
    const newlyUnlocked: UnlockedAchievement[] = [];

    try {
      const existing = await db.select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, playerId));

      const existingMap = new Map(existing.map(a => [a.achievementId, a]));
      const gamesPlayed = (existing.find(a => a.achievementId === 'knowledge_seeker')?.progress ?? 0) + 1;

      const checks: Array<{ id: string; progress: number; unlock: boolean }> = [
        // First win
        {
          id: 'first_win',
          progress: isWinner ? 1 : 0,
          unlock: isWinner
        },
        // Perfect game (all 10 correct)
        {
          id: 'perfect_game',
          progress: correctAnswers,
          unlock: correctAnswers >= 10
        },
        // Speed demon (answered under 3s — passed in from game server)
        {
          id: 'speed_demon',
          progress: fastestAnswerMs !== undefined && fastestAnswerMs < 3000 ? 1 : 0,
          unlock: fastestAnswerMs !== undefined && fastestAnswerMs < 3000
        },
        // Streaks
        {
          id: 'streak_3',
          progress: Math.min(playerResult.streak, 3),
          unlock: playerResult.streak >= 3
        },
        {
          id: 'streak_5',
          progress: Math.min(playerResult.streak, 5),
          unlock: playerResult.streak >= 5
        },
        {
          id: 'streak_10',
          progress: Math.min(playerResult.streak, 10),
          unlock: playerResult.streak >= 10
        },
        // Knowledge seeker (10 games played)
        {
          id: 'knowledge_seeker',
          progress: Math.min(gamesPlayed, 10),
          unlock: gamesPlayed >= 10
        },
        // Centurion (1000+ pts)
        {
          id: 'centurion',
          progress: playerResult.score >= 1000 ? 1 : 0,
          unlock: playerResult.score >= 1000
        },
        // PvP champion
        {
          id: 'pvp_champion',
          progress: room.mode === 'pvp' && isWinner ? 1 : 0,
          unlock: room.mode === 'pvp' && isWinner
        },
        // Trivia master (2000+ pts on hard)
        {
          id: 'trivia_master',
          progress: room.difficulty === 'hard' && playerResult.score >= 2000 ? 1 : 0,
          unlock: room.difficulty === 'hard' && playerResult.score >= 2000
        },
      ];

      for (const check of checks) {
        if (!check.unlock && check.progress === 0) continue;

        const existing_row = existingMap.get(check.id);
        const def = ACHIEVEMENTS.find(a => a.id === check.id)!;

        if (!existing_row) {
          // Create new achievement entry
          const unlocked = check.unlock;
          await db.insert(playerAchievements).values({
            playerId,
            achievementId: check.id,
            progress: check.progress,
            maxProgress: def.maxProgress,
            unlocked,
            unlockedAt: unlocked ? new Date() : undefined,
            createdAt: new Date()
          });
          if (unlocked) {
            newlyUnlocked.push({ ...def, unlockedAt: new Date() });
          }
        } else if (!existing_row.unlocked && check.unlock) {
          // Update to unlocked
          await db.update(playerAchievements)
            .set({ progress: check.progress, unlocked: true, unlockedAt: new Date() })
            .where(and(
              eq(playerAchievements.playerId, playerId),
              eq(playerAchievements.achievementId, check.id)
            ));
          newlyUnlocked.push({ ...def, unlockedAt: new Date() });
        } else if (!existing_row.unlocked && check.progress > (existing_row.progress ?? 0)) {
          // Update progress only
          await db.update(playerAchievements)
            .set({ progress: check.progress })
            .where(and(
              eq(playerAchievements.playerId, playerId),
              eq(playerAchievements.achievementId, check.id)
            ));
        }
      }
    } catch (error) {
      console.error('Achievement check error:', error);
    }

    return newlyUnlocked;
  }

  async getPlayerAchievements(playerId: string): Promise<Array<AchievementDef & { progress: number; unlocked: boolean; unlockedAt?: Date }>> {
    try {
      const rows = await db.select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, playerId));

      const rowMap = new Map(rows.map(r => [r.achievementId, r]));

      return ACHIEVEMENTS.map(def => {
        const row = rowMap.get(def.id);
        return {
          ...def,
          progress: row?.progress ?? 0,
          unlocked: row?.unlocked ?? false,
          unlockedAt: row?.unlockedAt ?? undefined
        };
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return ACHIEVEMENTS.map(def => ({ ...def, progress: 0, unlocked: false }));
    }
  }
}

export const achievementService = new AchievementService();
