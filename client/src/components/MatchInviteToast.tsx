import React, { useEffect } from 'react';
import { Swords, X, Check } from 'lucide-react';
import { usePrivateMatch, MatchInvite } from '../lib/stores/usePrivateMatch';
import { useTrivia } from '../lib/stores/useTrivia';
import { useAuth } from '../lib/stores/useAuth';
import { socketClient } from '../lib/socket';

const AUTO_DISMISS_MS = 30_000;

export function MatchInviteToast() {
  const { incomingInvite, setIncomingInvite } = usePrivateMatch();

  useEffect(() => {
    if (!incomingInvite) return;
    const timer = setTimeout(() => setIncomingInvite(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [incomingInvite]);

  if (!incomingInvite) return null;

  const handleAccept = (invite: MatchInvite) => {
    const { user } = useAuth.getState();
    const { playerName } = useTrivia.getState();
    const name = user?.username || playerName || 'Player';
    socketClient.emit('setPlayerName', name);
    socketClient.emit('joinPrivateRoom', { code: invite.roomCode });
    setIncomingInvite(null);
    // Phase transition to 'matchmaking' handled by App.tsx → joinedPrivateRoom
  };

  const handleDecline = () => {
    setIncomingInvite(null);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4 animate-slide-up">
      <div className="bg-gray-900 border border-yellow-500/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
          <Swords className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">
            {incomingInvite.isRematch ? '⚔️ Rematch Request!' : 'Private Match Invite!'}
          </p>
          <p className="text-gray-300 text-sm mt-0.5">
            <span className="text-yellow-300 font-semibold">{incomingInvite.fromName}</span>
            {incomingInvite.isRematch ? ' wants a rematch' : ' invited you to a match'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAccept(incomingInvite)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={handleDecline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
