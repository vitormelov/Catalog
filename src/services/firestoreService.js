// Serviço para interagir com o Firestore
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ========== COLECÕES ==========

/**
 * Cria uma nova coleção
 * @param {string} userId - ID do usuário
 * @param {Object} collectionData - Dados da coleção
 * @returns {Promise<string>} ID da coleção criada
 */
export const createCollection = async (userId, collectionData) => {
  try {
    const docRef = await addDoc(collection(db, 'collections'), {
      ...collectionData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar coleção:', error);
    throw error;
  }
};

/**
 * Busca todas as coleções do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de coleções
 */
export const getUserCollections = async (userId) => {
  try {
    const q = query(
      collection(db, 'collections'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const collections = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Ordenar manualmente
    return collections.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Erro ao buscar coleções:', error);
    throw error;
  }
};

/**
 * Busca uma coleção específica
 * @param {string} collectionId - ID da coleção
 * @param {string} userId - ID do usuário (para verificação de segurança)
 * @returns {Promise<Object>} Dados da coleção ou null se não existir ou não pertencer ao usuário
 */
export const getCollection = async (collectionId, userId) => {
  try {
    const docRef = doc(db, 'collections', collectionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const collectionData = {
        id: docSnap.id,
        ...docSnap.data()
      };
      // Verificar se a coleção pertence ao usuário
      if (collectionData.userId !== userId) {
        return null; // Retorna null se não pertencer ao usuário
      }
      return collectionData;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar coleção:', error);
    throw error;
  }
};

/**
 * Atualiza uma coleção
 * @param {string} collectionId - ID da coleção
 * @param {string} userId - ID do usuário (para verificação de segurança)
 * @param {Object} updates - Dados para atualizar
 */
export const updateCollection = async (collectionId, userId, updates) => {
  try {
    // Verificar se a coleção pertence ao usuário antes de atualizar
    const collection = await getCollection(collectionId, userId);
    if (!collection) {
      throw new Error('Coleção não encontrada ou não pertence ao usuário');
    }
    
    const docRef = doc(db, 'collections', collectionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar coleção:', error);
    throw error;
  }
};

/**
 * Deleta uma coleção
 * @param {string} collectionId - ID da coleção
 * @param {string} userId - ID do usuário (para verificação de segurança)
 */
export const deleteCollection = async (collectionId, userId) => {
  try {
    // Verificar se a coleção pertence ao usuário antes de deletar
    const collection = await getCollection(collectionId, userId);
    if (!collection) {
      throw new Error('Coleção não encontrada ou não pertence ao usuário');
    }
    
    await deleteDoc(doc(db, 'collections', collectionId));
  } catch (error) {
    console.error('Erro ao deletar coleção:', error);
    throw error;
  }
};

// ========== MANGÁS (dentro de coleções) ==========

/**
 * Adiciona um mangá a uma coleção
 * @param {string} userId - ID do usuário
 * @param {string} collectionId - ID da coleção (obrigatório)
 * @param {Object} mangaData - Dados do mangá
 * @returns {Promise<string>} ID do mangá adicionado
 */
export const addMangaToCollection = async (userId, collectionId, mangaData) => {
  try {
    const docRef = await addDoc(collection(db, 'mangaCollection'), {
      ...mangaData,
      collectionId, // Mangá pertence diretamente a uma coleção
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar mangá:', error);
    throw error;
  }
};

/**
 * Busca todos os mangás do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de mangás
 */
export const getUserMangaCollection = async (userId) => {
  try {
    const q = query(
      collection(db, 'mangaCollection'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const mangas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Ordenar manualmente
    return mangas.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Erro ao buscar coleção de mangás:', error);
    throw error;
  }
};

/**
 * Busca mangás de uma coleção específica
 * @param {string} collectionId - ID da coleção
 * @param {string} userId - ID do usuário (para verificação de segurança)
 * @returns {Promise<Array>} Lista de mangás
 */
export const getMangaByCollection = async (collectionId, userId) => {
  try {
    const q = query(
      collection(db, 'mangaCollection'),
      where('collectionId', '==', collectionId),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar mangás da coleção:', error);
    throw error;
  }
};

/**
 * Atualiza um mangá na coleção
 * @param {string} mangaId - ID do mangá
 * @param {string} userId - ID do usuário (para verificação de segurança)
 * @param {Object} updates - Dados para atualizar
 */
export const updateMangaInCollection = async (mangaId, userId, updates) => {
  try {
    // Verificar se o mangá pertence ao usuário antes de atualizar
    const docRef = doc(db, 'mangaCollection', mangaId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Mangá não encontrado');
    }
    
    const mangaData = docSnap.data();
    if (mangaData.userId !== userId) {
      throw new Error('Mangá não pertence ao usuário');
    }
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar mangá:', error);
    throw error;
  }
};

/**
 * Deleta um mangá da coleção
 * @param {string} mangaId - ID do mangá
 * @param {string} userId - ID do usuário (para verificação de segurança)
 */
export const deleteMangaFromCollection = async (mangaId, userId) => {
  try {
    // Verificar se o mangá pertence ao usuário antes de deletar
    const docRef = doc(db, 'mangaCollection', mangaId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Mangá não encontrado');
    }
    
    const mangaData = docSnap.data();
    if (mangaData.userId !== userId) {
      throw new Error('Mangá não pertence ao usuário');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar mangá:', error);
    throw error;
  }
};

/**
 * Calcula o custo total de uma coleção
 * @param {string} collectionId - ID da coleção
 * @param {string} userId - ID do usuário (para verificação de segurança)
 * @returns {Promise<number>} Custo total
 */
export const getCollectionTotalCost = async (collectionId, userId) => {
  try {
    const mangas = await getMangaByCollection(collectionId, userId);
    return mangas.reduce((total, manga) => {
      const volumesCost = (manga.volumes || []).reduce((sum, vol) => {
        return sum + (vol.price || 0);
      }, 0);
      return total + volumesCost;
    }, 0);
  } catch (error) {
    console.error('Erro ao calcular custo da coleção:', error);
    return 0;
  }
};

// ========== BIBLIOTECA PESSOAL (MANGÁS E ANIMES) ==========

/**
 * Adiciona um mangá à biblioteca pessoal do usuário
 */
export const addMangaToLibrary = async (userId, mangaData) => {
  try {
    const existing = await getMangaByMalId(userId, mangaData.mangaId);
    if (existing) return existing.id;

    const docRef = await addDoc(collection(db, 'mangaCollection'), {
      ...mangaData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar mangá à biblioteca:', error);
    throw error;
  }
};

/**
 * Busca um mangá da biblioteca pelo ID do documento Firestore
 */
export const getMangaById = async (mangaId, userId) => {
  try {
    const docRef = doc(db, 'mangaCollection', mangaId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = { id: docSnap.id, ...docSnap.data() };
    if (data.userId !== userId) return null;
    return data;
  } catch (error) {
    console.error('Erro ao buscar mangá:', error);
    throw error;
  }
};

/**
 * Busca um mangá na biblioteca pelo ID do MyAnimeList
 */
export const getMangaByMalId = async (userId, malId) => {
  try {
    const q = query(
      collection(db, 'mangaCollection'),
      where('userId', '==', userId),
      where('mangaId', '==', malId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Erro ao buscar mangá por MAL ID:', error);
    throw error;
  }
};

/**
 * Retorna os IDs do MyAnimeList dos mangás na biblioteca do usuário
 */
export const getUserMangaMalIds = async (userId) => {
  const mangas = await getUserMangaCollection(userId);
  return new Set(mangas.map((m) => m.mangaId).filter(Boolean));
};

// ========== ANIMES (biblioteca pessoal) ==========

/**
 * Adiciona um anime à biblioteca pessoal do usuário
 */
export const addAnimeToLibrary = async (userId, animeData) => {
  try {
    const existing = await getAnimeByMalId(userId, animeData.animeId);
    if (existing) return existing.id;

    const docRef = await addDoc(collection(db, 'animeCollection'), {
      ...animeData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar anime à biblioteca:', error);
    throw error;
  }
};

/**
 * Busca todos os animes do usuário
 */
export const getUserAnimeCollection = async (userId) => {
  try {
    const q = query(
      collection(db, 'animeCollection'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const animes = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    return animes.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Erro ao buscar coleção de animes:', error);
    throw error;
  }
};

/**
 * Busca um anime na biblioteca pelo ID do MyAnimeList
 */
export const getAnimeByMalId = async (userId, malId) => {
  try {
    const q = query(
      collection(db, 'animeCollection'),
      where('userId', '==', userId),
      where('animeId', '==', malId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Erro ao buscar anime por MAL ID:', error);
    throw error;
  }
};

/**
 * Retorna os IDs do MyAnimeList dos animes na biblioteca do usuário
 */
export const getUserAnimeMalIds = async (userId) => {
  const animes = await getUserAnimeCollection(userId);
  return new Set(animes.map((a) => a.animeId).filter(Boolean));
};

/**
 * Busca um anime da biblioteca pelo ID do documento Firestore
 */
export const getAnimeById = async (animeId, userId) => {
  try {
    const docRef = doc(db, 'animeCollection', animeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = { id: docSnap.id, ...docSnap.data() };
    if (data.userId !== userId) return null;
    return data;
  } catch (error) {
    console.error('Erro ao buscar anime:', error);
    throw error;
  }
};

/**
 * Atualiza um anime na biblioteca
 */
export const updateAnimeInCollection = async (animeId, userId, updates) => {
  try {
    const docRef = doc(db, 'animeCollection', animeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Anime não encontrado');
    }

    const animeData = docSnap.data();
    if (animeData.userId !== userId) {
      throw new Error('Anime não pertence ao usuário');
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar anime:', error);
    throw error;
  }
};

/**
 * Deleta um anime da biblioteca
 */
export const deleteAnimeFromCollection = async (animeId, userId) => {
  try {
    const docRef = doc(db, 'animeCollection', animeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Anime não encontrado');
    }

    const animeData = docSnap.data();
    if (animeData.userId !== userId) {
      throw new Error('Anime não pertence ao usuário');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar anime:', error);
    throw error;
  }
};
