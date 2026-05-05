import React, { useEffect } from 'react';
import { useSocket } from './lib/stores/useSocket';
import { useTrivia } from './lib/stores/useTrivia';
import { useAuth } from './lib/stores/useAuth';
import { useTournament } from './lib/stores/useTournament';
import { GameUI } from './components/GameUI';
import { AchievementToast } from './components/AchievementToast';
import { socketClient } from './lib/socket';
import "@fontsource/inter";

function App() {
  const { connect, currentRoom } = useSocket();
  const { setPhase, setCurrentQuestion, updatePlayers, setGameResults } = useTrivia();
  const { initFromStorage } = useAuth();
  const { setTournaments, setCurrentTournament, setBracketMatches } = useTournament();

  // Boot: restore auth from localStorage before connecting socket
  useEffect(() => {
    initFromStorage();
    connect();
  }, []);

  useEffect(() => {
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
        correctAnswersPerPlayer: results.correctAnswersPerPlayer || {},
        maxStreakPerPlayer: results.maxStreakPerPlayer || {},
        tournamentMatchId: results.tournamentMatchId,
      });
      setPhase('results');
    };

    const onPlayersUpdated = (players: any) => {
      updatePlayers(players);
    };

    // Tournament events
    const onTournamentsData = (tournaments: any[]) => {
      setTournaments(Array.isArray(tournaments) ? tournaments : []);
    };

    const onTournamentCreated = (tournament: any) => {
      setCurrentTournament(tournament);
      setPhase('tournament');
    };

    const onTournamentJoined = (tournament: any) => {
      if (tournament) {
        setCurrentTournament(tournament);
        setPhase('tournament');
      }
    };

    const onTournamentUpdated = (tournament: any) => {
      if (tournament) setCurrentTournament(tournament);
    };

    const onTournamentStarted = (tournament: any) => {
      if (tournament) setCurrentTournament(tournament);
    };

    const onTournamentComplete = (tournament: any) => {
      if (tournament) setCurrentTournament(tournament);
    };

    const onTournamentMatches = ({ matches }: { matches: any[]; tournamentId: number }) => {
      setBracketMatches(matches || []);
    };

    const onTournamentListUpdated = () => {
      socketClient.emit('getTournaments');
    };

    socketClient.on('gameStarted', onGameStarted);
    socketClient.on('newQuestion', onNewQuestion);
    socketClient.on('gameEnded', onGameEnded);
    socketClient.on('playersUpdated', onPlayersUpdated);
    socketClient.on('tournamentsData', onTournamentsData);
    socketClient.on('tournamentCreated', onTournamentCreated);
    socketClient.on('tournamentJoined', onTournamentJoined);
    socketClient.on('tournamentUpdated', onTournamentUpdated);
    socketClient.on('tournamentStarted', onTournamentStarted);
    socketClient.on('tournamentComplete', onTournamentComplete);
    socketClient.on('tournamentMatches', onTournamentMatches);
    socketClient.on('tournamentListUpdated', onTournamentListUpdated);

    return () => {
      socketClient.off('gameStarted', onGameStarted);
      socketClient.off('newQuestion', onNewQuestion);
      socketClient.off('gameEnded', onGameEnded);
      socketClient.off('playersUpdated', onPlayersUpdated);
      socketClient.off('tournamentsData', onTournamentsData);
      socketClient.off('tournamentCreated', onTournamentCreated);
      socketClient.off('tournamentJoined', onTournamentJoined);
      socketClient.off('tournamentUpdated', onTournamentUpdated);
      socketClient.off('tournamentStarted', onTournamentStarted);
      socketClient.off('tournamentComplete', onTournamentComplete);
      socketClient.off('tournamentMatches', onTournamentMatches);
      socketClient.off('tournamentListUpdated', onTournamentListUpdated);
    };
  }, [setPhase, setCurrentQuestion, updatePlayers, setGameResults, setTournaments, setCurrentTournament, setBracketMatches]);

  // Automatically transition to game when room starts
  useEffect(() => {
    if (currentRoom?.gameState === 'playing') {
      setPhase('playing');
    }
  }, [currentRoom, setPhase]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameUI />
      {/* Global achievement toast — lives outside game phases */}
      <AchievementToast />
    </div>
  );
}

export default App;
