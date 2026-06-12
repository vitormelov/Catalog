import { useState, useEffect } from 'react';
import { VOLUME_CONDITIONS, getVolumeCondition } from '../utils/volumeHelpers';
import './EditMangaModal.css';
import './VolumeMarkModal.css';

const formatPriceForInput = (value) => {
  if (value === 0) return '0.00';
  if (value === undefined || value === null || value === '') return '';
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  return Number.isNaN(numeric) ? '' : numeric.toFixed(2);
};

const VolumeMarkModal = ({ manga, volumeNumber, existingVolume = null, onClose, onSave, onRemove }) => {
  const isEditMode = Boolean(existingVolume);
  const [formData, setFormData] = useState({
    condition: 'lacrado',
    price: '',
    purchaseDate: '',
  });

  useEffect(() => {
    if (existingVolume) {
      setFormData({
        condition: getVolumeCondition(existingVolume),
        price: formatPriceForInput(existingVolume.price),
        purchaseDate: existingVolume.purchaseDate || '',
      });
    }
  }, [existingVolume]);

  if (!manga) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sanitizedPrice = String(formData.price).replace(',', '.');
    const parsedPrice = parseFloat(sanitizedPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Informe um preço válido (maior ou igual a zero).');
      return;
    }

    if (formData.purchaseDate && Number.isNaN(Date.parse(formData.purchaseDate))) {
      alert('Informe uma data válida ou deixe em branco.');
      return;
    }

    onSave({
      volumeNumber,
      condition: formData.condition,
      price: parsedPrice,
      purchaseDate: formData.purchaseDate || null,
    });
  };

  const handleRemove = () => {
    if (window.confirm(`Remover o volume ${volumeNumber} da sua coleção?`)) {
      onRemove(volumeNumber);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content volume-mark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? `Volume ${volumeNumber}` : `Marcar Volume ${volumeNumber}`}</h2>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
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

        <form onSubmit={handleSubmit} className="manga-form volume-mark-form">
          <div className="form-group">
            <label>Preço pago (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="Ex: 59.90"
              required
            />
          </div>

          <div className="form-group">
            <label>Data de aquisição</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Situação *</label>
            <select
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              required
            >
              {VOLUME_CONDITIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            {isEditMode && onRemove && (
              <button type="button" onClick={handleRemove} className="btn-remove-volume">
                Remover volume
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-save">
                {isEditMode ? 'Salvar' : 'Marcar como adquirido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolumeMarkModal;
