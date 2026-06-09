import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserAnimeCollection,
  deleteAnimeFromCollection,
} from '../services/firestoreService';
import {
  sortAnimes,
  countByWatchStatus,
  SORT_ALPHA,
  SORT_RATING,
  SORT_STATUS,
} from '../utils/animeStats';
import AnimeLibraryListItem from '../components/AnimeLibraryListItem';
import './MyLibrary.css';

const MyAnimes = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_ALPHA);

  useEffect(() => {
    if (currentUser) {
      loadAnimes();
    }
  }, [currentUser]);

  const loadAnimes = async () => {
    try {
      const data = await getUserAnimeCollection(currentUser.uid);
      setAnimes(data);
    } catch (error) {
      console.error('Erro ao carregar animes:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      assistindo: countByWatchStatus(animes, 'assistindo'),
      finalizado: countByWatchStatus(animes, 'finalizado'),
      querendo: countByWatchStatus(animes, 'querendo_assistir'),
      dropado: countByWatchStatus(animes, 'dropado'),
    }),
    [animes]
  );

  const sortedAnimes = useMemo(
    () => sortAnimes(animes, sortBy),
    [animes, sortBy]
  );

  const handleDelete = async (anime) => {
    if (!window.confirm(`Remover "${anime.title}" da sua coleção?`)) return;

    setDeletingId(anime.id);
    try {
      await deleteAnimeFromCollection(anime.id, currentUser.uid);
      setAnimes((prev) => prev.filter((a) => a.id !== anime.id));
    } catch (error) {
      console.error('Erro ao remover anime:', error);
      alert('Erro ao remover anime. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>Meus Animes</h1>
        <p className="library-subtitle">
          {animes.length} anime{animes.length !== 1 ? 's' : ''} na sua coleção
        </p>
      </div>

      {animes.length === 0 ? (
        <div className="library-empty">
          <p>Você ainda não adicionou nenhum anime à sua coleção.</p>
          <Link to="/" className="btn-library-link">
            Buscar animes
          </Link>
        </div>
      ) : (
        <>
          <div className="library-stats-banner">
            <div className="library-stat">
              <span className="library-stat-label">Animes</span>
              <span className="library-stat-value">{animes.length}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Assistindo</span>
              <span className="library-stat-value">{stats.assistindo}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Finalizados</span>
              <span className="library-stat-value">{stats.finalizado}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Na lista</span>
              <span className="library-stat-value">{stats.querendo}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Dropados</span>
              <span className="library-stat-value">{stats.dropado}</span>
            </div>
          </div>

          <div className="library-sort-bar">
            <span className="library-sort-label">Ordenar por:</span>
            <div className="library-sort-options">
              <button
                type="button"
                className={`sort-btn ${sortBy === SORT_ALPHA ? 'active' : ''}`}
                onClick={() => setSortBy(SORT_ALPHA)}
              >
                A–Z
              </button>
              <button
                type="button"
                className={`sort-btn ${sortBy === SORT_STATUS ? 'active' : ''}`}
                onClick={() => setSortBy(SORT_STATUS)}
              >
                Situação
              </button>
              <button
                type="button"
                className={`sort-btn ${sortBy === SORT_RATING ? 'active' : ''}`}
                onClick={() => setSortBy(SORT_RATING)}
              >
                Minha nota
              </button>
            </div>
          </div>

          <div className="anime-library-list">
            <div className="anime-library-header">
              <span></span>
              <span>Nome</span>
              <span>Notas</span>
              <span>Situação</span>
              <span>Início</span>
              <span>Término</span>
              <span></span>
            </div>
            {sortedAnimes.map((anime) => (
              <AnimeLibraryListItem
                key={anime.id}
                anime={anime}
                onView={() => navigate(`/my-animes/${anime.id}`)}
                onDelete={() => handleDelete(anime)}
                deleting={deletingId === anime.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyAnimes;
