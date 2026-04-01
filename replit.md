# Trivia Masters

A real-time multiplayer trivia battle game with PvP and PvE modes.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Zustand + TailwindCSS + shadcn/ui
- **Backend:** Express + Socket.IO 4 + Drizzle ORM + Neon PostgreSQL
- **Auth:** bcrypt (service built, not yet wired to REST routes)
- **Real-time:** Socket.IO WebSocket with polling fallback

## Architecture

```
client/              # React SPA (Vite, port 5000 via proxy)
  src/
    App.tsx          # Root: socket connect + global event listeners
    components/
      GameLobby.tsx  # Main menu, PvP/PvE entry, category/difficulty selection
      Matchmaking.tsx # PvP lobby, ready-up flow
      TriviaGame.tsx  # Live game: timer, question, answer buttons, scoreboard
      GameResults.tsx # End-of-game results, winner, scores, replay/menu
      GameUI.tsx      # Phase router: menu → matchmaking → playing → results
      Leaderboard.tsx # Leaderboard REST API display
      CategorySelect.tsx # Static category showcase
    lib/
      socket.ts       # Raw socket.io-client instance
      stores/
        useTrivia.tsx  # Zustand: game phase, question state, results, player list
        useSocket.tsx  # Zustand: socket actions (connect, join, answer, readyUp)

server/
  index.ts            # Express entry point, port 5000
  routes.ts           # REST: /api/leaderboard, /api/player/:id/stats
  gameServer.ts       # Socket.IO hub: all real-time events + question timers
  gameLogic.ts        # In-memory rooms, answer tracking, 10-question limit, scoring
  matchmaking.ts      # ELO queue, skill-based matching, tier system
  questionBank.ts     # 270 questions (6 categories × 3 difficulties × 15 questions)
  storage.ts          # Drizzle ORM + Neon PostgreSQL + in-memory fallback
  authService.ts      # bcrypt register/login (not yet wired to routes)
  tournamentService.ts # Tournament CRUD + bracket generation (built, no UI)
  socialService.ts    # Profiles, friends, messages, invites (built, no socket handlers)
  customCategoryService.ts # UGC categories + ratings (fully wired)

shared/
  schema.ts           # Drizzle schema (14 tables) + shared TypeScript interfaces
```

## Database (Neon PostgreSQL — 14 tables)

`users` · `game_stats` · `leaderboards` · `tournaments` · `tournament_participants` ·
`tournament_matches` · `custom_categories` · `custom_questions` · `category_ratings` ·
`player_profiles` · `friendships` · `player_messages` · `game_invites` · `player_achievements`

## Game Flow

1. Player enters name on GameLobby
2. **PvE:** Select category/difficulty → socket `joinMatchmaking(pve)` → server creates room + AI → `gameStarted` → first `newQuestion` → game loop
3. **PvP:** Navigate to Matchmaking screen → select settings → socket `joinMatchmaking(pvp)` → wait for opponent → both `playerReady` → `gameStarted` → first `newQuestion` → game loop
4. **Game loop:** `newQuestion` (10 total) → players submit answers → `answerResult` feedback → all answered → 2.5s pause → next question
5. After Q10: `gameEnded` event → `GameResults` component shows winner, scores, replay button

## Sprint 0 — COMPLETE (All 8 fixes shipped)

1. ✅ Answer tracking — `currentQuestionAnswers` per room, `allHumanPlayersAnswered()`
2. ✅ 10-question match limit — `questionIndex` + `maxQuestions` in GameRoom
3. ✅ PvE AI event-driven — `scheduleAIAnswer()` per question, adaptive accuracy
4. ✅ Results screen — `GameResults.tsx` with winner, scores, streaks, replay/menu
5. ✅ PvE category/difficulty — passes user selection from lobby through to room creation
6. ✅ Leaderboard accumulation — totalScore accumulates across games (not replaced)
7. ✅ game_stats unique constraint — `.unique()` on playerId + `db:push` applied
8. ✅ Question bank expansion — 18 → 270 questions (15 per category × 3 difficulties × 6 categories)

## Sprint 1 — NEXT (Identity + Content)

- Wire AuthService to REST routes (login/register endpoints)
- JWT/session — replace socket.id with authenticated user ID
- Achievement system service — 10 core achievements with triggers
- Wire social socket handlers — friends, messages, invites
- Player profile page

## Running

```bash
npm run dev        # Start server + client (port 5000)
npm run db:push    # Sync schema changes to Neon PostgreSQL
```

## Environment Variables

- `DATABASE_URL` — Neon PostgreSQL connection string
- `NODE_ENV` — `development` or `production`
- `CLIENT_ORIGIN` — (production only) allowed CORS origin
