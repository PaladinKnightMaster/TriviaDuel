import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Show mock data for demonstration
      setLeaderboard([
        { playerId: '1', playerName: 'TriviaKing', totalScore: 15420, gamesWon: 87, bestStreak: 12, rank: 1 },
        { playerId: '2', playerName: 'QuizMaster', totalScore: 14230, gamesWon: 76, bestStreak: 15, rank: 2 },
        { playerId: '3', playerName: 'BrainBox', totalScore: 13180, gamesWon: 69, bestStreak: 9, rank: 3 },
        { playerId: '4', playerName: 'Smarty', totalScore: 12890, gamesWon: 64, bestStreak: 11, rank: 4 },
        { playerId: '5', playerName: 'Genius', totalScore: 11750, gamesWon: 58, bestStreak: 8, rank: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gray-500/20 border-gray-500/50';
      case 3:
        return 'bg-amber-500/20 border-amber-500/50';
      default:
        return 'bg-gray-800/50 border-gray-600/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/50 border-yellow-500/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-yellow-500/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-center flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Global Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((entry) => (
            <div
              key={entry.playerId}
              className={`p-4 rounded-lg border ${getRankStyle(entry.rank)} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankIcon(entry.rank)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{entry.playerName}</span>
                      <Badge variant="secondary" className="text-xs">
                        #{entry.rank}
                      </Badge>
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
          ))}
        </div>
        
        {leaderboard.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No leaderboard data available yet. Be the first to play!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
