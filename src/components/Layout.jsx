// Layout principal da aplicação
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoMark from './LogoMark';
import UserMenu from './UserMenu';
import './Layout.css';

const Layout = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isLandingPage = !currentUser;
  const isFullBleed = location.pathname === '/estante-3d';

  return (
    <div className={`layout ${isLandingPage ? 'no-header-layout' : ''}`}>
      {currentUser && (
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              <LogoMark className="logo-mark" />
              <span className="logo-text">Trackeando</span>
            </Link>
            <nav className="nav">
              <Link to="/">Home</Link>
              <Link to="/my-mangas">Meus Mangás</Link>
              <Link to="/my-animes">Meus Animes</Link>
              <Link to="/ranking">Ranking</Link>
              <Link to="/estante-3d">Binder</Link>
              <UserMenu />
            </nav>
          </div>
        </header>
      )}
      <main
        className={[
          'main-content',
          isLandingPage ? 'no-header' : '',
          isFullBleed ? 'main-content--full-bleed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
