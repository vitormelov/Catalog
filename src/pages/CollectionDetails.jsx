// Página de detalhes da coleção (mostra os mangás)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCollection,
  getMangaByCollection,
  deleteMangaFromCollection,
  updateMangaInCollection,
  getCollectionTotalCost
} from '../services/firestoreService';
import MangaDetails from '../components/MangaDetails';
import EditMangaModal from '../components/EditMangaModal';
import './CollectionDetails.css';

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [collection, setCollection] = useState(null);
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [editingManga, setEditingManga] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (currentUser && id) {
      loadData();
    }
  }, [currentUser, id]);

  const loadData = async () => {
    try {
      const [col, mangasList, cost] = await Promise.all([
        getCollection(id),
        getMangaByCollection(id),
        getCollectionTotalCost(id)
      ]);
      
      if (col && col.userId === currentUser.uid) {
        setCollection(col);
        setMangas(mangasList);
        setTotalCost(cost);
      } else {
        navigate('/collections');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      navigate('/collections');
    } finally {
      setLoading(false);
    }
  };

  const handleEditManga = (manga) => {
    setEditingManga(manga);
    setShowEditModal(true);
  };

  const handleSaveManga = async (mangaData) => {
    try {
      await updateMangaInCollection(editingManga.id, mangaData);
      setShowEditModal(false);
      setEditingManga(null);
      loadData();
      alert('Mangá atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar mangá:', error);
      alert('Erro ao atualizar mangá. Tente novamente.');
    }
  };

  const handleDeleteManga = async (mangaId) => {
    if (!window.confirm('Tem certeza que deseja remover este mangá da coleção?')) {
      return;
    }

    try {
      await deleteMangaFromCollection(mangaId);
      loadData();
    } catch (error) {
      console.error('Erro ao remover mangá:', error);
      alert('Erro ao remover mangá. Tente novamente.');
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="collection-details-container">
      <div className="collection-header">
        <button onClick={() => navigate('/collections')} className="back-btn">
          ← Voltar
        </button>
        <div className="collection-info">
          <h1>{collection.name}</h1>
          {collection.description && (
            <p className="collection-description">{collection.description}</p>
          )}
          <div className="collection-stats">
            <div className="stat">
              <span className="stat-label">Mangás:</span>
              <span className="stat-value">{mangas.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Investimento Total:</span>
              <span className="stat-value">R$ {totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {mangas.length === 0 ? (
        <div className="empty-state">
          <p>Esta coleção ainda não tem mangás.</p>
          <button 
            onClick={() => navigate('/search')} 
            className="add-manga-btn"
          >
            Buscar Mangás
          </button>
        </div>
      ) : (
        <div className="mangas-section">
          <h2>Mangás na Coleção</h2>
          <div className="mangas-list">
            {mangas.map((manga) => (
              <div key={manga.id} className="manga-item-wrapper">
                <MangaDetails manga={manga} />
                <div className="manga-actions">
                  <button
                    onClick={() => handleEditManga(manga)}
                    className="edit-manga-btn"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteManga(manga.id)}
                    className="remove-manga-btn"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEditModal && editingManga && (
        <EditMangaModal
          manga={editingManga}
          onClose={() => {
            setShowEditModal(false);
            setEditingManga(null);
          }}
          onSave={handleSaveManga}
        />
      )}
    </div>
  );
};

export default CollectionDetails;
