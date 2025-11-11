// Card de coleção
import { Link } from 'react-router-dom';
import './CollectionCard.css';

const CollectionCard = ({ collection, onEdit, onDelete }) => {
  return (
    <div className="collection-card">
      <div className="collection-header">
        <h3>{collection.name}</h3>
        <div className="collection-actions">
          <button onClick={onEdit} className="edit-btn">✏️</button>
          <button onClick={onDelete} className="delete-btn">🗑️</button>
        </div>
      </div>
      
      {collection.description && (
        <p className="collection-description">{collection.description}</p>
      )}

      <div className="collection-stats">
        <div className="stat">
          <span className="stat-label">Mangás:</span>
          <span className="stat-value">{collection.mangaCount || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Investimento:</span>
          <span className="stat-value">R$ {collection.totalCost?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <Link to={`/collection/${collection.id}`} className="view-link">
        Ver Detalhes →
      </Link>
    </div>
  );
};

export default CollectionCard;

