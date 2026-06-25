import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  acceptFriendRequest,
  getUserFriendships,
  getUserProfile,
  removeFriendship,
  searchUsersByName,
  sendFriendRequest,
} from '../services/firestoreService';
import { getOtherParticipant } from '../utils/friendHelpers';
import './Friends.css';

const Friends = () => {
  const { currentUser } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const loadFriendships = useCallback(async () => {
    if (!currentUser) return;

    try {
      const data = await getUserFriendships(currentUser.uid);
      setFriendships(data);

      const otherIds = data
        .map((friendship) => getOtherParticipant(friendship, currentUser.uid))
        .filter(Boolean);

      const profileEntries = await Promise.all(
        otherIds.map(async (userId) => {
          const profile = await getUserProfile(userId);
          return [userId, profile];
        })
      );

      setProfiles(Object.fromEntries(profileEntries));
    } catch (err) {
      console.error('Erro ao carregar amizades:', err);
      setError('Erro ao carregar amizades.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  const friendshipByUserId = useMemo(() => {
    const map = new Map();
    friendships.forEach((friendship) => {
      const otherId = getOtherParticipant(friendship, currentUser?.uid);
      if (otherId) map.set(otherId, friendship);
    });
    return map;
  }, [friendships, currentUser]);

  const incomingRequests = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.status === 'pending' &&
          friendship.addresseeId === currentUser?.uid
      ),
    [friendships, currentUser]
  );

  const outgoingRequests = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.status === 'pending' &&
          friendship.requesterId === currentUser?.uid
      ),
    [friendships, currentUser]
  );

  const acceptedFriends = useMemo(
    () => friendships.filter((friendship) => friendship.status === 'accepted'),
    [friendships]
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    setError('');

    const term = searchInput.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsersByName(term);
      setSearchResults(results.filter((user) => user.userId !== currentUser.uid));
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao buscar usuários.');
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async (userId) => {
    setActionId(userId);
    setError('');
    try {
      await sendFriendRequest(currentUser.uid, userId);
      await loadFriendships();
      setSearchResults((prev) =>
        prev.map((user) =>
          user.userId === userId ? { ...user, _requestSent: true } : user
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleAccept = async (requesterId) => {
    setActionId(requesterId);
    setError('');
    try {
      await acceptFriendRequest(currentUser.uid, requesterId);
      await loadFriendships();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (otherUserId) => {
    setActionId(otherUserId);
    setError('');
    try {
      await removeFriendship(currentUser.uid, otherUserId);
      await loadFriendships();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const getConnectionLabel = (userId) => {
    const friendship = friendshipByUserId.get(userId);
    if (!friendship) return null;
    if (friendship.status === 'accepted') return 'Amigo';
    if (friendship.requesterId === currentUser.uid) return 'Pedido enviado';
    return 'Pedido recebido';
  };

  const renderUserName = (userId) =>
    profiles[userId]?.name || 'Usuário';

  if (loading) {
    return <div className="loading">Carregando amigos...</div>;
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1>Amigos</h1>
        <p className="friends-subtitle">
          Busque pessoas pelo nome e conecte-se para ver coleções e rankings.
        </p>
      </div>

      {error && <div className="friends-error">{error}</div>}

      <section className="friends-section">
        <h2>Buscar amigos</h2>
        <form onSubmit={handleSearch} className="friends-search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Digite o nome..."
            className="friends-search-input"
          />
          <button type="submit" className="friends-search-btn" disabled={searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="friends-search-results">
            {searchResults.map((user) => {
              const status = getConnectionLabel(user.userId);
              const isPending =
                status === 'Pedido enviado' || status === 'Pedido recebido';
              const isFriend = status === 'Amigo';

              return (
                <div key={user.userId} className="friends-user-row">
                  <span className="friends-user-name">{user.name}</span>
                  {isFriend ? (
                    <Link to={`/friends/${user.userId}`} className="friends-btn friends-btn-view">
                      Ver coleção
                    </Link>
                  ) : isPending ? (
                    <span className="friends-status-badge">{status}</span>
                  ) : (
                    <button
                      type="button"
                      className="friends-btn friends-btn-connect"
                      onClick={() => handleConnect(user.userId)}
                      disabled={actionId === user.userId}
                    >
                      {actionId === user.userId ? '...' : 'Conectar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {incomingRequests.length > 0 && (
        <section className="friends-section">
          <h2>Pedidos recebidos</h2>
          <div className="friends-list">
            {incomingRequests.map((friendship) => {
              const userId = friendship.requesterId;
              return (
                <div key={friendship.id} className="friends-user-row">
                  <span className="friends-user-name">{renderUserName(userId)}</span>
                  <div className="friends-row-actions">
                    <button
                      type="button"
                      className="friends-btn friends-btn-accept"
                      onClick={() => handleAccept(userId)}
                      disabled={actionId === userId}
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      className="friends-btn friends-btn-decline"
                      onClick={() => handleDecline(userId)}
                      disabled={actionId === userId}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {outgoingRequests.length > 0 && (
        <section className="friends-section">
          <h2>Pedidos enviados</h2>
          <div className="friends-list">
            {outgoingRequests.map((friendship) => {
              const userId = friendship.addresseeId;
              return (
                <div key={friendship.id} className="friends-user-row">
                  <span className="friends-user-name">{renderUserName(userId)}</span>
                  <button
                    type="button"
                    className="friends-btn friends-btn-decline"
                    onClick={() => handleDecline(userId)}
                    disabled={actionId === userId}
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="friends-section">
        <h2>Meus amigos</h2>
        {acceptedFriends.length === 0 ? (
          <p className="friends-empty">Você ainda não tem amigos conectados.</p>
        ) : (
          <div className="friends-list">
            {acceptedFriends.map((friendship) => {
              const userId = getOtherParticipant(friendship, currentUser.uid);
              return (
                <div key={friendship.id} className="friends-user-row">
                  <span className="friends-user-name">{renderUserName(userId)}</span>
                  <div className="friends-row-actions">
                    <Link to={`/friends/${userId}`} className="friends-btn friends-btn-view">
                      Ver coleção
                    </Link>
                    <button
                      type="button"
                      className="friends-btn friends-btn-decline"
                      onClick={() => handleDecline(userId)}
                      disabled={actionId === userId}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Friends;
