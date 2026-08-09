export const createShelfBookFromMangaDex = (manga, options = {}) => {
  const cover = options.coverUrl || manga.coverUrl || manga.coverUrlFull || null;

  return {
    id: `md-${manga.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mangadexId: manga.id || null,
    malId: manga.malId || null,
    mangadexUrl: manga.mangadexUrl || (manga.id ? `https://mangadex.org/title/${manga.id}` : null),
    title: manga.title || 'Mangá',
    titleEnglish: manga.titleEnglish || '',
    coverUrl: cover,
    backUrl: cover,
    volume: options.volume || 1,
    raro: Boolean(options.raro ?? manga.raro),
    color: options.color || pickCardAccent(manga.id || manga.title),
    score: options.score ?? manga.score ?? null,
    rank: options.rank ?? manga.rank ?? null,
    popularity: options.popularity ?? manga.popularity ?? null,
    members: options.members ?? manga.members ?? null,
    status: manga.status || '',
    synopsis: manga.synopsis || '',
    genres: manga.genres || [],
    source: 'mangadex',
  };
};

export const formatCardScore = (score) =>
  score != null && Number.isFinite(Number(score)) ? Number(score).toFixed(2) : '—';

export const formatCardRank = (value) =>
  value != null && Number.isFinite(Number(value)) ? `#${value}` : '—';

export const formatCardMembers = (members) => {
  if (members == null || !Number.isFinite(Number(members))) return '—';
  return Number(members).toLocaleString('en-US');
};

const CARD_ACCENTS = [
  '#e8c547',
  '#7ec8e3',
  '#e89b6a',
  '#9ad27a',
  '#c9a0dc',
  '#f0a0a8',
  '#8fb4d9',
  '#d4b483',
];

export const pickCardAccent = (seed) => {
  const str = String(seed || 'manga');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return CARD_ACCENTS[hash % CARD_ACCENTS.length];
};

/** @deprecated use pickCardAccent */
export const pickSpineColor = pickCardAccent;

/**
 * Config do binder (álbum de cards).
 * - pageCount: páginas do álbum
 * - rows: fileiras (altura) — fixo em 2
 * - cols: colunas — ajustadas ao espaço disponível
 */
export const DEFAULT_BINDER_CONFIG = {
  pageCount: 8,
  rows: 2,
  cols: 4,
};

/** Alias legado — a página ainda importa DEFAULT_SHELF_CONFIG */
export const DEFAULT_SHELF_CONFIG = DEFAULT_BINDER_CONFIG;

export const SHELF_ROWS = DEFAULT_BINDER_CONFIG.rows;
export const SLOTS_PER_ROW = DEFAULT_BINDER_CONFIG.cols;

export const normalizeBinderConfig = (config = {}) => ({
  pageCount: Math.max(1, Number(config.pageCount ?? config.unitCount) || DEFAULT_BINDER_CONFIG.pageCount),
  rows: Math.max(1, Number(config.rows) || DEFAULT_BINDER_CONFIG.rows),
  cols: Math.max(1, Number(config.cols ?? config.slotsPerRow) || DEFAULT_BINDER_CONFIG.cols),
});

export const normalizeShelfConfig = (config = {}) => {
  const cfg = normalizeBinderConfig(config);
  return {
    unitCount: cfg.pageCount,
    rows: cfg.rows,
    slotsPerRow: cfg.cols,
    pageCount: cfg.pageCount,
    cols: cfg.cols,
  };
};

export const createEmptyPage = (config = DEFAULT_BINDER_CONFIG) => {
  const { rows, cols } = normalizeBinderConfig(config);
  return Array.from({ length: rows }, () => Array(cols).fill(null));
};

export const createEmptyShelfLayout = createEmptyPage;

export const createEmptyBinder = (config = DEFAULT_BINDER_CONFIG) => {
  const cfg = normalizeBinderConfig(config);
  return Array.from({ length: cfg.pageCount }, () => createEmptyPage(cfg));
};

export const createEmptyUnits = createEmptyBinder;

/** Recalcula colunas que cabem em 2 fileiras sem scroll (ratio do card 2.5:3.5). */
export const estimateBinderCols = ({
  width,
  height,
  rows = 2,
  gap = 8,
  padX = 20,
  padY = 36,
  minCols = 2,
  maxCols = 8,
} = {}) => {
  const w = Math.max(60, (Number(width) || 0) - padX);
  const h = Math.max(60, (Number(height) || 0) - padY);
  const rowH = (h - gap * Math.max(0, rows - 1)) / Math.max(1, rows);
  const cardW = rowH * (2.5 / 3.5);
  if (cardW <= 0) return minCols;
  const cols = Math.floor((w + gap) / (cardW + gap));
  return Math.min(maxCols, Math.max(minCols, cols || minCols));
};

/** Redimensiona uma página preservando os cards (reempacota em ordem). */
export const resizePageLayout = (page, rows, cols) => {
  const books = [];
  (page || []).forEach((row) => {
    (row || []).forEach((book) => {
      if (book) books.push(book);
    });
  });

  const next = Array.from({ length: rows }, () => Array(cols).fill(null));
  let i = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (i >= books.length) return next;
      next[r][c] = books[i];
      i += 1;
    }
  }
  return next;
};

export const resizeBinderPages = (pages, rows, cols) =>
  (pages || []).map((page) => resizePageLayout(page, rows, cols));

/** Offset circular (legado da roleta de estantes). */
export const getCarouselOffset = (index, activeIndex, count) => {
  if (count <= 0) return 0;
  let offset = (index - activeIndex) % count;
  if (offset < 0) offset += count;
  if (offset > count / 2) offset -= count;
  return offset;
};

const getLayoutSize = (layout) => ({
  rows: layout?.length || 0,
  cols: layout?.[0]?.length || 0,
});

export const placeBookOnShelf = (layout, book, preferredRow = 0) => {
  const { rows } = getLayoutSize(layout);
  if (!rows) return null;

  const next = layout.map((row) => [...row]);
  const start = Math.min(Math.max(0, preferredRow), rows - 1);

  for (let r = start; r < rows; r += 1) {
    const empty = next[r].findIndex((slot) => slot == null);
    if (empty !== -1) {
      next[r][empty] = book;
      return next;
    }
  }
  for (let r = 0; r < start; r += 1) {
    const empty = next[r].findIndex((slot) => slot == null);
    if (empty !== -1) {
      next[r][empty] = book;
      return next;
    }
  }
  return null;
};

export const moveBookOnShelf = (layout, fromRow, fromSlot, toRow, toSlot) => {
  if (fromRow === toRow && fromSlot === toSlot) return layout;
  const next = layout.map((row) => [...row]);
  const book = next[fromRow]?.[fromSlot];
  if (!book) return layout;
  if (toRow < 0 || toRow >= next.length) return layout;
  if (toSlot < 0 || toSlot >= next[toRow].length) return layout;
  const target = next[toRow][toSlot];
  next[toRow][toSlot] = book;
  next[fromRow][fromSlot] = target;
  return next;
};

export const removeBookFromShelf = (layout, bookId) =>
  layout.map((row) => row.map((slot) => (slot?.id === bookId ? null : slot)));

export const countCardsInBinder = (pages) =>
  (pages || []).reduce(
    (total, page) =>
      total + page.reduce((rowTotal, row) => rowTotal + row.filter(Boolean).length, 0),
    0
  );
