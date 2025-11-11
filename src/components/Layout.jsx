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

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            📚 Minha Coleção de Mangás
          </Link>
          <nav className="nav">
            {currentUser ? (
              <>
                <Link to="/">Início</Link>
                <Link to="/collections">Coleções</Link>
                <Link to="/search">Buscar Mangás</Link>
                <span className="user-email">{currentUser.email}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Entrar</Link>
                <Link to="/signup">Cadastrar</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

