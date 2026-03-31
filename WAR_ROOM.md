# Trivia Masters — War Room Analysis & MVP Roadmap

**Date:** March 31, 2026
**Team:** Cross-functional (FE · BE · Mobile · AI/ML · UX · DevOps · PM · BA · Marketing · Quiz Consultant)
**Codebase size:** ~4,200 lines | **Server:** Running on port 5000 | **DB:** Neon PostgreSQL (14 tables synced)

---

## 1. Project Overview

Real-time multiplayer trivia battle game with PvP and PvE (AI opponent) modes. Stack:

- **Client:** React 18 + Vite + Zustand + Socket.IO-client + TailwindCSS + shadcn/ui
- **Server:** Express + Socket.IO 4 + Drizzle ORM + Neon PostgreSQL
- **Shared:** TypeScript types and Drizzle schema in `/shared/schema.ts`
- **Auth:** bcrypt (built, not yet wired to routes)
- **Real-time:** Socket.IO WebSocket with polling fallback

---

## 2. Codebase Inventory

### Backend (`server/`)

| File | Role | Status |
|------|------|--------|
| `index.ts` | Express entry point, port 5000 | ✅ Working |
| `routes.ts` | REST: `/api/leaderboard`, `/api/player/:id/stats` | ✅ Working |
| `gameServer.ts` | Socket.IO hub — all real-time events | ✅ Core works, gaps noted |
| `gameLogic.ts` | In-memory rooms, question timing, scoring | ⚠️ Critical gap: answer tracking |
| `matchmaking.ts` | ELO queue, skill-based matching | ✅ Complete |
| `questionBank.ts` | Static question data | 🔴 Only 18 questions |
| `storage.ts` | Drizzle ORM + Neon + in-memory fallback | ✅ Fixed |
| `authService.ts` | bcrypt register/login | ⚠️ Built, not wired |
| `tournamentService.ts` | Tournament CRUD, bracket generation | ⚠️ Built, no game-room bridge |
| `socialService.ts` | Profiles, friends, messages, invites | 🔴 Built, zero socket handlers |
| `customCategoryService.ts` | UGC categories + ratings | ✅ Fully wired |

### Frontend (`client/src/`)

| File | Role | Status |
|------|------|--------|
| `App.tsx` | Root: socket connection + event listeners | ✅ Working |
| `GameUI.tsx` | Phase router: menu → matchmaking → playing → results | 🔴 Results = placeholder |
| `GameLobby.tsx` | Main menu, PvP/PvE entry, player name | ✅ Working |
| `Matchmaking.tsx` | PvP lobby, category/difficulty select, ready-up | ✅ Working |
| `TriviaGame.tsx` | Live game: timer, question, answers, scoreboard | ⚠️ No answer-all detection |
| `Leaderboard.tsx` | Fetches `/api/leaderboard`, displays rankings | ✅ Working |
| `CategorySelect.tsx` | Visual category showcase | ✅ Static display |

### Database Schema (`shared/schema.ts`) — 14 Tables

All tables now synced to Neon PostgreSQL:

`users` · `game_stats` · `leaderboards` · `tournaments` · `tournament_participants` · `tournament_matches` · `custom_categories` · `custom_questions` · `category_ratings` · `player_profiles` · `friendships` · `player_messages` · `game_invites` · `player_achievements`

---

## 3. Critical Bugs (Blockers)

### BUG-01 — `checkAllPlayersAnswered` hardcoded `return false`
**File:** `gameServer.ts` line 341
**Impact:** PvP games never auto-advance. Players who answer instantly wait the full timer every time.

### BUG-02 — No per-question answer tracking
**File:** `gameLogic.ts` — `GameRoom` has no `answeredPlayers` field
**Impact:** Even if BUG-01 is fixed, there is nowhere to record who answered the current question.

### BUG-03 — No question count limit
**File:** `questionBank.ts` — `getRandomQuestion()` only returns `null` when list is empty
**Impact:** With 3 questions per (category + difficulty), match ends after ~3 random questions. No concept of "play 10 questions."

### BUG-04 — PvE AI interval timing broken
**File:** `gameServer.ts` `startAIBehavior()` — polls every 15s; questions last 15–25s
**Impact:** AI consistently misses or double-answers questions mid-game.

### BUG-05 — Results screen is a placeholder
**File:** `GameUI.tsx` line 18: `case 'results': return <div>Results coming soon...</div>`
**Impact:** Every game ends on a blank div. No winner, no scores, no replay.

### BUG-06 — Auth disconnected from game identity
**Impact:** Players identified by `socket.id` — new random ID every session. ELO and stats are permanently lost on reconnect.

---

## 4. High Priority Gaps

| # | Gap | Impact |
|---|-----|--------|
| 7 | Question bank: 18 questions total | Games repeat after 3 questions |
| 8 | PvE ignores category/difficulty selection — hardcoded `'general', 'medium'` | UX broken |
| 9 | Leaderboard replaces score instead of accumulating | Bad game erases lifetime high score |
| 10 | Social service: zero socket event handlers | Entire social layer unreachable |
| 11 | Tournament matches never spawn game rooms | Tournament system non-functional end-to-end |
| 12 | CORS `origin: "*"` | Security risk for production |
| 13 | PvP: only one player sees `gameStarted` event | Opponent stuck in lobby |
| 14 | `game_stats.playerId` has no unique constraint | Multiple rows per player possible |

---

## 5. Architecture Analysis

### Real-Time Communication

```
Client → socket.io-client → Express HTTP → Socket.IO → GameLogic (in-memory Maps)
```

**Current pattern:** Correct. All game state mutations are synchronous. Targeted `io.to(roomId).emit()` for broadcasts. Sub-50ms latency for same-region players on WebSocket transport.

**Scaling path:**
1. MVP: single process, in-memory state — handles ~100 concurrent rooms
2. Scale: Add Redis adapter to Socket.IO for multi-server fan-out
3. Scale+: Separate matchmaking service, dedicated game room workers

**Performance recommendation (core goal):** The Socket.IO + Node architecture is optimal for this use case. Key optimizations for world-class performance:
- All game state mutations synchronous in GameLogic ✅
- Use room-targeted broadcasts (not global) ✅
- Pre-load questions at game start (avoid DB latency mid-game) — needed
- Redis pub/sub for horizontal scaling — Phase 2

### Database Design Notes

- `game_stats.playerId` lacks `.unique()` — upsert conflict target will fail silently
- Questions stored in code, not DB — limits admin management and bulk import
- Leaderboard `updateLeaderboard` replaces score on upsert instead of accumulating

---

## 6. Task List Reality Check

| Task | Claimed | Actual |
|------|---------|--------|
| Fix TypeScript errors | ✅ completed | ✅ Confirmed |
| WebSocket integration | ✅ completed | ✅ Works, gaps noted |
| Database persistence | ✅ completed | ⚠️ 2 bugs fixed in review |
| PvE mode | 🔄 in_progress | ⚠️ Runs, AI timing broken, category ignored |
| Game flow / question progression | ⏳ pending | 🔴 Broken — no answer tracking, no question limit |
| Skill-based matchmaking | ⏳ pending | ✅ Actually complete — ELO + tier system done |
| Tournament mode | ⏳ pending | ⚠️ Backend built, no game-room bridge, no UI |
| Custom categories | ⏳ pending | ✅ Actually complete and fully wired |
| Social features | ⏳ pending | ⚠️ Backend complete, zero client exposure |
| Achievement system | ⏳ pending | 🔴 Schema only, no service, no triggers |

---

## 7. Confirmed Working Features

1. WebSocket connection — players connect reliably
2. PvE game launch — room creation, AI spawns, game starts
3. Question display with countdown timer
4. Answer submission + server-side validation
5. Score and streak tracking (in-memory)
6. ELO rating system (logic complete, pending persistent identity)
7. Custom categories — full CRUD, ratings, public/private
8. Leaderboard REST endpoint — DB-backed and working
9. Matchmaking queue — skill range expands over wait time
10. DB schema — all 14 tables synced to Neon

---

## 8. Market & Defensibility Assessment

### Market Landscape

Real-time trivia is proven: HQ Trivia peaked at 2.3M concurrent players, Kahoot at 300M users, QuizDuel generated $50M+ ARR.

### Competitive Differentiation

| Feature | HQ Trivia | Trivia Crack | Kahoot | This Project |
|---------|-----------|-------------|--------|-------------|
| Real-time PvP | ✅ | ❌ (async) | Partial | ✅ |
| ELO Matchmaking | ❌ | ❌ | ❌ | ✅ |
| User-generated content | ❌ | ❌ | ✅ | ✅ |
| Tournament brackets | ❌ | ❌ | ❌ | ✅ |
| PvE AI practice | ❌ | ❌ | ❌ | ✅ |
| Persistent social graph | ❌ | ❌ | Limited | ✅ |

**Technical moat:** Real-time ELO matchmaking + UGC categories + tournament brackets is genuinely uncommon and defensible if executed at quality.

**Biggest risk:** Shipping the game with the 6 critical bugs above. The core PvP loop must work flawlessly before any other feature ships.

---

## 9. MVP Development Roadmap

### 🔴 SPRINT 0 — Core Loop (1 week) — "Make it actually playable"

Fix everything required for one complete, satisfying game session end-to-end.

1. Fix answer tracking — Add `answeredPlayers` per room/question, fix `checkAllPlayersAnswered`
2. Add 10-question match limit — `questionIndex` + `maxQuestions` in GameRoom
3. Fix PvE AI timing — event-driven response, not polling
4. Build Results screen — winner, scores, streaks, replay/menu buttons
5. Fix PvE category/difficulty — pass user selection through matchmaking
6. Fix leaderboard score accumulation — sum scores, don't replace
7. Fix `game_stats` unique constraint on `playerId`
8. Expand question bank — minimum 30 questions per category (180 total)

### 🟡 SPRINT 1 — Identity + Content (1–2 weeks) — "Reason to return"

9. Wire AuthService to REST routes — login/register endpoints
10. JWT/session — replace socket.id with authenticated user ID
11. Expand to 200+ questions per category — integrate Open Trivia DB API
12. Achievement system service — 10 core achievements with triggers
13. Wire social socket handlers — friends, messages, invites (backend ready)
14. Player profile page — stats, tier badge, achievement grid

### 🟢 SPRINT 2 — Advanced Features (2–3 weeks) — "Defensibility"

15. Tournament → game room bridge — spawn Socket.IO rooms for bracket matches
16. Tournament UI — browse, join, bracket visualization
17. Friends list + game invites UI
18. CORS lockdown — environment-based origin whitelist
19. CI/CD pipeline — GitHub Actions → auto-deploy
20. Redis Socket.IO adapter — horizontal scaling prep
21. Observability — structured logging, Sentry error tracking

---

## 10. Immediate Fixes Applied (Review Session)

| Fix | File | What |
|-----|------|------|
| ✅ DB schema synced | All 14 tables | `npm run db:push` — leaderboards table was missing |
| ✅ Null-safe leaderboard | `storage.ts` | Empty table returned null, crashing `.map()` |
| ✅ Schema field bug | `shared/schema.ts` | `insertUserSchema` picked `password` (nonexistent), fixed to `passwordHash` |

---

*End of War Room Report — Sprint 0 execution begins immediately.*
