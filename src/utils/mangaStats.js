export const getOwnedVolumesCount = (manga) => (manga.volumes || []).length;

export const getMangaCollectionCost = (manga) =>
  (manga.volumes || []).reduce((sum, vol) => sum + (Number(vol.price) || 0), 0);

export const getTotalMangaCollectionCost = (mangas) =>
  mangas.reduce((sum, manga) => sum + getMangaCollectionCost(manga), 0);

export const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return null;
  const rounded = Math.round(rating * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

/** Nota do público (API) — preserva decimais, ex.: 8.09 */
export const formatPublicRating = (score) => {
  if (score === null || score === undefined) return null;
  const numeric = typeof score === 'number' ? score : parseFloat(score);
  if (Number.isNaN(numeric)) return null;
  return parseFloat(numeric.toFixed(2)).toString();
};

export const formatVolumesOwned = (manga) => {
  const owned = getOwnedVolumesCount(manga);
  const total = manga.totalVolumes;
  if (total != null && total > 0) {
    return `${owned} / ${total}`;
  }
  return owned > 0 ? `${owned} / ?` : '0 / ?';
};

export const SORT_ALPHA = 'alpha';
export const SORT_RATING = 'rating';

export const sortMangas = (mangas, sortBy) => {
  const copy = [...mangas];

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

  return copy;
};

export const sortVolumesByNumber = (volumes) =>
  [...volumes].sort(
    (a, b) => Number(a.volumeNumber) - Number(b.volumeNumber)
  );
