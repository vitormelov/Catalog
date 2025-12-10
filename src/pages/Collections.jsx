// Página de gerenciamento de coleções
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getMangaByCollection,
  getCollectionTotalCost
} from '../services/firestoreService';
import CollectionCard from '../components/CollectionCard';
import CollectionModal from '../components/CollectionModal';
import './Collections.css';

const Collections = () => {
  const { currentUser } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadCollections();
    }
  }, [currentUser]);

  const loadCollections = async () => {
    try {
      const cols = await getUserCollections(currentUser.uid);
      // Carregar custos totais e volumes para cada coleção
      const collectionsWithCosts = await Promise.all(
        cols.map(async (col) => {
          const totalCost = await getCollectionTotalCost(col.id, currentUser.uid);
          const mangas = await getMangaByCollection(col.id, currentUser.uid);
          
          // Calcular quantidade de volumes possuídos
          let volumesCount = 0;
          mangas.forEach((manga) => {
            const volumes = manga.volumes || [];
            volumesCount += volumes.length;
          });
          
          return {
            ...col,
            totalCost,
            mangaCount: mangas.length,
            volumesCount
          };
        })
      );
      setCollections(collectionsWithCosts);
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCollection(null);
    setShowModal(true);
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setShowModal(true);
  };

  const handleSave = async (collectionData) => {
    try {
      if (editingCollection) {
        await updateCollection(editingCollection.id, currentUser.uid, collectionData);
      } else {
        await createCollection(currentUser.uid, collectionData);
      }
      setShowModal(false);
      setEditingCollection(null);
      loadCollections();
    } catch (error) {
      console.error('Erro ao salvar coleção:', error);
      alert('Erro ao salvar coleção. Tente novamente.');
    }
  };

  const handleDelete = async (collectionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta coleção?')) {
      return;
    }

    try {
      await deleteCollection(collectionId, currentUser.uid);
      loadCollections();
    } catch (error) {
      console.error('Erro ao deletar coleção:', error);
      alert('Erro ao deletar coleção. Tente novamente.');
    }
  };

  if (loading) {
    return <div className="loading">Carregando coleções...</div>;
  }

  return (
    <div className="collections-container">
      <div className="collections-header">
        <h1>Minhas Coleções</h1>
        <button onClick={handleCreate} className="create-btn">
          + Nova Coleção
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não tem coleções. Crie uma para começar!</p>
        </div>
      ) : (
        <div className="collections-grid">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={() => handleEdit(collection)}
              onDelete={() => handleDelete(collection.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CollectionModal
          collection={editingCollection}
          onClose={() => {
            setShowModal(false);
            setEditingCollection(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Collections;

