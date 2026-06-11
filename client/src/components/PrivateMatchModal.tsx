import React, { useState, useEffect } from 'react';
import { X, Lock, Key, Users, Loader2 } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { useAuth } from '../lib/stores/useAuth';
import { useTrivia } from '../lib/stores/useTrivia';

const CATEGORIES = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'pop_culture', label: 'Pop Culture' },
  { value: 'sports', label: 'Sports' },
  { value: 'geography', label: 'Geography' },
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

type Tab = 'create' | 'join';

interface PrivateMatchModalProps {
  onClose: () => void;
}

export function PrivateMatchModal({ onClose }: PrivateMatchModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('create');
  const [category, setCategory] = useState('general');
  const [difficulty, setDifficulty] = useState('medium');
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Listen for server responses while modal is open
  useEffect(() => {
    const onJoined = () => {
      // Phase transition is handled by App.tsx (joinedPrivateRoom → setPhase('matchmaking'))
      // The phase change will unmount GameLobby and thus this modal
      setJoining(false);
    };
    const onError = (msg: string) => {
      setJoinError(msg);
      setJoining(false);
      setCreating(false);
    };
    socketClient.on('joinedPrivateRoom', onJoined);
    socketClient.on('joinPrivateRoomError', onError);
    return () => {
      socketClient.off('joinedPrivateRoom', onJoined);
      socketClient.off('joinPrivateRoomError', onError);
    };
  }, []);

  const ensureNameSet = () => {
    const name = user?.username || useTrivia.getState().playerName || 'Player';
    socketClient.emit('setPlayerName', name);
  };

  const handleCreate = () => {
    ensureNameSet();
    setCreating(true);
    socketClient.emit('createPrivateRoom', { category, difficulty });
    // Phase change from App.tsx (privateRoomCreated → setPhase('matchmaking')) unmounts this modal
  };

  const handleJoin = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) { setJoinError('Room code must be 6 characters.'); return; }
    setJoinError(null);
    setJoining(true);
    ensureNameSet();
    socketClient.emit('joinPrivateRoom', { code });
    // Server responds with joinedPrivateRoom (success) or joinPrivateRoomError
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            <span className="text-white font-bold text-lg">Private Match</span>
          </div>
          <button
            onClick={onClose}
            disabled={creating || joining}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['create', 'join'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setJoinError(null); }}
              disabled={creating || joining}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors disabled:opacity-50 ${
                tab === t
                  ? 'text-purple-300 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'create' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Create Room
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Join by Code
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* CREATE TAB */}
          {tab === 'create' && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={creating}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        disabled={creating}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors disabled:opacity-50 ${
                          difficulty === d
                            ? 'bg-purple-700 border border-purple-500 text-white'
                            : 'bg-gray-800 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <p className="text-gray-500 text-xs text-center">
                  You'll get a 6-character code to share with your friend.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Room...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Create Private Room</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* JOIN TAB */}
          {tab === 'join' && (
            <>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                  Room Code
                </label>
                <input
                  value={codeInput}
                  onChange={(e) => {
                    setJoinError(null);
                    setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="ABCDEF"
                  maxLength={6}
                  disabled={joining}
                  className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white text-center text-2xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                {joinError && (
                  <p className="text-red-400 text-xs mt-1.5 text-center">{joinError}</p>
                )}
              </div>

              <button
                onClick={handleJoin}
                disabled={codeInput.length !== 6 || joining}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {joining ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
                ) : (
                  <><Users className="w-4 h-4" /> Join Room</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
