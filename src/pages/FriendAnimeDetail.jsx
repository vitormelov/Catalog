import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  areFriends,
  getAnimeById,
  getUserProfile,
} from '../services/firestoreService';
import {
  formatDisplayDate,
  formatPublicRating,
  formatRating,
  getWatchStatusLabel,
} from '../utils/animeStats';
import {
  getFavoriteEpisodes,
  getTotalEpisodes,
  isFavoriteEpisode,
} from '../utils/episodeHelpers';
import '../pages/MangaDetail.css';
import '../pages/AnimeDetail.css';
import './FriendMediaDetail.css';

const FriendAnimeDetail = () => {
  const { userId, animeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser || !userId || !animeId) return;

      try {
        const isFriend = await areFriends(currentUser.uid, userId);
        if (!isFriend) {
          navigate('/friends');
          return;
        }

        const [userProfile, animeData] = await Promise.all([
          getUserProfile(userId),
          getAnimeById(animeId, userId),
        ]);

        if (!animeData) {
          navigate(`/friends/${userId}`);
          return;
        }

        setProfile(userProfile);
        setAnime(animeData);
      } catch (error) {
        console.error('Erro ao carregar anime do amigo:', error);
        navigate(`/friends/${userId}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, userId, animeId, navigate]);

  const totalEpisodes = anime ? getTotalEpisodes(anime) : null;
  const favoriteEpisodes = useMemo(
    () => (anime ? getFavoriteEpisodes(anime) : []),
    [anime]
  );

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!anime || !profile) return null;

  const personalRating = formatRating(anime.rating);
  const publicRating = formatPublicRating(anime.score);

  return (
    <div className="friend-media-detail">
      <Link to={`/friends/${userId}`} className="friend-back-link">
        ← Voltar para {profile.name}
      </Link>

      <div className="anime-detail-header">
        <img
          src={anime.imageUrl || '/placeholder-manga.jpg'}
          alt={anime.title}
          className="anime-detail-cover"
        />
        <div className="anime-detail-info">
          <h1>{anime.title}</h1>
          {anime.titleEnglish && anime.titleEnglish !== anime.title && (
            <p className="anime-detail-subtitle">{anime.titleEnglish}</p>
          )}
          <p className="friend-media-owner">Coleção de {profile.name}</p>
          {totalEpisodes != null && (
            <p className="anime-episodes-info">{totalEpisodes} episódios</p>
          )}

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

      <section className="tracking-section friend-tracking-readonly">
        <h2>Acompanhamento</h2>
        <div className="friend-tracking-info">
          <div>
            <span className="friend-tracking-label">Situação</span>
            <span className={`status-badge status-${anime.watchStatus || 'querendo_assistir'}`}>
              {getWatchStatusLabel(anime.watchStatus)}
            </span>
          </div>
          <div>
            <span className="friend-tracking-label">Início</span>
            <span>{formatDisplayDate(anime.startedAt)}</span>
          </div>
          <div>
            <span className="friend-tracking-label">Término</span>
            <span>{formatDisplayDate(anime.finishedAt)}</span>
          </div>
        </div>
      </section>

      <section className="volumes-section episodes-section">
        <div className="volumes-section-header">
          <h2>Episódios</h2>
          {totalEpisodes ? (
            <span className="total-volumes-display">
              {favoriteEpisodes.length} / {totalEpisodes} com estrela
            </span>
          ) : null}
        </div>

        {!totalEpisodes ? (
          favoriteEpisodes.length === 0 ? (
            <p className="volumes-hint">Nenhum episódio favorito registrado.</p>
          ) : (
            <div className="favorite-episodes-list">
              <h3>Episódios favoritos</h3>
              <p className="favorite-episodes-summary">
                {favoriteEpisodes.map((num) => `Ep. ${num}`).join(' · ')}
              </p>
            </div>
          )
        ) : (
          <>
            <div className="episode-grid friend-episode-grid">
              {Array.from({ length: totalEpisodes }, (_, index) => index + 1).map(
                (num) => {
                  const favorited = isFavoriteEpisode(anime.favoriteEpisodes, num);
                  return (
                    <div
                      key={num}
                      className={`episode-cell friend-episode-cell ${favorited ? 'favorited' : ''}`}
                      title={
                        favorited
                          ? `Ep. ${num} — favorito`
                          : `Episódio ${num}`
                      }
                    >
                      <span className="episode-cell-number">{num}</span>
                      {favorited && (
                        <span className="episode-cell-star" aria-hidden="true">
                          ★
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {favoriteEpisodes.length > 0 && (
              <div className="favorite-episodes-list">
                <h3>Episódios favoritos</h3>
                <p className="favorite-episodes-summary">
                  {favoriteEpisodes.map((num) => `Ep. ${num}`).join(' · ')}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default FriendAnimeDetail;
