import type { Express } from "express";
import { createServer, type Server } from "http";
import { GameServer } from "./gameServer";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leaderboard endpoint
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Player stats endpoint
  app.get("/api/player/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats(req.params.id);
      if (!stats) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch player stats:", error);
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  // Update player stats endpoint
  app.post("/api/player/:id/stats", async (req, res) => {
    try {
      const stats = await storage.updatePlayerStats(req.params.id, req.body);
      res.json(stats);
    } catch (error) {
      console.error("Failed to update player stats:", error);
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize game server with WebSocket support
  new GameServer(httpServer);

  return httpServer;
}
