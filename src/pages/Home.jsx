import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  searchManga,
  searchAnime,
  getPopularManga,
  getPopularAnime,
} from '../services/mangaApi';
import {
  addMangaToLibrary,
  addAnimeToLibrary,
  getUserMangaMalIds,
  getUserAnimeMalIds,
} from '../services/firestoreService';
import {
  jikanMangaToLibrary,
  jikanAnimeToLibrary,
} from '../utils/mediaHelpers';
import MediaListItem from '../components/MediaListItem';
import './Home.css';

const Home = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState('manga');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popularManga, setPopularManga] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [userMangaIds, setUserMangaIds] = useState(new Set());
  const [userAnimeIds, setUserAnimeIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);

  const loadUserLibrary = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [mangaIds, animeIds] = await Promise.all([
        getUserMangaMalIds(currentUser.uid),
        getUserAnimeMalIds(currentUser.uid),
      ]);
      setUserMangaIds(mangaIds);
      setUserAnimeIds(animeIds);
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUserLibrary();
    }
  }, [currentUser, loadUserLibrary]);

  useEffect(() => {
    if (currentUser && !hasSearched) {
      loadTrending();
    }
  }, [currentUser, hasSearched]);

  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const [manga, anime] = await Promise.all([
        getPopularManga(),
        getPopularAnime(),
      ]);
      setPopularManga(manga);
      setPopularAnime(anime);
    } catch (err) {
      console.error('Erro ao carregar trending:', err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const data =
        mediaType === 'manga'
          ? await searchManga(searchQuery)
          : await searchAnime(searchQuery);
      setResults(data);
    } catch (err) {
      setError('Erro ao buscar. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    setError('');
  };

  const handleAddToCollection = async (item, type) => {
    if (!currentUser) return;

    setAddingId(item.mal_id);
    try {
      if (type === 'manga') {
        await addMangaToLibrary(currentUser.uid, jikanMangaToLibrary(item));
        setUserMangaIds((prev) => new Set([...prev, item.mal_id]));
      } else {
        await addAnimeToLibrary(currentUser.uid, jikanAnimeToLibrary(item));
        setUserAnimeIds((prev) => new Set([...prev, item.mal_id]));
      }
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      alert('Erro ao adicionar à coleção. Tente novamente.');
    } finally {
      setAddingId(null);
    }
  };

  const isInCollection = (item, type) => {
    const ids = type === 'manga' ? userMangaIds : userAnimeIds;
    return ids.has(item.mal_id);
  };

  const renderMediaList = (items, type, title = null) => {
    if (items.length === 0) return null;

    return (
      <section className="media-section">
        {title && <h2>{title}</h2>}
        <div className="media-list">
          <div className="media-list-header">
            <span></span>
            <span>Nome</span>
            <span>{type === 'manga' ? 'Volumes/Cap.' : 'Episódios'}</span>
            <span>Nota</span>
            <span>Ranking</span>
            <span>Pop.</span>
            <span>Início</span>
            <span>Término</span>
            <span></span>
          </div>
          {items.map((item) => (
            <MediaListItem
              key={item.mal_id}
              item={item}
              type={type}
              inCollection={isInCollection(item, type)}
              onAdd={
                isInCollection(item, type)
                  ? undefined
                  : () => handleAddToCollection(item, type)
              }
              adding={addingId === item.mal_id}
            />
          ))}
        </div>
      </section>
    );
  };

  if (!currentUser) {
    return (
      <div className="home-container home-landing">
        <video
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/background1.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
        <div className="welcome-section">
          <h1>CATALOG</h1>
          <p>Organize a sua coleção de mangás e animes de maneira rápida e simples.</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">Entrar</Link>
            <Link to="/signup" className="btn btn-secondary">Cadastrar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container home-search">
      <div className="home-search-header">
        <h1>Buscar</h1>
        <p className="home-search-subtitle">
          Encontre mangás e animes para catalogar na sua coleção
        </p>
      </div>

      <form onSubmit={handleSearch} className="home-search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Digite o nome do ${mediaType === 'manga' ? 'mangá' : 'anime'}...`}
          className="home-search-input"
        />
        <div className="media-type-toggle">
          <button
            type="button"
            className={`type-btn ${mediaType === 'manga' ? 'active' : ''}`}
            onClick={() => setMediaType('manga')}
          >
            Mangá
          </button>
          <button
            type="button"
            className={`type-btn ${mediaType === 'anime' ? 'active' : ''}`}
            onClick={() => setMediaType('anime')}
          >
            Anime
          </button>
        </div>
        <button type="submit" disabled={loading} className="home-search-btn">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <div className="home-error">{error}</div>}

      {hasSearched && !loading && (
        <div className="search-results">
          <div className="search-results-header">
            <h2>
              Resultados para &ldquo;{searchQuery}&rdquo;
              <span className="results-type-badge">
                {mediaType === 'manga' ? 'Mangá' : 'Anime'}
              </span>
            </h2>
            <button onClick={handleClearSearch} className="btn-clear-search">
              Limpar busca
            </button>
          </div>
          {results.length === 0 ? (
            <p className="no-results">Nenhum resultado encontrado.</p>
          ) : (
            renderMediaList(results, mediaType)
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="trending-section">
          {loadingTrending ? (
            <div className="loading">Carregando destaques...</div>
          ) : (
            <>
              {renderMediaList(popularManga, 'manga', 'Mangás em alta')}
              {renderMediaList(popularAnime, 'anime', 'Animes em alta')}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
