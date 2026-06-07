# Trivia Masters

A real-time multiplayer trivia battle game with PvP and PvE modes, full user authentication, achievement system, and player profiles.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Zustand + TailwindCSS + shadcn/ui
- **Backend:** Express + Socket.IO 4 + Drizzle ORM + PostgreSQL (pg Pool driver)
- **Auth:** JWT (jsonwebtoken) + bcrypt — full register/login/session
- **Real-time:** Socket.IO WebSocket with polling fallback + JWT handshake auth

## Architecture

```
client/              # React SPA (Vite, port 5000 via proxy)
  src/
    App.tsx          # Root: auth init, socket connect, global event listeners, AchievementToast
    components/
      GameLobby.tsx  # Main menu, auth button, profile button, PvP/PvE entry
      Matchmaking.tsx # PvP lobby, category/difficulty select, ready-up flow
      TriviaGame.tsx  # Live game: timer, question, answer buttons, scoreboard
      GameResults.tsx # End-of-game results with confetti, score count-up, correct answers, best streak
      GameUI.tsx      # Phase router: menu → matchmaking → playing → results → tournament → profile
      Leaderboard.tsx # Leaderboard REST API display
      CategorySelect.tsx # Static category showcase
      AuthModal.tsx   # Login/Register modal with tabs (Sprint 1)
      AchievementToast.tsx # Real-time achievement popup toast, slide-in animation (Sprint 1)
      PlayerProfile.tsx    # Stats + achievement badges page (Sprint 1)
      Tournament.tsx  # Browse/create/join tournaments lobby (Sprint 2)
      TournamentBracket.tsx # Bracket visualization + "Play Match" game-room bridge (Sprint 2)
    lib/
      socket.ts       # Raw socket.io-client + JWT handshake + reconnectWithToken()
                      # socketClient.on() stores listeners and re-attaches on reconnect
                      # Duplicate listener guard prevents double-registration
      stores/
        useTrivia.tsx  # Zustand: game phase, question state, results (+ correctAnswersPerPlayer, maxStreakPerPlayer)
        useSocket.tsx  # Zustand: socket actions — all handlers registered via socketClient.on()
        useAuth.ts     # Zustand: JWT auth state, login/register/logout + localStorage
        useTournament.ts # Zustand: tournament state — browse, current, bracket matches, pending match

server/
  index.ts            # Express entry point, port 5000
  routes.ts           # REST: /api/auth/*, /api/leaderboard, /api/player/:id/*, /api/tournaments/*
  gameServer.ts       # Socket.IO hub: JWT handshake, real-time events, achievement triggers
                      # getDbPlayerId(): resolves socket.id → "user_2" → "2" for DB writes
                      # authToSocketId reverse map: authId → socket.id (for tournament notifications)
                      # joinTournamentMatch: creates PvP room, auto-starts when both players join
                      # finishGame enriched: correctAnswersPerPlayer + maxStreakPerPlayer in gameEnded
                      # Tournament bridge: updateMatchResult + tournamentUpdated after match ends
  gameLogic.ts        # In-memory rooms, answer tracking, maxStreakPerPlayer tracking
  matchmaking.ts      # ELO queue, skill-based matching, tier system
  questionBank.ts     # 270 questions (6 categories × 3 difficulties × 15 questions)
  storage.ts          # Drizzle ORM + PostgreSQL (pg Pool driver) + in-memory fallback
  authService.ts      # JWT signToken/verifyToken + bcrypt register/login/getUserById
  achievementService.ts # 10 achievements — checkAndAwardAchievements() uses maxStreakPerPlayer
  tournamentService.ts # Tournament CRUD + bracket gen + getMatch/updateMatchRoom/getPendingMatches
  socialService.ts    # Profiles, friends, messages, invites (backend built, no UI yet)
  customCategoryService.ts # UGC categories + ratings (fully wired)

shared/
  schema.ts           # Drizzle schema (14 tables) + shared TypeScript interfaces
                      # GameRoom includes maxStreakPerPlayer + tournamentMatchId?: number
```

## Database (PostgreSQL — 14 tables)

Uses Replit's built-in PostgreSQL via **`drizzle-orm/node-postgres`** (pg Pool).
> ⚠️ Do NOT use `drizzle-orm/neon-http` — this env is standard PostgreSQL, not Neon serverless cloud.

Key tables:
- `users` — id (serial PK), username (unique), password_hash (bcrypt)
- `game_stats` — playerId (unique text), totalGames, wins, losses, averageScore, bestStreak, rating, tier
- `leaderboards` — playerId (unique text), playerName, totalScore (accumulated), gamesWon, bestStreak, rank
- `player_achievements` — playerId, achievementId, progress, maxProgress, unlocked, unlockedAt

## Auth System (Sprint 1)

- **JWT** stored in `localStorage` as `trivia_auth_token`; expires in 7 days
- **Socket handshake**: `socket.io({ auth: { token } })` → server maps `socket.id → "user_${userId}"`
- **DB player ID**: `getDbPlayerId(socketId)` resolves `socket.id → "user_2" → "2"` (numeric string matching REST API key)
- **Guests**: `getDbPlayerId` returns `null` for non-auth sockets — no stats persisted for guests
- **REST endpoints**: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- **Client stores**: `useAuth.ts` handles login/register/logout + `reconnectWithToken()` for socket re-auth

## Socket Listener Persistence

Critical pattern — handlers must survive socket reconnects after login:
- `socketClient.on(event, cb)` stores `cb` in `this.listeners` Map AND attaches to socket
- On reconnect, `reconnectWithToken()` creates new socket → all `this.listeners` are re-attached
- Duplicate guard: `socketClient.on()` checks `existing.includes(callback)` before pushing
- `useSocket.connect()` uses `socketClient.on()` — NOT `socket.on()` directly
- `useSocket.isConnected` and `playerId` update correctly after every reconnect

## Achievement System (Sprint 1)

10 achievements with 4 rarity tiers:
- **Common**: first_win (🏆), streak_3 (🔥), knowledge_seeker (📚)
- **Rare**: speed_demon (⚡), streak_5 (🌋), centurion (💎), pvp_champion (⚔️)
- **Epic**: perfect_game (💯)
- **Legendary**: streak_10 (🚀), trivia_master (👑)

Triggered in `gameServer.ts → finishGame()`, persisted to `player_achievements`, emitted via `achievementUnlocked` socket event → `AchievementToast` slide-in UI.

**Streak logic**: Uses `room.maxStreakPerPlayer[playerId]` (best streak reached during game), NOT `player.streak` (final streak at game end which resets on wrong answers).

## Game Flow

1. **Lobby** (menu) — name input or account login, mode selection
2. **Matchmaking** — PvP queue with ELO-based pairing; PvE instant start
3. **Playing** — 10 questions, 30s timer each, real-time scoring + streaks
4. **Results** — final scoreboard, winner, ELO update, achievements triggered
5. **Profile** (overlay) — stats grid, achievement badges, progress bars

## Scoring

- Base points: easy=100, medium=150, hard=200
- Time bonus: proportional to remaining time (max 50 pts)
- Streak bonus: every 3rd consecutive correct answer adds `(streak/3) * 50` pts
- `maxStreakPerPlayer` tracked in `GameRoom` — updated in `gameLogic.submitAnswer()` on each correct answer

## Known Patterns / Notes

- Leaderboard shows `[]` when no authenticated players have completed games (guest stats not persisted)
- AI opponent answers with 1–4s delay, adaptive accuracy based on human performance
- Question IDs are deterministic (`category_difficulty_question[0:30]`) — no dedup issues across sessions
- `correctAnswersPerPlayer` + `fastestAnswerMsPerPlayer` + `maxStreakPerPlayer` tracked per room for achievements
- In production, `CORS origin` is locked to `CLIENT_ORIGIN` env var

## Sprint History

### Sprint 0 — Core Loop ✅
Core game loop, PvP/PvE rooms, ELO matchmaking, answer tracking, 10-question match limit, event-driven AI timing, GameResults screen, 270-question bank, leaderboard score accumulation, DB schema (14 tables).

### Sprint 1 — Identity + Achievements ✅
JWT auth (register/login/me endpoints), Socket.IO JWT handshake, persistent `socketToAuthId` map, 10 achievements with rarity system, `AuthModal`, `AchievementToast` with slide-in animation, `PlayerProfile` stats page, GameLobby auth integration.

**Sprint 1 Code Audit — Bugs Fixed:**
1. Stats/ELO stored under `socket.id` → now uses `getDbPlayerId()` → numeric DB user ID (fixes blank profile page)
2. Achievement streak checks used final `player.streak` → now uses `room.maxStreakPerPlayer` (fixes streak_3/5/10 never awarding)
3. Leaderboard `bestStreak` was final streak → now uses `maxStreakPerPlayer` (same fix, consistent data)
4. `useSocket.connect()` handlers lost after reconnect → switched to `socketClient.on()` (fixes stale `isConnected`)
5. PvP matchmaking sent empty name for auth users → now uses `useAuth.getState().user?.username`
6. `socketClient.on()` could register duplicate handlers → added `includes()` guard
7. `AchievementToast` popped in instantly → added `entering` state for slide-in animation

### Sprint 2 — Competitive Core ✅
Enhanced `GameResults` (confetti, score count-up, correct-answer count, accuracy %, best streak), Tournament mode end-to-end (create/join/browse, bracket visualization, game-room bridge, auto-start, post-game result writes), `useTournament` Zustand store, REST `/api/tournaments/*` routes, `authToSocketId` reverse map in `gameServer.ts`, `Tournament.tsx` + `TournamentBracket.tsx`.

**Sprint 2 Code Audit — Bugs Fixed:**
1. **Double bracket generation** — `tournamentService.joinTournament` called `startTournament` internally AND `gameServer` called it again → duplicate matches. Removed internal call; `gameServer` is sole orchestrator.
2. **Premature phase transition** — "Play Match" called `setPhase('playing')` immediately; first player saw empty game screen. Removed; driven solely by `gameStarted` socket event.
3. **Tournament room maxPlayers=4** — PvP rooms default to 4 slots. Added `room.maxPlayers = 2` for tournament 1v1 rooms.
4. **`getTournaments` socket returned only `registration`-status** — changed to `getAllTournaments()` for consistency with REST.
5. Dead code (`clearTournament`/`currentTournament` unused imports) removed from `GameUI.tsx`.

### Sprint 3 — Social Layer + Community 🔜
- **Friends system** — search/add/remove, online status, invite to match (`socialService.ts` backend ready)
- **Private matches** — create room with 6-char code, join by code, invite via friend list
- **Custom categories UI** — browse/create/play community question sets (`customCategoryService.ts` backend ready)
- **Tournament UX polish** — real player names in bracket, opponent-joined notification, rematch flow, winner podium
- **Mobile layout pass** — responsive breakpoints across all screens
