// Modal para criar/editar grupo (dentro de uma coleção)
import { useState, useEffect } from 'react';
import './GroupModal.css';

const GroupModal = ({ group, collections, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collectionId: ''
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        collectionId: group.collectionId || ''
      });
    }
  }, [group]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('O nome do grupo é obrigatório');
      return;
    }
    if (!group && !formData.collectionId) {
      alert('Selecione uma coleção para o grupo');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{group ? 'Editar Grupo' : 'Novo Grupo'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="group-form">
          {!group && (
            <div className="form-group">
              <label>Coleção *</label>
              <select
                value={formData.collectionId}
                onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                required
              >
                <option value="">Selecione uma coleção</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <small>O grupo será criado dentro desta coleção</small>
            </div>
          )}

          <div className="form-group">
            <label>Nome do Grupo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Mangás Favoritos"
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              placeholder="Descreva seu grupo..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {group ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;

