// Modal para criar/editar coleção ou grupo
import { useState, useEffect } from 'react';
import './CollectionModal.css';

const CollectionModal = ({ collection, onClose, onSave, type = 'collection' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || '',
        description: collection.description || ''
      });
    }
  }, [collection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(`O nome do ${type === 'collection' ? 'coleção' : 'grupo'} é obrigatório`);
      return;
    }
    onSave(formData);
  };

  const typeLabel = type === 'collection' ? 'Coleção' : 'Grupo';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{collection ? `Editar ${typeLabel}` : `Nova ${typeLabel}`}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="collection-form">
          <div className="form-group">
            <label>Nome da {typeLabel} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={`Ex: ${type === 'collection' ? 'Mangás de Ação' : 'Mangás Favoritos'}`}
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              placeholder={`Descreva sua ${typeLabel.toLowerCase()}...`}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {collection ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionModal;

