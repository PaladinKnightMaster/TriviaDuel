import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/stores/useAuth';
import { ArrowLeft, Trophy, Zap, Star, Target, TrendingUp, Shield } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface PlayerStats {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
  bestStreak: number;
  totalScore: number;
}

interface PlayerProfileProps {
  onBack: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500/50 bg-gray-800/60',
  rare: 'border-blue-500/60 bg-blue-950/60',
  epic: 'border-purple-500/60 bg-purple-950/60',
  legendary: 'border-yellow-500/60 bg-yellow-950/60',
};

const RARITY_BADGE: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const TIER_INFO: Record<string, { name: string; color: string; icon: string }> = {
  bronze: { name: 'Bronze', color: 'text-amber-600', icon: '🥉' },
  silver: { name: 'Silver', color: 'text-gray-300', icon: '🥈' },
  gold: { name: 'Gold', color: 'text-yellow-400', icon: '🥇' },
  platinum: { name: 'Platinum', color: 'text-cyan-300', icon: '💎' },
  diamond: { name: 'Diamond', color: 'text-blue-300', icon: '💠' },
  master: { name: 'Master', color: 'text-purple-400', icon: '👑' },
};

function getRatingTier(rating: number) {
  if (rating < 1100) return 'bronze';
  if (rating < 1300) return 'silver';
  if (rating < 1500) return 'gold';
  if (rating < 1700) return 'platinum';
  if (rating < 2000) return 'diamond';
  return 'master';
}

export function PlayerProfile({ onBack }: PlayerProfileProps) {
  const { user, token } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [achRes, statsRes] = await Promise.all([
          fetch(`/api/player/${user.userId}/achievements`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/player/${String(user.userId)}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (achRes.ok) {
          const data = await achRes.json();
          setAchievements(data);
        }
        if (statsRes.ok) {
          const s = await statsRes.json();
          const gp = s.totalGames ?? s.gamesPlayed ?? 0;
          const wins = s.wins ?? 0;
          setStats({
            rating: s.rating ?? 1000,
            gamesPlayed: gp,
            wins,
            losses: s.losses ?? Math.max(0, gp - wins),
            winRate: gp > 0 ? Math.round((wins / gp) * 100) : 0,
            avgScore: s.averageScore ?? s.avgScore ?? 0,
            bestStreak: s.bestStreak ?? 0,
            totalScore: s.totalScore ?? 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <p className="text-xl">Please sign in to view your profile</p>
          <button onClick={onBack} className="px-6 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const tier = getRatingTier(stats?.rating ?? 1000);
  const tierInfo = TIER_INFO[tier];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  const filtered = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Lobby
        </button>

        {/* Profile Header */}
        <div className="bg-black/50 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{user.username}</h1>
              <div className={`flex items-center gap-1.5 mt-1 font-semibold ${tierInfo.color}`}>
                <span className="text-xl">{tierInfo.icon}</span>
                <span>{tierInfo.name}</span>
                <span className="text-gray-400 font-normal ml-1">· {stats?.rating ?? 1000} ELO</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-yellow-400 text-sm font-medium">{totalPoints} achievement pts</span>
                <span className="text-gray-400 text-sm">{unlockedCount}/{achievements.length} badges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
            Loading stats...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Trophy className="w-5 h-5 text-yellow-400" />, label: 'Games', value: stats.gamesPlayed },
              { icon: <TrendingUp className="w-5 h-5 text-green-400" />, label: 'Win Rate', value: `${stats.winRate}%` },
              { icon: <Zap className="w-5 h-5 text-orange-400" />, label: 'Best Streak', value: stats.bestStreak },
              { icon: <Star className="w-5 h-5 text-blue-400" />, label: 'Avg Score', value: stats.avgScore },
              { icon: <Target className="w-5 h-5 text-red-400" />, label: 'Wins', value: stats.wins },
              { icon: <Shield className="w-5 h-5 text-gray-400" />, label: 'Losses', value: stats.losses },
              { icon: <Star className="w-5 h-5 text-purple-400" />, label: 'Total Score', value: stats.totalScore.toLocaleString() },
              { icon: <Trophy className="w-5 h-5 text-cyan-400" />, label: 'ELO Rating', value: stats.rating },
            ].map((s, i) => (
              <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Achievements */}
        <div className="bg-black/50 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievements
            </h2>
            <div className="flex gap-1 bg-gray-800/80 rounded-xl p-1">
              {(['all', 'unlocked', 'locked'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading achievements...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(achievement => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    achievement.unlocked
                      ? RARITY_COLORS[achievement.rarity]
                      : 'border-gray-700/50 bg-gray-900/60 opacity-50 grayscale'
                  }`}
                >
                  <div className="text-3xl flex-shrink-0">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{achievement.name}</span>
                      {achievement.unlocked && (
                        <span className={`text-xs font-bold uppercase ${RARITY_BADGE[achievement.rarity]}`}>
                          {achievement.rarity}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5 leading-snug">{achievement.description}</div>

                    {/* Progress bar */}
                    {!achievement.unlocked && achievement.maxProgress > 1 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {achievement.unlocked && (
                      <div className="text-yellow-500 text-xs font-semibold mt-1">+{achievement.points} pts</div>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center text-gray-500 py-6">
                  No {filter !== 'all' ? filter : ''} achievements to show
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
