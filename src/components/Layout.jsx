// Layout principal da aplicação
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isLandingPage = !currentUser;

  return (
    <div className={`layout ${isLandingPage ? 'no-header-layout' : ''}`}>
      {currentUser && (
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              Catalog
            </Link>
            <nav className="nav">
              <Link to="/">Início</Link>
              <Link to="/collections">Coleções</Link>
              <Link to="/search">Buscar Mangás</Link>
              <span className="user-email">{currentUser.email}</span>
              <button onClick={handleLogout} className="logout-btn">
                Sair
              </button>
            </nav>
          </div>
        </header>
      )}
      <main className={`main-content ${isLandingPage ? 'no-header' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;

