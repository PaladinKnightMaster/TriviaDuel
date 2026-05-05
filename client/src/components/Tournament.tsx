import React, { useState, useEffect, useCallback } from 'react';
import { useTrivia } from '../lib/stores/useTrivia';
import { useAuth } from '../lib/stores/useAuth';
import { useTournament } from '../lib/stores/useTournament';
import { Tournament as TournamentType } from '../../../shared/schema';
import { TournamentBracket } from './TournamentBracket';
import { Trophy, Users, Plus, ArrowLeft, Clock, Zap, Lock } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'pop_culture', label: 'Pop Culture' },
  { value: 'sports', label: 'Sports' },
  { value: 'geography', label: 'Geography' },
];

const DIFFICULTIES = [
  { value: 'easy', label: '🟢 Easy' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'hard', label: '🔴 Hard' },
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  registration: { label: 'Open', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  in_progress:  { label: 'In Progress', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  completed:    { label: 'Completed', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
};

export function Tournament() {
  const { setPhase } = useTrivia();
  const { user } = useAuth();
  const {
    tournaments, currentTournament, isLoading,
    setTournaments, setCurrentTournament, setLoading, clearTournament,
    createTournament, joinTournament, fetchTournaments,
  } = useTournament();

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState('general');
  const [createDifficulty, setCreateDifficulty] = useState('medium');
  const [createMaxPlayers, setCreateMaxPlayers] = useState(4);
  const [createPrize, setCreatePrize] = useState(0);
  const [creating, setCreating] = useState(false);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [setTournaments, setLoading]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleCreate = () => {
    if (!createName.trim()) return;
    setCreating(true);
    createTournament(createName.trim(), createCategory, createDifficulty, createMaxPlayers, createPrize);
    setTimeout(() => {
      setCreating(false);
      setShowCreate(false);
      setCreateName('');
    }, 1000);
  };

  const handleJoin = (t: TournamentType) => {
    const name = user?.username || `Player${Math.floor(Math.random() * 9999)}`;
    joinTournament(t.id, name);
  };

  const handleBack = () => {
    clearTournament();
    setPhase('menu');
  };

  if (currentTournament) {
    return <TournamentBracket onBack={() => setCurrentTournament(null)} onLeave={handleBack} />;
  }

  const openTournaments = tournaments.filter(t => t.status === 'registration');
  const activeTournaments = tournaments.filter(t => t.status === 'in_progress');

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-white">🏆 Tournament Mode</h1>
            <p className="text-amber-300/70 text-sm mt-1">Compete in bracket-style elimination tournaments</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Auth warning */}
        {!user && (
          <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm">Sign in to create or join tournaments and have your progress saved.</p>
          </div>
        )}

        {/* Create Tournament */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            disabled={!user}
            className="w-full mb-5 py-3 rounded-xl border-2 border-dashed border-amber-400/40 text-amber-300 hover:border-amber-400/70 hover:text-amber-200 transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create New Tournament
          </button>
        ) : (
          <div className="bg-black/40 rounded-xl border border-amber-400/30 p-4 mb-5 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              New Tournament
            </h3>
            <input
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="Tournament name..."
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/60"
              maxLength={40}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Category</label>
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCreateCategory(c.value)}
                      className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${
                        createCategory === c.value
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-400/40'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Difficulty</label>
                  <div className="space-y-1">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setCreateDifficulty(d.value)}
                        className={`w-full text-xs py-1 px-2 rounded-lg border transition-all ${
                          createDifficulty === d.value
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-400/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Max Players</label>
                  <div className="flex gap-1">
                    {[4, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => setCreateMaxPlayers(n)}
                        className={`flex-1 text-xs py-1 rounded-lg border transition-all ${
                          createMaxPlayers === n
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-400/40'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {creating ? 'Creating…' : 'Create Tournament'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateName(''); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active tournaments */}
        {activeTournaments.length > 0 && (
          <div className="mb-5">
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-2">In Progress</h2>
            <div className="space-y-2">
              {activeTournaments.map(t => (
                <TournamentCard
                  key={t.id} tournament={t} onJoin={handleJoin}
                  onView={() => setCurrentTournament(t)} canJoin={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Open tournaments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white/60 text-xs uppercase tracking-widest">Open for Registration</h2>
            <button
              onClick={loadTournaments}
              className="text-amber-400/60 hover:text-amber-400 text-xs transition-colors"
            >
              Refresh
            </button>
          </div>
          {isLoading ? (
            <div className="text-center text-white/40 py-8">Loading tournaments…</div>
          ) : openTournaments.length === 0 ? (
            <div className="text-center text-white/30 py-8 border border-dashed border-white/10 rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No open tournaments — create one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openTournaments.map(t => (
                <TournamentCard
                  key={t.id} tournament={t} onJoin={handleJoin}
                  onView={() => setCurrentTournament(t)}
                  canJoin={!!user}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TournamentCard({
  tournament: t, onJoin, onView, canJoin,
}: {
  tournament: TournamentType;
  onJoin: (t: TournamentType) => void;
  onView: () => void;
  canJoin: boolean;
}) {
  const badge = STATUS_BADGE[t.status] || STATUS_BADGE.registration;
  const isFull = t.currentPlayers >= t.maxPlayers;
  const fillPct = Math.round((t.currentPlayers / t.maxPlayers) * 100);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-amber-400/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-semibold truncate">{t.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
            <span className="capitalize">{t.category.replace('_', ' ')}</span>
            <span>·</span>
            <span className="capitalize">{t.difficulty}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {t.currentPlayers}/{t.maxPlayers}
            </span>
          </div>
          <div className="mt-2 bg-white/10 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {t.status !== 'registration' && (
            <button
              onClick={onView}
              className="text-xs py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              View Bracket
            </button>
          )}
          {t.status === 'registration' && !isFull && (
            <button
              onClick={() => canJoin ? onJoin(t) : null}
              disabled={!canJoin}
              className="text-xs py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Join
            </button>
          )}
          {isFull && t.status === 'registration' && (
            <span className="text-xs text-white/40 py-1.5 px-2">Full</span>
          )}
        </div>
      </div>
    </div>
  );
}
