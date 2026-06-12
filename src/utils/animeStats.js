import { formatRating, formatPublicRating } from './mangaStats';
import { getTotalEpisodes } from './episodeHelpers';

export { formatRating, formatPublicRating };

export const formatEpisodesCount = (anime) => {
  const total = getTotalEpisodes(anime);
  if (total == null) return '—';
  return `${total} ep.`;
};

export const WATCH_STATUSES = [
  { value: 'assistindo', label: 'Assistindo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'dropado', label: 'Dropado' },
  { value: 'querendo_assistir', label: 'Querendo assistir' },
];

export const SORT_ALPHA = 'alpha';
export const SORT_RATING = 'rating';
export const SORT_STATUS = 'status';

const STATUS_SORT_ORDER = {
  assistindo: 0,
  querendo_assistir: 1,
  finalizado: 2,
  dropado: 3,
};

export const getWatchStatusLabel = (status) =>
  WATCH_STATUSES.find((s) => s.value === status)?.label || '—';

export const formatDisplayDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

export const countByWatchStatus = (animes, status) =>
  animes.filter((a) => a.watchStatus === status).length;

export const sortAnimes = (animes, sortBy) => {
  const copy = [...animes];

  if (sortBy === SORT_ALPHA) {
    return copy.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' })
    );
  }

  if (sortBy === SORT_RATING) {
    return copy.sort((a, b) => {
      const ratingA = a.rating > 0 ? a.rating : -1;
      const ratingB = b.rating > 0 ? b.rating : -1;
      return ratingB - ratingA;
    });
  }

  if (sortBy === SORT_STATUS) {
    return copy.sort((a, b) => {
      const orderA = STATUS_SORT_ORDER[a.watchStatus] ?? 99;
      const orderB = STATUS_SORT_ORDER[b.watchStatus] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });
    });
  }

  return copy;
};
