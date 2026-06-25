import { formatPublicRating, formatRating } from './mangaStats';
import { getFavoriteEpisodes } from './episodeHelpers';

const getStarredEpisodeCount = (item) => getFavoriteEpisodes(item).length;

const compareByTitle = (a, b) =>
  (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });

const arePersonallyTied = (a, b, tieBreakByFavoriteEpisodes) => {
  if (a.rating !== b.rating) return false;
  if (
    tieBreakByFavoriteEpisodes &&
    getStarredEpisodeCount(a) !== getStarredEpisodeCount(b)
  ) {
    return false;
  }
  return true;
};

export const RANKING_PERSONAL = 'personal';
export const RANKING_PUBLIC = 'public';
export const PUBLIC_SORT_SCORE = 'score';
export const PUBLIC_SORT_POPULARITY = 'popularity';

export const INITIAL_VISIBLE = 10;
export const LOAD_MORE_COUNT = 10;

/**
 * Atribui colocações com empate (competition ranking) por nota pessoal.
 * @param {object[]} items
 * @param {{ tieBreakByFavoriteEpisodes?: boolean }} options
 */
export const assignPersonalRanks = (items, options = {}) => {
  const { tieBreakByFavoriteEpisodes = false } = options;

  const rated = items
    .filter((item) => item.rating > 0)
    .sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;

      if (tieBreakByFavoriteEpisodes) {
        const starDiff = getStarredEpisodeCount(b) - getStarredEpisodeCount(a);
        if (starDiff !== 0) return starDiff;
      }

      return compareByTitle(a, b);
    });

  const result = [];
  for (let i = 0; i < rated.length; i++) {
    let rank;
    if (i === 0) {
      rank = 1;
    } else if (!arePersonallyTied(rated[i], rated[i - 1], tieBreakByFavoriteEpisodes)) {
      rank = i + 1;
    } else {
      rank = result[i - 1].rank;
    }
    result.push({ ...rated[i], rank });
  }
  return result;
};

export const normalizePersonalItem = (item) => ({
  id: item.id,
  imageUrl: item.imageUrl || '',
  title: item.title || '',
  titleEnglish: item.titleEnglish || '',
  rating: item.rating || 0,
  score: item.score,
  popularity: null,
});

export const normalizePublicItem = (item) => ({
  id: String(item.mal_id),
  imageUrl: item.images?.jpg?.image_url || item.images?.webp?.image_url || '',
  title: item.title || '',
  titleEnglish: item.title_english || '',
  rating: item.score ?? 0,
  score: item.score,
  popularity: item.popularity ?? item.rank ?? null,
});

const assignRanksByValue = (items, getValue, descending = true) => {
  const sorted = [...items].sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);
    if (valA === valB) {
      return (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });
    }
    return descending ? valB - valA : valA - valB;
  });

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    let rank;
    const current = getValue(sorted[i]);
    const previous = i > 0 ? getValue(sorted[i - 1]) : null;

    if (i === 0) {
      rank = 1;
    } else if (current !== previous) {
      rank = i + 1;
    } else {
      rank = result[i - 1].rank;
    }
    result.push({ ...sorted[i], rank });
  }
  return result;
};

export const assignPublicRanks = (items, sortBy) => {
  if (sortBy === PUBLIC_SORT_POPULARITY) {
    return assignRanksByValue(
      items,
      (item) => item.popularity ?? Number.MAX_SAFE_INTEGER,
      false
    );
  }
  return assignRanksByValue(items, (item) => item.rating ?? 0, true);
};

export const getRankLabel = (rank) => `${rank}º`;

export const getRankingDisplayValue = (item, rankingSource, publicSort) => {
  if (rankingSource === RANKING_PUBLIC && publicSort === PUBLIC_SORT_POPULARITY) {
    return item.popularity != null ? `#${item.popularity}` : '—';
  }
  if (rankingSource === RANKING_PUBLIC) {
    return formatPublicRating(item.rating) ?? '—';
  }
  const rating = item.rating;
  if (!rating || rating <= 0) return '—';
  return formatRating(rating) ?? '—';
};

export const getRankingValueLabel = (rankingSource, publicSort) => {
  if (rankingSource === RANKING_PUBLIC && publicSort === PUBLIC_SORT_POPULARITY) {
    return 'Popularidade';
  }
  return 'Nota';
};

// Compatibilidade
export const assignRanks = assignPersonalRanks;
