// Modal para editar mangá (nota e volumes) na coleção
import { useState, useEffect } from 'react';
import './EditMangaModal.css';

const EditMangaModal = ({ manga, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    notes: '',
    volumes: []
  });

  useEffect(() => {
    if (manga) {
      setFormData({
        rating: manga.rating || 0,
        notes: manga.notes || '',
        volumes: manga.volumes || []
      });
    }
  }, [manga]);

  const handleVolumeChange = (index, field, value) => {
    const newVolumes = [...formData.volumes];
    if (!newVolumes[index]) {
      newVolumes[index] = { volumeNumber: index + 1, price: 0, purchaseDate: '', owned: false };
    }
    newVolumes[index][field] = field === 'price' ? parseFloat(value) || 0 : 
                               field === 'owned' ? value : value;
    setFormData({ ...formData, volumes: newVolumes });
  };

  const handleAddVolume = () => {
    const newVolumes = [...formData.volumes];
    newVolumes.push({
      volumeNumber: newVolumes.length + 1,
      price: 0,
      purchaseDate: '',
      owned: false
    });
    setFormData({ ...formData, volumes: newVolumes });
  };

  const handleRemoveVolume = (index) => {
    const newVolumes = formData.volumes.filter((_, i) => i !== index);
    // Reordenar números dos volumes
    newVolumes.forEach((vol, i) => {
      vol.volumeNumber = i + 1;
    });
    setFormData({ ...formData, volumes: newVolumes });
  };

  // Sistema de meia estrela
  const handleStarClick = (starIndex, isHalf) => {
    const rating = isHalf ? starIndex + 0.5 : starIndex + 1;
    setFormData({ ...formData, rating });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filtrar apenas volumes que o usuário possui
    const ownedVolumes = formData.volumes.filter(vol => vol.owned);
    
    if (ownedVolumes.length === 0) {
      alert('Marque pelo menos um volume que você possui');
      return;
    }

    // Processar volumes: se não tiver data, deixar como null
    const processedVolumes = ownedVolumes.map(vol => ({
      volumeNumber: vol.volumeNumber,
      price: vol.price || 0,
      purchaseDate: vol.purchaseDate || null,
      owned: true
    }));

    onSave({
      ...formData,
      volumes: processedVolumes
    });
  };

  if (!manga) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Mangá</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="manga-preview">
          <img 
            src={manga.imageUrl || '/placeholder-manga.jpg'} 
            alt={manga.title}
            className="preview-image"
          />
          <div>
            <h3>{manga.title}</h3>
            {manga.titleEnglish && <p>{manga.titleEnglish}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="manga-form">
          <div className="form-group">
            <label>Sua Nota (1-5 estrelas) *</label>
            <div className="star-rating-container">
              <div className="star-rating">
                {[0, 1, 2, 3, 4].map((starIndex) => {
                  const isHalfFilled = formData.rating >= starIndex + 0.5 && formData.rating < starIndex + 1;
                  const isFullFilled = formData.rating >= starIndex + 1;
                  
                  return (
                    <div key={starIndex} className="star-wrapper">
                      <div 
                        className={`star-half left ${isHalfFilled || isFullFilled ? 'filled' : ''}`}
                        onClick={() => handleStarClick(starIndex, true)}
                        title={`${starIndex + 0.5} estrelas`}
                      >
                        <span className="star">⭐</span>
                      </div>
                      <div 
                        className={`star-half right ${isFullFilled ? 'filled' : ''}`}
                        onClick={() => handleStarClick(starIndex, false)}
                        title={`${starIndex + 1} estrelas`}
                      >
                        <span className="star">⭐</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {formData.rating > 0 && (
                <span className="rating-text">{formData.rating} de 5 estrelas</span>
              )}
            </div>
            {formData.rating === 0 && (
              <small className="error-text">Selecione uma nota</small>
            )}
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Anotações sobre este mangá..."
            />
          </div>

          <div className="volumes-section">
            <div className="volumes-header">
              <h3>Volumes que Possuo</h3>
              <button type="button" onClick={handleAddVolume} className="add-volume-btn">
                + Adicionar Volume
              </button>
            </div>
            <p className="volumes-instruction">
              Marque os volumes que você possui, informe o preço pago e a data de compra (opcional)
            </p>

            {formData.volumes.length === 0 ? (
              <p className="no-volumes">Nenhum volume adicionado. Clique em "+ Adicionar Volume" para começar.</p>
            ) : (
              <div className="volumes-list">
                {formData.volumes.map((volume, index) => (
                  <div key={index} className="volume-item">
                    <div className="volume-number">Vol. {volume.volumeNumber}</div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={volume.owned || false}
                        onChange={(e) => handleVolumeChange(index, 'owned', e.target.checked)}
                      />
                      Possuo
                    </label>
                    {volume.owned && (
                      <>
                        <div className="volume-price">
                          <label>Preço (R$)</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={volume.price || ''}
                            onChange={(e) => handleVolumeChange(index, 'price', e.target.value)}
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div className="volume-date">
                          <label>Data de Compra (opcional)</label>
                          <input
                            type="date"
                            value={volume.purchaseDate || ''}
                            onChange={(e) => handleVolumeChange(index, 'purchaseDate', e.target.value)}
                          />
                          {!volume.purchaseDate && (
                            <small className="date-hint">Deixar vazio = indefinido</small>
                          )}
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveVolume(index)}
                      className="remove-volume-btn"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={formData.rating === 0}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMangaModal;

