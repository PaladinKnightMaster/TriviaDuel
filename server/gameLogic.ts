import { GameRoom, Player, Question, Answer } from '../shared/schema';
import { QuestionBank } from './questionBank';

export class GameLogic {
  private questionBank: QuestionBank;
  private rooms: Map<string, GameRoom>;
  private roomQuestionHistory: Map<string, string[]>;

  constructor() {
    this.questionBank = new QuestionBank();
    this.rooms = new Map();
    this.roomQuestionHistory = new Map();
  }

  createRoom(roomId: string, mode: 'pvp' | 'pve', category: string, difficulty: string): GameRoom {
    const room: GameRoom = {
      id: roomId,
      players: [],
      gameState: 'waiting',
      mode,
      category,
      difficulty,
      maxPlayers: mode === 'pvp' ? 4 : 2, // pve = human + AI opponent
      currentQuestion: undefined,
      questionStartTime: undefined,
      questionIndex: 0,
      maxQuestions: 10,
      currentQuestionAnswers: {},
      correctAnswersPerPlayer: {},
      fastestAnswerMsPerPlayer: {}
    };

    this.rooms.set(roomId, room);
    this.roomQuestionHistory.set(roomId, []);
    return room;
  }

  addPlayerToRoom(roomId: string, player: Player): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) return null;
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
    if (player) player.isReady = true;

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
    room.questionIndex = 0;
    this.nextQuestion(roomId);
    return room;
  }

  // Returns the next question, or null if the match is over.
  // Does NOT manage timers — that is the GameServer's responsibility.
  nextQuestion(roomId: string): Question | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.questionIndex >= room.maxQuestions) return null;

    const usedIds = this.roomQuestionHistory.get(roomId) || [];
    const question = this.questionBank.getRandomQuestion(room.category, room.difficulty, usedIds);
    if (!question) return null;

    usedIds.push(question.id);
    this.roomQuestionHistory.set(roomId, usedIds);

    room.currentQuestion = question;
    room.questionStartTime = Date.now();
    room.currentQuestionAnswers = {};
    room.questionIndex += 1;

    return question;
  }

  submitAnswer(roomId: string, answer: Answer): { room: GameRoom; isCorrect: boolean; points: number } | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentQuestion || room.gameState !== 'playing') return null;

    const player = room.players.find(p => p.id === answer.playerId);
    if (!player) return null;

    // Prevent double-answering
    if (room.currentQuestionAnswers[answer.playerId] !== undefined) {
      return { room, isCorrect: false, points: 0 };
    }

    const isCorrect = answer.selectedAnswer === room.currentQuestion.correctAnswer;
    const timeBonus = this.calculateTimeBonus(room.questionStartTime!, answer.timeToAnswer, room.currentQuestion.timeLimit);

    let points = 0;
    if (isCorrect) {
      const basePoints = this.getBasePoints(room.currentQuestion.difficulty);
      points = basePoints + timeBonus;
      player.score += points;
      player.streak += 1;

      if (player.streak >= 3 && player.streak % 3 === 0) {
        const streakBonus = Math.floor(player.streak / 3) * 50;
        player.score += streakBonus;
        points += streakBonus;
      }

      // Track cumulative correct answers for achievements
      room.correctAnswersPerPlayer[answer.playerId] = (room.correctAnswersPerPlayer[answer.playerId] || 0) + 1;

      // Track fastest correct answer time (ms) for speed demon achievement
      const answerMs = answer.timeToAnswer - room.questionStartTime!;
      if (answerMs > 0) {
        const prev = room.fastestAnswerMsPerPlayer[answer.playerId];
        if (prev === undefined || answerMs < prev) {
          room.fastestAnswerMsPerPlayer[answer.playerId] = answerMs;
        }
      }
    } else {
      player.streak = 0;
    }

    room.currentQuestionAnswers[answer.playerId] = isCorrect;
    return { room, isCorrect, points };
  }

  // Resets streaks for players who timed out without answering
  applyQuestionTimeout(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.forEach(player => {
      if (room.currentQuestionAnswers[player.id] === undefined) {
        player.streak = 0;
      }
    });
  }

  allHumanPlayersAnswered(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const humanPlayers = room.players.filter(p => !p.id.startsWith('ai_'));
    if (humanPlayers.length === 0) return false;

    return humanPlayers.every(p => room.currentQuestionAnswers[p.id] !== undefined);
  }

  isGameOver(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return true;
    return room.questionIndex >= room.maxQuestions;
  }

  endGame(roomId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.gameState = 'finished';
    room.players.sort((a, b) => b.score - a.score);
    return room;
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.roomQuestionHistory.delete(roomId);
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
