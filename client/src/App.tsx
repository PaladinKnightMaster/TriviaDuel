import React, { useEffect } from 'react';
import { useSocket } from './lib/stores/useSocket';
import { useTrivia } from './lib/stores/useTrivia';
import { GameUI } from './components/GameUI';
import { socketClient } from './lib/socket';
import "@fontsource/inter";

function App() {
  const { connect, currentRoom } = useSocket();
  const { setPhase, setCurrentQuestion, updatePlayers } = useTrivia();

  useEffect(() => {
    // Connect to socket server
    connect();

    // Listen for game events
    socketClient.on('gameStarted', () => {
      setPhase('playing');
    });

    socketClient.on('newQuestion', (question) => {
      setCurrentQuestion(question);
    });

    socketClient.on('gameEnded', (results) => {
      setPhase('results');
      console.log('Game ended:', results);
    });

    socketClient.on('playersUpdated', (players) => {
      updatePlayers(players);
    });

    return () => {
      socketClient.off('gameStarted');
      socketClient.off('newQuestion');
      socketClient.off('gameEnded');
      socketClient.off('playersUpdated');
    };
  }, [connect, setPhase, setCurrentQuestion, updatePlayers]);

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
