// Serviço para buscar mangás e animes da Jikan API
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

/**
 * Busca mangás por título
 * @param {string} query - Título do mangá para buscar
 * @returns {Promise} Dados do mangá
 */
export const searchManga = async (query) => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/manga?q=${encodeURIComponent(query)}&limit=20`);
    if (!response.ok) {
      throw new Error('Erro ao buscar mangás');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar mangá:', error);
    throw error;
  }
};

/**
 * Busca detalhes de um mangá específico por ID
 * @param {number} mangaId - ID do mangá no MyAnimeList
 * @returns {Promise} Detalhes completos do mangá
 */
export const getMangaDetails = async (mangaId) => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/manga/${mangaId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do mangá');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do mangá:', error);
    throw error;
  }
};

/**
 * Busca mangás populares
 * @returns {Promise} Lista de mangás populares
 */
export const getPopularManga = async () => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/top/manga?limit=20`);
    if (!response.ok) {
      throw new Error('Erro ao buscar mangás populares');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar mangás populares:', error);
    throw error;
  }
};

/**
 * Busca animes por título
 * @param {string} query - Título do anime para buscar
 * @returns {Promise} Dados do anime
 */
export const searchAnime = async (query) => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=20`);
    if (!response.ok) {
      throw new Error('Erro ao buscar animes');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar anime:', error);
    throw error;
  }
};

/**
 * Busca detalhes de um anime específico por ID
 * @param {number} animeId - ID do anime no MyAnimeList
 * @returns {Promise} Detalhes completos do anime
 */
export const getAnimeDetails = async (animeId) => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/anime/${animeId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do anime');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do anime:', error);
    throw error;
  }
};

/**
 * Busca animes populares
 * @returns {Promise} Lista de animes populares
 */
export const getPopularAnime = async () => {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/top/anime?limit=20`);
    if (!response.ok) {
      throw new Error('Erro ao buscar animes populares');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar animes populares:', error);
    throw error;
  }
};

