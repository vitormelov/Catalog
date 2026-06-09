import {
  formatRating,
  formatPublicRating,
  formatDisplayDate,
  getWatchStatusLabel,
} from '../utils/animeStats';
import { IconEye, IconTrash } from './Icons';
import './AnimeLibraryListItem.css';

const AnimeLibraryListItem = ({ anime, onView, onDelete, deleting = false }) => {
  const imageUrl = anime.imageUrl || '/placeholder-manga.jpg';
  const title = anime.title || '';
  const titleEnglish = anime.titleEnglish || '';
  const publicRating = formatPublicRating(anime.score);
  const personalRating = formatRating(anime.rating);
  const status = anime.watchStatus || 'querendo_assistir';

  return (
    <div className="anime-library-item">
      <div className="anime-library-image">
        <img src={imageUrl} alt={title} />
      </div>
      <div className="anime-library-content">
        <h3 className="anime-library-title">{title}</h3>
        {titleEnglish && titleEnglish !== title && (
          <p className="anime-library-subtitle">{titleEnglish}</p>
        )}
      </div>
      <div className="anime-library-ratings">
        <span className="anime-library-mobile-label">Notas</span>
        <div className="ratings-comparison-cell">
          <span className="rating-personal" title="Minha nota">
            {personalRating != null ? personalRating : '—'}
          </span>
          <span className="rating-separator">/</span>
          <span className="rating-public" title="Nota do público">
            {publicRating != null ? `${publicRating}` : '—'}
          </span>
        </div>
        <span className="ratings-legend">minha · público</span>
      </div>
      <div className="anime-library-status">
        <span className="anime-library-mobile-label">Situação</span>
        <span className={`status-badge status-${status}`}>
          {getWatchStatusLabel(status)}
        </span>
      </div>
      <div className="anime-library-date">
        <span className="anime-library-mobile-label">Início</span>
        {formatDisplayDate(anime.startedAt)}
      </div>
      <div className="anime-library-date">
        <span className="anime-library-mobile-label">Término</span>
        {formatDisplayDate(anime.finishedAt)}
      </div>
      <div className="anime-library-actions">
        {onView && (
          <button
            type="button"
            className="library-btn library-btn-view"
            onClick={onView}
            title="Ver detalhes"
          >
            <IconEye />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="library-btn library-btn-delete"
            onClick={onDelete}
            disabled={deleting}
            title="Remover da coleção"
          >
            <IconTrash />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimeLibraryListItem;
