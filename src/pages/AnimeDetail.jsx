import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAnimeById,
  updateAnimeInCollection,
} from '../services/firestoreService';
import { WATCH_STATUSES, formatDisplayDate, formatPublicRating } from '../utils/animeStats';
import {
  getTotalEpisodes,
  getFavoriteEpisodes,
  isFavoriteEpisode,
  toggleFavoriteEpisode,
} from '../utils/episodeHelpers';
import './MangaDetail.css';
import './AnimeDetail.css';

const AnimeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState('');
  const [watchStatus, setWatchStatus] = useState('querendo_assistir');
  const [startedAt, setStartedAt] = useState('');
  const [finishedAt, setFinishedAt] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [totalEpisodesInput, setTotalEpisodesInput] = useState('');
  const [editingTotalEpisodes, setEditingTotalEpisodes] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(null);

  useEffect(() => {
    if (currentUser && id) {
      loadAnime();
    }
  }, [currentUser, id]);

  const loadAnime = async () => {
    try {
      const data = await getAnimeById(id, currentUser.uid);
      if (!data) {
        navigate('/my-animes');
        return;
      }
      setAnime(data);
      setRating(
        data.rating !== null && data.rating !== undefined && data.rating > 0
          ? String(data.rating)
          : ''
      );
      setWatchStatus(data.watchStatus || 'querendo_assistir');
      setStartedAt(data.startedAt || '');
      setFinishedAt(data.finishedAt || '');
      const total = getTotalEpisodes(data);
      setTotalEpisodesInput(total ? String(total) : '');
      setEditingTotalEpisodes(!total);
    } catch (error) {
      console.error('Erro ao carregar anime:', error);
      navigate('/my-animes');
    } finally {
      setLoading(false);
    }
  };

  const totalEpisodes = anime ? getTotalEpisodes(anime) : null;
  const favoriteEpisodes = useMemo(
    () => (anime ? getFavoriteEpisodes(anime) : []),
    [anime]
  );

  const handleSaveRating = async () => {
    if (!rating) {
      await updateAnimeInCollection(anime.id, currentUser.uid, { rating: 0 });
      setAnime((prev) => ({ ...prev, rating: 0 }));
      return;
    }

    const numericRating = parseFloat(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      alert('Informe uma nota entre 1 e 10.');
      return;
    }

    setSavingRating(true);
    try {
      const rounded = Math.round(numericRating * 2) / 2;
      await updateAnimeInCollection(anime.id, currentUser.uid, { rating: rounded });
      setAnime((prev) => ({ ...prev, rating: rounded }));
      setRating(String(rounded));
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Erro ao salvar nota.');
    } finally {
      setSavingRating(false);
    }
  };

  const handleSaveTotalEpisodes = async () => {
    const parsed = parseInt(totalEpisodesInput, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      alert('Informe um número válido de episódios (mínimo 1).');
      return;
    }

    try {
      await updateAnimeInCollection(anime.id, currentUser.uid, { totalEpisodes: parsed });
      setAnime((prev) => ({ ...prev, totalEpisodes: parsed }));
      setEditingTotalEpisodes(false);
    } catch (error) {
      console.error('Erro ao salvar total de episódios:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const handleToggleFavorite = async (episodeNumber) => {
    if (savingFavorite != null) return;

    const updated = toggleFavoriteEpisode(anime.favoriteEpisodes, episodeNumber);
    setSavingFavorite(episodeNumber);

    try {
      await updateAnimeInCollection(anime.id, currentUser.uid, {
        favoriteEpisodes: updated,
      });
      setAnime((prev) => ({ ...prev, favoriteEpisodes: updated }));
    } catch (error) {
      console.error('Erro ao salvar episódio favorito:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSavingFavorite(null);
    }
  };

  const handleSaveTracking = async () => {
    if (startedAt && Number.isNaN(Date.parse(startedAt))) {
      alert('Informe uma data de início válida ou deixe em branco.');
      return;
    }
    if (finishedAt && Number.isNaN(Date.parse(finishedAt))) {
      alert('Informe uma data de término válida ou deixe em branco.');
      return;
    }

    setSavingTracking(true);
    try {
      const updates = {
        watchStatus,
        startedAt: startedAt || null,
        finishedAt: finishedAt || null,
      };
      await updateAnimeInCollection(anime.id, currentUser.uid, updates);
      setAnime((prev) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Erro ao salvar acompanhamento:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSavingTracking(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!anime) return null;

  return (
    <div className="anime-detail-container">
      <Link to="/my-animes" className="back-link">
        ← Voltar para Meus Animes
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
          {totalEpisodes != null && (
            <p className="anime-episodes-info">{totalEpisodes} episódios</p>
          )}

          <div className="ratings-comparison">
            <div className="rating-card public-rating">
              <span className="rating-label">Nota do público</span>
              <span className="rating-value">
                {anime.score != null ? formatPublicRating(anime.score) : '—'}
              </span>
            </div>
            <div className="rating-card personal-rating">
              <span className="rating-label">Minha nota</span>
              <div className="rating-input-group">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="1–10"
                  className="rating-input"
                />
                <span className="rating-scale">/10</span>
                <button
                  type="button"
                  onClick={handleSaveRating}
                  disabled={savingRating}
                  className="btn-save-rating"
                >
                  {savingRating ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>

          {favoriteEpisodes.length > 0 && (
            <div className="anime-detail-stats">
              <span>
                {favoriteEpisodes.length} episódio
                {favoriteEpisodes.length !== 1 ? 's' : ''} favorito
                {favoriteEpisodes.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <section className="tracking-section">
        <h2>Meu acompanhamento</h2>

        <div className="tracking-form">
          <div className="form-group">
            <label>Situação</label>
            <div className="status-options">
              {WATCH_STATUSES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`status-option status-${opt.value} ${
                    watchStatus === opt.value ? 'active' : ''
                  }`}
                  onClick={() => setWatchStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tracking-dates">
            <div className="form-group">
              <label>Quando comecei a assistir</label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
              {anime.startedAt && (
                <span className="date-saved-hint">
                  Salvo: {formatDisplayDate(anime.startedAt)}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Quando finalizei</label>
              <input
                type="date"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
              />
              {anime.finishedAt && (
                <span className="date-saved-hint">
                  Salvo: {formatDisplayDate(anime.finishedAt)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveTracking}
            disabled={savingTracking}
            className="btn-save-tracking"
          >
            {savingTracking ? 'Salvando...' : 'Salvar acompanhamento'}
          </button>
        </div>
      </section>

      <section className="volumes-section episodes-section">
        <div className="volumes-section-header">
          <h2>Meus Episódios</h2>
          {totalEpisodes && !editingTotalEpisodes ? (
            <div className="total-volumes-display">
              <span>
                {favoriteEpisodes.length} / {totalEpisodes} com estrela
              </span>
              <button
                type="button"
                className="btn-edit-total"
                onClick={() => setEditingTotalEpisodes(true)}
              >
                Editar total
              </button>
            </div>
          ) : (
            <div className="total-volumes-edit">
              <label>Total de episódios:</label>
              <input
                type="number"
                min="1"
                value={totalEpisodesInput}
                onChange={(e) => setTotalEpisodesInput(e.target.value)}
                placeholder="Ex: 24"
              />
              <button
                type="button"
                onClick={handleSaveTotalEpisodes}
                className="btn-save-total"
              >
                {totalEpisodes ? 'Salvar' : 'Definir'}
              </button>
              {totalEpisodes && (
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={() => {
                    setEditingTotalEpisodes(false);
                    setTotalEpisodesInput(String(totalEpisodes));
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>

        {!totalEpisodes ? (
          <p className="volumes-hint">
            Defina o total de episódios acima para marcar os seus favoritos com estrela.
          </p>
        ) : (
          <>
            <p className="episodes-hint">
              Clique em um episódio para marcar ou desmarcar com estrela.
            </p>
            <div className="episode-grid">
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((num) => {
                const favorited = isFavoriteEpisode(anime.favoriteEpisodes, num);
                return (
                  <button
                    key={num}
                    type="button"
                    className={`episode-cell ${favorited ? 'favorited' : ''}`}
                    onClick={() => handleToggleFavorite(num)}
                    disabled={savingFavorite === num}
                    title={
                      favorited
                        ? `Ep. ${num} — favorito`
                        : `Marcar episódio ${num} como favorito`
                    }
                  >
                    <span className="episode-cell-number">{num}</span>
                    {favorited && <span className="episode-cell-star" aria-hidden="true">★</span>}
                  </button>
                );
              })}
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

export default AnimeDetail;
