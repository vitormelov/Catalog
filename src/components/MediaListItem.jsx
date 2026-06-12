import { formatPublicRating } from '../utils/mangaStats';
import { IconEye, IconTrash, IconPlus } from './Icons';
import './MediaListItem.css';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

const getImageUrl = (item) =>
  item.images?.jpg?.image_url ||
  item.images?.webp?.image_url ||
  item.imageUrl ||
  '/placeholder-manga.jpg';

const MediaListItem = ({
  item,
  type,
  inCollection = false,
  onAdd,
  adding = false,
  onView,
  onDelete,
  deleting = false,
}) => {
  const isManga = type === 'manga';
  const title = item.title || '';
  const titleEnglish = item.title_english || item.titleEnglish || '';
  const score = formatPublicRating(item.score);
  const rank = item.rank != null ? `#${item.rank}` : '—';
  const popularity = item.popularity != null ? `#${item.popularity}` : '—';

  const countLabel = isManga
    ? [
        item.volumes != null && `${item.volumes} vol.`,
        item.chapters != null && `${item.chapters} cap.`,
      ]
        .filter(Boolean)
        .join(' · ') || '—'
    : item.episodes != null
      ? `${item.episodes} ep.`
      : '—';

  const startDate = isManga ? item.published?.from : item.aired?.from;
  const endDate = isManga ? item.published?.to : item.aired?.to;

  const showLibraryActions = onView || onDelete;

  return (
    <div className={`media-list-item ${showLibraryActions ? 'has-library-actions' : ''}`}>
      <div className="media-list-image">
        <img src={getImageUrl(item)} alt={title} />
      </div>
      <div className="media-list-content">
        <h3 className="media-list-title">{title}</h3>
        {titleEnglish && titleEnglish !== title && (
          <p className="media-list-subtitle">{titleEnglish}</p>
        )}
      </div>
      <div className="media-list-count" data-label="Volumes/Capítulos">
        <span className="media-list-mobile-label">
          {isManga ? 'Volumes/Cap.' : 'Episódios'}
        </span>
        {countLabel}
      </div>
      <div className="media-list-score" data-label="Nota">
        <span className="media-list-mobile-label">Nota</span>
        {score != null ? score : '—'}
      </div>
      <div className="media-list-rank" data-label="Ranking">
        <span className="media-list-mobile-label">Ranking</span>
        {rank}
      </div>
      <div className="media-list-popularity" data-label="Popularidade">
        <span className="media-list-mobile-label">Popularidade</span>
        {popularity}
      </div>
      <div className="media-list-date" data-label="Início">
        <span className="media-list-mobile-label">Início</span>
        {formatDate(startDate)}
      </div>
      <div className="media-list-date" data-label="Término">
        <span className="media-list-mobile-label">Término</span>
        {formatDate(endDate)}
      </div>
      <div className="media-list-action">
        {showLibraryActions ? (
          <div className="library-actions">
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
        ) : inCollection ? null : onAdd ? (
          <button
            type="button"
            className="collection-btn collection-btn-add"
            onClick={onAdd}
            disabled={adding}
            title="Adicionar à coleção"
          >
            {adding ? <span className="collection-btn-loading">…</span> : <IconPlus />}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MediaListItem;
