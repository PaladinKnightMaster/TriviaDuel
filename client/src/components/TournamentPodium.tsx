import React, { useEffect, useState, useMemo } from 'react';
import Confetti from 'react-confetti';
import { Trophy, Medal, ArrowLeft, ListOrdered } from 'lucide-react';
import { Tournament, TournamentMatch } from '../../../shared/schema';

interface StandingsGroup {
  place: number;
  label: string;
  players: { id: string; name: string }[];
}

function resolveName(id: string, playerNames: Record<string, string>): string {
  if (playerNames[id]) return playerNames[id];
  return id.startsWith('user_') ? `Player #${id.replace('user_', '')}` : `Player #${id.slice(0, 5)}`;
}

function eliminationLabel(round: number, maxRound: number): string {
  const fromEnd = maxRound - round;
  if (fromEnd === 1) return 'Semifinalist';
  if (fromEnd === 2) return 'Quarterfinalist';
  return `Round ${round}`;
}

function computeStandings(
  matches: TournamentMatch[],
  playerNames: Record<string, string>,
  fallbackWinnerId?: string
): StandingsGroup[] {
  const completed = matches.filter((m) => m.status === 'completed');
  if (completed.length === 0) return [];

  const maxRound = Math.max(...matches.map((m) => m.round));
  const finalMatch = completed.find((m) => m.round === maxRound);

  const champion = finalMatch?.winnerId || fallbackWinnerId;
  const runnerUp = finalMatch
    ? finalMatch.winnerId === finalMatch.player1Id
      ? finalMatch.player2Id
      : finalMatch.player1Id
    : undefined;

  const groups: StandingsGroup[] = [];
  if (champion) {
    groups.push({ place: 1, label: 'Champion', players: [{ id: champion, name: resolveName(champion, playerNames) }] });
  }
  if (runnerUp) {
    groups.push({ place: 2, label: 'Runner-Up', players: [{ id: runnerUp, name: resolveName(runnerUp, playerNames) }] });
  }

  for (let round = maxRound - 1; round >= 1; round--) {
    const losers = completed
      .filter((m) => m.round === round)
      .map((m) => (m.winnerId === m.player1Id ? m.player2Id : m.player1Id))
      .filter((id): id is string => !!id);
    if (losers.length === 0) continue;
    const place = groups.reduce((sum, g) => sum + g.players.length, 0) + 1;
    groups.push({
      place,
      label: eliminationLabel(round, maxRound),
      players: losers.map((id) => ({ id, name: resolveName(id, playerNames) })),
    });
  }

  return groups;
}

interface Props {
  tournament: Tournament;
  matches: TournamentMatch[];
  playerNames: Record<string, string>;
  onViewBracket: () => void;
  onBack: () => void;
  onLeave: () => void;
}

export function TournamentPodium({ tournament, matches, playerNames, onViewBracket, onBack, onLeave }: Props) {
  const standings = useMemo(
    () => computeStandings(matches, playerNames, tournament.winnerId),
    [matches, playerNames, tournament.winnerId]
  );

  const [showConfetti, setShowConfetti] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), 50);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 6000);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  const champion = standings[0]?.players[0];
  const runnerUp = standings[1]?.players[0];
  const thirdGroup = standings[2];
  const remainingGroups = standings.slice(3);

  if (standings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950 flex items-center justify-center">
        <div className="text-white/50 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Tallying final results…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950 p-4 relative overflow-hidden">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={320}
          gravity={0.15}
          colors={['#fbbf24', '#f59e0b', '#facc15', '#fde68a', '#ffffff']}
        />
      )}

      <div className="max-w-3xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </button>
          <button
            onClick={onLeave}
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            Leave
          </button>
        </div>

        {/* Title */}
        <div
          className={`text-center mt-4 mb-8 transition-all duration-700 ${
            revealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          <div className="text-6xl mb-3 animate-bounce" style={{ animationDuration: '1.6s' }}>🏆</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tournament Complete!</h1>
          <p className="text-amber-300/90 mt-1">{tournament.name}</p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10" style={{ minHeight: 260 }}>
          {/* 2nd place */}
          <PodiumColumn
            place={2}
            height={140}
            delayMs={300}
            revealed={revealed}
            color="from-slate-400 to-slate-500"
            medal="🥈"
            names={runnerUp ? [runnerUp.name] : []}
          />
          {/* 1st place */}
          <PodiumColumn
            place={1}
            height={190}
            delayMs={100}
            revealed={revealed}
            color="from-amber-400 to-yellow-500"
            medal="🥇"
            names={champion ? [champion.name] : []}
            isChampion
          />
          {/* 3rd place (may be tied) */}
          <PodiumColumn
            place={3}
            height={100}
            delayMs={500}
            revealed={revealed}
            color="from-orange-600 to-amber-700"
            medal="🥉"
            names={thirdGroup ? thirdGroup.players.map((p) => p.name) : []}
          />
        </div>

        {/* Full standings */}
        {remainingGroups.length > 0 && (
          <div
            className={`bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 transition-all duration-700 delay-700 ${
              revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 text-white/70 text-sm font-semibold">
              <ListOrdered className="w-4 h-4" />
              Final Standings
            </div>
            <div className="space-y-2">
              {remainingGroups.map((group) => (
                <div key={group.place} className="flex items-start gap-3">
                  <span className="text-white/40 text-xs font-bold w-16 shrink-0 pt-0.5">
                    {group.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.players.map((p) => (
                      <span
                        key={p.id}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/70 border border-white/10"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onViewBracket}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Medal className="w-4 h-4" />
            View Full Bracket
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    </div>
  );
}

function PodiumColumn({
  place, height, delayMs, revealed, color, medal, names, isChampion,
}: {
  place: number; height: number; delayMs: number; revealed: boolean;
  color: string; medal: string; names: string[]; isChampion?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center transition-all ease-out"
      style={{
        width: 96,
        transitionDuration: '600ms',
        transitionDelay: `${delayMs}ms`,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.9)',
      }}
    >
      <div className={`text-3xl mb-1 ${isChampion ? 'animate-pulse' : ''}`}>{medal}</div>
      <div className="text-center mb-2 min-h-[2.5rem] flex flex-col items-center justify-end">
        {names.length === 0 ? (
          <span className="text-white/30 text-xs italic">—</span>
        ) : (
          names.map((name, i) => (
            <span
              key={i}
              className={`text-xs font-semibold truncate max-w-[92px] ${isChampion ? 'text-white text-sm' : 'text-white/80'}`}
            >
              {name}
            </span>
          ))
        )}
      </div>
      <div
        className={`w-full rounded-t-lg bg-gradient-to-b ${color} shadow-lg flex items-start justify-center pt-2`}
        style={{ height }}
      >
        <span className="text-black/50 font-extrabold text-lg">{place}</span>
      </div>
    </div>
  );
}
