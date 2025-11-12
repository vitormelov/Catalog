// Componente para mostrar detalhes do mangá na coleção (com volumes)
import './MangaDetails.css';

const MangaDetails = ({ manga, onAddVolume, onEditVolume, onDeleteVolume }) => {
  const imageUrl = manga.imageUrl || '/placeholder-manga.jpg';
  const title = manga.title || '';
  const titleEnglish = manga.titleEnglish || '';
  const rating = manga.rating ?? null;
  const volumes = manga.volumes || [];
  const totalVolumes = manga.totalVolumes || null;
  const ownedVolumesCount = volumes.length;

  // Obter significado da nota
  const getRatingMeaning = (rating) => {
    const ratingMeanings = {
      5: 'obra-prima',
      4.5: 'excelente',
      4: 'muito bom',
      3.5: 'bom',
      3: 'ok',
      2.5: 'mediano',
      2: 'ruim',
      1.5: 'muito ruim',
      1: 'lixo',
      0.5: 'muito lixo',
      0: 'absurdamente horrível',
    };
    return ratingMeanings[rating] || '';
  };

  // Renderizar nota numérica (0 a 5 com incrementos de 0,5)
  const renderRating = (rawRating) => {
    if (rawRating === null || rawRating === undefined) {
      return <span className="no-rating">Sem nota</span>;
    }

    const numericRating = typeof rawRating === 'number' ? rawRating : parseFloat(rawRating);

    if (Number.isNaN(numericRating)) {
      return <span className="no-rating">Sem nota</span>;
    }

    const clampedRating = Math.min(Math.max(numericRating, 0), 5);
    const roundedRating = Math.round(clampedRating * 2) / 2;
    const displayValue = Number.isInteger(roundedRating)
      ? roundedRating.toFixed(0)
      : roundedRating.toFixed(1);
    
    const meaning = getRatingMeaning(roundedRating);

    return (
      <div className="rating-number">
        <span className="rating-number-value">{displayValue}</span>
        <span className="rating-number-scale">/5</span>
        {meaning && (
          <span className="rating-meaning">({meaning})</span>
        )}
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
            {renderRating(rating)}
          </div>
          {totalVolumes !== null && (
            <div className="manga-volumes-info">
              <strong>Volumes:</strong>
              <span className="volumes-count">
                {ownedVolumesCount} / {totalVolumes}
              </span>
              {ownedVolumesCount >= totalVolumes ? (
                <span className="collection-status complete">Coleção Completa</span>
              ) : (
                <span className="collection-status incomplete">Coleção Incompleta</span>
              )}
            </div>
          )}
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
          <div className="volumes-title">
            <h4>Volumes Possuídos ({volumes.length})</h4>
            {totalSpent > 0 && (
              <div className="total-spent">
                Total Gasto: <strong>R$ {totalSpent.toFixed(2)}</strong>
              </div>
            )}
          </div>
          {onAddVolume && (
            <button
              type="button"
              className="add-volume-btn"
              onClick={onAddVolume}
            >
              Adicionar Volume
            </button>
          )}
        </div>

        {volumes.length === 0 ? (
          <p className="no-volumes">Nenhum volume registrado</p>
        ) : (
          <div className="volumes-crud">
            <div className="volumes-crud-header">
              <span className="volume-col volume-number">Volume</span>
              <span className="volume-col volume-state">Estado</span>
              <span className="volume-col volume-price">Preço</span>
              <span className="volume-col volume-date">Data de compra</span>
              {(onEditVolume || onDeleteVolume) && (
                <span className="volume-col volume-actions">Ações</span>
              )}
            </div>
            <div className="volumes-crud-body">
              {volumes
                .slice()
                .sort((a, b) => a.volumeNumber - b.volumeNumber)
                .map((volume) => {
                  const state = volume.state || volume.status || 'aberto';
                  const displayState = state === 'lacrado' ? 'Lacrado' : 'Aberto';
                  const formattedDate = volume.purchaseDate
                    ? formatDate(volume.purchaseDate)
                    : 'Indefinido';

                  return (
                    <div key={volume.volumeNumber} className="volumes-crud-row">
                      <span className="volume-col volume-number">Vol. {volume.volumeNumber}</span>
                      <span className={`volume-col volume-state state-${state}`}>{displayState}</span>
                      <span className="volume-col volume-price">
                        R$ {(volume.price || 0).toFixed(2)}
                      </span>
                      <span
                        className={`volume-col volume-date ${
                          !volume.purchaseDate ? 'undefined' : ''
                        }`}
                      >
                        {formattedDate}
                      </span>
                      {(onEditVolume || onDeleteVolume) && (
                        <span className="volume-col volume-actions">
                          {onEditVolume && (
                            <button
                              type="button"
                              className="crud-button edit"
                              onClick={() => onEditVolume(volume)}
                            >
                              ✏️
                            </button>
                          )}
                          {onDeleteVolume && (
                            <button
                              type="button"
                              className="crud-button delete"
                              onClick={() => onDeleteVolume(volume)}
                            >
                              🗑️
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaDetails;

