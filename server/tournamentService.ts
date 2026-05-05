import { db } from './storage';
import { tournaments, tournamentParticipants, tournamentMatches } from '../shared/schema';
import { Tournament, TournamentParticipant, TournamentMatch } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class TournamentService {
  private activeIntervals: Map<number, NodeJS.Timeout> = new Map();

  async createTournament(
    name: string,
    category: string,
    difficulty: string,
    maxPlayers: number = 8,
    prizePool: number = 0
  ): Promise<Tournament | null> {
    try {
      const [result] = await db.insert(tournaments)
        .values({
          name,
          category,
          difficulty,
          maxPlayers,
          currentPlayers: 0,
          status: 'registration',
          prizePool,
          createdAt: new Date()
        })
        .returning();

      return {
        id: result.id,
        name: result.name,
        category: result.category,
        difficulty: result.difficulty,
        maxPlayers: result.maxPlayers || 8,
        currentPlayers: result.currentPlayers || 0,
        status: result.status as 'registration' | 'in_progress' | 'completed',
        startTime: result.startTime || undefined,
        endTime: result.endTime || undefined,
        winnerId: result.winnerId || undefined,
        prizePool: result.prizePool || 0,
        participants: []
      };
    } catch (error) {
      console.error('Error creating tournament:', error);
      return null;
    }
  }

  async joinTournament(tournamentId: number, playerId: string, playerName: string): Promise<boolean> {
    try {
      // Check if tournament exists and has space
      const [tournament] = await db.select().from(tournaments)
        .where(eq(tournaments.id, tournamentId));

      if (!tournament || tournament.status !== 'registration' || 
          (tournament.currentPlayers || 0) >= (tournament.maxPlayers || 8)) {
        return false;
      }

      // Check if player already joined
      const existing = await db.select().from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, playerId)
        ));

      if (existing.length > 0) {
        return false; // Already joined
      }

      // Add participant
      await db.insert(tournamentParticipants)
        .values({
          tournamentId,
          playerId,
          playerName,
          currentRound: 0,
          eliminated: false,
          joinedAt: new Date()
        });

      // Update tournament player count
      await db.update(tournaments)
        .set({ 
          currentPlayers: (tournament.currentPlayers || 0) + 1 
        })
        .where(eq(tournaments.id, tournamentId));

      // Check if tournament is full and should start
      if ((tournament.currentPlayers || 0) + 1 >= (tournament.maxPlayers || 8)) {
        await this.startTournament(tournamentId);
      }

      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      return false;
    }
  }

  async getTournament(tournamentId: number): Promise<Tournament | null> {
    try {
      const [tournament] = await db.select().from(tournaments)
        .where(eq(tournaments.id, tournamentId));

      if (!tournament) return null;

      const participants = await db.select().from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId));

      return {
        id: tournament.id,
        name: tournament.name,
        category: tournament.category,
        difficulty: tournament.difficulty,
        maxPlayers: tournament.maxPlayers || 8,
        currentPlayers: tournament.currentPlayers || 0,
        status: tournament.status as 'registration' | 'in_progress' | 'completed',
        startTime: tournament.startTime || undefined,
        endTime: tournament.endTime || undefined,
        winnerId: tournament.winnerId || undefined,
        prizePool: tournament.prizePool || 0,
        participants: participants.map((p: any) => ({
          id: p.id,
          tournamentId: p.tournamentId,
          playerId: p.playerId,
          playerName: p.playerName,
          seed: p.seed || undefined,
          currentRound: p.currentRound || 0,
          eliminated: p.eliminated || false
        }))
      };
    } catch (error) {
      console.error('Error getting tournament:', error);
      return null;
    }
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const activeTournaments = await db.select().from(tournaments)
        .where(eq(tournaments.status, 'registration'))
        .orderBy(desc(tournaments.createdAt));

      const result: Tournament[] = [];
      
      for (const tournament of activeTournaments) {
        const participants = await db.select().from(tournamentParticipants)
          .where(eq(tournamentParticipants.tournamentId, tournament.id));

        result.push({
          id: tournament.id,
          name: tournament.name,
          category: tournament.category,
          difficulty: tournament.difficulty,
          maxPlayers: tournament.maxPlayers || 8,
          currentPlayers: tournament.currentPlayers || 0,
          status: tournament.status as 'registration' | 'in_progress' | 'completed',
          startTime: tournament.startTime || undefined,
          endTime: tournament.endTime || undefined,
          winnerId: tournament.winnerId || undefined,
          prizePool: tournament.prizePool || 0,
          participants: participants.map((p: any) => ({
            id: p.id,
            tournamentId: p.tournamentId,
            playerId: p.playerId,
            playerName: p.playerName,
            seed: p.seed || undefined,
            currentRound: p.currentRound || 0,
            eliminated: p.eliminated || false
          }))
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting active tournaments:', error);
      return [];
    }
  }

  async startTournament(tournamentId: number): Promise<void> {
    try {
      // Update tournament status
      await db.update(tournaments)
        .set({ 
          status: 'in_progress',
          startTime: new Date()
        })
        .where(eq(tournaments.id, tournamentId));

      // Generate tournament bracket
      await this.generateBracket(tournamentId);
      
      console.log(`Tournament ${tournamentId} started!`);
    } catch (error) {
      console.error('Error starting tournament:', error);
    }
  }

  private async generateBracket(tournamentId: number): Promise<void> {
    try {
      const participants = await db.select().from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId));

      // Assign random seeds
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffled.length; i++) {
        await db.update(tournamentParticipants)
          .set({ seed: i + 1 })
          .where(eq(tournamentParticipants.id, shuffled[i].id));
      }

      // Generate first round matches
      const matches: Array<{
        tournamentId: number;
        round: number;
        matchNumber: number;
        player1Id: string;
        player2Id: string;
        status: string;
      }> = [];

      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          matches.push({
            tournamentId,
            round: 1,
            matchNumber: Math.floor(i / 2) + 1,
            player1Id: shuffled[i].playerId,
            player2Id: shuffled[i + 1].playerId,
            status: 'pending'
          });
        }
      }

      if (matches.length > 0) {
        await db.insert(tournamentMatches).values(matches);
      }

      console.log(`Generated ${matches.length} first round matches for tournament ${tournamentId}`);
    } catch (error) {
      console.error('Error generating bracket:', error);
    }
  }

  async getMatch(matchId: number): Promise<TournamentMatch | null> {
    try {
      const [match] = await db.select().from(tournamentMatches).where(eq(tournamentMatches.id, matchId));
      if (!match) return null;
      return {
        id: match.id,
        tournamentId: match.tournamentId,
        round: match.round,
        matchNumber: match.matchNumber,
        player1Id: match.player1Id || undefined,
        player2Id: match.player2Id || undefined,
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        winnerId: match.winnerId || undefined,
        status: match.status as 'pending' | 'in_progress' | 'completed',
        roomId: match.roomId || undefined
      };
    } catch (error) {
      console.error('Error getting match:', error);
      return null;
    }
  }

  async updateMatchRoom(matchId: number, roomId: string): Promise<void> {
    try {
      await db.update(tournamentMatches)
        .set({ roomId, status: 'in_progress', startedAt: new Date() })
        .where(eq(tournamentMatches.id, matchId));
    } catch (error) {
      console.error('Error updating match room:', error);
    }
  }

  async getAllTournaments(): Promise<Tournament[]> {
    try {
      const all = await db.select().from(tournaments)
        .orderBy(desc(tournaments.createdAt));

      const result: Tournament[] = [];
      for (const t of all) {
        const participants = await db.select().from(tournamentParticipants)
          .where(eq(tournamentParticipants.tournamentId, t.id));
        result.push({
          id: t.id, name: t.name, category: t.category, difficulty: t.difficulty,
          maxPlayers: t.maxPlayers || 8, currentPlayers: t.currentPlayers || 0,
          status: t.status as 'registration' | 'in_progress' | 'completed',
          startTime: t.startTime || undefined, endTime: t.endTime || undefined,
          winnerId: t.winnerId || undefined, prizePool: t.prizePool || 0,
          participants: participants.map((p: any) => ({
            id: p.id, tournamentId: p.tournamentId, playerId: p.playerId,
            playerName: p.playerName, seed: p.seed || undefined,
            currentRound: p.currentRound || 0, eliminated: p.eliminated || false
          }))
        });
      }
      return result;
    } catch (error) {
      console.error('Error getting all tournaments:', error);
      return [];
    }
  }

  async getPendingMatches(tournamentId: number): Promise<TournamentMatch[]> {
    try {
      const matches = await db.select().from(tournamentMatches)
        .where(and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.status, 'pending')
        ));
      return matches.map((m: any) => ({
        id: m.id, tournamentId: m.tournamentId, round: m.round,
        matchNumber: m.matchNumber, player1Id: m.player1Id || undefined,
        player2Id: m.player2Id || undefined, player1Score: m.player1Score || 0,
        player2Score: m.player2Score || 0, winnerId: m.winnerId || undefined,
        status: m.status as 'pending' | 'in_progress' | 'completed',
        roomId: m.roomId || undefined
      }));
    } catch (error) {
      console.error('Error getting pending matches:', error);
      return [];
    }
  }

  async getTournamentMatches(tournamentId: number, round?: number): Promise<TournamentMatch[]> {
    try {
      const matches = round 
        ? await db.select().from(tournamentMatches)
            .where(and(
              eq(tournamentMatches.tournamentId, tournamentId),
              eq(tournamentMatches.round, round)
            ))
        : await db.select().from(tournamentMatches)
            .where(eq(tournamentMatches.tournamentId, tournamentId));

      return matches.map((match: any) => ({
        id: match.id,
        tournamentId: match.tournamentId,
        round: match.round,
        matchNumber: match.matchNumber,
        player1Id: match.player1Id || undefined,
        player2Id: match.player2Id || undefined,
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        winnerId: match.winnerId || undefined,
        status: match.status as 'pending' | 'in_progress' | 'completed',
        roomId: match.roomId || undefined
      }));
    } catch (error) {
      console.error('Error getting tournament matches:', error);
      return [];
    }
  }

  async updateMatchResult(matchId: number, winnerId: string, player1Score: number, player2Score: number): Promise<void> {
    try {
      // Update match result
      await db.update(tournamentMatches)
        .set({
          winnerId,
          player1Score,
          player2Score,
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(tournamentMatches.id, matchId));

      // Get match details to advance tournament
      const [match] = await db.select().from(tournamentMatches)
        .where(eq(tournamentMatches.id, matchId));

      if (match) {
        await this.advanceTournament(match.tournamentId, match.round);
      }
    } catch (error) {
      console.error('Error updating match result:', error);
    }
  }

  private async advanceTournament(tournamentId: number, completedRound: number): Promise<void> {
    try {
      // Check if all matches in this round are completed
      const roundMatches = await db.select().from(tournamentMatches)
        .where(and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.round, completedRound)
        ));

      const allCompleted = roundMatches.every((match: any) => match.status === 'completed');
      
      if (!allCompleted) return;

      // Get winners from this round
      const winners = roundMatches
        .filter((match: any) => match.winnerId)
        .map((match: any) => match.winnerId!);

      if (winners.length === 1) {
        // Tournament completed!
        await db.update(tournaments)
          .set({
            status: 'completed',
            winnerId: winners[0],
            endTime: new Date()
          })
          .where(eq(tournaments.id, tournamentId));

        console.log(`Tournament ${tournamentId} completed! Winner: ${winners[0]}`);
      } else if (winners.length > 1) {
        // Generate next round matches
        const nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            nextRoundMatches.push({
              tournamentId,
              round: completedRound + 1,
              matchNumber: Math.floor(i / 2) + 1,
              player1Id: winners[i],
              player2Id: winners[i + 1],
              status: 'pending'
            });
          }
        }

        if (nextRoundMatches.length > 0) {
          await db.insert(tournamentMatches).values(nextRoundMatches);
          console.log(`Generated ${nextRoundMatches.length} matches for round ${completedRound + 1}`);
        }
      }
    } catch (error) {
      console.error('Error advancing tournament:', error);
    }
  }
}