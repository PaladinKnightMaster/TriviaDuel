import React from 'react';
import { Player } from '../../../shared/schema';

interface GameResultsProps {
  finalScores: Player[];
  winner: Player | null;
  totalQuestions: number;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣'];

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  gold: { label: 'Gold', color: '#f59e0b', bg: '#fef3c7' },
  silver: { label: 'Silver', color: '#6b7280', bg: '#f3f4f6' },
  bronze: { label: 'Bronze', color: '#92400e', bg: '#fef3c7' },
};

function getRankLabel(index: number, total: number): { label: string; color: string; bg: string } {
  if (index === 0) return { label: '1st Place', color: '#d97706', bg: '#fef3c7' };
  if (index === 1) return { label: '2nd Place', color: '#6b7280', bg: '#f3f4f6' };
  if (index === 2) return { label: '3rd Place', color: '#b45309', bg: '#fef3c7' };
  return { label: `${index + 1}th Place`, color: '#4b5563', bg: '#f9fafb' };
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div
        className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function GameResults({
  finalScores,
  winner,
  totalQuestions,
  currentPlayerId,
  onPlayAgain,
  onMainMenu,
}: GameResultsProps) {
  const sorted = [...finalScores].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score || 1;
  const myResult = sorted.find(p => p.id === currentPlayerId);
  const myRank = sorted.findIndex(p => p.id === currentPlayerId);
  const isWinner = winner?.id === currentPlayerId || (winner?.id.startsWith('ai_') === false && myRank === 0);
  const perfectGame = myResult && totalQuestions > 0
    ? myResult.score >= totalQuestions * 200
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          {winner && (
            <div className="mb-3">
              <div className="text-6xl mb-2">
                {winner.id.startsWith('ai_') ? '🤖' : isWinner ? '🏆' : '💪'}
              </div>
              <h1 className="text-3xl font-bold text-white">
                {winner.id.startsWith('ai_')
                  ? 'AI Wins!'
                  : isWinner
                    ? 'You Win!'
                    : `${winner.name} Wins!`}
              </h1>
              <p className="text-indigo-300 mt-1 text-sm">
                {totalQuestions} questions completed
              </p>
            </div>
          )}
          {perfectGame && (
            <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mt-2">
              ⭐ Perfect Streak Bonus!
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-5 border border-white/20">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 text-center">
            Final Scores
          </h2>
          <div className="space-y-3">
            {sorted.map((player, index) => {
              const rank = getRankLabel(index, sorted.length);
              const isMe = player.id === currentPlayerId;
              const isAI = player.id.startsWith('ai_');

              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 border transition-all ${
                    isMe
                      ? 'bg-indigo-500/30 border-indigo-400/60 ring-1 ring-indigo-400/40'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{RANK_BADGES[index] || '🎯'}</span>
                      <div>
                        <span className="text-white font-semibold text-sm">
                          {isAI ? '🤖 AI Opponent' : player.name}
                          {isMe && (
                            <span className="ml-2 text-xs text-indigo-300 font-normal">(You)</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: rank.bg, color: rank.color }}
                          >
                            {rank.label}
                          </span>
                          {player.streak > 0 && (
                            <span className="text-xs text-orange-300">
                              🔥 {player.streak} streak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">{player.score.toLocaleString()}</div>
                      <div className="text-indigo-300 text-xs">pts</div>
                    </div>
                  </div>
                  <ScoreBar score={player.score} maxScore={maxScore} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Stats (if multiple players) */}
        {myResult && sorted.length > 1 && (
          <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/10">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{myResult.score.toLocaleString()}</div>
                <div className="text-indigo-300 text-xs mt-0.5">Your Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">#{myRank + 1}</div>
                <div className="text-indigo-300 text-xs mt-0.5">Rank</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myResult.streak}</div>
                <div className="text-indigo-300 text-xs mt-0.5">Best Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-900/50"
          >
            🔄 Play Again
          </button>
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
