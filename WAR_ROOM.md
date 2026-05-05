# Trivia Masters — Sprint Tracker & Project Status

**Last Updated:** May 5, 2026
**Stack:** React + Vite + Zustand (client) · Express + Socket.IO + Drizzle ORM + PostgreSQL/pg (server)
**Codebase:** ~6,500 lines | Port: 5000 | DB: Replit PostgreSQL (14 tables)

---

## Current Status: Sprint 1 Complete — Sprint 2 Starting

---

## Codebase Inventory

### Backend (`server/`)

| File | Role | Status |
|------|------|--------|
| `index.ts` | Express entry point, port 5000 | ✅ Working |
| `routes.ts` | REST: `/api/auth/*`, `/api/leaderboard`, `/api/player/:id/*` | ✅ Working |
| `gameServer.ts` | Socket.IO hub, JWT handshake, game lifecycle, `getDbPlayerId()` | ✅ Working |
| `gameLogic.ts` | In-memory rooms, scoring, streak tracking, `maxStreakPerPlayer` | ✅ Working |
| `matchmaking.ts` | ELO queue, skill-range expansion, tier system | ✅ Complete |
| `questionBank.ts` | 270 questions (6 categories × 3 difficulties × 15 each) | ✅ Complete |
| `storage.ts` | Drizzle ORM + pg Pool, stats/leaderboard/achievements | ✅ Working |
| `authService.ts` | JWT sign/verify, bcrypt register/login/getUserById | ✅ Wired & working |
| `achievementService.ts` | 10 achievements, `checkAndAwardAchievements()`, `maxStreakPerPlayer` fix | ✅ Complete |
| `tournamentService.ts` | Tournament CRUD, bracket generation | ⚠️ Backend only — no game-room bridge, no UI |
| `socialService.ts` | Profiles, friends, messages, invites | ⚠️ Backend only — no socket handlers, no UI |
| `customCategoryService.ts` | UGC categories + ratings, CRUD, public/private | ✅ Fully wired |

### Frontend (`client/src/`)

| File | Role | Status |
|------|------|--------|
| `App.tsx` | Root: auth init, socket connect, global listeners, AchievementToast | ✅ Working |
| `GameUI.tsx` | Phase router: lobby → matchmaking → playing → results → profile | ✅ Working |
| `GameLobby.tsx` | Main menu, PvP/PvE entry, auth/profile buttons | ✅ Working |
| `Matchmaking.tsx` | PvP queue, category/difficulty select, auth name fix | ✅ Working |
| `TriviaGame.tsx` | Live game: timer (Date.now()-based), question, answers, scoreboard | ✅ Working |
| `GameResults.tsx` | End-of-game results, winner, scores, replay/menu | ✅ Working |
| `Leaderboard.tsx` | Global leaderboard via REST | ✅ Working |
| `CategorySelect.tsx` | Visual category showcase | ✅ Static display |
| `AuthModal.tsx` | Login/Register modal with tabs | ✅ Sprint 1 complete |
| `AchievementToast.tsx` | Slide-in achievement toast (entering/exiting animation) | ✅ Sprint 1 complete |
| `PlayerProfile.tsx` | Stats grid + achievement badge page | ✅ Sprint 1 complete |

### Shared (`shared/`)

| File | Role | Status |
|------|------|--------|
| `schema.ts` | 14 Drizzle tables + TypeScript interfaces including `maxStreakPerPlayer` in `GameRoom` | ✅ Current |

---

## Sprint 0 — Core Loop ✅ COMPLETE

**Goal:** One complete, satisfying game session end-to-end.

| # | Task | Status |
|---|------|--------|
| 1 | Fix answer tracking — `currentQuestionAnswers`, `correctAnswersPerPlayer` | ✅ Done |
| 2 | Add 10-question match limit — `questionIndex` + `maxQuestions` in GameRoom | ✅ Done |
| 3 | Fix PvE AI timing — event-driven (not polling interval) | ✅ Done |
| 4 | Build Results screen — winner, scores, streaks, replay/menu | ✅ Done |
| 5 | Fix PvE category/difficulty — passed from client through `joinPvE` | ✅ Done |
| 6 | Fix leaderboard score accumulation — accumulate, don't replace | ✅ Done |
| 7 | Expand question bank — 270 questions (was 18) | ✅ Done |
| 8 | Fix timer — `Date.now()`-based 100ms intervals (was choppy) | ✅ Done |

---

## Sprint 1 — Identity + Achievements ✅ COMPLETE

**Goal:** Reason to return — persistent identity, stats, and achievements.

| # | Task | Status |
|---|------|--------|
| 1 | JWT auth REST endpoints (register/login/me) | ✅ Done |
| 2 | Socket.IO JWT handshake — `socketToAuthId` map | ✅ Done |
| 3 | `AuthModal` component (login/register tabs) | ✅ Done |
| 4 | `PlayerProfile` page — stats grid, achievement badges | ✅ Done |
| 5 | `AchievementToast` — real-time socket-driven notification | ✅ Done |
| 6 | 10 achievements (4 rarity tiers) with `checkAndAwardAchievements()` | ✅ Done |
| 7 | GameLobby auth integration — sign in/out, profile button | ✅ Done |
| 8 | Switch DB driver from Neon to `pg` Pool | ✅ Done |

**Sprint 1 Code Audit — All 7 Bugs Fixed:**

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | Stats stored under `socket.id`, queried by numeric DB user ID → blank profile | Critical | `getDbPlayerId()` resolves to `"2"` for `user_2` |
| 2 | Streak achievements used `player.streak` (final) → never awarded mid-game streaks | Critical | Added `maxStreakPerPlayer` to `GameRoom`, tracked in `submitAnswer` |
| 3 | Leaderboard `bestStreak` used final streak → wrong DB value | Critical | Same `maxStreakPerPlayer` fix |
| 4 | `useSocket.connect()` handlers lost after reconnect → stale `isConnected` | Medium | Switched to `socketClient.on()` with persistent listener map |
| 5 | PvP matchmaking sent empty name for auth users | Medium | Added `useAuth.getState().user?.username` fallback |
| 6 | `socketClient.on()` could register duplicate handlers | Medium | Added `includes()` guard before push |
| 7 | `AchievementToast` had no entrance animation | Minor | Added `entering` state → `opacity-0 translate-x-full` → slide in |

---

## Sprint 2 — Competitive Core 🔜 PLANNED

**Goal:** Complete the competitive experience — polish results + add tournament play.

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Enhanced game results screen | High | Per-question breakdown, score animation, rematch button, ELO delta display |
| 2 | Tournament mode UI | High | Browse/create tournaments, join bracket, bracket visualization |
| 3 | Tournament → game room bridge | High | `tournamentService.ts` backend exists, needs Socket.IO room spawning |
| 4 | Tournament winner podium | Medium | End-of-tournament ceremony, prize pool display |

---

## Sprint 3 — Community Features 📋 PLANNED

**Goal:** Social layer — friends, invites, custom content.

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Friends list UI | High | `socialService.ts` backend complete, needs client |
| 2 | Game invite system | High | Send/receive/accept invites via socket |
| 3 | Custom categories UI | High | `customCategoryService.ts` fully wired, needs UI |
| 4 | Direct messages UI | Medium | Backend complete |
| 5 | Private match lobby | Medium | Invite-only rooms |

---

## Architecture Reference

### Real-Time Communication
```
Client → socket.io-client (JWT handshake) → Express → Socket.IO
  → GameServer (socketToAuthId map)
      → GameLogic (in-memory Maps, synchronous mutations)
          → Broadcasts: io.to(roomId).emit(event, payload)
```

**Scaling path:**
1. **MVP** (current): single process, in-memory state — handles ~100 concurrent rooms
2. **Scale**: Redis Socket.IO adapter for multi-server fan-out
3. **Scale+**: Separate matchmaking service, dedicated game room workers

### Player Identity Chain
```
Login → JWT → socketClient.reconnectWithToken(token)
  → new socket with auth: { token }
  → server: socketToAuthId.set(socket.id, "user_2")
  → getDbPlayerId(socket.id) → "user_2".replace("user_","") → "2"
  → storage.updateLeaderboard("2", ...) ← matches /api/player/2/stats
```

### Persistent Listener Pattern
```
socketClient.on(event, cb)
  → stored in this.listeners Map
  → attached to current socket
  → on reconnect: new socket created, all this.listeners re-attached
  → useSocket.connect() uses socketClient.on() — NOT socket.on() directly
```

---

## Technical Debt Log

| Item | File | Impact | Sprint |
|------|------|--------|--------|
| `@neondatabase/serverless` still in package.json (unused) | `package.json` | Low (dead dep) | Cleanup |
| Guest players produce no persistent stats | `gameServer.ts` | Low (by design) | — |
| Question bank is static code, not DB | `questionBank.ts` | Medium (no admin UI) | Sprint 3+ |
| Social socket handlers not implemented | `socialService.ts` | Medium | Sprint 3 |
| Tournament game-room bridge not built | `tournamentService.ts` | High | Sprint 2 |
| CORS `origin: "*"` in dev mode | `gameServer.ts` | Low (dev only) | Pre-deploy |
