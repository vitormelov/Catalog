import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserMangaCollection,
  deleteMangaFromCollection,
} from '../services/firestoreService';
import {
  getOwnedVolumesCount,
  getTotalMangaCollectionCost,
  sortMangas,
  SORT_ALPHA,
  SORT_RATING,
  SORT_STATUS,
  SORT_COST,
} from '../utils/mangaStats';
import MangaLibraryListItem from '../components/MangaLibraryListItem';
import './MyLibrary.css';

const MyMangas = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_ALPHA);

  useEffect(() => {
    if (currentUser) {
      loadMangas();
    }
  }, [currentUser]);

  const loadMangas = async () => {
    try {
      const data = await getUserMangaCollection(currentUser.uid);
      setMangas(data);
    } catch (error) {
      console.error('Erro ao carregar mangás:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCost = getTotalMangaCollectionCost(mangas);
    const totalOwnedVolumes = mangas.reduce(
      (sum, m) => sum + getOwnedVolumesCount(m),
      0
    );
    return { totalCost, totalOwnedVolumes };
  }, [mangas]);

  const sortedMangas = useMemo(
    () => sortMangas(mangas, sortBy),
    [mangas, sortBy]
  );

  const handleDelete = async (manga) => {
    if (!window.confirm(`Remover "${manga.title}" da sua coleção?`)) return;

    setDeletingId(manga.id);
    try {
      await deleteMangaFromCollection(manga.id, currentUser.uid);
      setMangas((prev) => prev.filter((m) => m.id !== manga.id));
    } catch (error) {
      console.error('Erro ao remover mangá:', error);
      alert('Erro ao remover mangá. Tente novamente.');
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
        <h1>Meus Mangás</h1>
        <p className="library-subtitle">
          {mangas.length} mangá{mangas.length !== 1 ? 's' : ''} na sua coleção
        </p>
      </div>

      {mangas.length === 0 ? (
        <div className="library-empty">
          <p>Você ainda não adicionou nenhum mangá à sua coleção.</p>
          <Link to="/" className="btn-library-link">
            Buscar mangás
          </Link>
        </div>
      ) : (
        <>
          <div className="library-stats-banner">
            <div className="library-stat">
              <span className="library-stat-label">Mangás</span>
              <span className="library-stat-value">{mangas.length}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Volumes adquiridos</span>
              <span className="library-stat-value">{stats.totalOwnedVolumes}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-label">Investimento total</span>
              <span className="library-stat-value investment">
                R$ {stats.totalCost.toFixed(2)}
              </span>
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
                className={`sort-btn ${sortBy === SORT_RATING ? 'active' : ''}`}
                onClick={() => setSortBy(SORT_RATING)}
              >
                Minha nota
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
                className={`sort-btn ${sortBy === SORT_COST ? 'active' : ''}`}
                onClick={() => setSortBy(SORT_COST)}
              >
                Custo
              </button>
            </div>
          </div>

          <div className="manga-library-list">
            <div className="manga-library-header">
              <span></span>
              <span>Nome</span>
              <span>Volumes</span>
              <span>Situação</span>
              <span>Notas</span>
              <span>Custo</span>
              <span></span>
            </div>
            {sortedMangas.map((manga) => (
              <MangaLibraryListItem
                key={manga.id}
                manga={manga}
                onView={() => navigate(`/my-mangas/${manga.id}`)}
                onDelete={() => handleDelete(manga)}
                deleting={deletingId === manga.id}
              />
            ))}
            <div className="manga-library-total-row">
              <span></span>
              <span className="total-label">Custo total da coleção</span>
              <span></span>
              <span></span>
              <span></span>
              <span className="total-cost">R$ {stats.totalCost.toFixed(2)}</span>
              <span></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyMangas;
