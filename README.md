# 🧠 Trivia Masters

> Real-time multiplayer trivia battle game with PvP, PvE, ELO matchmaking, achievements, and persistent player profiles.

---

## Features

| Category | Details |
|----------|---------|
| **Game Modes** | Player vs Player (real-time), Player vs AI (adaptive difficulty) |
| **Matchmaking** | ELO-based skill matchmaking with Bronze → Grandmaster tier system |
| **Question Bank** | 270 curated questions stored in PostgreSQL — 6 categories × 3 difficulties × 15 questions |
| **Scoring** | Base points + time bonus + streak multiplier (×3 streak = bonus points) |
| **Achievements** | 10 achievements across 4 rarity tiers (Common / Rare / Epic / Legendary) |
| **Auth** | JWT register/login, bcrypt password hashing, 7-day session |
| **Profiles** | Persistent stats: ELO rating, W/L record, best streak, tier badge |
| **Leaderboard** | Global leaderboard with accumulated scores, ranked by total score |
| **Custom Categories** | Create, share, and rate user-generated question sets |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| State | Zustand 5 |
| Styling | TailwindCSS 3 + shadcn/ui (Radix primitives) |
| Real-time | Socket.IO 4 (WebSocket + polling fallback) |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL via `pg` Pool + Drizzle ORM |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` |
| Dev | `tsx` for server, `vite` for client, `drizzle-kit` for migrations |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (connection string in `DATABASE_URL`)

### Install & Run

```bash
npm install
npm run db:push      # sync schema to database
npm run dev          # starts Express + Vite on port 5000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (auto-generated if absent) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_ORIGIN` | Allowed CORS origin in production |

---

## Project Structure

```
trivia-masters/
├── client/                     # React SPA (served via Vite proxy on port 5000)
│   └── src/
│       ├── App.tsx             # Root: auth init, socket connect, global listeners
│       ├── components/
│       │   ├── GameLobby.tsx   # Main menu — mode selection, auth entry point
│       │   ├── Matchmaking.tsx # PvP queue UI — category/difficulty + search timer
│       │   ├── TriviaGame.tsx  # Live game — timer, question, answers, scoreboard
│       │   ├── GameResults.tsx # End-of-game results, winner, score breakdown
│       │   ├── GameUI.tsx      # Phase router: lobby → matchmaking → playing → results
│       │   ├── Leaderboard.tsx # Global leaderboard (REST-backed)
│       │   ├── CategorySelect.tsx  # Category showcase (static)
│       │   ├── AuthModal.tsx   # Login / Register modal with tabs
│       │   ├── AchievementToast.tsx # Slide-in achievement unlock notification
│       │   └── PlayerProfile.tsx    # Stats grid + achievement badge page
│       └── lib/
│           ├── socket.ts       # Socket.IO client — JWT handshake, reconnectWithToken,
│           │                   # persistent listener map (survives reconnects)
│           └── stores/
│               ├── useTrivia.tsx  # Zustand: game phase, questions, results, player list
│               ├── useSocket.tsx  # Zustand: socket actions + connection state
│               └── useAuth.ts     # Zustand: JWT auth state, login/register/logout
│
├── server/
│   ├── index.ts                # Express entry point, port 5000
│   ├── routes.ts               # REST: auth, admin question catalog, leaderboard, player APIs
│   ├── gameServer.ts           # Socket.IO hub: JWT auth, real-time events, game lifecycle
│   ├── gameLogic.ts            # In-memory room state, answer validation, scoring, streaks
│   ├── matchmaking.ts          # ELO queue with skill-range expansion over wait time
│   ├── questionBank.ts         # DB-backed catalog + idempotent seed (270 questions)
│   ├── storage.ts              # Drizzle ORM + pg Pool — stats, leaderboard, achievements
│   ├── authService.ts          # JWT sign/verify + bcrypt register/login/getUserById
│   ├── achievementService.ts   # 10 achievements — checkAndAwardAchievements() trigger
│   ├── tournamentService.ts    # Tournament CRUD + bracket generation (backend complete)
│   ├── socialService.ts        # Profiles, friends, messages, invites (backend complete)
│   └── customCategoryService.ts # UGC categories + ratings (fully wired)
│
└── shared/
    └── schema.ts               # Drizzle schema (15 tables) + shared TypeScript interfaces
```

---

## Architecture

### Real-Time Flow

```
Browser
  └── socket.io-client (JWT auth: { token } in handshake)
        └── Socket.IO Server (gameServer.ts)
              ├── JWT verified → socketToAuthId maps socket.id → "user_2"
              ├── GameLogic (in-memory Maps — synchronous mutations)
              │     ├── createRoom / addPlayer / submitAnswer / endGame
              │     └── maxStreakPerPlayer tracked per question-answer cycle
              └── Broadcasts: io.to(roomId).emit(event, payload)
```

### Auth & Persistent Identity

```
Register/Login (REST)
  → JWT stored in localStorage as trivia_auth_token
  → socketClient.reconnectWithToken(token)
      → new socket with auth: { token } in handshake
      → server: socketToAuthId.set(socket.id, "user_<userId>")
      → DB writes use numeric ID: "user_2" → "2"
      → matches /api/player/2/stats query key
```

### Game Lifecycle (PvE)

```
joinPvE → createRoom → addAIPlayer → startGame
  → emitNewQuestion (loop, 10 questions)
      ├── Human submits answer  →  submitAnswer → scoring → triggerAdvance
      ├── AI answers (1–4s delay, adaptive accuracy)
      └── Timer expires → triggerAdvance (if not already advancing)
  → finishGame → updateLeaderboards + updatePlayerRatings + checkAchievements
```

---

## Database Schema (14 Tables)

> Driver: `drizzle-orm/node-postgres` with `pg` Pool.
> ⚠️ Do NOT use `drizzle-orm/neon-http` — this is standard PostgreSQL, not Neon serverless.

| Table | Purpose |
|-------|---------|
| `users` | id, username, password_hash |
| `game_stats` | Per-player stats: totalGames, wins, losses, averageScore, bestStreak, rating, tier |
| `leaderboards` | Global ranking: totalScore (accumulated), gamesWon, bestStreak, rank |
| `player_achievements` | Per-player achievement progress + unlock state |
| `tournaments` | Tournament metadata: name, category, difficulty, status, bracket |
| `tournament_participants` | Player enrollment, seed, elimination status |
| `tournament_matches` | Individual bracket matches with roomId bridge |
| `custom_categories` | User-created question sets: name, public/private, rating |
| `custom_questions` | Questions within custom categories |
| `category_ratings` | Star ratings + reviews for custom categories |
| `player_profiles` | Display name, bio, avatar, favorite categories |
| `friendships` | Friend requests: pending / accepted / declined / blocked |
| `player_messages` | Direct messages between players |
| `game_invites` | Game invitations with mode, category, expiry |

---

## REST API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new account |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | JWT | Get current user |
| `GET` | `/api/admin/questions` | Admin JWT | List active and retired questions |
| `POST` | `/api/admin/questions` | Admin JWT | Create a question |
| `PATCH` | `/api/admin/questions/:id` | Admin JWT | Edit or retire/reactivate a question |
| `GET` | `/api/leaderboard` | — | Global leaderboard (top 100) |
| `GET` | `/api/player/:id/stats` | — | Player stats by numeric user ID |
| `GET` | `/api/player/:id/achievements` | — | Player achievement progress |

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinPvE` | `{ playerName, category, difficulty }` | Start a PvE game |
| `joinMatchmaking` | `{ playerName, category, difficulty }` | Enter PvP matchmaking queue |
| `submitAnswer` | `{ roomId, questionId, selectedAnswer, timeToAnswer }` | Submit answer |
| `readyUp` | `{ roomId }` | Signal ready in PvP lobby |
| `leaveRoom` | `{ roomId }` | Leave current room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `roomJoined` | `GameRoom` | Joined a room successfully |
| `gameStarted` | `GameRoom` | Match begins |
| `newQuestion` | `{ question, questionIndex, totalQuestions, timeLimit }` | Next question |
| `answerResult` | `{ correct, points, streak, correctAnswer }` | Answer feedback |
| `playersUpdated` | `Player[]` | Scoreboard update |
| `gameEnded` | `{ finalScores, winner, totalQuestions }` | Game over |
| `achievementUnlocked` | `{ achievements: AchievementDef[] }` | Achievements earned |
| `matchFound` | `{ roomId }` | PvP match paired |

---

## Achievements

| ID | Name | Rarity | Condition |
|----|------|--------|-----------|
| `first_win` | First Victory | Common | Win any game |
| `streak_3` | Hot Streak | Common | Best streak ≥ 3 in one game |
| `knowledge_seeker` | Knowledge Seeker | Common | Play 10 games |
| `speed_demon` | Speed Demon | Rare | Answer correctly in < 3 seconds |
| `streak_5` | On Fire | Rare | Best streak ≥ 5 in one game |
| `centurion` | Centurion | Rare | Score 1000+ points in one game |
| `pvp_champion` | PvP Champion | Rare | Win 10 PvP games |
| `perfect_game` | Perfectionist | Epic | Answer all 10 questions correctly |
| `streak_10` | Unstoppable | Legendary | Best streak ≥ 10 in one game |
| `trivia_master` | Trivia Master | Legendary | Play 100 games |

> Streak achievements use `maxStreakPerPlayer` (best streak reached during game), not the final streak at game end.

---

## Sprint History

### Sprint 0 — Core Loop ✅
Core game loop, PvP/PvE, ELO matchmaking, answer tracking, 10-question limit, AI timing, results screen, 270-question bank, leaderboard accumulation.

### Sprint 1 — Identity + Achievements ✅
JWT auth (register/login/me), Socket.IO JWT handshake, `socketToAuthId` persistent identity, 10 achievements with 4 rarity tiers, `AuthModal`, `AchievementToast` with entrance animation, `PlayerProfile` stats page.

**Sprint 1 Audit Fixes:**
- Stats/ELO now stored under numeric DB user ID (not `socket.id`) — profile page data now persists
- Achievement streak checks use `maxStreakPerPlayer` (best streak), not final streak
- `useSocket.connect()` registers handlers via `socketClient.on()` — survives socket reconnects
- PvP matchmaking uses `auth.user.username` over empty guest name
- Duplicate listener guard added to `socketClient.on()`
- `AchievementToast` slide-in entrance animation added

### Sprint 2 — Competitive Core 🔜
Enhanced game results screen, tournament mode with bracket UI.
