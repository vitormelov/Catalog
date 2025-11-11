// Card de grupo
import { Link } from 'react-router-dom';
import './GroupCard.css';

const GroupCard = ({ group, onEdit, onDelete }) => {
  return (
    <div className="group-card">
      <div className="group-header">
        <h3>{group.name}</h3>
        <div className="group-actions">
          <button onClick={onEdit} className="edit-btn">✏️</button>
          <button onClick={onDelete} className="delete-btn">🗑️</button>
        </div>
      </div>
      
      {group.description && (
        <p className="group-description">{group.description}</p>
      )}

      <div className="group-stats">
        <div className="stat">
          <span className="stat-label">Mangás:</span>
          <span className="stat-value">{group.mangaCount || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Investimento:</span>
          <span className="stat-value">R$ {group.totalCost?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <Link to={`/group/${group.id}`} className="view-link">
        Ver Detalhes →
      </Link>
    </div>
  );
};

export default GroupCard;

