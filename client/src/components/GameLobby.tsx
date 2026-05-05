import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { useAuth } from '../lib/stores/useAuth';
import { CategorySelect } from './CategorySelect';
import { Leaderboard } from './Leaderboard';
import { AuthModal } from './AuthModal';
import { Trophy, Users, Zap, BookOpen, ChevronDown, ChevronUp, User, LogOut, Award } from 'lucide-react';

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

interface GameLobbyProps {
  onOpenProfile?: () => void;
}

export function GameLobby({ onOpenProfile }: GameLobbyProps) {
  const { playerName, setPlayerName, setPhase } = useTrivia();
  const { setPlayerName: setSocketPlayerName, joinMatchmaking } = useSocket();
  const { user, logout } = useAuth();

  const [pveCategory, setPveCategory] = useState('general');
  const [pveDifficulty, setPveDifficulty] = useState('medium');
  const [showPveOptions, setShowPveOptions] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleStartPvP = () => {
    const name = user?.username || playerName.trim();
    if (name) {
      setPhase('matchmaking');
    }
  };

  const handleStartPvE = () => {
    const name = user?.username || playerName.trim();
    if (!name) return;

    const { isConnected, connect } = useSocket.getState();
    const launch = () => {
      setSocketPlayerName(name);
      joinMatchmaking('pve', pveCategory, pveDifficulty);
      setTimeout(() => setPhase('playing'), 800);
    };

    if (!isConnected) {
      connect();
      setTimeout(launch, 1000);
    } else {
      launch();
    }
  };

  const displayName = user?.username || playerName;
  const canPlay = !!displayName.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">

        {/* Header + Auth bar */}
        <div className="text-center space-y-3 relative">
          {/* Auth controls — top right */}
          <div className="absolute right-0 top-0 flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 bg-purple-900/40 border border-purple-500/40 rounded-xl px-3 py-1.5 transition-all hover:bg-purple-900/60"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-[80px] truncate">{user.username}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1.5"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 bg-purple-900/40 border border-purple-500/40 rounded-xl px-3 py-2 transition-all hover:bg-purple-900/60"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          <h1 className="text-5xl font-bold text-white mb-2">
            🧠 Trivia Masters
          </h1>
          <p className="text-xl text-gray-300">
            Test your knowledge in the ultimate trivia challenge
          </p>
        </div>

        {/* Player Name / Account status */}
        {user ? (
          <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{user.username}</div>
                <div className="text-green-400 text-xs">✓ Account connected — stats saved</div>
              </div>
            </div>
            <button
              onClick={onOpenProfile}
              className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Profile
            </button>
          </div>
        ) : (
          <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">Enter Your Name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your trivia master name..."
                className="text-lg text-center bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleStartPvE()}
              />
              <p className="text-center text-gray-500 text-xs">
                Or{' '}
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                  sign in / create account
                </button>
                {' '}to save your progress
              </p>
            </CardContent>
          </Card>
        )}

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
                disabled={!canPlay}
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
                disabled={!canPlay}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Mode */}
        <button
          onClick={() => setPhase('tournament')}
          disabled={!canPlay}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600/80 to-amber-600/80 hover:from-yellow-500/90 hover:to-amber-500/90 disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-400/40 text-white font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-yellow-900/30"
        >
          <Award className="w-5 h-5 text-yellow-300" />
          <div className="text-left">
            <div className="font-bold">Tournament Mode</div>
            <div className="text-xs text-yellow-200/70 font-normal">Compete in bracket-style elimination</div>
          </div>
          <Trophy className="w-5 h-5 text-yellow-300 ml-auto" />
        </button>

        {/* Categories Preview */}
        <CategorySelect />

        {/* Leaderboard */}
        <Leaderboard />
      </div>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
