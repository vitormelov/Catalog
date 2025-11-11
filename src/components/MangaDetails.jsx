// Componente para mostrar detalhes do mangá na coleção (com volumes)
import './MangaDetails.css';

const MangaDetails = ({ manga }) => {
  const imageUrl = manga.imageUrl || '/placeholder-manga.jpg';
  const title = manga.title || '';
  const titleEnglish = manga.titleEnglish || '';
  const rating = manga.rating || 0;
  const volumes = manga.volumes || [];

  // Renderizar estrelas para a nota (suporta meia estrela)
  const renderStars = (rating) => {
    if (!rating || rating === 0) return <span className="no-rating">Sem nota</span>;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return <span key={star} className="star-filled">⭐</span>;
          } else if (star === fullStars + 1 && hasHalfStar) {
            return <span key={star} className="star-half">⭐</span>;
          } else {
            return <span key={star} className="star-empty">⭐</span>;
          }
        })}
        <span className="rating-value">({rating}/5)</span>
      </div>
    );
  };

  // Formatar data ou mostrar "indefinido"
  const formatDate = (dateString) => {
    if (!dateString) return 'Indefinido';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Indefinido';
    }
  };

  // Calcular total gasto
  const totalSpent = volumes.reduce((sum, vol) => sum + (vol.price || 0), 0);

  return (
    <div className="manga-details">
      <div className="manga-details-header">
        <img src={imageUrl} alt={title} className="manga-details-image" />
        <div className="manga-details-info">
          <h3>{title}</h3>
          {titleEnglish && titleEnglish !== title && (
            <p className="manga-subtitle">{titleEnglish}</p>
          )}
          <div className="manga-rating-section">
            <strong>Minha Nota:</strong>
            {renderStars(rating)}
          </div>
          {manga.notes && (
            <div className="manga-notes">
              <strong>Observações:</strong>
              <p>{manga.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="volumes-details">
        <div className="volumes-header">
          <h4>Volumes Possuídos ({volumes.length})</h4>
          {totalSpent > 0 && (
            <div className="total-spent">
              Total Gasto: <strong>R$ {totalSpent.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {volumes.length === 0 ? (
          <p className="no-volumes">Nenhum volume registrado</p>
        ) : (
          <div className="volumes-list">
            {volumes.map((volume, index) => (
              <div key={index} className="volume-detail-item">
                <div className="volume-number">Volume {volume.volumeNumber}</div>
                <div className="volume-info">
                  <div className="volume-price">
                    <span className="label">Preço:</span>
                    <span className="value">R$ {(volume.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="volume-date">
                    <span className="label">Data de Compra:</span>
                    <span className={`value ${!volume.purchaseDate ? 'undefined' : ''}`}>
                      {formatDate(volume.purchaseDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaDetails;

