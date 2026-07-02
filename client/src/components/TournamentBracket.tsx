import React, { useEffect, useMemo } from 'react';
import { useTournament } from '../lib/stores/useTournament';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { TournamentMatch } from '../../../shared/schema';
import { ArrowLeft, Trophy, Clock, CheckCircle2, Loader2, Swords } from 'lucide-react';
import { socketClient } from '../lib/socket';

interface Props {
  onBack: () => void;
  onLeave: () => void;
}

function getRoundLabel(round: number, maxRound: number): string {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round ${round}`;
}

const STATUS_STYLES = {
  pending:     { dot: 'bg-gray-400', text: 'Waiting' },
  in_progress: { dot: 'bg-yellow-400 animate-pulse', text: 'Playing' },
  completed:   { dot: 'bg-green-400', text: 'Done' },
};

export function TournamentBracket({ onBack, onLeave }: Props) {
  const { currentTournament, bracketMatches, setBracketMatches, joinTournamentMatch, refreshBracket } = useTournament();
  const { setPhase } = useTrivia();

  // Build playerId → displayName map from tournament participants
  const playerNames = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of currentTournament?.participants ?? []) {
      map[p.playerId] = p.playerName;
    }
    return map;
  }, [currentTournament?.participants]);

  useEffect(() => {
    if (!currentTournament) return;
    refreshBracket(currentTournament.id);
  }, [currentTournament?.id]);

  useEffect(() => {
    if (!currentTournament) return;
    const onMatches = ({ matches }: { matches: TournamentMatch[]; tournamentId: number }) => {
      setBracketMatches(matches);
    };
    socketClient.on('tournamentMatches', onMatches);
    return () => socketClient.off('tournamentMatches', onMatches);
  }, [currentTournament?.id]);

  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950 flex items-center justify-center">
        <div className="text-white/50 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading bracket…</p>
        </div>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  for (const m of bracketMatches) {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  }
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] || 1;

  const isCompleted = currentTournament.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950 p-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              {currentTournament.name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                isCompleted
                  ? 'text-gray-400 bg-gray-400/10 border-gray-400/30'
                  : currentTournament.status === 'in_progress'
                    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                    : 'text-green-400 bg-green-400/10 border-green-400/30'
              }`}>
                {isCompleted ? 'Completed' : currentTournament.status === 'in_progress' ? 'In Progress' : 'Registration Open'}
              </span>
              <span className="text-white/40 text-xs">
                {currentTournament.currentPlayers}/{currentTournament.maxPlayers} players
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/40 text-xs capitalize">{currentTournament.category.replace('_', ' ')} · {currentTournament.difficulty}</span>
            </div>
          </div>
          <button
            onClick={onLeave}
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            Leave
          </button>
        </div>

        {/* Tournament Winner Podium */}
        {isCompleted && currentTournament.winnerId && (
          <div className="bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-400/40 rounded-2xl p-5 mb-6 text-center">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-white font-bold text-xl">Tournament Complete!</h2>
            <p className="text-amber-300 text-sm mt-1">
              🏅 {playerNames[currentTournament.winnerId] || currentTournament.winnerId}
            </p>
          </div>
        )}

        {/* Registration waiting message */}
        {currentTournament.status === 'registration' && (
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 mb-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-300" />
            <p className="text-amber-200 text-sm font-medium">Waiting for players to join…</p>
            <p className="text-amber-300/60 text-xs mt-1">
              {currentTournament.maxPlayers - currentTournament.currentPlayers} more needed to start
            </p>
          </div>
        )}

        {/* Bracket */}
        {rounds.length > 0 ? (
          <div className="overflow-x-auto">
            <div
              className="flex gap-4 min-w-max"
              style={{ alignItems: 'flex-start' }}
            >
              {rounds.map(round => (
                <div key={round} className="flex flex-col gap-3" style={{ minWidth: 220 }}>
                  <div className="text-center mb-1">
                    <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                      {getRoundLabel(round, maxRound)}
                    </span>
                  </div>
                  {(matchesByRound[round] || []).map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      playerNames={playerNames}
                      onPlay={() => {
                        joinTournamentMatch(match.id);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/30 py-12 border border-dashed border-white/10 rounded-xl">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {currentTournament.status === 'registration'
                ? 'Bracket will appear once the tournament starts'
                : 'No matches found'}
            </p>
          </div>
        )}

        {/* Refresh button */}
        {currentTournament.status === 'in_progress' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => refreshBracket(currentTournament.id)}
              className="text-amber-400/60 hover:text-amber-400 text-xs transition-colors"
            >
              Refresh bracket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, playerNames, onPlay }: { match: TournamentMatch; playerNames: Record<string, string>; onPlay: () => void }) {
  const style = STATUS_STYLES[match.status];
  const isPending = match.status === 'pending';
  const isInProgress = match.status === 'in_progress';
  const isDone = match.status === 'completed';

  return (
    <div className={`bg-black/40 rounded-xl border transition-all p-3 ${
      isInProgress
        ? 'border-yellow-400/50 shadow-lg shadow-yellow-900/20'
        : isDone
          ? 'border-white/10 opacity-80'
          : 'border-white/15'
    }`}>
      {/* Match players */}
      <div className="space-y-1.5 mb-2.5">
        <PlayerSlot
          id={match.player1Id}
          score={match.player1Score}
          isWinner={isDone && match.winnerId === match.player1Id}
          isLoser={isDone && match.winnerId !== match.player1Id && !!match.player1Id}
          isDone={isDone}
          playerNames={playerNames}
        />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-bold">VS</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <PlayerSlot
          id={match.player2Id}
          score={match.player2Score}
          isWinner={isDone && match.winnerId === match.player2Id}
          isLoser={isDone && match.winnerId !== match.player2Id && !!match.player2Id}
          isDone={isDone}
          playerNames={playerNames}
        />
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className="text-white/40 text-xs">{style.text}</span>
        </div>
        {isPending && match.player1Id && match.player2Id && (
          <button
            onClick={onPlay}
            className="text-xs py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors flex items-center gap-1"
          >
            <Swords className="w-3 h-3" />
            Play
          </button>
        )}
        {isInProgress && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Live
          </span>
        )}
        {isDone && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        )}
      </div>
    </div>
  );
}

function PlayerSlot({
  id, score, isWinner, isLoser, isDone, playerNames,
}: {
  id?: string; score: number; isWinner: boolean; isLoser: boolean; isDone: boolean;
  playerNames: Record<string, string>;
}) {
  const displayName = id
    ? (playerNames[id] ?? (id.startsWith('user_') ? `Player #${id.replace('user_', '')}` : `Player #${id.slice(0, 5)}`))
    : <span className="italic text-white/25">TBD</span>;
  return (
    <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${
      isWinner ? 'bg-green-400/15' : isLoser ? 'bg-white/5 opacity-50' : 'bg-white/5'
    }`}>
      <div className="flex items-center gap-2">
        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
        <span className={`text-sm font-medium ${isWinner ? 'text-white' : 'text-white/70'}`}>
          {displayName}
        </span>
      </div>
      {isDone && id && (
        <span className={`text-xs tabular-nums font-bold ${isWinner ? 'text-green-400' : 'text-white/40'}`}>
          {score.toLocaleString()}
        </span>
      )}
    </div>
  );
}
