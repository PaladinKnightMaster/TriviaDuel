import React, { useEffect } from 'react';
import { useSocket } from './lib/stores/useSocket';
import { useTrivia } from './lib/stores/useTrivia';
import { GameUI } from './components/GameUI';
import { socketClient } from './lib/socket';
import "@fontsource/inter";

function App() {
  const { connect, currentRoom } = useSocket();
  const { setPhase, setCurrentQuestion, updatePlayers, setGameResults } = useTrivia();

  useEffect(() => {
    connect();

    const onGameStarted = () => {
      setPhase('playing');
    };

    const onNewQuestion = (question: any) => {
      setCurrentQuestion(question);
    };

    const onGameEnded = (results: any) => {
      console.log('Game ended:', results);
      setGameResults({
        finalScores: results.finalScores || [],
        winner: results.winner || null,
        totalQuestions: results.totalQuestions || 10,
      });
      setPhase('results');
    };

    const onPlayersUpdated = (players: any) => {
      updatePlayers(players);
    };

    socketClient.on('gameStarted', onGameStarted);
    socketClient.on('newQuestion', onNewQuestion);
    socketClient.on('gameEnded', onGameEnded);
    socketClient.on('playersUpdated', onPlayersUpdated);

    return () => {
      socketClient.off('gameStarted', onGameStarted);
      socketClient.off('newQuestion', onNewQuestion);
      socketClient.off('gameEnded', onGameEnded);
      socketClient.off('playersUpdated', onPlayersUpdated);
    };
  }, [connect, setPhase, setCurrentQuestion, updatePlayers, setGameResults]);

  // Automatically transition to game when room starts
  useEffect(() => {
    if (currentRoom?.gameState === 'playing') {
      setPhase('playing');
    }
  }, [currentRoom, setPhase]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameUI />
    </div>
  );
}

export default App;
