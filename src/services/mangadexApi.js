const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

const LOCALE_PRIORITY = ['pt-br', 'en', 'ja', 'ja-ro', 'es-la', 'es', 'fr'];

const pickLocalized = (dict, preferred = ['pt-br', 'en', 'ja-ro', 'ja']) => {
  if (!dict || typeof dict !== 'object') return '';
  for (const key of preferred) {
    if (dict[key]) return dict[key];
  }
  const first = Object.values(dict).find(Boolean);
  return first || '';
};

const pickAltTitle = (altTitles = [], langs = ['en', 'pt-br', 'ja-ro']) => {
  for (const lang of langs) {
    const found = altTitles.find((entry) => entry[lang]);
    if (found) return found[lang];
  }
  return '';
};

/** Normaliza "01", "1", "1.0" para comparação. */
export const normalizeVolumeKey = (value) => {
  if (value == null || value === '') return '';
  const raw = String(value).trim().replace(/^vol\.?\s*/i, '');
  const num = Number(raw);
  if (!Number.isNaN(num) && raw !== '') {
    return String(num);
  }
  return raw.toLowerCase();
};

export const getMangaDexCoverUrl = (mangaId, fileName, size = 512) => {
  if (!mangaId || !fileName) return null;
  if (size === 'full') {
    return `${MANGADEX_UPLOADS}/covers/${mangaId}/${fileName}`;
  }
  return `${MANGADEX_UPLOADS}/covers/${mangaId}/${fileName}.${size}.jpg`;
};

export const normalizeMangaDexManga = (item) => {
  const attrs = item.attributes || {};
  const coverRel = (item.relationships || []).find((rel) => rel.type === 'cover_art');
  const fileName = coverRel?.attributes?.fileName || null;
  const title = pickLocalized(attrs.title) || pickAltTitle(attrs.altTitles) || 'Mangá';
  const titleEnglish =
    pickAltTitle(attrs.altTitles, ['en']) ||
    (attrs.title?.en && attrs.title.en !== title ? attrs.title.en : '');

  return {
    id: item.id,
    title,
    titleEnglish,
    synopsis: pickLocalized(attrs.description, ['pt-br', 'en']),
    status: attrs.status || '',
    year: attrs.year || null,
    contentRating: attrs.contentRating || '',
    genres: (attrs.tags || [])
      .filter((tag) => tag.attributes?.group === 'genre')
      .map((tag) => pickLocalized(tag.attributes?.name, ['en', 'pt-br']))
      .filter(Boolean),
    coverFileName: fileName,
    coverUrl: getMangaDexCoverUrl(item.id, fileName, 512),
    coverUrlFull: getMangaDexCoverUrl(item.id, fileName, 'full'),
    malId: attrs.links?.mal ? Number(attrs.links.mal) || attrs.links.mal : null,
    mangadexUrl: `https://mangadex.org/title/${item.id}`,
  };
};

export const normalizeMangaDexCover = (cover, mangaId) => {
  const attrs = cover.attributes || {};
  const fileName = attrs.fileName;
  return {
    id: cover.id,
    mangaId,
    volume: attrs.volume ?? null,
    locale: attrs.locale || '',
    fileName,
    coverUrl: getMangaDexCoverUrl(mangaId, fileName, 512),
    coverUrlFull: getMangaDexCoverUrl(mangaId, fileName, 'full'),
  };
};

const localeRank = (locale) => {
  const idx = LOCALE_PRIORITY.indexOf(locale);
  return idx === -1 ? LOCALE_PRIORITY.length + 1 : idx;
};

/**
 * Busca mangás por título na API pública do MangaDex (gratuita).
 */
export const searchMangaDex = async (query) => {
  const params = new URLSearchParams();
  params.set('title', query);
  params.set('limit', '20');
  params.append('includes[]', 'cover_art');
  params.append('order[relevance]', 'desc');
  ['safe', 'suggestive', 'erotica'].forEach((rating) => {
    params.append('contentRating[]', rating);
  });

  const response = await fetch(`${MANGADEX_API}/manga?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar mangás no MangaDex');
  }

  const data = await response.json();
  return (data.data || []).map(normalizeMangaDexManga);
};

/**
 * Lista todas as cover arts de um mangá (paginado).
 */
export const listMangaDexCovers = async (mangaId) => {
  const covers = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams();
    params.append('manga[]', mangaId);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    params.append('order[volume]', 'asc');

    const response = await fetch(`${MANGADEX_API}/cover?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar capas no MangaDex');
    }

    const data = await response.json();
    const batch = data.data || [];
    covers.push(...batch.map((cover) => normalizeMangaDexCover(cover, mangaId)));

    offset += limit;
    if (offset >= (data.total || 0) || batch.length === 0) break;
  }

  return covers;
};

/**
 * Cover arts de um volume específico, ordenadas por locale preferido.
 */
export const getMangaDexVolumeCovers = async (mangaId, volume) => {
  const target = normalizeVolumeKey(volume);
  if (!target) return [];

  const all = await listMangaDexCovers(mangaId);
  return all
    .filter((cover) => normalizeVolumeKey(cover.volume) === target)
    .sort((a, b) => localeRank(a.locale) - localeRank(b.locale));
};
