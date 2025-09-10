import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { GameLogic } from './gameLogic';
import { MatchmakingService } from './matchmaking';
import { TournamentService } from './tournamentService';
import { CustomCategoryService } from './customCategoryService';
import { storage } from './storage';
import { Player, Answer } from '../shared/schema';

export class GameServer {
  private io: SocketServer;
  private gameLogic: GameLogic;
  private matchmaking: MatchmakingService;
  private tournament: TournamentService;
  private customCategories: CustomCategoryService;
  private playerRooms: Map<string, string>; // playerId -> roomId
  private playerNames: Map<string, string>; // playerId -> playerName

  constructor(httpServer: Server) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.gameLogic = new GameLogic();
    this.matchmaking = new MatchmakingService(this.gameLogic);
    this.tournament = new TournamentService();
    this.customCategories = new CustomCategoryService();
    this.playerRooms = new Map();
    this.playerNames = new Map();

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);

      // Set player name
      socket.on('setPlayerName', (name: string) => {
        this.playerNames.set(socket.id, name);
        console.log(`Player ${socket.id} set name to: ${name}`);
      });

      // Join matchmaking
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
          // Player was matched to a room
          this.playerRooms.set(socket.id, roomId);
          socket.join(roomId);
          
          const room = this.gameLogic.getRoom(roomId);
          if (room) {
            // For PvE mode, add AI opponent and auto-ready the player
            if (mode === 'pve') {
              console.log(`Setting up PvE game for room ${roomId}`);
              const aiPlayer: Player = {
                id: 'ai_' + roomId,
                name: 'AI Opponent',
                score: 0,
                streak: 0,
                isReady: true
              };
              this.gameLogic.addPlayerToRoom(roomId, aiPlayer);
              console.log(`AI player added to room ${roomId}`);
              
              // Auto-ready the human player for PvE
              const readyRoom = this.gameLogic.playerReady(roomId, socket.id);
              console.log(`Player ready status set, game state: ${readyRoom?.gameState}`);
              
              // Start game immediately for PvE
              setTimeout(() => {
                const updatedRoom = this.gameLogic.getRoom(roomId);
                console.log(`Checking PvE game start - State: ${updatedRoom?.gameState}, Question: ${updatedRoom?.currentQuestion ? 'Yes' : 'No'}`);
                if (updatedRoom && updatedRoom.gameState === 'playing' && updatedRoom.currentQuestion) {
                  console.log(`Starting PvE game for ${socket.id}`);
                  socket.emit('gameStarted');
                  socket.emit('newQuestion', updatedRoom.currentQuestion);
                  
                  // Start AI opponent behavior
                  this.startAIBehavior(roomId, socket.id);
                } else {
                  console.log(`PvE game not ready - manually starting game`);
                  // Force start the game if it didn't start automatically
                  this.gameLogic.startGame(roomId);
                  const finalRoom = this.gameLogic.getRoom(roomId);
                  if (finalRoom?.currentQuestion) {
                    socket.emit('gameStarted');
                    socket.emit('newQuestion', finalRoom.currentQuestion);
                    console.log(`PvE game force started for ${socket.id}`);
                    
                    // Start AI opponent behavior
                    this.startAIBehavior(roomId, socket.id);
                  }
                }
              }, 1500);
            }
            
            this.io.to(roomId).emit('roomJoined', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
            console.log(`Player ${socket.id} joined room ${roomId} (${mode} mode)`);
          }
        } else {
          socket.emit('matchmakingStarted');
          console.log(`Player ${socket.id} added to matchmaking queue`);
        }
      });

      // Leave matchmaking
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
        console.log(`Player ${socket.id} left matchmaking`);
      });

      // Player ready
      socket.on('playerReady', () => {
        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
          const room = this.gameLogic.playerReady(roomId, socket.id);
          if (room) {
            this.io.to(roomId).emit('roomUpdated', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
            
            if (room.gameState === 'playing' && room.currentQuestion) {
              this.io.to(roomId).emit('gameStarted');
              this.io.to(roomId).emit('newQuestion', room.currentQuestion);
            }
          }
        }
      });

      // Submit answer
      socket.on('submitAnswer', (answerData: Answer) => {
        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
          const result = this.gameLogic.submitAnswer(roomId, answerData);
          if (result) {
            // Notify room of updated scores
            this.io.to(roomId).emit('playersUpdated', result.room.players);
            
            // Send feedback to the player
            socket.emit('answerResult', {
              isCorrect: result.isCorrect,
              points: result.points,
              correctAnswer: result.room.currentQuestion?.correctAnswer
            });

            // Check if all players have answered
            const allAnswered = this.checkAllPlayersAnswered(roomId);
            if (allAnswered) {
              // Move to next question after showing results
              setTimeout(async () => {
                const nextQuestion = this.gameLogic.nextQuestion(roomId);
                if (nextQuestion) {
                  this.io.to(roomId).emit('newQuestion', nextQuestion);
                } else {
                  // End game
                  const finalRoom = this.gameLogic.endGame(roomId);
                  if (finalRoom) {
                    // Update player ratings for PvP games
                    if (finalRoom.mode === 'pvp' && finalRoom.players.length >= 2) {
                      await this.updatePlayerRatings(finalRoom.players);
                    }
                    
                    // Update leaderboards for all players
                    await this.updateLeaderboards(finalRoom.players);
                    
                    this.io.to(roomId).emit('gameEnded', {
                      finalScores: finalRoom.players,
                      winner: finalRoom.players[0]
                    });
                  }
                }
              }, 3000);
            }
          }
        }
      });

      // Tournament events
      socket.on('createTournament', async ({ name, category, difficulty, maxPlayers, prizePool }) => {
        console.log(`Player ${socket.id} creating tournament: ${name}`);
        const tournament = await this.tournament.createTournament(name, category, difficulty, maxPlayers, prizePool);
        if (tournament) {
          socket.emit('tournamentCreated', tournament);
          this.io.emit('tournamentListUpdated'); // Notify all clients to refresh tournament list
        } else {
          socket.emit('error', 'Failed to create tournament');
        }
      });

      socket.on('joinTournament', async ({ tournamentId, playerName }) => {
        console.log(`Player ${socket.id} joining tournament: ${tournamentId}`);
        const success = await this.tournament.joinTournament(tournamentId, socket.id, playerName);
        if (success) {
          const updatedTournament = await this.tournament.getTournament(tournamentId);
          socket.emit('tournamentJoined', updatedTournament);
          socket.join(`tournament_${tournamentId}`);
          this.io.to(`tournament_${tournamentId}`).emit('tournamentUpdated', updatedTournament);
        } else {
          socket.emit('error', 'Failed to join tournament');
        }
      });

      socket.on('getTournaments', async () => {
        const tournaments = await this.tournament.getActiveTournaments();
        socket.emit('tournamentsData', tournaments);
      });

      socket.on('getTournament', async ({ tournamentId }) => {
        const tournament = await this.tournament.getTournament(tournamentId);
        socket.emit('tournamentData', tournament);
      });

      socket.on('getTournamentMatches', async ({ tournamentId, round }) => {
        const matches = await this.tournament.getTournamentMatches(tournamentId, round);
        socket.emit('tournamentMatches', { tournamentId, matches });
      });

      // Custom Category events
      socket.on('createCustomCategory', async ({ name, description, isPublic }) => {
        const category = await this.customCategories.createCategory(name, description, socket.id, isPublic);
        if (category) {
          socket.emit('customCategoryCreated', category);
        } else {
          socket.emit('error', 'Failed to create custom category');
        }
      });

      socket.on('addCustomQuestion', async ({ categoryId, question, options, correctAnswer, difficulty, explanation }) => {
        const addedQuestion = await this.customCategories.addQuestion(categoryId, question, options, correctAnswer, difficulty, explanation);
        if (addedQuestion) {
          socket.emit('customQuestionAdded', addedQuestion);
        } else {
          socket.emit('error', 'Failed to add question to category');
        }
      });

      socket.on('getCustomCategory', async ({ categoryId, includeQuestions }) => {
        const category = await this.customCategories.getCategory(categoryId, includeQuestions);
        socket.emit('customCategoryData', category);
      });

      socket.on('getPublicCategories', async ({ limit }) => {
        const categories = await this.customCategories.getPublicCategories(limit);
        socket.emit('publicCategoriesData', categories);
      });

      socket.on('getUserCategories', async () => {
        const categories = await this.customCategories.getUserCategories(socket.id);
        socket.emit('userCategoriesData', categories);
      });

      socket.on('updateCustomCategory', async ({ categoryId, updates }) => {
        const success = await this.customCategories.updateCategory(categoryId, socket.id, updates);
        if (success) {
          socket.emit('customCategoryUpdated', { categoryId, updates });
        } else {
          socket.emit('error', 'Failed to update category');
        }
      });

      socket.on('deleteCustomCategory', async ({ categoryId }) => {
        const success = await this.customCategories.deleteCategory(categoryId, socket.id);
        if (success) {
          socket.emit('customCategoryDeleted', { categoryId });
        } else {
          socket.emit('error', 'Failed to delete category');
        }
      });

      socket.on('rateCategory', async ({ categoryId, rating, review }) => {
        const success = await this.customCategories.rateCategory(categoryId, socket.id, rating, review);
        if (success) {
          socket.emit('categoryRated', { categoryId, rating });
        } else {
          socket.emit('error', 'Failed to rate category');
        }
      });

      socket.on('searchCategories', async ({ searchTerm, isPublicOnly }) => {
        const categories = await this.customCategories.searchCategories(searchTerm, isPublicOnly);
        socket.emit('searchCategoriesResults', categories);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove from matchmaking
        this.matchmaking.leaveQueue(socket.id);
        
        // Remove from room
        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
          const room = this.gameLogic.removePlayerFromRoom(roomId, socket.id);
          if (room) {
            this.io.to(roomId).emit('roomUpdated', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
          }
          this.playerRooms.delete(socket.id);
        }
        
        // Clean up player data
        this.playerNames.delete(socket.id);
      });
    });
  }

  private checkAllPlayersAnswered(roomId: string): boolean {
    // This is a simplified check - in a real implementation,
    // you'd track which players have answered the current question
    return false;
  }

  private startAIBehavior(roomId: string, humanPlayerId: string): void {
    const room = this.gameLogic.getRoom(roomId);
    if (!room || room.mode !== 'pve') return;

    const aiPlayer = room.players.find(p => p.id.startsWith('ai_'));
    if (!aiPlayer) return;

    // AI responds to questions with some delay and varying accuracy
    const respondToQuestion = () => {
      const currentRoom = this.gameLogic.getRoom(roomId);
      if (!currentRoom?.currentQuestion || currentRoom.gameState !== 'playing') return;

      // AI difficulty based on player performance
      const humanPlayer = currentRoom.players.find(p => p.id === humanPlayerId);
      let aiAccuracy = 0.7; // Default 70% accuracy
      
      if (humanPlayer) {
        // Adaptive difficulty: if human is doing well, AI gets better
        if (humanPlayer.score > 500) aiAccuracy = 0.8;
        if (humanPlayer.score > 1000) aiAccuracy = 0.85;
        if (humanPlayer.streak > 3) aiAccuracy = 0.9;
      }

      // AI answers with some randomness
      const isCorrect = Math.random() < aiAccuracy;
      const selectedAnswer = isCorrect 
        ? currentRoom.currentQuestion.correctAnswer 
        : Math.floor(Math.random() * currentRoom.currentQuestion.options.length);

      // Submit AI answer with delay
      setTimeout(() => {
        const aiAnswer = {
          playerId: aiPlayer.id,
          questionId: currentRoom.currentQuestion!.id,
          selectedAnswer,
          timeToAnswer: Date.now()
        };

        const result = this.gameLogic.submitAnswer(roomId, aiAnswer);
        if (result) {
          // Update all players with the new scores
          this.io.to(roomId).emit('playersUpdated', result.room.players);
          console.log(`AI answered question in room ${roomId}: ${isCorrect ? 'Correct' : 'Wrong'}`);
        }
      }, Math.random() * 3000 + 2000); // Random delay 2-5 seconds
    };

    // Start responding to questions
    respondToQuestion();

    // Set up interval to continue responding to future questions
    const aiInterval = setInterval(() => {
      const currentRoom = this.gameLogic.getRoom(roomId);
      if (!currentRoom || currentRoom.gameState === 'finished') {
        clearInterval(aiInterval);
        return;
      }
      respondToQuestion();
    }, 15000); // Check every 15 seconds for new questions
  }

  private async updatePlayerRatings(players: Player[]): Promise<void> {
    try {
      // Sort players by score (highest first)
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      
      // Update ratings for each pair of players
      for (let i = 0; i < sortedPlayers.length; i++) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          const winner = sortedPlayers[i];
          const loser = sortedPlayers[j];
          
          // Get current ratings
          const winnerStats = await storage.getPlayerStats(winner.id);
          const loserStats = await storage.getPlayerStats(loser.id);
          
          const winnerRating = winnerStats?.rating || 1000;
          const loserRating = loserStats?.rating || 1000;
          
          // Update ratings using the matchmaking service's rating system
          await this.matchmaking.updatePlayerRating(winner.id, true, loserRating);
          await this.matchmaking.updatePlayerRating(loser.id, false, winnerRating);
        }
      }
      
      console.log(`Updated ratings for ${players.length} players`);
    } catch (error) {
      console.error('Error updating player ratings:', error);
    }
  }

  private async updateLeaderboards(players: Player[]): Promise<void> {
    try {
      // Sort players by score (highest first)
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      
      for (const player of sortedPlayers) {
        const playerName = this.playerNames.get(player.id) || `Player${player.id.substr(0, 4)}`;
        const isWinner = player === sortedPlayers[0];
        const gamesWon = isWinner ? 1 : 0;
        
        // Update leaderboard entry
        await storage.updateLeaderboard(
          player.id,
          playerName,
          player.score,
          gamesWon,
          player.streak
        );
      }
      
      console.log(`Updated leaderboards for ${players.length} players`);
    } catch (error) {
      console.error('Error updating leaderboards:', error);
    }
  }

  getServer(): SocketServer {
    return this.io;
  }
}
