import React from 'react';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { socketClient } from '../lib/socket';
import { GameLobby } from './GameLobby';
import { Matchmaking } from './Matchmaking';
import { TriviaGame } from './TriviaGame';
import GameResults from './GameResults';

export function GameUI() {
  const { phase, gameResults, players, resetGame } = useTrivia();
  const { disconnect } = useSocket();

  const handlePlayAgain = () => {
    socketClient.emit('leaveMatchmaking');
    resetGame();
  };

  const handleMainMenu = () => {
    socketClient.emit('leaveMatchmaking');
    resetGame();
  };

  switch (phase) {
    case 'menu':
      return <GameLobby />;
    case 'matchmaking':
      return <Matchmaking />;
    case 'playing':
      return <TriviaGame />;
    case 'results':
      if (gameResults) {
        return (
          <GameResults
            finalScores={gameResults.finalScores}
            winner={gameResults.winner}
            totalQuestions={gameResults.totalQuestions}
            currentPlayerId={socketClient.id || ''}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
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
      return <GameLobby />;
  }
}
