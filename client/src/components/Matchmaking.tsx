import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSocket } from '../lib/stores/useSocket';
import { useTrivia } from '../lib/stores/useTrivia';
import { useAuth } from '../lib/stores/useAuth';
import { useSocial } from '../lib/stores/useSocial';
import { Loader2, Users, ArrowLeft, Timer, Lock, Copy, Check, Send } from 'lucide-react';
import { socketClient } from '../lib/socket';

export function Matchmaking() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const { currentRoom, joinMatchmaking, leaveMatchmaking, readyUp, setPlayerName } = useSocket();
  const { setPhase } = useTrivia();
  const { friends } = useSocial();

  const onlineFriends = friends.filter((f) => f.isOnline);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && !currentRoom) {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, currentRoom]);

  // Listen for invite feedback
  useEffect(() => {
    const onInviteSent = () => {
      setInviteStatus('Invite sent!');
      setTimeout(() => setInviteStatus(null), 3000);
    };
    const onInviteError = (msg: string) => {
      setInviteStatus(msg);
      setTimeout(() => setInviteStatus(null), 3000);
    };
    socketClient.on('inviteSent', onInviteSent);
    socketClient.on('inviteError', onInviteError);
    return () => {
      socketClient.off('inviteSent', onInviteSent);
      socketClient.off('inviteError', onInviteError);
    };
  }, []);

  const handleStartMatchmaking = () => {
    setIsSearching(true);
    setSearchTime(0);
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
    if (isSearching) handleCancelMatchmaking();
    setPhase('menu');
  };

  const handleReady = () => readyUp();

  const handleCopyCode = useCallback(() => {
    if (!currentRoom?.privateCode) return;
    navigator.clipboard.writeText(currentRoom.privateCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [currentRoom?.privateCode]);

  const handleInvite = () => {
    if (!selectedFriend || !currentRoom?.privateCode) return;
    socketClient.emit('inviteToMatch', {
      targetPlayerId: selectedFriend,
      roomCode: currentRoom.privateCode,
    });
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
          <h1 className="text-3xl font-bold text-white">
            {currentRoom?.isPrivate ? 'Private Match' : 'Matchmaking'}
          </h1>
          {currentRoom?.isPrivate && (
            <Lock className="w-5 h-5 text-purple-300" />
          )}
        </div>

        {!currentRoom ? (
          // ── PUBLIC MATCHMAKING ─────────────────────────────────────────────
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
                      <label className="text-white text-sm font-medium mb-2 block">Category</label>
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
                      <label className="text-white text-sm font-medium mb-2 block">Difficulty</label>
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
          // ── LOBBY (MATCHED or PRIVATE) ─────────────────────────────────────
          <Card className={`bg-black/50 backdrop-blur-sm ${currentRoom.isPrivate ? 'border-purple-500/50' : 'border-green-500/50'}`}>
            <CardHeader>
              <CardTitle className="text-white text-center">
                {currentRoom.isPrivate ? 'Private Room' : 'Match Found!'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Private room code + invite */}
              {currentRoom.isPrivate && currentRoom.privateCode && (
                <div className="bg-purple-900/30 border border-purple-500/40 rounded-xl p-4 space-y-3">
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wide">Room Code</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-center">
                      <span className="text-white text-2xl font-mono font-bold tracking-[0.3em]">
                        {currentRoom.privateCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {onlineFriends.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-xs">Invite a friend:</p>
                      <div className="flex gap-2">
                        <select
                          value={selectedFriend}
                          onChange={(e) => setSelectedFriend(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="">— Select friend —</option>
                          {onlineFriends.map((f) => (
                            <option key={f.playerId} value={f.playerId}>
                              {f.displayName}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleInvite}
                          disabled={!selectedFriend}
                          className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {inviteStatus && (
                        <p className="text-xs text-center text-purple-300">{inviteStatus}</p>
                      )}
                    </div>
                  )}

                  {currentRoom.players.length < currentRoom.maxPlayers && (
                    <p className="text-center text-gray-400 text-sm animate-pulse">
                      Waiting for opponent to join...
                    </p>
                  )}
                </div>
              )}

              {/* Player list */}
              <div>
                <p className="text-gray-300 mb-3">Players in lobby:</p>
                <div className="space-y-2">
                  {currentRoom.players.map((player) => (
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
                  {/* Show waiting slot for private room */}
                  {currentRoom.isPrivate && currentRoom.players.length < currentRoom.maxPlayers && (
                    <div className="flex items-center justify-between bg-gray-800/30 border border-dashed border-gray-600 p-3 rounded-lg">
                      <span className="text-gray-500 text-sm italic">Waiting for player...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category / difficulty badges */}
              <div className="text-center">
                <Badge className="bg-purple-100 text-purple-800 mr-2">
                  {currentRoom.category.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {currentRoom.difficulty.toUpperCase()}
                </Badge>
              </div>

              {/* Ready button — only when room is full */}
              {currentRoom.players.length >= currentRoom.maxPlayers && (
                <Button
                  onClick={handleReady}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                >
                  Ready Up!
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
