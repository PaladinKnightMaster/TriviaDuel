import type { Express } from "express";
import { createServer, type Server } from "http";
import { GameServer } from "./gameServer";
import { QuestionBank } from "./questionBank";
import { storage } from "./storage";
import { authService } from "./authService";
import { achievementService } from "./achievementService";
import { TournamentService } from "./tournamentService";
import { SocialService } from "./socialService";

const tournamentService = new TournamentService();
const socialService = new SocialService();

export async function registerRoutes(app: Express): Promise<Server> {

  // ── AUTH ROUTES ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const result = await authService.registerUser(username, password);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ token: result.token, userId: result.userId, username: result.username });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const result = await authService.loginUser(username, password);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ token: result.token, userId: result.userId, username: result.username });
  });

  app.get("/api/auth/me", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token" });
    }
    const payload = authService.verifyToken(auth.slice(7));
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const user = await authService.getUserById(payload.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ userId: user.id, username: user.username });
  });

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ── PLAYER STATS ───────────────────────────────────────────────────────────
  app.get("/api/player/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats(req.params.id);
      if (!stats) return res.status(404).json({ message: "Player not found" });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.post("/api/player/:id/stats", async (req, res) => {
    try {
      const stats = await storage.updatePlayerStats(req.params.id, req.body);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });

  // ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
  app.get("/api/player/:id/achievements", async (req, res) => {
    try {
      const achievements = await achievementService.getPlayerAchievements(req.params.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // ── TOURNAMENTS ────────────────────────────────────────────────────────────
  app.get("/api/tournaments", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const all = await tournamentService.getAllTournaments();
      const filtered = status ? all.filter(t => t.status === status) : all;
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    const { name, category, difficulty, maxPlayers, prizePool } = req.body;
    if (!name || !category || !difficulty) {
      return res.status(400).json({ error: "name, category, difficulty required" });
    }
    const tournament = await tournamentService.createTournament(
      name, category, difficulty, maxPlayers || 8, prizePool || 0
    );
    if (!tournament) return res.status(500).json({ error: "Failed to create tournament" });
    res.json(tournament);
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    const tournament = await tournamentService.getTournament(parseInt(req.params.id));
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    res.json(tournament);
  });

  app.get("/api/tournaments/:id/matches", async (req, res) => {
    const round = req.query.round ? parseInt(req.query.round as string) : undefined;
    const matches = await tournamentService.getTournamentMatches(parseInt(req.params.id), round);
    res.json(matches);
  });

  // ── SOCIAL ─────────────────────────────────────────────────────────────────
  app.get("/api/social/friends-leaderboard", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });
    try {
      const friends = await socialService.getFriends(userId);
      const leaderboard = await storage.getLeaderboard();
      const friendIds = new Set(friends.map((f) => f.playerId));
      friendIds.add(userId); // include self
      const filtered = leaderboard.filter((entry) => friendIds.has(entry.playerId));
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends leaderboard" });
    }
  });

  // ── HTTP SERVER + WEBSOCKET ────────────────────────────────────────────────
  const httpServer = createServer(app);
  // Load and seed the built-in question catalog before accepting game traffic.
  // GameLogic remains synchronous during a match, so startup is the single
  // async boundary for the database-backed question bank.
  const questionBank = new QuestionBank();
  await questionBank.initialize();
  new GameServer(httpServer, questionBank);
  return httpServer;
}
