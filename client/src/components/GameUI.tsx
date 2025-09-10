import React from 'react';
import { useTrivia } from '../lib/stores/useTrivia';
import { GameLobby } from './GameLobby';
import { Matchmaking } from './Matchmaking';
import { TriviaGame } from './TriviaGame';

export function GameUI() {
  const { phase } = useTrivia();

  switch (phase) {
    case 'menu':
      return <GameLobby />;
    case 'matchmaking':
      return <Matchmaking />;
    case 'playing':
      return <TriviaGame />;
    case 'results':
      return <div>Results coming soon...</div>;
    default:
      return <GameLobby />;
  }
}
