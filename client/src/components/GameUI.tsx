import React, { useState } from 'react';
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
          />
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
