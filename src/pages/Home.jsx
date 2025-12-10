// Página inicial
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserCollections, getMangaByCollection, getCollectionTotalCost } from '../services/firestoreService';
import './Home.css';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    collections: 0,
    volumes: 0,
    totalCost: 0
  });
  const [collectionsData, setCollectionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const loadStats = async () => {
    try {
      const collections = await getUserCollections(currentUser.uid);

      // Calcular dados detalhados de cada coleção
      const collectionsWithData = await Promise.all(
        collections.map(async (col) => {
          const mangasInCollection = await getMangaByCollection(col.id, currentUser.uid);
          const totalCost = await getCollectionTotalCost(col.id, currentUser.uid);

          // Calcular volumes possuídos e totais
          let ownedVolumes = 0;
          let totalVolumes = 0;
          const ratings = [];
          
          mangasInCollection.forEach((manga) => {
            const volumes = manga.volumes || [];
            ownedVolumes += volumes.length;
            
            if (manga.totalVolumes !== null && manga.totalVolumes !== undefined) {
              totalVolumes += manga.totalVolumes;
            }
            
            if (manga.rating !== null && manga.rating !== undefined) {
              ratings.push(manga.rating);
            }
          });
          
          // Calcular nota média
          const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : null;
          
          return {
            ...col,
            ownedVolumes,
            totalVolumes: totalVolumes > 0 ? totalVolumes : null,
            averageRating,
            totalCost,
            mangaCount: mangasInCollection.length
          };
        })
      );

      // Calcular custos totais e volumes totais
      const totalCost = collectionsWithData.reduce((sum, col) => sum + col.totalCost, 0);
      const totalVolumes = collectionsWithData.reduce((sum, col) => sum + col.ownedVolumes, 0);

      setStats({
        collections: collections.length,
        volumes: totalVolumes,
        totalCost
      });
      
      setCollectionsData(collectionsWithData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined) {
      return 'Sem nota';
    }
    const roundedRating = Math.round(rating * 2) / 2;
    return Number.isInteger(roundedRating)
      ? roundedRating.toFixed(0)
      : roundedRating.toFixed(1);
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
          <p>Organize a sua coleção de maneira rápida e simples.</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">Entrar</Link>
            <Link to="/signup" className="btn btn-secondary">Cadastrar</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="home-container">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.collections}</h3>
            <p>Coleções</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.volumes}</h3>
            <p>Volumes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>R$ {stats.totalCost.toFixed(2)}</h3>
            <p>Investimento Total</p>
          </div>
        </div>
      </div>

      <div className="collections-table-section">
        <h2>Minhas Coleções</h2>
        {collectionsData.length === 0 ? (
          <div className="empty-collections">
            <p>Você ainda não tem coleções cadastradas.</p>
            <Link to="/collections" className="btn btn-primary">
              Criar Coleção
          </Link>
        </div>
        ) : (
          <div className="collections-table-container">
            <table className="collections-table">
              <thead>
                <tr>
                  <th>Nome da Coleção</th>
                  <th>Volumes</th>
                  <th>Minha Nota</th>
                  <th>Investimento Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {collectionsData.map((collection) => (
                  <tr key={collection.id}>
                    <td className="collection-name">{collection.name}</td>
                    <td className="collection-volumes">
                      {collection.totalVolumes !== null
                        ? `${collection.ownedVolumes} / ${collection.totalVolumes}`
                        : collection.ownedVolumes}
                    </td>
                    <td className="collection-rating">
                      {collection.averageRating !== null
                        ? `${formatRating(collection.averageRating)}/5`
                        : 'Sem nota'}
                    </td>
                    <td className="collection-cost">R$ {collection.totalCost.toFixed(2)}</td>
                    <td className="collection-actions">
                      <button
                        onClick={() => navigate(`/collection/${collection.id}`)}
                        className="btn-view"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="3" className="total-label">
                    <strong>Total Geral</strong>
                  </td>
                  <td className="total-cost">
                    <strong>R$ {stats.totalCost.toFixed(2)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
