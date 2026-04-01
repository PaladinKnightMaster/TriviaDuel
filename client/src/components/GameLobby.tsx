import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { CategorySelect } from './CategorySelect';
import { Leaderboard } from './Leaderboard';
import { Trophy, Users, Zap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'pop_culture', label: 'Pop Culture' },
  { value: 'sports', label: 'Sports' },
  { value: 'geography', label: 'Geography' },
];

const DIFFICULTIES = [
  { value: 'easy', label: '🟢 Easy', color: 'text-green-400' },
  { value: 'medium', label: '🟡 Medium', color: 'text-yellow-400' },
  { value: 'hard', label: '🔴 Hard', color: 'text-red-400' },
];

export function GameLobby() {
  const { playerName, setPlayerName, setPhase } = useTrivia();
  const { setPlayerName: setSocketPlayerName, joinMatchmaking } = useSocket();

  const [pveCategory, setPveCategory] = useState('general');
  const [pveDifficulty, setPveDifficulty] = useState('medium');
  const [showPveOptions, setShowPveOptions] = useState(false);

  const handleStartPvP = () => {
    if (playerName.trim()) {
      setPhase('matchmaking');
    }
  };

  const handleStartPvE = () => {
    if (!playerName.trim()) return;

    const { isConnected, connect } = useSocket.getState();
    const launch = () => {
      setSocketPlayerName(playerName.trim());
      joinMatchmaking('pve', pveCategory, pveDifficulty);
      // Don't set phase here — wait for 'gameStarted' from server (handled in App.tsx)
      // But we do need to show the playing screen immediately so set it after a small delay
      setTimeout(() => setPhase('playing'), 800);
    };

    if (!isConnected) {
      connect();
      setTimeout(launch, 1000);
    } else {
      launch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
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
              onKeyDown={(e) => e.key === 'Enter' && handleStartPvE()}
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
              <p className="text-gray-300 text-sm">
                Challenge other players in real-time trivia battles with skill-based matchmaking
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Real-time skill-based matchmaking</li>
                <li>• ELO rating system</li>
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
              <p className="text-gray-300 text-sm">
                Practice against an adaptive AI opponent that adjusts to your skill
              </p>

              {/* PvE Options toggle */}
              <button
                onClick={() => setShowPveOptions(!showPveOptions)}
                className="flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                {showPveOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showPveOptions ? 'Hide options' : 'Choose category & difficulty'}
              </button>

              {showPveOptions && (
                <div className="space-y-3 bg-black/30 rounded-lg p-3 border border-white/10">
                  <div>
                    <label className="text-white/70 text-xs font-medium mb-1.5 block">Category</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setPveCategory(cat.value)}
                          className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${
                            pveCategory === cat.value
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-gray-800/60 border-gray-600 text-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-xs font-medium mb-1.5 block">Difficulty</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DIFFICULTIES.map(diff => (
                        <button
                          key={diff.value}
                          onClick={() => setPveDifficulty(diff.value)}
                          className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${
                            pveDifficulty === diff.value
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-gray-800/60 border-gray-600 text-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-center pt-1">
                    <span className="text-indigo-300">{CATEGORIES.find(c => c.value === pveCategory)?.label}</span>
                    {' · '}
                    <span className="text-indigo-300 capitalize">{pveDifficulty}</span>
                  </div>
                </div>
              )}

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

        {/* Leaderboard */}
        <Leaderboard />
      </div>
    </div>
  );
}
