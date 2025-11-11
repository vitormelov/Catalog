// Modal simplificado para adicionar mangá a uma coleção
import { useState, useEffect } from 'react';
import { getUserCollections } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import './AddMangaModal.css';

const AddMangaModal = ({ manga, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cols = await getUserCollections(currentUser.uid);
      setCollections(cols);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!collectionId) {
      alert('Selecione uma coleção para adicionar o mangá');
      return;
    }
    onSave({ collectionId });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content simple-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar à Coleção</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="manga-preview">
          <img 
            src={manga.images?.jpg?.image_url || manga.images?.webp?.image_url} 
            alt={manga.title}
            className="preview-image"
          />
          <div>
            <h3>{manga.title}</h3>
            {manga.title_english && <p>{manga.title_english}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="manga-form">
          <div className="form-group">
            <label>Coleção *</label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              required
            >
              <option value="">Selecione uma coleção</option>
              {collections.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
            <small>Você poderá adicionar nota e volumes depois na página da coleção</small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMangaModal;
