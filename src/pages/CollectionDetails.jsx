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
import ManageVolumesModal from '../components/ManageVolumesModal';
import './CollectionDetails.css';

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [collection, setCollection] = useState(null);
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [totalVolumes, setTotalVolumes] = useState(0);
  const [headerImage, setHeaderImage] = useState(null);
  const [editingManga, setEditingManga] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [volumeModalData, setVolumeModalData] = useState({
    manga: null,
    volume: null
  });
  const [showVolumeModal, setShowVolumeModal] = useState(false);

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

        const volumeCount = mangasList.reduce((acc, manga) => {
          return acc + (manga.volumes ? manga.volumes.length : 0);
        }, 0);
        setTotalVolumes(volumeCount);

        if (mangasList.length > 0) {
          const cover =
            mangasList[0].imageUrl ||
            mangasList[0].images?.jpg?.large_image_url ||
            mangasList[0].images?.jpg?.image_url ||
            null;
          setHeaderImage(cover);
        } else {
          setHeaderImage(null);
        }
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

  const handleAddVolume = (manga) => {
    setVolumeModalData({ manga, volume: null });
    setShowVolumeModal(true);
  };

  const handleEditVolume = (manga, volume) => {
    setVolumeModalData({ manga, volume });
    setShowVolumeModal(true);
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

  const handleSaveVolume = async (volumeData) => {
    const { manga, volume } = volumeModalData;

    if (!manga) {
      return;
    }

    const normalizeVolume = (vol) => ({
      volumeNumber: Number(vol.volumeNumber),
      state: (vol.state || vol.status) === 'lacrado' ? 'lacrado' : 'aberto',
      price: Number(vol.price) || 0,
      purchaseDate: vol.purchaseDate || null
    });

    try {
      const currentVolumes = (manga.volumes || []).map(normalizeVolume);
      const filteredVolumes = volume
        ? currentVolumes.filter((volItem) => volItem.volumeNumber !== volume.volumeNumber)
        : currentVolumes;

      if (
        filteredVolumes.some(
          (volItem) => volItem.volumeNumber === Number(volumeData.volumeNumber)
        )
      ) {
        alert(`O volume ${volumeData.volumeNumber} já está cadastrado.`);
        return;
      }

      const sanitizedVolume = normalizeVolume(volumeData);

      const updatedVolumes = [...filteredVolumes, sanitizedVolume].sort(
        (a, b) => a.volumeNumber - b.volumeNumber
      );

      await updateMangaInCollection(manga.id, {
        volumes: updatedVolumes
      });

      setShowVolumeModal(false);
      setVolumeModalData({ manga: null, volume: null });
      loadData();
      alert(`Volume ${sanitizedVolume.volumeNumber} salvo com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar volume:', error);
      alert('Erro ao salvar volume. Tente novamente.');
    }
  };

  const handleDeleteVolume = async (manga, volume) => {
    if (
      !window.confirm(
        `Tem certeza que deseja remover o volume ${volume.volumeNumber} deste mangá?`
      )
    ) {
      return;
    }

    try {
      const updatedVolumes = (manga.volumes || []).filter(
        (vol) => vol.volumeNumber !== volume.volumeNumber
      );

      await updateMangaInCollection(manga.id, {
        volumes: updatedVolumes
      });

      loadData();
      alert(`Volume ${volume.volumeNumber} removido.`);
    } catch (error) {
      console.error('Erro ao remover volume:', error);
      alert('Erro ao remover volume. Tente novamente.');
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
      <div className={`collection-header${headerImage ? ' has-cover' : ''}`}>
        {headerImage && (
          <div 
            className="collection-header-bg"
            style={{ backgroundImage: `url(${headerImage})` }}
          />
        )}
        <button onClick={() => navigate('/collections')} className="back-btn">
          ← Voltar
        </button>
        <div className="collection-header-content">
          <div className="collection-info">
            <h1>{collection.name}</h1>
            {collection.description && (
              <p className="collection-description">{collection.description}</p>
            )}
          </div>
          <div className="collection-stats">
            <div className="stat-card">
              <span className="stat-label">Mangás</span>
              <span className="stat-value">{mangas.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Volumes</span>
              <span className="stat-value">{totalVolumes}</span>
            </div>
            <div className="stat-card investment">
              <span className="stat-label">Investimento Total</span>
              <span className="stat-value currency">R$ {totalCost.toFixed(2)}</span>
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
                <MangaDetails
                  manga={manga}
                  onAddVolume={() => handleAddVolume(manga)}
                  onEditVolume={(volume) => handleEditVolume(manga, volume)}
                  onDeleteVolume={(volume) => handleDeleteVolume(manga, volume)}
                />
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

      {showVolumeModal && volumeModalData.manga && (
        <ManageVolumesModal
          manga={volumeModalData.manga}
          initialVolume={volumeModalData.volume}
          onClose={() => {
            setShowVolumeModal(false);
            setVolumeModalData({
              manga: null,
              volume: null
            });
          }}
          onSave={handleSaveVolume}
        />
      )}
    </div>
  );
};

export default CollectionDetails;
