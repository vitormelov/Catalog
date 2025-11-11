// Página inicial
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserCollections, getUserMangaCollection } from '../services/firestoreService';
import { getCollectionTotalCost } from '../services/firestoreService';
import './Home.css';

const Home = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    collections: 0,
    mangas: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const loadStats = async () => {
    try {
      const [collections, mangas] = await Promise.all([
        getUserCollections(currentUser.uid),
        getUserMangaCollection(currentUser.uid)
      ]);

      // Calcular custos totais
      const collectionCosts = await Promise.all(
        collections.map(col => getCollectionTotalCost(col.id))
      );

      const totalCost = collectionCosts.reduce((sum, cost) => sum + cost, 0);

      setStats({
        collections: collections.length,
        mangas: mangas.length,
        totalCost
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="home-container">
        <div className="welcome-section">
          <h1>Bem-vindo à sua Coleção de Mangás!</h1>
          <p>Organize, acompanhe e gerencie sua coleção de mangás de forma fácil e intuitiva.</p>
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
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.collections}</h3>
            <p>Coleções</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>{stats.mangas}</h3>
            <p>Mangás</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>R$ {stats.totalCost.toFixed(2)}</h3>
            <p>Investimento Total</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Ações Rápidas</h2>
        <div className="actions-grid">
          <Link to="/search" className="action-card">
            <span className="action-icon">🔍</span>
            <h3>Buscar Mangás</h3>
            <p>Encontre novos mangás para adicionar à sua coleção</p>
          </Link>
          <Link to="/collections" className="action-card">
            <span className="action-icon">📚</span>
            <h3>Minhas Coleções</h3>
            <p>Gerencie suas coleções de mangás</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
