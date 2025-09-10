import { GameRoom, Player, Question, Answer } from '../shared/schema';
import { QuestionBank } from './questionBank';

export class GameLogic {
  private questionBank: QuestionBank;
  private rooms: Map<string, GameRoom>;
  private roomTimers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.questionBank = new QuestionBank();
    this.rooms = new Map();
    this.roomTimers = new Map();
  }

  createRoom(roomId: string, mode: 'pvp' | 'pve', category: string, difficulty: string): GameRoom {
    const room: GameRoom = {
      id: roomId,
      players: [],
      gameState: 'waiting',
      mode,
      category,
      difficulty,
      maxPlayers: mode === 'pvp' ? 4 : 1,
      currentQuestion: undefined,
      questionStartTime: undefined
    };

    this.rooms.set(roomId, room);
    return room;
  }

  addPlayerToRoom(roomId: string, player: Player): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return null;
    }

    room.players.push(player);
    return room;
  }

  removePlayerFromRoom(roomId: string, playerId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);
    
    if (room.players.length === 0) {
      this.deleteRoom(roomId);
      return null;
    }

    return room;
  }

  playerReady(roomId: string, playerId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }

    // Start game if all players are ready and minimum players met
    const minPlayers = room.mode === 'pvp' ? 2 : 1;
    const allReady = room.players.length >= minPlayers && room.players.every(p => p.isReady);
    
    if (allReady && room.gameState === 'waiting') {
      this.startGame(roomId);
    }

    return room;
  }

  startGame(roomId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.gameState = 'playing';
    this.nextQuestion(roomId);
    
    return room;
  }

  nextQuestion(roomId: string): Question | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const question = this.questionBank.getRandomQuestion(room.category, room.difficulty);
    if (!question) return null;

    room.currentQuestion = question;
    room.questionStartTime = Date.now();

    // Set timer for question timeout
    if (this.roomTimers.has(roomId)) {
      clearTimeout(this.roomTimers.get(roomId)!);
    }

    const timer = setTimeout(() => {
      this.questionTimeout(roomId);
    }, question.timeLimit * 1000);

    this.roomTimers.set(roomId, timer);

    return question;
  }

  submitAnswer(roomId: string, answer: Answer): { room: GameRoom; isCorrect: boolean; points: number } | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentQuestion || room.gameState !== 'playing') {
      return null;
    }

    const player = room.players.find(p => p.id === answer.playerId);
    if (!player) return null;

    const isCorrect = answer.selectedAnswer === room.currentQuestion.correctAnswer;
    const timeBonus = this.calculateTimeBonus(room.questionStartTime!, answer.timeToAnswer, room.currentQuestion.timeLimit);
    
    let points = 0;
    if (isCorrect) {
      const basePoints = this.getBasePoints(room.currentQuestion.difficulty);
      points = basePoints + timeBonus;
      player.score += points;
      player.streak += 1;
      
      // Streak bonus
      if (player.streak >= 3) {
        const streakBonus = Math.floor(player.streak / 3) * 50;
        player.score += streakBonus;
        points += streakBonus;
      }
    } else {
      player.streak = 0;
    }

    return { room, isCorrect, points };
  }

  questionTimeout(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Reset streaks for players who didn't answer
    room.players.forEach(player => {
      player.streak = 0;
    });

    // Move to next question after a brief delay
    setTimeout(() => {
      this.nextQuestion(roomId);
    }, 2000);
  }

  endGame(roomId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.gameState = 'finished';
    
    // Clear any existing timers
    if (this.roomTimers.has(roomId)) {
      clearTimeout(this.roomTimers.get(roomId)!);
      this.roomTimers.delete(roomId);
    }

    // Sort players by score
    room.players.sort((a, b) => b.score - a.score);

    return room;
  }

  deleteRoom(roomId: string): void {
    if (this.roomTimers.has(roomId)) {
      clearTimeout(this.roomTimers.get(roomId)!);
      this.roomTimers.delete(roomId);
    }
    this.rooms.delete(roomId);
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  private calculateTimeBonus(startTime: number, answerTime: number, timeLimit: number): number {
    const timeUsed = (answerTime - startTime) / 1000;
    const timeRemaining = Math.max(0, timeLimit - timeUsed);
    return Math.floor((timeRemaining / timeLimit) * 100);
  }

  private getBasePoints(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 200;
      case 'hard': return 300;
      default: return 100;
    }
  }
}
