import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { GameLogic } from './gameLogic';
import { MatchmakingService } from './matchmaking';
import { Player, Answer } from '../shared/schema';

export class GameServer {
  private io: SocketServer;
  private gameLogic: GameLogic;
  private matchmaking: MatchmakingService;
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
      socket.on('joinMatchmaking', ({ mode, category, difficulty }) => {
        const playerName = this.playerNames.get(socket.id) || `Player${socket.id.substr(0, 4)}`;
        
        const player: Player = {
          id: socket.id,
          name: playerName,
          score: 0,
          streak: 0,
          isReady: false
        };

        const roomId = this.matchmaking.joinQueue(player, mode, category, difficulty);
        
        if (roomId) {
          // Player was matched to a room
          this.playerRooms.set(socket.id, roomId);
          socket.join(roomId);
          
          const room = this.gameLogic.getRoom(roomId);
          if (room) {
            this.io.to(roomId).emit('roomJoined', room);
            this.io.to(roomId).emit('playersUpdated', room.players);
            console.log(`Player ${socket.id} joined room ${roomId}`);
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
              setTimeout(() => {
                const nextQuestion = this.gameLogic.nextQuestion(roomId);
                if (nextQuestion) {
                  this.io.to(roomId).emit('newQuestion', nextQuestion);
                } else {
                  // End game
                  const finalRoom = this.gameLogic.endGame(roomId);
                  if (finalRoom) {
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

  getServer(): SocketServer {
    return this.io;
  }
}
