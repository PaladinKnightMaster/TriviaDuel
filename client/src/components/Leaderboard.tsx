import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { useAuth } from '../lib/stores/useAuth';

type LeaderboardTab = 'global' | 'friends';

export function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<LeaderboardTab>('global');
  const [globalBoard, setGlobalBoard] = useState<LeaderboardEntry[]>([]);
  const [friendsBoard, setFriendsBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobal = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        setGlobalBoard(await response.json());
      }
    } catch {
      setGlobalBoard([
        { playerId: '1', playerName: 'TriviaKing', totalScore: 15420, gamesWon: 87, bestStreak: 12, rank: 1 },
        { playerId: '2', playerName: 'QuizMaster', totalScore: 14230, gamesWon: 76, bestStreak: 15, rank: 2 },
        { playerId: '3', playerName: 'BrainBox', totalScore: 13180, gamesWon: 69, bestStreak: 9, rank: 3 },
      ]);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/social/friends-leaderboard?userId=${user.userId}`);
      if (response.ok) {
        setFriendsBoard(await response.json());
      }
    } catch {
      setFriendsBoard([]);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchGlobal().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'friends' && user) {
      fetchFriends();
    }
  }, [tab, user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 border-yellow-500/50';
      case 2: return 'bg-gray-500/20 border-gray-500/50';
      case 3: return 'bg-amber-500/20 border-amber-500/50';
      default: return 'bg-gray-800/50 border-gray-600/50';
    }
  };

  const entries = tab === 'global' ? globalBoard : friendsBoard;

  return (
    <Card className="bg-black/50 border-yellow-500/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-center flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </CardTitle>
        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mt-2">
          <button
            onClick={() => setTab('global')}
            className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'global'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Global
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'friends'
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Friends
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center text-gray-400">Loading…</div>
        ) : tab === 'friends' && !user ? (
          <div className="text-center text-gray-500 py-6 text-sm">
            Sign in to see your friends leaderboard
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry, idx) => {
              const rank = tab === 'friends' ? idx + 1 : entry.rank;
              return (
                <div
                  key={entry.playerId}
                  className={`p-4 rounded-lg border ${getRankStyle(rank)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRankIcon(rank)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{entry.playerName}</span>
                          <Badge variant="secondary" className="text-xs">#{rank}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span>Wins: {entry.gamesWon}</span>
                          <span>Best Streak: {entry.bestStreak}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">
                        {entry.totalScore.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">Total Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {tab === 'friends'
                  ? 'Add friends and play games to see them here!'
                  : 'No leaderboard data yet. Be the first to play!'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
