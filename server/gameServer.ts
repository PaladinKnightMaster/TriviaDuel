import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { GameLogic } from './gameLogic';
import { MatchmakingService } from './matchmaking';
import { TournamentService } from './tournamentService';
import { CustomCategoryService } from './customCategoryService';
import { storage } from './storage';
import { authService } from './authService';
import { achievementService } from './achievementService';
import { Player, Answer } from '../shared/schema';

export class GameServer {
  private io: SocketServer;
  private gameLogic: GameLogic;
  private matchmaking: MatchmakingService;
  private tournament: TournamentService;
  private customCategories: CustomCategoryService;
  private playerRooms: Map<string, string>;
  private playerNames: Map<string, string>;
  private questionTimers: Map<string, NodeJS.Timeout>;
  private advancingRooms: Set<string>;
  // Maps socket.id → persistent auth ID ('user_123') or socket.id for guests
  private socketToAuthId: Map<string, string>;

  constructor(httpServer: Server) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? (process.env.CLIENT_ORIGIN || false)
          : '*',
        methods: ['GET', 'POST']
      }
    });

    this.gameLogic = new GameLogic();
    this.matchmaking = new MatchmakingService(this.gameLogic);
    this.tournament = new TournamentService();
    this.customCategories = new CustomCategoryService();
    this.playerRooms = new Map();
    this.playerNames = new Map();
    this.questionTimers = new Map();
    this.advancingRooms = new Set();
    this.socketToAuthId = new Map();

    this.setupSocketHandlers();
  }

  // ── EMIT NEW QUESTION + START TIMER ─────────────────────────────────────
  private emitNewQuestion(roomId: string): void {
    const room = this.gameLogic.getRoom(roomId);
    if (!room?.currentQuestion) return;

    const question = room.currentQuestion;

    // Cancel any existing question timer
    this.clearQuestionTimer(roomId);

    // Broadcast question to everyone in the room
    this.io.to(roomId).emit('newQuestion', {
      ...question,
      questionNumber: room.questionIndex,
      totalQuestions: room.maxQuestions
    });

    // Start server-side question timer
    const timer = setTimeout(() => {
      this.handleQuestionTimeout(roomId);
    }, question.timeLimit * 1000);

    this.questionTimers.set(roomId, timer);
  }

  private clearQuestionTimer(roomId: string): void {
    const timer = this.questionTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(roomId);
    }
  }

  private handleQuestionTimeout(roomId: string): void {
    const room = this.gameLogic.getRoom(roomId);
    if (!room || room.gameState !== 'playing') return;

    // Apply streak resets for non-answerers
    this.gameLogic.applyQuestionTimeout(roomId);
    this.io.to(roomId).emit('playersUpdated', room.players);
    this.io.to(roomId).emit('questionTimeout');

    // Advance the game
    this.triggerAdvance(roomId);
  }

  // ── GAME ADVANCEMENT ──────────────────────────────────────────────────────
  private triggerAdvance(roomId: string): void {
    // Guard: don't double-advance
    if (this.advancingRooms.has(roomId)) return;
    this.advancingRooms.add(roomId);
    this.clearQuestionTimer(roomId);

    setTimeout(async () => {
      this.advancingRooms.delete(roomId);

      const room = this.gameLogic.getRoom(roomId);
      if (!room || room.gameState !== 'playing') return;

      if (this.gameLogic.isGameOver(roomId)) {
        await this.finishGame(roomId);
        return;
      }

      const nextQuestion = this.gameLogic.nextQuestion(roomId);
      if (!nextQuestion) {
        await this.finishGame(roomId);
        return;
      }

      // Emit new question and restart timer
      this.emitNewQuestion(roomId);

      // Schedule AI answer for PvE rooms
      if (room.mode === 'pve') {
        const humanSocketId = Array.from(this.playerRooms.entries())
          .find(([_, rid]) => rid === roomId)?.[0];
        if (humanSocketId) {
          this.scheduleAIAnswer(roomId, humanSocketId, nextQuestion.id);
        }
      }
    }, 2500); // 2.5s result display window
  }

  private async finishGame(roomId: string): Promise<void> {
    const finalRoom = this.gameLogic.endGame(roomId);
    if (!finalRoom) return;

    const winner = finalRoom.players[0];

    // Update ELO ratings for PvP
    if (finalRoom.mode === 'pvp' && finalRoom.players.filter(p => !p.id.startsWith('ai_')).length >= 2) {
      await this.updatePlayerRatings(finalRoom.players.filter(p => !p.id.startsWith('ai_')));
    }

    // Update persistent leaderboards
    await this.updateLeaderboards(finalRoom.players);

    // Check achievements for each human player
    const humanPlayers = finalRoom.players.filter(p => !p.id.startsWith('ai_'));
    for (const player of humanPlayers) {
      const authId = this.socketToAuthId.get(player.id) || player.id;
      // Only check achievements for authenticated (persistent) players
      if (!authId.startsWith('user_')) continue;
      const dbUserId = parseInt(authId.replace('user_', ''), 10);
      if (isNaN(dbUserId)) continue;

      const isWinner = player.id === winner?.id;
      const correctAnswers = finalRoom.correctAnswersPerPlayer[player.id] || 0;
      const fastestAnswerMs = finalRoom.fastestAnswerMsPerPlayer[player.id];

      try {
        const newAchievements = await achievementService.checkAndAwardAchievements(
          String(dbUserId),
          finalRoom,
          player,
          isWinner,
          correctAnswers,
          fastestAnswerMs
        );
        if (newAchievements.length > 0) {
          const playerSocket = this.io.sockets.sockets.get(player.id);
          if (playerSocket) {
            playerSocket.emit('achievementUnlocked', { achievements: newAchievements });
          }
        }
      } catch (err) {
        console.error(`Achievement check failed for ${authId}:`, err);
      }
    }

    this.io.to(roomId).emit('gameEnded', {
      finalScores: finalRoom.players,
      winner,
      totalQuestions: finalRoom.maxQuestions
    });

    console.log(`Game finished in room ${roomId}. Winner: ${winner?.name} (${winner?.score} pts)`);
  }

  // ── AI BEHAVIOR (event-driven per question) ───────────────────────────────
  private scheduleAIAnswer(roomId: string, humanSocketId: string, questionId: string): void {
    const room = this.gameLogic.getRoom(roomId);
    if (!room || room.mode !== 'pve' || room.gameState !== 'playing') return;

    const aiPlayer = room.players.find(p => p.id.startsWith('ai_'));
    const humanPlayer = room.players.find(p => p.id === humanSocketId);
    if (!aiPlayer || !room.currentQuestion) return;

    // Adaptive accuracy based on human performance
    let aiAccuracy = 0.65;
    if (humanPlayer) {
      if (humanPlayer.score > 500) aiAccuracy = 0.72;
      if (humanPlayer.score > 1000) aiAccuracy = 0.80;
      if (humanPlayer.streak >= 3) aiAccuracy = 0.85;
    }
    if (room.difficulty === 'easy') aiAccuracy = Math.min(aiAccuracy + 0.10, 0.92);
    if (room.difficulty === 'hard') aiAccuracy = Math.max(aiAccuracy - 0.12, 0.35);

    const isCorrect = Math.random() < aiAccuracy;
    const selectedAnswer = isCorrect
      ? room.currentQuestion.correctAnswer
      : Math.floor(Math.random() * room.currentQuestion.options.length);

    // AI responds 1–4 seconds after question appears.
    // Keeping this under the 2.5s result-display window ensures the AI scores
    // most of the time even when the human answers instantly.
    const delay = Math.random() * 3000 + 1000;

    setTimeout(() => {
      const currentRoom = this.gameLogic.getRoom(roomId);
      // Bail if the question has already changed (game moved on)
      if (!currentRoom?.currentQuestion || currentRoom.currentQuestion.id !== questionId) return;
      if (currentRoom.gameState !== 'playing') return;
      // Note: do NOT guard on advancingRooms here — AI should still score
      // during the 2.5 s result window. triggerAdvance has its own guard.

      const aiAnswer: Answer = {
        playerId: aiPlayer.id,
        questionId,
        selectedAnswer,
        timeToAnswer: Date.now()
      };

      const result = this.gameLogic.submitAnswer(roomId, aiAnswer);
      if (result) {
        this.io.to(roomId).emit('playersUpdated', result.room.players);
        console.log(`AI answered room ${roomId}: ${isCorrect ? '✓' : '✗'} (accuracy: ${(aiAccuracy * 100).toFixed(0)}%)`);

        // Only trigger advance if human already answered but advance hasn't started yet
        if (!this.advancingRooms.has(roomId) && this.gameLogic.allHumanPlayersAnswered(roomId)) {
          this.triggerAdvance(roomId);
        }
      }
    }, delay);
  }

  // ── SOCKET HANDLERS ───────────────────────────────────────────────────────
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      // Resolve persistent auth ID from JWT (falls back to socket.id for guests)
      const token = (socket.handshake.auth as any)?.token as string | undefined;
      let authId: string = socket.id;
      if (token) {
        const payload = authService.verifyToken(token);
        if (payload) {
          authId = `user_${payload.userId}`;
          // Pre-fill the player name from the account
          this.playerNames.set(socket.id, payload.username);
          console.log(`Authenticated socket: ${socket.id} → ${authId} (${payload.username})`);
        }
      }
      this.socketToAuthId.set(socket.id, authId);
      console.log(`Player connected: ${socket.id}${authId !== socket.id ? ` [auth: ${authId}]` : ''}`);

      socket.on('setPlayerName', (name: string) => {
        // Only update name if not already set from JWT
        if (!token) this.playerNames.set(socket.id, name);
      });

      // MATCHMAKING
      socket.on('joinMatchmaking', async ({ mode, category, difficulty }) => {
        const playerName = this.playerNames.get(socket.id) || `Player${socket.id.substr(0, 4)}`;

        const player: Player = {
          id: socket.id,
          name: playerName,
          score: 0,
          streak: 0,
          isReady: false
        };

        const roomId = await this.matchmaking.joinQueue(player, mode, category, difficulty);

        if (roomId) {
          const room = this.gameLogic.getRoom(roomId);
          if (room) {
            // Join ALL matched players to the Socket.IO room.
            // For PvP this fixes the critical bug where only the 2nd player's socket
            // was joined; the 1st player was never notified and stayed stuck in matchmaking.
            for (const roomPlayer of room.players) {
              const playerSocket = this.io.sockets.sockets.get(roomPlayer.id);
              if (playerSocket) {
                this.playerRooms.set(roomPlayer.id, roomId);
                playerSocket.join(roomId);
              }
            }

            if (mode === 'pve') {
              const aiPlayer: Player = {
                id: 'ai_' + roomId,
                name: 'AI Opponent',
                score: 0,
                streak: 0,
                isReady: true
              };
              this.gameLogic.addPlayerToRoom(roomId, aiPlayer);
              this.gameLogic.playerReady(roomId, socket.id);

              setTimeout(() => {
                let updatedRoom = this.gameLogic.getRoom(roomId);
                if (updatedRoom?.gameState !== 'playing') {
                  this.gameLogic.startGame(roomId);
                  updatedRoom = this.gameLogic.getRoom(roomId);
                }
                if (updatedRoom?.currentQuestion) {
                  socket.emit('gameStarted');
                  this.emitNewQuestion(roomId);
                  this.scheduleAIAnswer(roomId, socket.id, updatedRoom.currentQuestion.id);
                }
              }, 600);
            }

            this.io.to(roomId).emit('roomJoined', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
            console.log(`Player ${socket.id} → room ${roomId} (${mode}/${category}/${difficulty})`);
          }
        } else {
          socket.emit('matchmakingStarted');
          console.log(`Player ${socket.id} queued for ${mode} (${category}/${difficulty})`);
        }
      });

      socket.on('leaveMatchmaking', () => {
        this.matchmaking.leaveQueue(socket.id);
        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
          socket.leave(roomId);
          const room = this.gameLogic.removePlayerFromRoom(roomId, socket.id);
          this.playerRooms.delete(socket.id);
          if (room) {
            this.io.to(roomId).emit('roomUpdated', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
          }
        }
        socket.emit('roomLeft');
      });

      // READY UP (PvP)
      socket.on('playerReady', () => {
        const roomId = this.playerRooms.get(socket.id);
        if (!roomId) return;

        const room = this.gameLogic.playerReady(roomId, socket.id);
        if (room) {
          this.io.to(roomId).emit('roomUpdated', room);
          this.io.to(roomId).emit('playersUpdated', room.players);

          if (room.gameState === 'playing' && room.currentQuestion) {
            // Broadcast gameStarted + question to ALL players in room
            this.io.to(roomId).emit('gameStarted');
            this.emitNewQuestion(roomId);
          }
        }
      });

      // ANSWER SUBMISSION
      socket.on('submitAnswer', async (answerData: Answer) => {
        const roomId = this.playerRooms.get(socket.id);
        if (!roomId) return;

        // Always use socket.id as the authoritative player ID — never trust the
        // client-provided playerId which can be stale after socket reconnection.
        const canonicalAnswer: Answer = { ...answerData, playerId: socket.id };
        const result = this.gameLogic.submitAnswer(roomId, canonicalAnswer);
        if (!result) return;

        this.io.to(roomId).emit('playersUpdated', result.room.players);

        socket.emit('answerResult', {
          isCorrect: result.isCorrect,
          points: result.points,
          correctAnswer: result.room.currentQuestion?.correctAnswer
        });

        // If all human players answered, advance immediately (cancel remaining timer)
        if (this.gameLogic.allHumanPlayersAnswered(roomId)) {
          this.triggerAdvance(roomId);
        }
      });

      // TOURNAMENT EVENTS
      socket.on('createTournament', async ({ name, category, difficulty, maxPlayers, prizePool }) => {
        const tournament = await this.tournament.createTournament(name, category, difficulty, maxPlayers, prizePool);
        if (tournament) {
          socket.emit('tournamentCreated', tournament);
          this.io.emit('tournamentListUpdated');
        } else {
          socket.emit('error', 'Failed to create tournament');
        }
      });

      socket.on('joinTournament', async ({ tournamentId, playerName }) => {
        const success = await this.tournament.joinTournament(tournamentId, socket.id, playerName);
        if (success) {
          const updated = await this.tournament.getTournament(tournamentId);
          socket.emit('tournamentJoined', updated);
          socket.join(`tournament_${tournamentId}`);
          this.io.to(`tournament_${tournamentId}`).emit('tournamentUpdated', updated);
        } else {
          socket.emit('error', 'Failed to join tournament');
        }
      });

      socket.on('getTournaments', async () => {
        socket.emit('tournamentsData', await this.tournament.getActiveTournaments());
      });

      socket.on('getTournament', async ({ tournamentId }) => {
        socket.emit('tournamentData', await this.tournament.getTournament(tournamentId));
      });

      socket.on('getTournamentMatches', async ({ tournamentId, round }) => {
        const matches = await this.tournament.getTournamentMatches(tournamentId, round);
        socket.emit('tournamentMatches', { tournamentId, matches });
      });

      // CUSTOM CATEGORIES
      socket.on('createCustomCategory', async ({ name, description, isPublic }) => {
        const cat = await this.customCategories.createCategory(name, description, socket.id, isPublic);
        cat ? socket.emit('customCategoryCreated', cat) : socket.emit('error', 'Failed to create category');
      });

      socket.on('addCustomQuestion', async ({ categoryId, question, options, correctAnswer, difficulty, explanation }) => {
        const q = await this.customCategories.addQuestion(categoryId, question, options, correctAnswer, difficulty, explanation);
        q ? socket.emit('customQuestionAdded', q) : socket.emit('error', 'Failed to add question');
      });

      socket.on('getCustomCategory', async ({ categoryId, includeQuestions }) => {
        socket.emit('customCategoryData', await this.customCategories.getCategory(categoryId, includeQuestions));
      });

      socket.on('getPublicCategories', async ({ limit }) => {
        socket.emit('publicCategoriesData', await this.customCategories.getPublicCategories(limit));
      });

      socket.on('getUserCategories', async () => {
        socket.emit('userCategoriesData', await this.customCategories.getUserCategories(socket.id));
      });

      socket.on('updateCustomCategory', async ({ categoryId, updates }) => {
        const ok = await this.customCategories.updateCategory(categoryId, socket.id, updates);
        ok ? socket.emit('customCategoryUpdated', { categoryId, updates }) : socket.emit('error', 'Failed to update');
      });

      socket.on('deleteCustomCategory', async ({ categoryId }) => {
        const ok = await this.customCategories.deleteCategory(categoryId, socket.id);
        ok ? socket.emit('customCategoryDeleted', { categoryId }) : socket.emit('error', 'Failed to delete');
      });

      socket.on('rateCategory', async ({ categoryId, rating, review }) => {
        const ok = await this.customCategories.rateCategory(categoryId, socket.id, rating, review);
        ok ? socket.emit('categoryRated', { categoryId, rating }) : socket.emit('error', 'Failed to rate');
      });

      socket.on('searchCategories', async ({ searchTerm, isPublicOnly }) => {
        socket.emit('searchCategoriesResults', await this.customCategories.searchCategories(searchTerm, isPublicOnly));
      });

      // DISCONNECT
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        this.socketToAuthId.delete(socket.id);
        this.matchmaking.leaveQueue(socket.id);

        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
          const room = this.gameLogic.removePlayerFromRoom(roomId, socket.id);
          if (room) {
            this.io.to(roomId).emit('roomUpdated', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
          } else {
            // Room was deleted (no players left), clean up timer
            this.clearQuestionTimer(roomId);
          }
          this.playerRooms.delete(socket.id);
        }

        this.playerNames.delete(socket.id);
      });
    });
  }

  // ── ELO & LEADERBOARD ─────────────────────────────────────────────────────
  private async updatePlayerRatings(players: Player[]): Promise<void> {
    try {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const winner = sorted[i];
          const loser = sorted[j];
          const winnerStats = await storage.getPlayerStats(winner.id);
          const loserStats = await storage.getPlayerStats(loser.id);
          await this.matchmaking.updatePlayerRating(winner.id, true, loserStats?.rating || 1000);
          await this.matchmaking.updatePlayerRating(loser.id, false, winnerStats?.rating || 1000);
        }
      }
    } catch (error) {
      console.error('Error updating player ratings:', error);
    }
  }

  private async updateLeaderboards(players: Player[]): Promise<void> {
    try {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      for (const player of sorted) {
        if (player.id.startsWith('ai_')) continue;
        const name = this.playerNames.get(player.id) || `Player${player.id.substr(0, 4)}`;
        await storage.updateLeaderboard(player.id, name, player.score, player === sorted[0] ? 1 : 0, player.streak);
      }
    } catch (error) {
      console.error('Error updating leaderboards:', error);
    }
  }

  getServer(): SocketServer {
    return this.io;
  }
}
