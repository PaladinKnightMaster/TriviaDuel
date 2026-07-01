import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Search, Star, BookOpen, Play, Trash2, Users, Loader2, Globe, Lock } from 'lucide-react';
import { useTrivia } from '../lib/stores/useTrivia';
import { useAuth } from '../lib/stores/useAuth';
import { useSocket } from '../lib/stores/useSocket';
import { useCustomCategory } from '../lib/stores/useCustomCategory';
import { socketClient } from '../lib/socket';
import { CustomCategory } from '../../../shared/schema';
import { CustomCategoryEditor } from './CustomCategoryEditor';

type Tab = 'browse' | 'mine';

export function CustomCategoryBrowser() {
  const { setPhase } = useTrivia();
  const { user } = useAuth();
  const { joinMatchmaking } = useSocket();
  const {
    publicCategories, myCategories, searchResults,
    loading, searchLoading,
    fetchPublic, fetchMine, search,
    deleteCategory, rate,
    setPublic, setMine, setSearch, removeFromMine,
    setLoading,
  } = useCustomCategory();

  const [tab, setTab] = useState<Tab>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  // Mount: register socket listeners + fetch initial data
  useEffect(() => {
    const onPublic = (cats: CustomCategory[]) => setPublic(cats);
    const onMine = (cats: CustomCategory[]) => setMine(cats);
    const onSearch = (cats: CustomCategory[]) => setSearch(cats);
    const onDeleted = ({ categoryId }: { categoryId: number }) => {
      removeFromMine(categoryId);
      setDeletingId(null);
    };

    socketClient.on('publicCategoriesData', onPublic);
    socketClient.on('userCategoriesData', onMine);
    socketClient.on('searchCategoriesResults', onSearch);
    socketClient.on('customCategoryDeleted', onDeleted);

    fetchPublic();

    return () => {
      socketClient.off('publicCategoriesData', onPublic);
      socketClient.off('userCategoriesData', onMine);
      socketClient.off('searchCategoriesResults', onSearch);
      socketClient.off('customCategoryDeleted', onDeleted);
    };
  }, []);

  // Tab switch → fetch
  useEffect(() => {
    if (tab === 'mine') fetchMine();
    else fetchPublic();
    setSearchTerm('');
  }, [tab]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!term.trim()) { setSearch([]); return; }
    searchDebounce.current = setTimeout(() => search(term), 350);
  };

  const handlePlay = (cat: CustomCategory) => {
    if (!cat.id) return;
    if (cat.questionCount < 1) { alert('This category has no questions yet — add some first!'); return; }

    const { playerName } = useTrivia.getState();
    const name = user?.username || playerName || 'Player';
    socketClient.emit('setPlayerName', name);
    setPlayingId(cat.id);
    joinMatchmaking('pve', 'custom', 'mixed', cat.id);
    setTimeout(() => {
      setPlayingId(null);
      setPhase('playing');
    }, 800);
  };

  const handleDelete = (cat: CustomCategory) => {
    if (!confirm(`Delete "${cat.name}"? This also removes all its questions.`)) return;
    setDeletingId(cat.id);
    deleteCategory(cat.id);
  };

  const handleRate = (catId: number, stars: number) => {
    setUserRatings((prev) => ({ ...prev, [catId]: stars }));
    rate(catId, stars);
  };

  const displayList = searchTerm.trim() ? searchResults : (tab === 'browse' ? publicCategories : myCategories);
  const isSearching = searchLoading && !!searchTerm.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button
          onClick={() => setPhase('menu')}
          className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Community Trivia</h1>
          <p className="text-teal-300 text-sm">Browse and play community-made question sets</p>
        </div>
        {user && (
          <button
            onClick={() => setShowEditor(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-1 mb-4">
        {(['browse', 'mine'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-teal-600 text-white'
                : 'text-teal-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t === 'browse' ? '🌍 Browse Public' : '📁 My Categories'}
          </button>
        ))}
      </div>

      {/* Search bar (browse tab only) */}
      {tab === 'browse' && (
        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Auth notice for Mine tab */}
      {tab === 'mine' && !user && (
        <div className="mx-6 mb-4 p-4 rounded-xl bg-yellow-900/30 border border-yellow-500/40 text-yellow-300 text-sm text-center">
          Sign in to create and manage your own categories.
        </div>
      )}

      {/* Category grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {loading && !searchTerm ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {tab === 'browse' && searchTerm
              ? 'No categories found for that search.'
              : tab === 'mine'
              ? user
                ? <span>You haven't created any categories yet.<br /><button onClick={() => setShowEditor(true)} className="mt-3 inline-block text-teal-400 hover:text-teal-300 underline">Create your first one →</button></span>
                : 'Sign in to see your categories.'
              : 'No public categories yet. Be the first to create one!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                isMine={tab === 'mine'}
                isAuth={!!user}
                playingId={playingId}
                deletingId={deletingId}
                userRating={userRatings[cat.id] ?? 0}
                onPlay={handlePlay}
                onDelete={handleDelete}
                onRate={handleRate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor overlay */}
      {showEditor && (
        <CustomCategoryEditor
          onClose={() => setShowEditor(false)}
          onCreated={() => {
            setShowEditor(false);
            setTab('mine');
            fetchMine();
          }}
        />
      )}
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────────────────

interface CardProps {
  cat: CustomCategory;
  isMine: boolean;
  isAuth: boolean;
  playingId: number | null;
  deletingId: number | null;
  userRating: number;
  onPlay: (cat: CustomCategory) => void;
  onDelete: (cat: CustomCategory) => void;
  onRate: (catId: number, stars: number) => void;
}

function CategoryCard({ cat, isMine, isAuth, playingId, deletingId, userRating, onPlay, onDelete, onRate }: CardProps) {
  const isPlaying = playingId === cat.id;
  const isDeleting = deletingId === cat.id;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-teal-500/40 transition-all">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {cat.isPublic
              ? <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              : <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
            <h3 className="text-white font-bold text-sm truncate">{cat.name}</h3>
          </div>
          {cat.description && (
            <p className="text-gray-400 text-xs line-clamp-2">{cat.description}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {cat.questionCount} Qs
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {cat.plays} plays
        </span>
        {cat.rating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {cat.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Star rating (public, auth, not own) */}
      {isAuth && !isMine && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRate(cat.id, star)}
              className="transition-transform hover:scale-110"
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`w-4 h-4 ${
                  star <= userRating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600 hover:text-yellow-400'
                }`}
              />
            </button>
          ))}
          {userRating > 0 && (
            <span className="text-xs text-gray-500 ml-1">Your rating</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onPlay(cat)}
          disabled={isPlaying || cat.questionCount < 1}
          className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          title={cat.questionCount < 1 ? 'No questions yet' : 'Play vs AI'}
        >
          {isPlaying
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting...</>
            : <><Play className="w-3.5 h-3.5" /> Play</>}
        </button>

        {isMine && (
          <button
            onClick={() => onDelete(cat)}
            disabled={isDeleting}
            className="p-2 rounded-lg bg-red-900/50 hover:bg-red-700/60 disabled:opacity-40 text-red-300 hover:text-white transition-colors"
            title="Delete category"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
