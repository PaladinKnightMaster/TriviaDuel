import React, { useState, useEffect } from 'react';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { useTournament } from '../lib/stores/useTournament';
import { socketClient } from '../lib/socket';
import { GameLobby } from './GameLobby';
import { Matchmaking } from './Matchmaking';
import { TriviaGame } from './TriviaGame';
import GameResults from './GameResults';
import { PlayerProfile } from './PlayerProfile';
import { Tournament } from './Tournament';
import { CustomCategoryBrowser } from './CustomCategoryBrowser';

export function GameUI() {
  const { phase, gameResults, resetGame, setPhase } = useTrivia();
  const { } = useSocket(); // keep import live for side-effects
  const [showProfile, setShowProfile] = useState(false);
  const [rematchError, setRematchError] = useState<string | null>(null);

  // BUG 1 fix: handle rematchError (opponent already left) — server emits this event
  useEffect(() => {
    const onRematchError = (msg: string) => {
      setRematchError(msg);
      setTimeout(() => setRematchError(null), 4000);
    };
    socketClient.on('rematchError', onRematchError);
    return () => socketClient.off('rematchError', onRematchError);
  }, []);

  const handlePlayAgain = () => {
    socketClient.emit('leaveMatchmaking');
    resetGame();
  };

  const handleMainMenu = () => {
    socketClient.emit('leaveMatchmaking');
    resetGame();
  };

  const handleBackToBracket = () => {
    setPhase('tournament');
  };

  // BUGs 3 & 4 fix: opponentId computed at render time in GameResults (no stale socket.id);
  // category/difficulty preserved from original game so rematch plays same settings
  const handleRematch = (opponentId: string) => {
    if (!gameResults || !opponentId) return;
    socketClient.emit('requestRematch', {
      opponentId,
      category: gameResults.category || 'general',
      difficulty: gameResults.difficulty || 'medium',
    });
  };

  // Profile overlay takes priority
  if (showProfile) {
    return <PlayerProfile onBack={() => setShowProfile(false)} />;
  }

  switch (phase) {
    case 'menu':
      return <GameLobby onOpenProfile={() => setShowProfile(true)} />;
    case 'matchmaking':
      return <Matchmaking />;
    case 'playing':
      return <TriviaGame />;
    case 'tournament':
      return <Tournament />;
    case 'custom':
      return <CustomCategoryBrowser />;
    case 'results':
      if (gameResults) {
        return (
          <>
            {rematchError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 text-red-200 text-sm px-4 py-2.5 rounded-xl shadow-xl pointer-events-none">
                ⚠️ {rematchError}
              </div>
            )}
            <GameResults
              finalScores={gameResults.finalScores}
              winner={gameResults.winner}
              totalQuestions={gameResults.totalQuestions}
              currentPlayerId={socketClient.id || ''}
              correctAnswersPerPlayer={gameResults.correctAnswersPerPlayer}
              maxStreakPerPlayer={gameResults.maxStreakPerPlayer}
              tournamentMatchId={gameResults.tournamentMatchId}
              onPlayAgain={handlePlayAgain}
              onMainMenu={handleMainMenu}
              onBackToBracket={gameResults.tournamentMatchId ? handleBackToBracket : undefined}
              onRematch={handleRematch}
            />
          </>
        );
      }
      return (
        <div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-4xl mb-4">🏁</div>
            <p className="text-xl">Game Over</p>
            <button
              onClick={handleMainMenu}
              className="mt-4 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      );
    default:
      return <GameLobby onOpenProfile={() => setShowProfile(true)} />;
  }
}
