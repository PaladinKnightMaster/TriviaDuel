# Trivia Masters

A real-time multiplayer trivia battle game with PvP and PvE modes, full user authentication, achievement system, player profiles, friends system, private matches, and community-created categories.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Zustand + TailwindCSS + shadcn/ui
- **Backend:** Express + Socket.IO 4 + Drizzle ORM + PostgreSQL (pg Pool driver)
- **Auth:** JWT (jsonwebtoken) + bcrypt — full register/login/session
- **Real-time:** Socket.IO WebSocket with polling fallback + JWT handshake auth

## Architecture

```
client/              # React SPA (Vite, port 5000 via proxy)
  src/
    App.tsx          # Root: auth init, socket connect, global event listeners,
                     # AchievementToast, MatchInviteToast
                     # Persistent listeners: gameStarted, gameEnded, achievementUnlocked,
                     #   privateRoomCreated, joinedPrivateRoom, matchInviteReceived,
                     #   friendRequestReceived, friendOnline/Offline
    components/
      GameLobby.tsx  # Main menu — PvP/PvE/Community/Private/Tournament buttons,
                     # auth + profile + friends buttons (badge on pending requests)
      Matchmaking.tsx # PvP lobby + private room lobby (code display, copy, friend invite)
      TriviaGame.tsx  # Live game: timer, question, answer buttons, scoreboard
      GameResults.tsx # End-of-game: confetti, score count-up, correct answers, best streak
      GameUI.tsx      # Phase router: menu → matchmaking → playing → results →
                     #   tournament → custom → profile overlay
      Leaderboard.tsx # Global + Friends leaderboard tabs (REST API)
      CategorySelect.tsx # Static category showcase
      AuthModal.tsx   # Login/Register modal with tabs (Sprint 1)
      AchievementToast.tsx # Real-time achievement popup, slide-in animation (Sprint 1)
      PlayerProfile.tsx    # Stats + achievement badges page (Sprint 1)
      Tournament.tsx  # Browse/create/join tournaments lobby (Sprint 2)
      TournamentBracket.tsx # Bracket visualization + "Play Match" bridge (Sprint 2)
      FriendsPanel.tsx     # Slide-in panel: Search/Friends/Requests tabs (Sprint 3A)
      PrivateMatchModal.tsx # Create/Join private room modal (Sprint 3B)
      MatchInviteToast.tsx  # Incoming invite overlay, 30s auto-dismiss (Sprint 3B)
      CustomCategoryBrowser.tsx # Full-page browser: Browse/Mine tabs, search,
                                #   star rating, play, delete (Sprint 3C)
      CustomCategoryEditor.tsx  # 2-step modal: create category → add questions (Sprint 3C)
    lib/
      socket.ts       # Raw socket.io-client + JWT handshake + reconnectWithToken()
                      # socketClient.on() stores listeners and re-attaches on reconnect
                      # Duplicate listener guard prevents double-registration
      stores/
        useTrivia.tsx  # Zustand: game phase (GamePhase), question state, results
        useSocket.tsx  # Zustand: socket actions — joinMatchmaking(mode,cat,diff,customCategoryId?)
        useAuth.ts     # Zustand: JWT auth state, login/register/logout + localStorage
        useTournament.ts # Zustand: tournament state — browse, current, bracket, pending match
        useSocial.ts    # Zustand: friends list, pending requests, online status (Sprint 3A)
        usePrivateMatch.ts # Zustand: incomingInvite state (Sprint 3B)
        useCustomCategory.ts # Zustand: publicCategories, myCategories, searchResults (Sprint 3C)

server/
  index.ts            # Express entry point, port 5000
  routes.ts           # REST: /api/auth/*, /api/leaderboard, /api/leaderboard?friendIds=,
                      #   /api/player/:id/*, /api/tournaments/*
  gameServer.ts       # Socket.IO hub: JWT handshake, real-time events, achievement triggers
                      # getDbPlayerId(): resolves socket.id → "user_2" → "2" for DB writes
                      # authToSocketId reverse map: authId → socket.id (tournament + invite)
                      # customCategoryUserId(): socketToAuthId.get(id) || id (stable for auth users)
                      # joinTournamentMatch: creates PvP room, auto-starts when both join
                      # joinMatchmaking: now accepts customCategoryId → fetches + loads questions
                      # finishGame: correctAnswersPerPlayer + maxStreakPerPlayer in gameEnded
                      # Tournament bridge: updateMatchResult + tournamentUpdated after match ends
                      # Private rooms: privateRoomCodes Map, createPrivateRoom, joinPrivateRoom,
                      #   inviteToMatch — code cleaned up on last player disconnect
                      # Social handlers: searchPlayers, sendFriendRequest, respondToFriendRequest,
                      #   getFriends, getFriendRequests, online/offline notifications
                      # Custom category handlers: createCustomCategory, addCustomQuestion,
                      #   getPublicCategories, getUserCategories, deleteCustomCategory, rateCategory
  gameLogic.ts        # In-memory rooms, answer tracking, maxStreakPerPlayer tracking
                      # customQuestionsMap: Map<roomId, Question[]> — per-room custom Q bank
                      # setCustomQuestions(roomId, questions, maxQuestionsOverride?) — loaded pre-game
                      # nextQuestion(): custom questions take priority over built-in bank
                      # deleteRoom(): cleans up customQuestionsMap entry
  matchmaking.ts      # ELO queue, skill-based matching, tier system
  questionBank.ts     # 270 questions (6 categories × 3 difficulties × 15 questions)
  storage.ts          # Drizzle ORM + PostgreSQL (pg Pool driver) + in-memory fallback
  authService.ts      # JWT signToken/verifyToken + bcrypt register/login/getUserById
  achievementService.ts # 10 achievements — checkAndAwardAchievements() uses maxStreakPerPlayer
  tournamentService.ts # Tournament CRUD + bracket gen + getMatch/updateMatchRoom/getPendingMatches
  socialService.ts    # Profiles, friends, messages, invites — full CRUD
  customCategoryService.ts # UGC categories + ratings — full CRUD, public/private, search

shared/
  schema.ts           # Drizzle schema (14 tables) + shared TypeScript interfaces
                      # GameRoom: maxStreakPerPlayer, tournamentMatchId?, isPrivate?,
                      #   privateCode?, customCategoryId?
                      # GamePhase: 'menu'|'matchmaking'|'playing'|'results'|'tournament'|'custom'
```

## Database (PostgreSQL — 14 tables)

Uses Replit's built-in PostgreSQL via **`drizzle-orm/node-postgres`** (pg Pool).
> ⚠️ Do NOT use `drizzle-orm/neon-http` — this env is standard PostgreSQL, not Neon serverless cloud.

Key tables:
- `users` — id (serial PK), username (unique), password_hash (bcrypt)
- `game_stats` — playerId (unique text), totalGames, wins, losses, averageScore, bestStreak, rating, tier
- `leaderboards` — playerId (unique text), playerName, totalScore (accumulated), gamesWon, bestStreak, rank
- `player_achievements` — playerId, achievementId, progress, maxProgress, unlocked, unlockedAt
- `player_profiles` — playerId, displayName, bio, avatar, isPublic, favoriteCategories
- `friendships` — requesterId, recipientId, status (pending/accepted/rejected/blocked)
- `custom_categories` — id, name, description, createdBy (auth: "user_N", guest: socket.id), isPublic, questionCount, plays, rating
- `custom_questions` — id, categoryId, question, option1-4, correctAnswer, difficulty, explanation
- `category_ratings` — categoryId, playerId, rating (1-5), review
- `tournaments`, `tournament_participants`, `tournament_matches`, `player_messages`, `game_invites`

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
- Component-level one-shot handlers (editor, modals) use `socketClient.on/off` in useEffect with cleanup

## Custom Category Ownership Pattern (Sprint 3C)

Critical pattern — auth users must retain ownership of categories across reconnects:
- `customCategoryUserId()` = `this.socketToAuthId.get(socket.id) || socket.id`
- Auth users get `"user_N"` — stable identifier that survives socket reconnects
- Guests get `socket.id` — volatile, but acceptable since guests have no persistent identity
- Used in: `createCustomCategory`, `getUserCategories`, `updateCustomCategory`, `deleteCustomCategory`, `rateCategory`

## Private Room Pattern (Sprint 3B)

- **Code**: 6-char, charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous I/O/0/1)
- **Server**: `privateRoomCodes: Map<string, string>` (code→roomId); cleanup on last player disconnect
- **Flow**: `createPrivateRoom` → `roomUpdated` + `privateRoomCreated{code}` → App.tsx → `setPhase('matchmaking')`
- **Join**: `joinPrivateRoom{code}` → 5-guard validation → `roomUpdated` to room + `joinedPrivateRoom` to joiner
- **Invite**: `inviteToMatch{targetPlayerId, roomCode}` → `authToSocketId` lookup → `matchInviteReceived` toast

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
2. **Matchmaking** — PvP queue with ELO-based pairing; PvE instant start; private room code display
3. **Playing** — up to 10 questions, 30s timer each, real-time scoring + streaks
4. **Results** — final scoreboard, winner, ELO update, achievements triggered
5. **Profile** (overlay) — stats grid, achievement badges, progress bars
6. **Community** ('custom' phase) — browse/create/play community category sets
7. **Tournament** — bracket-style elimination competitions

## Custom Category Play Flow

1. User clicks "Community Trivia" → `setPhase('custom')` → `CustomCategoryBrowser`
2. Browse tab fetches public categories via `getPublicCategories` socket emit
3. User clicks "Play" on a card → `joinMatchmaking('pve', 'custom', 'mixed', categoryId)`
4. Server fetches questions via `getCategory(id, includeQuestions: true)`, maps to `Question[]`
5. `setCustomQuestions(roomId, questions, min(count, 10))` pre-loads into `gameLogic`
6. `nextQuestion()` uses custom pool (random from unused) instead of built-in bank
7. After 800ms, client transitions to `setPhase('playing')`

## Scoring

- Base points: easy=100, medium=150, hard=200
- Time bonus: proportional to remaining time (max 50 pts)
- Streak bonus: every 3rd consecutive correct answer adds `(streak/3) * 50` pts
- `maxStreakPerPlayer` tracked in `GameRoom` — updated in `gameLogic.submitAnswer()` on each correct answer

## Known Patterns / Notes

- Leaderboard shows `[]` when no authenticated players have completed games (guest stats not persisted)
- AI opponent answers with 1–4s delay, adaptive accuracy based on human performance
- Question IDs are deterministic (`category_difficulty_question[0:30]`) — no dedup issues across sessions
- Custom question IDs use `custom_${dbId}` format — guaranteed unique per room via `usedIds` filter
- `correctAnswersPerPlayer` + `fastestAnswerMsPerPlayer` + `maxStreakPerPlayer` tracked per room for achievements
- In production, `CORS origin` is locked to `CLIENT_ORIGIN` env var
- `customCategoryError` and `customQuestionError` are named events (not generic `error`) to avoid cross-handler pollution

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

### Sprint 3 — Social Layer + Community ✅ (Groups A–C)

#### Group A — Friends System ✅
Friends list with 3-tab panel (Search/Friends/Requests), friend request send/accept/reject, online presence (green dot + notification), friends leaderboard tab, friends badge in lobby header, profile auto-creation on auth socket connect. New store: `useSocial`. New component: `FriendsPanel`.

**Group A Bugs Fixed:**
1. Profile not created on first login → auto-created in `handleConnection` on auth socket connect
2. Friends leaderboard required separate REST endpoint → added `GET /api/leaderboard?friendIds=` query param

#### Group B — Private Matches ✅
6-char room code (unambiguous charset), create/join private room, invite friend from online list, `MatchInviteToast` (30s auto-dismiss, Accept/Decline), private room code display + copy button in Matchmaking lobby, cleanup on last player disconnect. New stores: `usePrivateMatch`. New components: `PrivateMatchModal`, `MatchInviteToast`.

**Group B Bugs Fixed:**
1. `privateCode` captured before room deletion in disconnect handler (prevents undefined reference)
2. Private room `maxPlayers` set to 2 explicitly (PvP default was 4)
3. Ready button only appears when room is full (prevents premature ready)

#### Group C — Custom Categories UI ✅
Full browse/create/play flow for community question sets. Browser page (Browse/Mine tabs, debounced search, star ratings, play/delete), Editor modal (2-step: create info → add up to 20 questions), play via PvE with custom question bank (min/10 cap, exhaustion detection). New stores: `useCustomCategory`. New components: `CustomCategoryBrowser`, `CustomCategoryEditor`. New phase: `'custom'` in `GamePhase`. `joinMatchmaking` extended with optional `customCategoryId`.

**Group C Bugs Fixed:**
1. **Critical**: All 5 custom category socket handlers used `socket.id` as owner ID → auth users lost categories on reconnect. Fixed: `customCategoryUserId()` helper uses `socketToAuthId.get(socket.id) || socket.id`
2. **Performance**: Double `fetchPublic()` on mount (mount effect + tab effect both fired). Fixed: removed redundant call from mount effect; tab effect handles initial load
3. **UX**: Editor spinners stuck permanently if server emitted error (no error recovery). Fixed: named error events (`customCategoryError`, `customQuestionError`) + 8s timeout resets loading state
4. **Cleanup**: `setLoading` destructured but unused in browser component → removed

### Sprint 3 Group D — Tournament UX Polish ✅

#### D1 — Real player names in tournament bracket ✅
`TournamentBracket.tsx` builds a `playerNames: Record<string, string>` via `useMemo` from `currentTournament.participants` (which stores `playerId → playerName` at join time). `PlayerSlot` and the winner podium now resolve the actual username instead of raw IDs. Fallback: `Player #${numericId}` for auth users when name missing; `Player #XXXXX` for guests.

**D1 Note**: tournament `participantId` is `dbPlayerId || socket.id` → "2" (numeric string) for auth users, socket.id for guests. Both match the IDs stored in `tournament_matches.player1Id/player2Id`. 

#### D2 — Rematch flow after PvP game ✅
New `requestRematch` handler in `gameServer.ts`: creates a private room, adds requester, emits `privateRoomCreated` to requester (App.tsx already navigates to matchmaking on this event), emits `matchInviteReceived{isRematch: true}` to opponent via their socket.

Client: `GameResults.tsx` detects PvP games (`!tournamentMatchId && finalScores.some(non-AI, non-self player)`) and shows ⚔️ Rematch button. `GameUI.tsx` handles `onRematch` callback by emitting `requestRematch{opponentId}`. `MatchInviteToast.tsx` and `usePrivateMatch.ts` updated to show "⚔️ Rematch Request!" when `isRematch: true`.

#### D3 — Opponent-joined notification ✅
`Matchmaking.tsx` tracks `currentRoom.players.length` changes via `useRef(prevPlayerCount)`. When count goes 1→2 in a **public** (non-private) PvP room, shows an `opponentJoinedName` banner: "⚡ {name} joined! Get ready..." with 3.5s auto-dismiss. Client-only — no new server events required.

#### D4 — Mobile layout responsive pass ✅
- `TriviaGame.tsx`: category badge hidden on mobile (`hidden sm:inline-flex`), difficulty badge always visible — prevents header overflow on small screens
- `GameResults.tsx`: Your Performance stats grid `grid-cols-2 sm:grid-cols-4` (2 columns on mobile); action buttons `flex-col sm:flex-row` (stack on mobile)
- `Matchmaking.tsx`: opponent-joined banner is compact and mobile-friendly by design

**Group D Bugs Found and Fixed During Audit (5 total):**

1. **🔴 Critical — Silent rematch failure**: Server emitted `rematchError` but no client listener existed. Added `rematchError` handler in `GameUI.tsx` with a fixed-position error banner (4s auto-dismiss). Users now see "⚠️ Opponent has already left." instead of a silent no-op.

2. **🟡 Medium — Incomplete type annotation**: `App.tsx` `onMatchInviteReceived` handler typed as `{ fromName, roomCode }`, missing `isRematch?: boolean`. Updated type annotation to match `MatchInvite` interface fully. Runtime was unaffected (JS structural passthrough), but the type contract is now correct.

3. **🟡 Medium — Stale socket ID in rematch opponent lookup**: `handleRematch` in `GameUI.tsx` re-read `socketClient.id` at click-time, but `currentPlayerId` (used by `GameResults`) was captured at render-time. If socket reconnected between game-end and click, `myId` diverged from `finalScores` IDs and could find the wrong opponent. Fix: opponent ID now computed inside `GameResults` at render time (same frame as `currentPlayerId`) and passed back to `onRematch(opponentId: string)` — callback signature updated accordingly.

4. **🟡 Medium — Rematch ignored original game settings**: `requestRematch` created rooms with hardcoded `'general'/'medium'`, discarding the original game's category and difficulty. Fix: added `category` + `difficulty` to `gameEnded` server payload → `GameResults` store → `requestRematch` emit → server `createRoom()` call. Rematches now preserve the original settings with `|| 'general'` / `|| 'medium'` fallbacks.

5. **🟢 Minor — Dead constant**: `ROUND_LABELS: Record<number, string>` in `TournamentBracket.tsx` was defined but never read (`getRoundLabel()` reimplemented the same logic inline). Removed.
