// Modal para editar mangá (nota e volumes) na coleção
import { useState, useEffect } from 'react';
import './EditMangaModal.css';

const EditMangaModal = ({ manga, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    rating: '',
    notes: ''
  });

  useEffect(() => {
    if (manga) {
      setFormData({
        rating: manga.rating ? manga.rating.toString() : '',
        notes: manga.notes || ''
      });
    }
  }, [manga]);

  const handleRatingChange = (value) => {
    if (value === '') {
      setFormData({ ...formData, rating: '' });
      return;
    }

    let numericValue = parseFloat(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    numericValue = Math.min(Math.max(numericValue, 1), 5);
    numericValue = Math.round(numericValue * 2) / 2;

    setFormData({ ...formData, rating: numericValue.toString() });
  };

  const numericRating = parseFloat(formData.rating);
  const isRatingValid = !Number.isNaN(numericRating) && numericRating >= 1 && numericRating <= 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isRatingValid) {
      alert('Informe uma nota entre 1 e 5 (permitido 0,5).');
      return;
    }

    onSave({
      rating: numericRating,
      notes: formData.notes
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
            <label>Sua Nota (1-5) *</label>
            <div className="numeric-rating">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="5"
                step="0.5"
                placeholder="Ex: 4.5"
                value={formData.rating}
                onChange={(e) => handleRatingChange(e.target.value)}
                required
              />
              <span className="rating-hint">Aceita valores com 0,5</span>
            </div>
            {!isRatingValid && (
              <small className="error-text">Informe uma nota entre 1 e 5.</small>
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={!isRatingValid}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMangaModal;

