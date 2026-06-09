import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserMangaCollection,
  getUserAnimeCollection,
} from '../services/firestoreService';
import { assignRanks, getRankLabel } from '../utils/rankingHelpers';
import { formatRating } from '../utils/mangaStats';
import './Ranking.css';

const PodiumCard = ({ item, size }) => {
  const imageUrl = item.imageUrl || '/placeholder-manga.jpg';
  const rating = formatRating(item.rating);

  return (
    <div className={`podium-card podium-${size}`}>
      {size === 'first' && (
        <div className="podium-crown" aria-hidden="true">👑</div>
      )}
      <div className="podium-image-wrap">
        <img src={imageUrl} alt={item.title} />
      </div>
      <h3 className="podium-title">{item.title}</h3>
      <span className="podium-rating">⭐ {rating}/10</span>
      <span className="podium-place">{getRankLabel(item.rank)}</span>
    </div>
  );
};

const RankingListItem = ({ item }) => {
  const imageUrl = item.imageUrl || '/placeholder-manga.jpg';
  const rating = formatRating(item.rating);

  return (
    <div className="ranking-list-item">
      <span className="ranking-list-place">{getRankLabel(item.rank)}</span>
      <img src={imageUrl} alt={item.title} className="ranking-list-image" />
      <div className="ranking-list-info">
        <span className="ranking-list-title">{item.title}</span>
        {item.titleEnglish && item.titleEnglish !== item.title && (
          <span className="ranking-list-subtitle">{item.titleEnglish}</span>
        )}
      </div>
      <span className="ranking-list-rating">⭐ {rating}/10</span>
    </div>
  );
};

const Ranking = () => {
  const { currentUser } = useAuth();
  const [mediaType, setMediaType] = useState('manga');
  const [mangas, setMangas] = useState([]);
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [mangaData, animeData] = await Promise.all([
        getUserMangaCollection(currentUser.uid),
        getUserAnimeCollection(currentUser.uid),
      ]);
      setMangas(mangaData);
      setAnimes(animeData);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const rankedItems = useMemo(() => {
    const source = mediaType === 'manga' ? mangas : animes;
    return assignRanks(source);
  }, [mangas, animes, mediaType]);

  const podiumItems = rankedItems.slice(0, 3);
  const listItems = rankedItems.slice(3);

  const podiumOrder =
    podiumItems.length === 3
      ? [podiumItems[1], podiumItems[0], podiumItems[2]]
      : podiumItems.length === 2
        ? [null, podiumItems[0], podiumItems[1]]
        : podiumItems.length === 1
          ? [null, podiumItems[0], null]
          : [];

  const podiumSizes = ['second', 'first', 'third'];

  if (loading) {
    return <div className="loading">Carregando ranking...</div>;
  }

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1>Ranking</h1>
        <p className="ranking-subtitle">
          Baseado na sua nota pessoal
        </p>
      </div>

      <div className="ranking-type-toggle">
        <button
          type="button"
          className={`type-btn ${mediaType === 'manga' ? 'active' : ''}`}
          onClick={() => setMediaType('manga')}
        >
          Mangás
        </button>
        <button
          type="button"
          className={`type-btn ${mediaType === 'anime' ? 'active' : ''}`}
          onClick={() => setMediaType('anime')}
        >
          Animes
        </button>
      </div>

      {rankedItems.length === 0 ? (
        <div className="ranking-empty">
          <p>
            Nenhum {mediaType === 'manga' ? 'mangá' : 'anime'} com nota atribuída ainda.
          </p>
          <p className="ranking-empty-hint">
            Atribua notas na página de detalhes para aparecer no ranking.
          </p>
        </div>
      ) : (
        <>
          {podiumItems.length > 0 && (
            <div className="podium">
              {podiumOrder.map((item, index) =>
                item ? (
                  <PodiumCard
                    key={item.id}
                    item={item}
                    size={podiumSizes[index]}
                  />
                ) : (
                  <div key={`empty-${index}`} className="podium-spacer" />
                )
              )}
            </div>
          )}

          {listItems.length > 0 && (
            <div className="ranking-list">
              <h2>Demais colocações</h2>
              {listItems.map((item) => (
                <RankingListItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Ranking;
