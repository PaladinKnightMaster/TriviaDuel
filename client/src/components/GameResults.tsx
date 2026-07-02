import React, { useEffect, useState, useRef } from 'react';
import Confetti from 'react-confetti';
import { Player } from '../../../shared/schema';

interface GameResultsProps {
  finalScores: Player[];
  winner: Player | null;
  totalQuestions: number;
  currentPlayerId: string;
  correctAnswersPerPlayer?: Record<string, number>;
  maxStreakPerPlayer?: Record<string, number>;
  tournamentMatchId?: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onBackToBracket?: () => void;
  onRematch?: (opponentId: string) => void;
}

const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣'];

function getRankLabel(index: number): { label: string; color: string; bg: string } {
  if (index === 0) return { label: '1st Place', color: '#d97706', bg: 'rgba(253,230,138,0.15)' };
  if (index === 1) return { label: '2nd Place', color: '#9ca3af', bg: 'rgba(209,213,219,0.1)' };
  if (index === 2) return { label: '3rd Place', color: '#b45309', bg: 'rgba(180,83,9,0.15)' };
  return { label: `${index + 1}th Place`, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PlayerRow({
  player, index, isMe, currentPlayerId, maxScore, totalQuestions,
  correctAnswers, bestStreak,
}: {
  player: Player; index: number; isMe: boolean; currentPlayerId: string;
  maxScore: number; totalQuestions: number;
  correctAnswers: number; bestStreak: number;
}) {
  const rank = getRankLabel(index);
  const isAI = player.id.startsWith('ai_');
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const animatedScore = useCountUp(player.score, 1200 + index * 200);

  return (
    <div
      className={`rounded-xl p-3.5 border transition-all ${
        isMe
          ? 'bg-indigo-500/20 border-indigo-400/50 ring-1 ring-indigo-400/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{RANK_BADGES[index] || '🎯'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">
                {isAI ? '🤖 AI Opponent' : player.name}
              </span>
              {isMe && (
                <span className="text-xs text-indigo-300 font-normal">(You)</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: rank.bg, color: rank.color }}
              >
                {rank.label}
              </span>
              {bestStreak >= 3 && (
                <span className="text-xs text-orange-300">🔥 {bestStreak} streak</span>
              )}
              {!isAI && (
                <span className="text-xs text-gray-400">
                  {correctAnswers}/{totalQuestions} correct · {accuracy}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-xl tabular-nums">
            {animatedScore.toLocaleString()}
          </div>
          <div className="text-indigo-300 text-xs">pts</div>
        </div>
      </div>
      <ScoreBar score={player.score} maxScore={maxScore} />
    </div>
  );
}

export default function GameResults({
  finalScores,
  winner,
  totalQuestions,
  currentPlayerId,
  correctAnswersPerPlayer = {},
  maxStreakPerPlayer = {},
  tournamentMatchId,
  onPlayAgain,
  onMainMenu,
  onBackToBracket,
  onRematch,
}: GameResultsProps) {
  const sorted = [...finalScores].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score || 1;
  const myResult = sorted.find(p => p.id === currentPlayerId);
  const myIndex = sorted.findIndex(p => p.id === currentPlayerId);

  // Show Rematch button only for head-to-head PvP games (no tournament, no AI opponents)
  const canRematch = !tournamentMatchId && finalScores.some(p => !p.id.startsWith('ai_') && p.id !== currentPlayerId);
  // Compute opponent ID at render time (consistent with currentPlayerId, avoids stale socket.id on click)
  const opponentId = finalScores.find(p => !p.id.startsWith('ai_') && p.id !== currentPlayerId)?.id ?? '';
  const isWinner = winner?.id === currentPlayerId;

  const myCorrect = correctAnswersPerPlayer[currentPlayerId] ?? 0;
  const myBestStreak = maxStreakPerPlayer[currentPlayerId] ?? myResult?.streak ?? 0;
  const myAccuracy = totalQuestions > 0 ? Math.round((myCorrect / totalQuestions) * 100) : 0;

  const myAnimatedScore = useCountUp(myResult?.score ?? 0, 1400);

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const winnerEmoji = winner?.id.startsWith('ai_') ? '🤖' : isWinner ? '🏆' : '💪';
  const winnerLabel = winner?.id.startsWith('ai_')
    ? 'AI Wins!'
    : isWinner
      ? 'You Win!'
      : `${winner?.name} Wins!`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      {isWinner && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={350}
          gravity={0.25}
        />
      )}

      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          {winner && (
            <>
              <div className="text-6xl mb-2 animate-bounce">{winnerEmoji}</div>
              <h1 className="text-3xl font-bold text-white">{winnerLabel}</h1>
              <p className="text-indigo-300 mt-1 text-sm">{totalQuestions} questions completed</p>
              {tournamentMatchId && (
                <div className="inline-block mt-2 bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full">
                  🏆 Tournament Match
                </div>
              )}
            </>
          )}
        </div>

        {/* Scoreboard */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10">
          <h2 className="text-white/60 font-semibold text-xs uppercase tracking-widest mb-3 text-center">
            Final Scoreboard
          </h2>
          <div className="space-y-3">
            {sorted.map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                isMe={player.id === currentPlayerId}
                currentPlayerId={currentPlayerId}
                maxScore={maxScore}
                totalQuestions={totalQuestions}
                correctAnswers={correctAnswersPerPlayer[player.id] ?? 0}
                bestStreak={maxStreakPerPlayer[player.id] ?? player.streak}
              />
            ))}
          </div>
        </div>

        {/* Your Stats */}
        {myResult && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
            <h3 className="text-white/50 text-xs uppercase tracking-widest text-center mb-3">Your Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xl font-bold text-white tabular-nums">
                  {myAnimatedScore.toLocaleString()}
                </div>
                <div className="text-indigo-300 text-xs mt-0.5">Score</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xl font-bold text-white">#{myIndex + 1}</div>
                <div className="text-indigo-300 text-xs mt-0.5">Rank</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xl font-bold text-white">{myCorrect}/{totalQuestions}</div>
                <div className="text-indigo-300 text-xs mt-0.5">Correct</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xl font-bold text-white">
                  {myBestStreak > 0 ? `🔥${myBestStreak}` : myBestStreak}
                </div>
                <div className="text-indigo-300 text-xs mt-0.5">Streak</div>
              </div>
            </div>
            {myAccuracy >= 80 && (
              <div className="mt-2 text-center text-xs text-yellow-300">
                {myAccuracy === 100 ? '⭐ Perfect Game!' : `🎯 ${myAccuracy}% accuracy — great game!`}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {tournamentMatchId && onBackToBracket ? (
            <button
              onClick={onBackToBracket}
              className="flex-1 py-3 px-4 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-yellow-900/50"
            >
              🏆 View Bracket
            </button>
          ) : canRematch && onRematch ? (
            <button
              onClick={() => onRematch(opponentId)}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-red-900/50"
            >
              ⚔️ Rematch
            </button>
          ) : (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-900/50"
            >
              🔄 Play Again
            </button>
          )}
          <button
            onClick={onMainMenu}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors text-sm"
          >
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
