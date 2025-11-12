// Modal dedicado para gerenciar os volumes do mangá
import { useState, useEffect } from 'react';
import './EditMangaModal.css';
import './ManageVolumesModal.css';

const DEFAULT_FORM = {
  volumeNumber: '',
  state: 'lacrado',
  price: '',
  purchaseDate: ''
};

const formatPriceForInput = (value) => {
  if (value === 0) {
    return '0.00';
  }

  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numeric = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(numeric)) {
    return '';
  }

  return numeric.toFixed(2);
};

const ManageVolumesModal = ({ manga, initialVolume = null, onClose, onSave }) => {
  const isEditMode = Boolean(initialVolume);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (initialVolume) {
      setFormData({
        volumeNumber: initialVolume.volumeNumber ?? '',
        state:
          initialVolume.state === 'lacrado' || initialVolume.status === 'lacrado'
            ? 'lacrado'
            : 'aberto',
        price: formatPriceForInput(initialVolume.price),
        purchaseDate: initialVolume.purchaseDate || ''
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [initialVolume]);

  if (!manga) {
    return null;
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const parsedNumber = parseInt(formData.volumeNumber, 10);
    if (Number.isNaN(parsedNumber) || parsedNumber <= 0) {
      alert('Informe um número de volume válido (inteiro positivo).');
      return;
    }

    const sanitizedPrice = String(formData.price).replace(',', '.');
    const parsedPrice = parseFloat(sanitizedPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Informe um preço válido (maior ou igual a zero).');
      return;
    }

    if (formData.purchaseDate && Number.isNaN(Date.parse(formData.purchaseDate))) {
      alert('Informe uma data válida no formato AAAA-MM-DD ou deixe em branco.');
      return;
    }

    onSave({
      volumeNumber: parsedNumber,
      state: formData.state === 'lacrado' ? 'lacrado' : 'aberto',
      price: parsedPrice,
      purchaseDate: formData.purchaseDate || null
    });
  };

  const modalTitle = isEditMode ? 'Editar Volume' : 'Adicionar Volume';
  const submitLabel = isEditMode ? 'Salvar Alterações' : 'Adicionar Volume';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content manage-volumes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{modalTitle}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
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

        <form onSubmit={handleSubmit} className="manga-form volume-form">
          <div className="volume-form-grid">
            <div className="form-group">
              <label>Número do Volume *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.volumeNumber}
                onChange={(e) => handleChange('volumeNumber', e.target.value)}
                placeholder="Ex: 12"
                required
              />
            </div>

            <div className="form-group">
              <label>Estado *</label>
              <div className="state-toggle">
                <button
                  type="button"
                  className={`state-option ${formData.state === 'lacrado' ? 'active' : ''}`}
                  onClick={() => handleChange('state', 'lacrado')}
                >
                  Lacrado
                </button>
                <button
                  type="button"
                  className={`state-option ${formData.state === 'aberto' ? 'active' : ''}`}
                  onClick={() => handleChange('state', 'aberto')}
                >
                  Aberto
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Preço Pago (R$) *</label>
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
              <label>Data da Compra</label>
              <input
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
              />
              {!formData.purchaseDate && (
                <small className="date-hint">Deixar vazio = indefinido</small>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageVolumesModal;


