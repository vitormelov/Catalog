// Serviço para buscar mangás da Jikan API
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

