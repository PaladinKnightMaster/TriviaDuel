import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSocket } from '../lib/stores/useSocket';
import { useTrivia } from '../lib/stores/useTrivia';
import { useAuth } from '../lib/stores/useAuth';
import { Loader2, Users, ArrowLeft, Timer } from 'lucide-react';

export function Matchmaking() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const { currentRoom, joinMatchmaking, leaveMatchmaking, readyUp, setPlayerName } = useSocket();
  const { setPhase } = useTrivia();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && !currentRoom) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, currentRoom]);

  const handleStartMatchmaking = () => {
    setIsSearching(true);
    setSearchTime(0);
    // Prefer the authenticated username; fall back to the guest name in the trivia store
    const { playerName } = useTrivia.getState();
    const { user } = useAuth.getState();
    const name = user?.username || playerName || 'Player';
    setPlayerName(name);
    joinMatchmaking('pvp', selectedCategory, selectedDifficulty);
  };

  const handleCancelMatchmaking = () => {
    setIsSearching(false);
    setSearchTime(0);
    leaveMatchmaking();
  };

  const handleBack = () => {
    if (isSearching) {
      handleCancelMatchmaking();
    }
    setPhase('menu');
  };

  const handleReady = () => {
    readyUp();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Matchmaking</h1>
        </div>

        {!currentRoom ? (
          <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {isSearching ? 'Finding Match...' : 'Match Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isSearching ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Knowledge</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="pop_culture">Pop Culture</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="geography">Geography</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Difficulty
                      </label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartMatchmaking}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Find Match
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-white text-lg">Searching for opponents...</p>
                      <div className="flex items-center justify-center gap-2">
                        <Timer className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-400">{formatTime(searchTime)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Badge className="bg-purple-100 text-purple-800">
                        {selectedCategory.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 ml-2">
                        {selectedDifficulty.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={handleCancelMatchmaking}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancel Search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-black/50 border-green-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">Match Found!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Players in lobby:</p>
                  <div className="space-y-2">
                    {currentRoom.players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg"
                      >
                        <span className="text-white font-medium">{player.name}</span>
                        <Badge className={player.isReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {player.isReady ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Badge className="bg-purple-100 text-purple-800 mr-2">
                    {currentRoom.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {currentRoom.difficulty.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={handleReady}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
              >
                Ready Up!
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
