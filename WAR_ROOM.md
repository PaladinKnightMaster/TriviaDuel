# Trivia Masters — Sprint Tracker & Project Status

**Last Updated:** June 7, 2026
**Stack:** React + Vite + Zustand (client) · Express + Socket.IO + Drizzle ORM + PostgreSQL/pg (server)
**Codebase:** ~8,200 lines | Port: 5000 | DB: Replit PostgreSQL (14 tables)

---

## Current Status: Sprint 2 Complete — Sprint 3 Planned

---

## Codebase Inventory

### Backend (`server/`)

| File | Role | Status |
|------|------|--------|
| `index.ts` | Express entry point, port 5000 | ✅ Working |
| `routes.ts` | REST: `/api/auth/*`, `/api/leaderboard`, `/api/player/:id/*`, `/api/tournaments/*` | ✅ Working |
| `gameServer.ts` | Socket.IO hub, JWT handshake, game lifecycle, tournament bridge, `authToSocketId` reverse map | ✅ Working |
| `gameLogic.ts` | In-memory rooms, scoring, streak + correct-answer tracking, `maxStreakPerPlayer` | ✅ Working |
| `matchmaking.ts` | ELO queue, skill-range expansion, tier system | ✅ Complete |
| `questionBank.ts` | 270 questions (6 categories × 3 difficulties × 15 each) | ✅ Complete |
| `storage.ts` | Drizzle ORM + pg Pool, stats / leaderboard / achievements | ✅ Working |
| `authService.ts` | JWT sign/verify, bcrypt register/login/getUserById | ✅ Working |
| `achievementService.ts` | 10 achievements, `checkAndAwardAchievements()`, `maxStreakPerPlayer` fix | ✅ Complete |
| `tournamentService.ts` | Tournament CRUD, bracket gen, `getMatch`, `updateMatchRoom`, `getPendingMatches`, `getAllTournaments` | ✅ Fully wired |
| `socialService.ts` | Friends, messages, invites — backend only | ⚠️ No socket handlers / UI |
| `customCategoryService.ts` | UGC categories + ratings, CRUD, public/private | ⚠️ Backend wired — no UI |

### Frontend (`client/src/`)

| File | Role | Status |
|------|------|--------|
| `App.tsx` | Root: auth init, socket connect, global event listeners (game + tournament), AchievementToast | ✅ Working |
| `GameUI.tsx` | Phase router: menu → matchmaking → playing → results → tournament → profile | ✅ Working |
| `GameLobby.tsx` | Main menu, PvP / PvE / Tournament entry, auth + profile buttons | ✅ Working |
| `Matchmaking.tsx` | PvP queue, category/difficulty select | ✅ Working |
| `TriviaGame.tsx` | Live game: timer, question, answers, scoreboard | ✅ Working |
| `GameResults.tsx` | Confetti, score count-up, correct-answer count, accuracy %, best streak, "View Bracket" for tournaments | ✅ Sprint 2 |
| `Tournament.tsx` | Browse all tournaments (REST), create form, join button, real-time updates | ✅ Sprint 2 |
| `TournamentBracket.tsx` | Round columns, match cards, "Play Match" → game-room bridge | ✅ Sprint 2 |
| `Leaderboard.tsx` | Global leaderboard via REST | ✅ Working |
| `CategorySelect.tsx` | Visual category showcase | ✅ Static |
| `AuthModal.tsx` | Login/Register modal | ✅ Sprint 1 |
| `AchievementToast.tsx` | Slide-in achievement toast | ✅ Sprint 1 |
| `PlayerProfile.tsx` | Stats grid + achievement badge page | ✅ Sprint 1 |

### State Stores (`client/src/lib/stores/`)

| Store | Responsibility |
|-------|----------------|
| `useTrivia.tsx` | Game phase, question state, results (`correctAnswersPerPlayer`, `maxStreakPerPlayer`) |
| `useSocket.tsx` | Socket connection, room state, game actions |
| `useAuth.ts` | JWT auth state, login/register/logout, localStorage |
| `useTournament.ts` | Tournament list, current tournament, bracket matches, pending match room |

### Shared (`shared/`)

| File | Role | Status |
|------|------|--------|
| `schema.ts` | 14 Drizzle tables + TypeScript interfaces; `GameRoom` includes `maxStreakPerPlayer` + `tournamentMatchId?` | ✅ Current |

---

## Sprint 0 — Core Loop ✅ COMPLETE

**Goal:** One complete, satisfying game session end-to-end.

| # | Task | Status |
|---|------|--------|
| 1 | Fix answer tracking — `currentQuestionAnswers`, `correctAnswersPerPlayer` | ✅ |
| 2 | Add 10-question match limit — `questionIndex` + `maxQuestions` in `GameRoom` | ✅ |
| 3 | Fix PvE AI timing — event-driven (not polling interval) | ✅ |
| 4 | Build Results screen — winner, scores, streaks, replay/menu | ✅ |
| 5 | Fix PvE category/difficulty — passed through `joinMatchmaking` | ✅ |
| 6 | Fix leaderboard score accumulation — accumulate, don't replace | ✅ |
| 7 | Expand question bank — 270 questions (was 18) | ✅ |
| 8 | Fix timer — `Date.now()`-based 100 ms intervals (was choppy) | ✅ |

---

## Sprint 1 — Identity + Achievements ✅ COMPLETE

**Goal:** Reason to return — persistent identity, stats, and achievements.

| # | Task | Status |
|---|------|--------|
| 1 | JWT auth REST endpoints (register / login / me) | ✅ |
| 2 | Socket.IO JWT handshake — `socketToAuthId` map | ✅ |
| 3 | `AuthModal` component (login/register tabs) | ✅ |
| 4 | `PlayerProfile` page — stats grid, achievement badges, progress bars | ✅ |
| 5 | 10 achievements with rarity tiers (common → legendary) | ✅ |
| 6 | `AchievementToast` slide-in animation | ✅ |
| 7 | Auth name surfaced in PvP matchmaking | ✅ |

**Sprint 1 Code Audit — Bugs Fixed:**
1. Stats/ELO stored under `socket.id` → now uses `getDbPlayerId()` → numeric DB user ID (fixes blank profile page)
2. Achievement streak checks used final `player.streak` → now uses `room.maxStreakPerPlayer` (fixes streak_3/5/10 never firing)
3. Leaderboard `bestStreak` was final streak → now uses `maxStreakPerPlayer`
4. `useSocket.connect()` handlers lost after reconnect → switched to `socketClient.on()`
5. PvP matchmaking sent empty name for auth users → now uses `useAuth.getState().user?.username`
6. `socketClient.on()` could register duplicate handlers → added `includes()` guard
7. `AchievementToast` popped in instantly → added `entering` state for CSS slide-in

---

## Sprint 2 — Competitive Core ✅ COMPLETE

**Goal:** Bracket competition + richer post-game feedback.

### What Was Built

| # | Task | Status |
|---|------|--------|
| 1 | Enhanced `GameResults` — score count-up animation, correct-answer count, accuracy %, best streak | ✅ |
| 2 | Confetti on win (`react-confetti`, `recycle={false}`) | ✅ |
| 3 | `correctAnswersPerPlayer` + `maxStreakPerPlayer` added to `gameEnded` socket payload | ✅ |
| 4 | `tournamentMatchId?` added to `GameRoom` interface and threaded through `gameEnded` | ✅ |
| 5 | `Tournament.tsx` — browse (REST), create form, join, real-time socket updates | ✅ |
| 6 | `TournamentBracket.tsx` — round columns, match cards (pending/in_progress/completed), "Play Match" | ✅ |
| 7 | `useTournament` Zustand store — tournament state, socket action wrappers | ✅ |
| 8 | `tournamentService.ts` additions — `getMatch`, `updateMatchRoom`, `getPendingMatches`, `getAllTournaments` | ✅ |
| 9 | `gameServer.ts` — `authToSocketId` reverse map, `joinTournamentMatch` handler, enriched `finishGame` | ✅ |
| 10 | Tournament game-room bridge — auto-creates 1v1 PvP room on first `joinTournamentMatch`, auto-starts on second | ✅ |
| 11 | Post-game bridge — `finishGame` calls `updateMatchResult`, emits `tournamentUpdated` to bracket room | ✅ |
| 12 | Auto-start tournament when `currentPlayers >= maxPlayers` (server only; emits `tournamentStarted` + `tournamentUpdated`) | ✅ |
| 13 | REST: `GET /api/tournaments`, `POST /api/tournaments`, `GET /api/tournaments/:id`, `GET /api/tournaments/:id/matches` | ✅ |
| 14 | GameLobby — Tournament Mode entry button | ✅ |
| 15 | `GameResults` — "View Bracket" button replaces "Play Again" for tournament match results | ✅ |

### Sprint 2 Code Audit — Bugs Fixed

1. **Double bracket generation** — `tournamentService.joinTournament` also called `startTournament` internally AND `gameServer.joinTournament` called it again → duplicate matches. Fixed: removed internal call from service; `gameServer` is the sole orchestrator.
2. **Premature phase transition** — "Play Match" called `setPhase('playing')` immediately; first player saw empty game screen before opponent joined. Fixed: removed from button; phase transition is now driven solely by `gameStarted` socket event in `App.tsx`.
3. **Tournament room maxPlayers=4** — PvP rooms default to 4. Tournament rooms must cap at 2. Fixed: `room.maxPlayers = 2` added after room creation in `joinTournamentMatch`.
4. **`getTournaments` socket only returned `registration`-status** — `getActiveTournaments()` excluded in-progress tournaments. Fixed: changed socket handler to use `getAllTournaments()`.
5. **Dead code** — Unused `clearTournament` / `currentTournament` imports removed from `GameUI.tsx`.
6. **`useSocket` missing import in `TriviaGame.tsx`** — was used but not imported. Added.
7. **Wrong relative import path in `useTournament.ts`** — `../../../shared/schema` was one level too shallow. Corrected to `../../../../shared/schema`.

---

## Sprint 3 — Social Layer + Community ⬜ PLANNED

**Goal:** Reason to bring friends — private matches, friends list, custom content, tournament UX polish.

### Group A: Friends & Social *(uses existing `socialService.ts` backend)*

| # | Task | Priority | Notes |
|---|------|----------|-------|
| A1 | `FriendsPanel.tsx` — search by username, send/accept/decline requests | High | `socialService.sendFriendRequest`, `acceptFriendRequest` |
| A2 | Friends sidebar/overlay — online status indicator, "Invite to Match" button | High | Socket events: `friendOnline` / `friendOffline` |
| A3 | Friend leaderboard tab in `Leaderboard.tsx` | Medium | New REST: `GET /api/leaderboard/friends/:userId` |
| A4 | Public profile view by username — add/remove friend button when viewing others | Medium | Extend `PlayerProfile.tsx` for non-self view |

### Group B: Private Matches *(uses existing invite infrastructure)*

| # | Task | Priority | Notes |
|---|------|----------|-------|
| B1 | Private room creation — host picks settings, gets a 6-char room code | High | New socket: `createPrivateRoom` |
| B2 | Join by room code from lobby | High | New socket: `joinPrivateRoom` |
| B3 | Invite via `socialService.sendInvite` → push notification to friend's socket | High | Uses `authToSocketId` reverse map |
| B4 | Waiting room UI — shows both players, ready-up button | Medium | Reuse `Matchmaking.tsx` pattern |

### Group C: Custom Categories UI *(backend 100% done in `customCategoryService.ts`)*

| # | Task | Priority | Notes |
|---|------|----------|-------|
| C1 | `CustomCategoryBrowser.tsx` — browse public categories, star ratings, question counts | High | Socket: `getPublicCategories` |
| C2 | `CustomCategoryEditor.tsx` — create category, add questions (up to 20), public/private toggle | High | Socket: `createCustomCategory`, `addCustomQuestion` |
| C3 | Play button on category card → launch PvE/PvP with custom question bank | High | Pass `customCategoryId` through `joinMatchmaking` |
| C4 | Rating widget — thumbs up/down or star rating on category cards | Medium | Socket: `rateCategory` |

### Group D: Polish & Tournament UX

| # | Task | Priority | Notes |
|---|------|----------|-------|
| D1 | Player names in tournament bracket — resolve DB player ID → username | High | `GET /api/player/:id/stats` already returns name |
| D2 | Quick rematch after PvP game — "Rematch" sends invite to opponent | Medium | New socket: `requestRematch` |
| D3 | In-game "opponent joined" notification before `gameStarted` | Medium | Emit `opponentJoined` from `joinTournamentMatch` |
| D4 | Mobile layout pass — responsive breakpoints across lobby + game screens | Medium | TailwindCSS `sm:` / `md:` prefixes |
| D5 | Tournament winner podium — animated reveal, trophy icon, final standings | Low | New screen after last bracket match |

---

## Architecture Reference

### Real-Time Communication
```
Client → socket.io-client (JWT handshake) → Express → Socket.IO
  → GameServer
      ├── socketToAuthId:  socket.id  → "user_2"   (forward)
      ├── authToSocketId:  "user_2"   → socket.id  (reverse — Sprint 2)
      └── GameLogic (in-memory Maps, synchronous)
              → Broadcasts: io.to(roomId).emit(event, payload)
```

### Player Identity Chain
```
Login → JWT → socketClient.reconnectWithToken(token)
  → new socket with auth: { token }
  → server: socketToAuthId.set(socket.id, "user_2")
           authToSocketId.set("user_2", socket.id)   ← added Sprint 2
  → getDbPlayerId(socket.id) → "2"
  → storage.updateLeaderboard("2", ...) ← matches /api/player/2/stats
```

### Tournament Match Bridge (Sprint 2)
```
Player A: joinTournamentMatch({ matchId })
  → server creates room tmatch_N (pvp, maxPlayers=2, tournamentMatchId=N)
  → Player A joins room — waits

Player B: joinTournamentMatch({ matchId })
  → server: 2 human players → playerReady(both) → game starts
  → io.to(room).emit('gameStarted') + emitNewQuestion
  → App.tsx gameStarted handler → setPhase('playing')

Game ends → finishGame()
  → updateMatchResult(matchId, winnerId, scores)
  → io.to('tournament_N').emit('tournamentUpdated')
  → next round OR tournamentComplete
```

### Persistent Socket Listener Pattern
```
socketClient.on(event, cb)
  → stored in this.listeners Map (survives reconnects)
  → attached to current socket
  → on reconnect: new socket + all this.listeners re-attached
  → socketClient.off(event, cb) → removes from Map AND socket
```

### Game Phase State Machine
```
menu → matchmaking → playing → results → menu
  ↑                                        ↓
  └──────────── tournament ────────────────┘
       (browse/create → bracket → playing → results → bracket)
```

---

## Technical Debt Log

| Item | File | Impact | Sprint |
|------|------|--------|--------|
| `@neondatabase/serverless` in package.json (unused) | `package.json` | Low | Cleanup |
| Guest players produce no persistent stats | `gameServer.ts` | Low (by design) | — |
| Question bank is static code, not DB | `questionBank.ts` | Medium | Sprint 3+ |
| Social socket handlers not wired | `gameServer.ts` / `socialService.ts` | High | Sprint 3 |
| Custom category — no browse/create UI | `customCategoryService.ts` | High | Sprint 3 |
| Player names in tournament bracket show as IDs | `TournamentBracket.tsx` | Medium | Sprint 3 |
| No rematch flow after PvP | `GameResults.tsx` | Medium | Sprint 3 |
| CORS `origin: "*"` in dev mode | `gameServer.ts` | Low | Pre-deploy |
