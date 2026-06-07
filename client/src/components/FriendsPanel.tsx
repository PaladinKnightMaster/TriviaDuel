import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Users, UserPlus, Check, XCircle, Loader2, UserCheck } from 'lucide-react';
import { useSocial, FriendEntry } from '../lib/stores/useSocial';
import { useAuth } from '../lib/stores/useAuth';
import { socketClient } from '../lib/socket';
import { PlayerProfile, Friendship } from '../../../shared/schema';

type Tab = 'friends' | 'search' | 'requests';

interface SearchResult extends PlayerProfile {
  isFriend?: boolean;
  isOnline?: boolean;
}

interface FriendsPanelProps {
  onClose: () => void;
}

export function FriendsPanel({ onClose }: FriendsPanelProps) {
  const { user } = useAuth();
  const {
    friends,
    friendRequests,
    pendingRequestCount,
    clearPendingRequests,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    respondToFriendRequest,
  } = useSocial();

  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Load friends + requests on mount
  useEffect(() => {
    if (!user) return;
    loadFriends();
    loadFriendRequests();
    clearPendingRequests();
  }, [user]);

  // Listen for search results while panel is open
  useEffect(() => {
    const onResults = (results: SearchResult[]) => {
      setSearchResults(results);
      setSearching(false);
    };
    const onSent = ({ targetPlayerId }: { targetPlayerId: string }) => {
      setSentRequests((prev) => new Set(prev).add(targetPlayerId));
      setRequestFeedback('Friend request sent!');
      setTimeout(() => setRequestFeedback(null), 3000);
    };
    const onError = (msg: string) => {
      setRequestFeedback(msg);
      setTimeout(() => setRequestFeedback(null), 3000);
    };
    socketClient.on('searchResults', onResults);
    socketClient.on('friendRequestSent', onSent);
    socketClient.on('friendRequestError', onError);
    return () => {
      socketClient.off('searchResults', onResults);
      socketClient.off('friendRequestSent', onSent);
      socketClient.off('friendRequestError', onError);
    };
  }, []);

  // Reload lists when tab switches to requests
  useEffect(() => {
    if (tab === 'requests') {
      loadFriendRequests();
      clearPendingRequests();
    } else if (tab === 'friends') {
      loadFriends();
    }
  }, [tab]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    socketClient.emit('searchPlayers', { query: query.trim() });
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 border border-purple-500/40 rounded-2xl p-8 text-center max-w-xs mx-4 shadow-2xl">
          <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Sign in to use Friends</p>
          <p className="text-gray-400 text-sm mb-4">Friends features require an account.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm h-full bg-gray-950 border-l border-purple-500/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white font-bold text-lg">Friends</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['friends', 'search', 'requests'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${
                tab === t
                  ? 'text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
              {t === 'requests' && pendingRequestCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Feedback toast */}
        {requestFeedback && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 text-sm text-center">
            {requestFeedback}
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── FRIENDS TAB ── */}
          {tab === 'friends' && (
            <div className="p-4 space-y-2">
              {friends.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No friends yet.</p>
                  <p className="text-xs mt-1 opacity-70">Use the Search tab to find players.</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <FriendRow key={friend.playerId} friend={friend} />
                ))
              )}
            </div>
          )}

          {/* ── SEARCH TAB ── */}
          {tab === 'search' && (
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by display name…"
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                  className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <SearchResultRow
                    key={result.playerId}
                    result={result}
                    alreadySent={sentRequests.has(result.playerId)}
                    onAdd={() => sendFriendRequest(result.playerId)}
                  />
                ))}
                {!searching && query.trim() && searchResults.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-6">
                    No players found for "{query}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── REQUESTS TAB ── */}
          {tab === 'requests' && (
            <div className="p-4 space-y-2">
              {friendRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No pending friend requests.</p>
                </div>
              ) : (
                friendRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    request={req}
                    onAccept={() => respondToFriendRequest(req.id, 'accepted')}
                    onDecline={() => respondToFriendRequest(req.id, 'declined')}
                  />
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function FriendRow({ friend }: { friend: FriendEntry }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
          {friend.displayName.charAt(0).toUpperCase()}
        </div>
        {friend.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-950" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{friend.displayName}</p>
        <p className={`text-xs ${friend.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
          {friend.isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
      {friend.stats && (
        <div className="text-right text-xs text-gray-400">
          <div className="text-gray-300">{friend.stats.tier}</div>
          <div>{friend.stats.rating} ELO</div>
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  result,
  alreadySent,
  onAdd,
}: {
  result: SearchResult;
  alreadySent: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-sm font-bold text-white">
          {result.displayName.charAt(0).toUpperCase()}
        </div>
        {result.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-950" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{result.displayName}</p>
        {result.stats && (
          <p className="text-xs text-gray-400">{result.stats.tier} · {result.stats.rating} ELO</p>
        )}
      </div>
      {result.isFriend ? (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> Friends
        </span>
      ) : alreadySent ? (
        <span className="text-xs text-purple-400 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Sent
        </span>
      ) : (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add
        </button>
      )}
    </div>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [responded, setResponded] = useState(false);

  const handleAccept = () => {
    setResponded(true);
    onAccept();
  };
  const handleDecline = () => {
    setResponded(true);
    onDecline();
  };

  const name = request.requesterProfile?.displayName || `Player #${request.requesterId}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-sm font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-gray-500">Wants to be friends</p>
      </div>
      {responded ? (
        <span className="text-xs text-gray-400">Done</span>
      ) : (
        <div className="flex gap-1.5">
          <button
            onClick={handleAccept}
            className="p-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white transition-colors"
            title="Accept"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleDecline}
            className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            title="Decline"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
