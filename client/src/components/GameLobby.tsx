import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { CategorySelect } from './CategorySelect';
import { Leaderboard } from './Leaderboard';
import { Trophy, Users, Zap, BookOpen } from 'lucide-react';

export function GameLobby() {
  const { playerName, setPlayerName, setPhase } = useTrivia();
  const { setPlayerName: setSocketPlayerName } = useSocket();

  const handleStartPvP = () => {
    if (playerName.trim()) {
      setPhase('matchmaking');
    }
  };

  const handleStartPvE = () => {
    if (playerName.trim()) {
      setSocketPlayerName(playerName);
      setPhase('playing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2">
            🧠 Trivia Masters
          </h1>
          <p className="text-xl text-gray-300">
            Test your knowledge in the ultimate trivia challenge
          </p>
        </div>

        {/* Player Name Input */}
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Enter Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your trivia master name..."
              className="text-lg text-center bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={20}
            />
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* PvP Mode */}
          <Card className="bg-black/50 border-red-500/50 backdrop-blur-sm hover:bg-black/60 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-red-400" />
                Player vs Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Challenge other players in real-time trivia battles
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Real-time matchmaking</li>
                <li>• Competitive scoring</li>
                <li>• Live leaderboards</li>
                <li>• Streak bonuses</li>
              </ul>
              <Button
                onClick={handleStartPvP}
                disabled={!playerName.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Find Match
              </Button>
            </CardContent>
          </Card>

          {/* PvE Mode */}
          <Card className="bg-black/50 border-green-500/50 backdrop-blur-sm hover:bg-black/60 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-green-400" />
                Player vs AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Practice against adaptive AI opponents
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Adaptive difficulty</li>
                <li>• Practice mode</li>
                <li>• Skill improvement</li>
                <li>• All categories</li>
              </ul>
              <Button
                onClick={handleStartPvE}
                disabled={!playerName.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Categories Preview */}
        <CategorySelect />

        {/* Leaderboard Preview */}
        <Leaderboard />
      </div>
    </div>
  );
}
