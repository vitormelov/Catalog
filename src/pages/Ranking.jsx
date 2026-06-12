import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserMangaCollection,
  getUserAnimeCollection,
} from '../services/firestoreService';
import {
  getTopMangaPage,
  getTopAnimePage,
} from '../services/mangaApi';
import {
  assignPersonalRanks,
  assignPublicRanks,
  getRankLabel,
  getRankingDisplayValue,
  INITIAL_VISIBLE,
  LOAD_MORE_COUNT,
  normalizePublicItem,
  PUBLIC_SORT_POPULARITY,
  PUBLIC_SORT_SCORE,
  RANKING_PERSONAL,
  RANKING_PUBLIC,
} from '../utils/rankingHelpers';
import './Ranking.css';

const PodiumCard = ({ item, size, rankingSource, publicSort }) => {
  const imageUrl = item.imageUrl || '/placeholder-manga.jpg';
  const displayValue = getRankingDisplayValue(item, rankingSource, publicSort);

  return (
    <div className={`podium-card podium-${size}`}>
      {size === 'first' && (
        <div className="podium-first-badge" aria-hidden="true">
          1
        </div>
      )}
      <div className="podium-image-wrap">
        <img src={imageUrl} alt={item.title} />
      </div>
      <h3 className="podium-title">{item.title}</h3>
      <span className="podium-rating">{displayValue}</span>
      <span className="podium-place">{getRankLabel(item.rank)}</span>
    </div>
  );
};

const RankingListItem = ({ item, rankingSource, publicSort }) => {
  const imageUrl = item.imageUrl || '/placeholder-manga.jpg';
  const displayValue = getRankingDisplayValue(item, rankingSource, publicSort);

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
      <span className="ranking-list-rating">{displayValue}</span>
    </div>
  );
};

const Ranking = () => {
  const { currentUser } = useAuth();
  const [mediaType, setMediaType] = useState('manga');
  const [rankingSource, setRankingSource] = useState(RANKING_PERSONAL);
  const [publicSort, setPublicSort] = useState(PUBLIC_SORT_SCORE);
  const [mangas, setMangas] = useState([]);
  const [animes, setAnimes] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  const [publicItems, setPublicItems] = useState([]);
  const [publicPage, setPublicPage] = useState(1);
  const [hasMorePublic, setHasMorePublic] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (currentUser) {
      loadPersonalData();
    }
  }, [currentUser]);

  const loadPersonalData = async () => {
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
      setLoadingPersonal(false);
    }
  };

  const fetchPublicPage = useCallback(
    async (page) =>
      mediaType === 'manga'
        ? getTopMangaPage(page, publicSort)
        : getTopAnimePage(page, publicSort),
    [mediaType, publicSort]
  );

  const loadPublicData = useCallback(async () => {
    setLoadingPublic(true);
    setPublicItems([]);
    setPublicPage(1);
    setHasMorePublic(true);
    setVisibleCount(INITIAL_VISIBLE);

    try {
      const result = await fetchPublicPage(1);
      const ranked = assignPublicRanks(
        result.items.map(normalizePublicItem),
        publicSort
      );
      setPublicItems(ranked);
      setHasMorePublic(result.hasNext);
      setPublicPage(1);
    } catch (error) {
      console.error('Erro ao carregar ranking público:', error);
      setPublicItems([]);
      setHasMorePublic(false);
    } finally {
      setLoadingPublic(false);
    }
  }, [fetchPublicPage, publicSort]);

  useEffect(() => {
    if (rankingSource === RANKING_PUBLIC) {
      loadPublicData();
    }
  }, [rankingSource, mediaType, publicSort, loadPublicData]);

  const personalRanked = useMemo(() => {
    const source = mediaType === 'manga' ? mangas : animes;
    return assignPersonalRanks(source, {
      tieBreakByFavoriteEpisodes: mediaType === 'anime',
    });
  }, [mangas, animes, mediaType]);

  const rankedItems =
    rankingSource === RANKING_PERSONAL ? personalRanked : publicItems;

  const visibleItems = rankedItems.slice(0, visibleCount);
  const podiumItems = visibleItems.slice(0, 3);
  const listItems = visibleItems.slice(3);

  const podiumOrder =
    podiumItems.length === 3
      ? [podiumItems[1], podiumItems[0], podiumItems[2]]
      : podiumItems.length === 2
        ? [null, podiumItems[0], podiumItems[1]]
        : podiumItems.length === 1
          ? [null, podiumItems[0], null]
          : [];

  const podiumSizes = ['second', 'first', 'third'];

  const canRevealMore = visibleCount < rankedItems.length;
  const canFetchMore =
    rankingSource === RANKING_PUBLIC && hasMorePublic && !loadingPublic;

  const loadMorePublicPage = useCallback(async () => {
    if (loadingMoreRef.current || !hasMorePublic) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = publicPage + 1;
      const result = await fetchPublicPage(nextPage);
      setPublicItems((prev) =>
        assignPublicRanks(
          [...prev, ...result.items.map(normalizePublicItem)],
          publicSort
        )
      );
      setPublicPage(nextPage);
      setHasMorePublic(result.hasNext);
      setVisibleCount((count) => count + LOAD_MORE_COUNT);
    } catch (error) {
      console.error('Erro ao carregar mais itens:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPublicPage, hasMorePublic, publicPage, publicSort]);

  const handleRevealMore = useCallback(() => {
    if (canRevealMore) {
      setVisibleCount((count) => count + LOAD_MORE_COUNT);
      return;
    }
    if (canFetchMore) {
      loadMorePublicPage();
    }
  }, [canRevealMore, canFetchMore, loadMorePublicPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleRevealMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleRevealMore, rankedItems.length, visibleCount]);

  const handleSourceChange = (source) => {
    setRankingSource(source);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handlePublicSortChange = (sort) => {
    setPublicSort(sort);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const isLoading =
    rankingSource === RANKING_PERSONAL ? loadingPersonal : loadingPublic;

  const subtitle =
    rankingSource === RANKING_PERSONAL
      ? 'Baseado na sua nota pessoal'
      : publicSort === PUBLIC_SORT_POPULARITY
        ? 'Ranking público por popularidade (MyAnimeList)'
        : 'Ranking público por nota (MyAnimeList)';

  const emptyMessage =
    rankingSource === RANKING_PERSONAL
      ? `Nenhum ${mediaType === 'manga' ? 'mangá' : 'anime'} com nota atribuída ainda.`
      : 'Nenhum resultado disponível no momento.';

  const emptyHint =
    rankingSource === RANKING_PERSONAL
      ? 'Atribua notas na página de detalhes para aparecer no ranking.'
      : null;

  const showLoadMoreSentinel =
    rankedItems.length > 0 && (canRevealMore || canFetchMore);

  if (loadingPersonal && rankingSource === RANKING_PERSONAL) {
    return <div className="loading">Carregando ranking...</div>;
  }

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1>Ranking</h1>
        <p className="ranking-subtitle">{subtitle}</p>
      </div>

      <div className="ranking-controls">
        <div className="ranking-source-toggle">
          <button
            type="button"
            className={`source-btn ${rankingSource === RANKING_PERSONAL ? 'active' : ''}`}
            onClick={() => handleSourceChange(RANKING_PERSONAL)}
          >
            Pessoal
          </button>
          <button
            type="button"
            className={`source-btn ${rankingSource === RANKING_PUBLIC ? 'active' : ''}`}
            onClick={() => handleSourceChange(RANKING_PUBLIC)}
          >
            Público
          </button>
        </div>

        <div className="ranking-type-toggle">
          <button
            type="button"
            className={`type-btn ${mediaType === 'manga' ? 'active' : ''}`}
            onClick={() => handleMediaTypeChange('manga')}
          >
            Mangás
          </button>
          <button
            type="button"
            className={`type-btn ${mediaType === 'anime' ? 'active' : ''}`}
            onClick={() => handleMediaTypeChange('anime')}
          >
            Animes
          </button>
        </div>

        {rankingSource === RANKING_PUBLIC && (
          <div className="ranking-sort-toggle">
            <button
              type="button"
              className={`sort-btn ${publicSort === PUBLIC_SORT_SCORE ? 'active' : ''}`}
              onClick={() => handlePublicSortChange(PUBLIC_SORT_SCORE)}
            >
              Por nota
            </button>
            <button
              type="button"
              className={`sort-btn ${publicSort === PUBLIC_SORT_POPULARITY ? 'active' : ''}`}
              onClick={() => handlePublicSortChange(PUBLIC_SORT_POPULARITY)}
            >
              Por popularidade
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="ranking-loading-state">Carregando ranking...</div>
      ) : rankedItems.length === 0 ? (
        <div className="ranking-empty">
          <p>{emptyMessage}</p>
          {emptyHint && <p className="ranking-empty-hint">{emptyHint}</p>}
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
                    rankingSource={rankingSource}
                    publicSort={publicSort}
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
                <RankingListItem
                  key={item.id}
                  item={item}
                  rankingSource={rankingSource}
                  publicSort={publicSort}
                />
              ))}
            </div>
          )}

          {showLoadMoreSentinel && (
            <div ref={loadMoreRef} className="ranking-load-more">
              {loadingMore && <span>Carregando mais...</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Ranking;
