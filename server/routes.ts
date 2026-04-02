import type { Express } from "express";
import { createServer, type Server } from "http";
import { GameServer } from "./gameServer";
import { storage } from "./storage";
import { authService } from "./authService";
import { achievementService } from "./achievementService";

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

  // ── HTTP SERVER + WEBSOCKET ────────────────────────────────────────────────
  const httpServer = createServer(app);
  new GameServer(httpServer);
  return httpServer;
}
