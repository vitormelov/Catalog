export const getTotalEpisodes = (anime) =>
  anime?.totalEpisodes ?? anime?.episodes ?? null;

export const getFavoriteEpisodes = (anime) => {
  const list = anime?.favoriteEpisodes;
  if (!Array.isArray(list)) return [];
  return list.map(Number).filter((n) => n > 0).sort((a, b) => a - b);
};

export const isFavoriteEpisode = (favorites, episodeNumber) =>
  getFavoriteEpisodes({ favoriteEpisodes: favorites }).includes(Number(episodeNumber));

export const toggleFavoriteEpisode = (favorites, episodeNumber) => {
  const num = Number(episodeNumber);
  const current = getFavoriteEpisodes({ favoriteEpisodes: favorites });
  if (current.includes(num)) {
    return current.filter((n) => n !== num);
  }
  return [...current, num].sort((a, b) => a - b);
};
