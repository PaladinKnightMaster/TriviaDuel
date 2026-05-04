# Trivia Masters

A real-time multiplayer trivia battle game with PvP and PvE modes, full user authentication, achievement system, and player profiles.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Zustand + TailwindCSS + shadcn/ui
- **Backend:** Express + Socket.IO 4 + Drizzle ORM + PostgreSQL (pg driver)
- **Auth:** JWT (jsonwebtoken) + bcrypt — full register/login/session
- **Real-time:** Socket.IO WebSocket with polling fallback + JWT handshake auth

## Architecture

```
client/              # React SPA (Vite, port 5000 via proxy)
  src/
    App.tsx          # Root: auth init, socket connect, global event listeners, AchievementToast
    components/
      GameLobby.tsx  # Main menu, auth button, profile button, PvP/PvE entry
      Matchmaking.tsx # PvP lobby, ready-up flow
      TriviaGame.tsx  # Live game: timer, question, answer buttons, scoreboard
      GameResults.tsx # End-of-game results, winner, scores, replay/menu
      GameUI.tsx      # Phase router: menu → matchmaking → playing → results → profile
      Leaderboard.tsx # Leaderboard REST API display
      CategorySelect.tsx # Static category showcase
      AuthModal.tsx   # Login/Register modal with tabs (Sprint 1)
      AchievementToast.tsx # Real-time achievement popup toast (Sprint 1)
      PlayerProfile.tsx    # Stats + achievement badges page (Sprint 1)
    lib/
      socket.ts       # Raw socket.io-client with JWT handshake + reconnectWithToken()
      stores/
        useTrivia.tsx  # Zustand: game phase, question state, results, player list
        useSocket.tsx  # Zustand: socket actions (connect, join, answer, readyUp)
        useAuth.ts     # Zustand: JWT auth state, login/register/logout + localStorage

server/
  index.ts            # Express entry point, port 5000
  routes.ts           # REST: /api/auth/*, /api/leaderboard, /api/player/:id/*, /api/player/:id/achievements
  gameServer.ts       # Socket.IO hub: JWT handshake auth, real-time events, achievement triggers
  gameLogic.ts        # In-memory rooms, answer tracking, correct answers + fastest answer tracking
  matchmaking.ts      # ELO queue, skill-based matching, tier system
  questionBank.ts     # 270 questions (6 categories × 3 difficulties × 15 questions)
  storage.ts          # Drizzle ORM + PostgreSQL (pg Pool driver) + in-memory fallback
  authService.ts      # JWT signToken/verifyToken + bcrypt register/login/getUserById
  achievementService.ts # 10 achievements with checkAndAwardAchievements() + getPlayerAchievements()
  tournamentService.ts # Tournament CRUD + bracket generation (built, no UI)
  socialService.ts    # Profiles, friends, messages, invites (built, no socket handlers)
  customCategoryService.ts # UGC categories + ratings (fully wired)

shared/
  schema.ts           # Drizzle schema (14 tables) + shared TypeScript interfaces
                      # Key: users, gameStats, leaderboards, playerAchievements
```

## Database (PostgreSQL — 14 tables)

Uses Replit's built-in PostgreSQL via **`drizzle-orm/node-postgres`** (pg Pool).
> ⚠️ Do NOT use `drizzle-orm/neon-http` — this env is standard PostgreSQL, not Neon cloud.

Key tables:
- `users` — id, username, password_hash (bcrypt)
- `game_stats` — playerId (unique), totalGames, wins, losses, averageScore, bestStreak, rating, tier
- `leaderboards` — playerId (unique), playerName, totalScore, gamesWon, bestStreak, rank
- `player_achievements` — playerId, achievementId, progress, maxProgress, unlocked, unlockedAt

## Auth System (Sprint 1)

- **JWT** stored in `localStorage` as `trivia_auth_token`; expires in 7 days
- **Socket handshake**: `socket.io({ auth: { token } })` → server maps to `user_${userId}`
- **Persistent player ID**: authenticated players use `user_123` as their DB key; guests use `socket.id`
- **REST endpoints**: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- **Client stores**: `useAuth.ts` handles login/register/logout + socket reconnection

## Achievement System (Sprint 1)

10 achievements with 4 rarity tiers:
- **Common**: first_win (🏆), streak_3 (🔥), knowledge_seeker (📚)
- **Rare**: speed_demon (⚡), streak_5 (🌋), centurion (💎), pvp_champion (⚔️)
- **Epic**: perfect_game (💯)
- **Legendary**: streak_10 (🚀), trivia_master (👑)

Triggered in `gameServer.ts → finishGame()`, persisted to `player_achievements`, emitted via `achievementUnlocked` socket event → toast UI.

## Game Flow

1. **Lobby** (menu) — name input or account login, mode selection
2. **Matchmaking** — PvP queue with ELO-based pairing; PvE instant start
3. **Playing** — 10 questions, 30s timer each, real-time scoring + streaks
4. **Results** — final scoreboard, winner, ELO delta, stats update
5. **Profile** (overlay) — stats grid, achievement badges, progress bars

## Known Issues / Notes

- Leaderboard shows empty `[]` when no real games completed yet (no more fallback sample data)
- AI opponent answers with 1–4s delay, scores realistically
- Question IDs are deterministic (`category_difficulty_question[0:30]`) — no dedup issues
- `correctAnswersPerPlayer` + `fastestAnswerMsPerPlayer` tracked per room for achievements

## Sprint History

- **Sprint 0**: Core game loop, PvP/PvE, ELO, leaderboards, 270-question bank, bug fixes
- **Sprint 1**: JWT auth (register/login/me), Socket JWT handshake, 10 achievements, AuthModal, AchievementToast, PlayerProfile, switched DB driver to pg Pool
