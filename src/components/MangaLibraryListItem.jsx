import {
  formatRating,
  formatPublicRating,
  formatVolumesOwned,
  getMangaCollectionCost,
} from '../utils/mangaStats';
import { IconEye, IconTrash } from './Icons';
import './MangaLibraryListItem.css';

const MangaLibraryListItem = ({ manga, onView, onDelete, deleting = false }) => {
  const imageUrl = manga.imageUrl || '/placeholder-manga.jpg';
  const title = manga.title || '';
  const titleEnglish = manga.titleEnglish || '';
  const publicRating = formatPublicRating(manga.score);
  const personalRating = formatRating(manga.rating);
  const cost = getMangaCollectionCost(manga);

  return (
    <div className="manga-library-item">
      <div className="manga-library-image">
        <img src={imageUrl} alt={title} />
      </div>
      <div className="manga-library-content">
        <h3 className="manga-library-title">{title}</h3>
        {titleEnglish && titleEnglish !== title && (
          <p className="manga-library-subtitle">{titleEnglish}</p>
        )}
      </div>
      <div className="manga-library-volumes">
        <span className="manga-library-mobile-label">Volumes</span>
        <span className="volumes-owned">{formatVolumesOwned(manga)}</span>
      </div>
      <div className="manga-library-ratings">
        <span className="manga-library-mobile-label">Notas</span>
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
      <div className="manga-library-cost">
        <span className="manga-library-mobile-label">Custo</span>
        <span className="cost-value">R$ {cost.toFixed(2)}</span>
      </div>
      <div className="manga-library-actions">
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

export default MangaLibraryListItem;
