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
 * @returns {Promise<Object>} Dados da coleção
 */
export const getCollection = async (collectionId) => {
  try {
    const docRef = doc(db, 'collections', collectionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
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
 * @param {Object} updates - Dados para atualizar
 */
export const updateCollection = async (collectionId, updates) => {
  try {
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
 */
export const deleteCollection = async (collectionId) => {
  try {
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
 * @returns {Promise<Array>} Lista de mangás
 */
export const getMangaByCollection = async (collectionId) => {
  try {
    const q = query(
      collection(db, 'mangaCollection'),
      where('collectionId', '==', collectionId)
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
 * @param {Object} updates - Dados para atualizar
 */
export const updateMangaInCollection = async (mangaId, updates) => {
  try {
    const docRef = doc(db, 'mangaCollection', mangaId);
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
 */
export const deleteMangaFromCollection = async (mangaId) => {
  try {
    await deleteDoc(doc(db, 'mangaCollection', mangaId));
  } catch (error) {
    console.error('Erro ao deletar mangá:', error);
    throw error;
  }
};

/**
 * Calcula o custo total de uma coleção
 * @param {string} collectionId - ID da coleção
 * @returns {Promise<number>} Custo total
 */
export const getCollectionTotalCost = async (collectionId) => {
  try {
    const mangas = await getMangaByCollection(collectionId);
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
