export const libraryMangaToDisplay = (manga) => ({
  mal_id: manga.mangaId,
  title: manga.title,
  title_english: manga.titleEnglish,
  images: manga.imageUrl ? { jpg: { image_url: manga.imageUrl } } : undefined,
  volumes: manga.totalVolumes,
  chapters: manga.chapters,
  score: manga.score,
  published: manga.published,
});

export const libraryAnimeToDisplay = (anime) => ({
  mal_id: anime.animeId,
  title: anime.title,
  title_english: anime.titleEnglish,
  images: anime.imageUrl ? { jpg: { image_url: anime.imageUrl } } : undefined,
  episodes: anime.episodes,
  score: anime.score,
  aired: anime.aired,
});

export const jikanMangaToLibrary = (item) => ({
  mangaId: item.mal_id,
  title: item.title,
  titleEnglish: item.title_english || item.title,
  imageUrl: item.images?.jpg?.image_url || item.images?.webp?.image_url || '',
  synopsis: item.synopsis || '',
  chapters: item.chapters,
  totalVolumes: item.volumes,
  score: item.score ?? null,
  rank: item.rank ?? null,
  popularity: item.popularity ?? null,
  members: item.members ?? null,
  status: item.status,
  published: item.published,
  rating: 0,
  notes: '',
  volumes: [],
});

export const jikanAnimeToLibrary = (item) => ({
  animeId: item.mal_id,
  title: item.title,
  titleEnglish: item.title_english || item.title,
  imageUrl: item.images?.jpg?.image_url || item.images?.webp?.image_url || '',
  synopsis: item.synopsis || '',
  episodes: item.episodes,
  score: item.score,
  status: item.status,
  aired: item.aired,
  rating: 0,
  notes: '',
  watchStatus: 'querendo_assistir',
  startedAt: null,
  finishedAt: null,
  totalEpisodes: item.episodes ?? null,
  favoriteEpisodes: [],
});
