// Card de exibição de mangá
import './MangaCard.css';

const MangaCard = ({ manga, onAdd }) => {
  // Suporta tanto dados da API quanto do Firestore
  const imageUrl = manga.imageUrl || 
                   manga.images?.jpg?.image_url || 
                   manga.images?.webp?.image_url || 
                   '/placeholder-manga.jpg';
  
  const title = manga.title || '';
  const titleEnglish = manga.titleEnglish || manga.title_english || '';
  const score = manga.score || null;
  const rating = manga.rating || null; // Nota pessoal (1-5 estrelas)

  // Renderizar estrelas para a nota pessoal
  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    return (
      <div className="manga-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star-filled' : 'star-empty'}>
            ⭐
          </span>
        ))}
        <span className="rating-value">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="manga-card">
      <div className="manga-image-container">
        <img src={imageUrl} alt={title} className="manga-image" />
      </div>
      <div className="manga-info">
        <h3 className="manga-title">{title}</h3>
        {titleEnglish && titleEnglish !== title && (
          <p className="manga-title-english">{titleEnglish}</p>
        )}
        <div className="manga-meta">
          {score && (
            <span className="manga-score">⭐ {score}</span>
          )}
          {manga.volumes && typeof manga.volumes === 'number' && (
            <span className="manga-volumes">{manga.volumes} vols</span>
          )}
        </div>
        {rating && renderStars(rating)}
        {onAdd && (
          <button onClick={onAdd} className="add-manga-btn">
            Adicionar à Coleção
          </button>
        )}
      </div>
    </div>
  );
};

export default MangaCard;
