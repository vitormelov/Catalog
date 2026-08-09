import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  areFriends,
  getMangaById,
  getUserProfile,
} from '../services/firestoreService';
import {
  formatPublicRating,
  formatRating,
  sortVolumesByNumber,
} from '../utils/mangaStats';
import { getConditionLabel, normalizeVolume } from '../utils/volumeHelpers';
import { formatLocalDate, formatLocalDateTime } from '../utils/dateHelpers';
import { userShowsCostsToFriends } from '../utils/friendHelpers';
import '../pages/MangaDetail.css';
import './FriendMediaDetail.css';

const FriendMangaDetail = () => {
  const { userId, mangaId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser || !userId || !mangaId) return;

      try {
        const isFriend = await areFriends(currentUser.uid, userId);
        if (!isFriend) {
          navigate('/friends');
          return;
        }

        const [userProfile, mangaData] = await Promise.all([
          getUserProfile(userId),
          getMangaById(mangaId, userId),
        ]);

        if (!mangaData) {
          navigate(`/friends/${userId}`);
          return;
        }

        setProfile(userProfile);
        setManga(mangaData);
      } catch (error) {
        console.error('Erro ao carregar mangá do amigo:', error);
        navigate(`/friends/${userId}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, userId, mangaId, navigate]);

  const ownedVolumes = manga?.volumes || [];
  const sortedOwnedVolumes = useMemo(
    () => sortVolumesByNumber(ownedVolumes),
    [ownedVolumes]
  );
  const totalVolumes = manga?.totalVolumes || null;
  const ownedMap = useMemo(
    () =>
      new Map(
        sortedOwnedVolumes.map((volume) => [
          Number(volume.volumeNumber),
          normalizeVolume(volume),
        ])
      ),
    [sortedOwnedVolumes]
  );

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!manga || !profile) return null;

  const personalRating = formatRating(manga.rating);
  const publicRating = formatPublicRating(manga.score);
  const showCosts = userShowsCostsToFriends(profile);

  return (
    <div className="friend-media-detail">
      <Link to={`/friends/${userId}`} className="friend-back-link">
        ← Voltar para {profile.name}
      </Link>

      <div className="manga-detail-header">
        <img
          src={manga.imageUrl || '/placeholder-manga.jpg'}
          alt={manga.title}
          className="manga-detail-cover"
        />
        <div className="manga-detail-info">
          <h1>{manga.title}</h1>
          {manga.titleEnglish && manga.titleEnglish !== manga.title && (
            <p className="manga-detail-subtitle">{manga.titleEnglish}</p>
          )}
          <p className="friend-media-owner">Coleção de {profile.name}</p>

          <div className="ratings-comparison friend-ratings-readonly">
            <div className="rating-card public-rating">
              <span className="rating-label">Nota do público</span>
              <span className="rating-value">{publicRating ?? '—'}</span>
            </div>
            <div className="rating-card personal-rating">
              <span className="rating-label">Nota de {profile.name}</span>
              <span className="rating-value">{personalRating ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="volumes-section">
        <div className="volumes-section-header">
          <h2>Volumes</h2>
          {totalVolumes ? (
            <span className="total-volumes-display">
              {sortedOwnedVolumes.length} / {totalVolumes} volumes
            </span>
          ) : (
            <span className="friend-media-meta">
              {sortedOwnedVolumes.length} volume
              {sortedOwnedVolumes.length !== 1 ? 's' : ''} adquirido
              {sortedOwnedVolumes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!totalVolumes ? (
          sortedOwnedVolumes.length === 0 ? (
            <p className="volumes-hint">Nenhum volume registrado.</p>
          ) : (
            <div className="owned-volumes-list">
              <h3>Volumes adquiridos</h3>
              {sortedOwnedVolumes.map((volume) => {
                const normalized = normalizeVolume(volume);
                return (
                  <div key={volume.volumeNumber} className="owned-volume-row">
                    <span className="owned-vol-num">
                      Vol. {normalized.volumeNumber}
                      {normalized.raro && (
                        <span className="owned-vol-rare-star" title="Volume raro">
                          ★
                        </span>
                      )}
                    </span>
                    <span className="owned-vol-condition">
                      {getConditionLabel(normalized.condition)}
                    </span>
                    {showCosts && (
                      <span className="owned-vol-price">
                        R$ {(normalized.price || 0).toFixed(2)}
                      </span>
                    )}
                    <span className="owned-vol-date">
                      {formatLocalDate(normalized.purchaseDate, '—')}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <>
            <div className="volume-grid friend-volume-grid">
              {Array.from({ length: totalVolumes }, (_, index) => index + 1).map(
                (num) => {
                  const owned = ownedMap.get(num);
                  return (
                    <div
                      key={num}
                      className={`volume-cell friend-volume-cell ${owned ? 'owned' : ''}`}
                      title={
                        owned
                          ? `Vol. ${num} — ${getConditionLabel(owned.condition)}${
                              owned.raro ? ' — Volume raro' : ''
                            }`
                          : `Volume ${num} não adquirido`
                      }
                    >
                      <span className="volume-cell-number">{num}</span>
                      {owned && (
                        <span className="volume-cell-mark" aria-hidden="true">
                          {owned.raro ? '★' : '✓'}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {sortedOwnedVolumes.length > 0 && (
              <div className="owned-volumes-list">
                <h3>Detalhes dos volumes adquiridos</h3>
                {sortedOwnedVolumes.map((volume) => {
                  const normalized = normalizeVolume(volume);
                  return (
                    <div key={volume.volumeNumber} className="owned-volume-row">
                      <span className="owned-vol-num">
                        Vol. {normalized.volumeNumber}
                        {normalized.raro && (
                          <span className="owned-vol-rare-star" title="Volume raro">
                            ★
                          </span>
                        )}
                      </span>
                      <span className="owned-vol-condition">
                        {getConditionLabel(normalized.condition)}
                      </span>
                      {showCosts && (
                        <span className="owned-vol-price">
                          R$ {(normalized.price || 0).toFixed(2)}
                        </span>
                      )}
                      <span className="owned-vol-date">
                        {formatLocalDate(normalized.purchaseDate, '—')}
                      </span>
                      <span className="owned-vol-updated">
                        {formatLocalDateTime(normalized.lastUpdated, '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default FriendMangaDetail;
