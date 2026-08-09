import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SearchManga from './pages/SearchManga';
import Collections from './pages/Collections';
import CollectionDetails from './pages/CollectionDetails';
import MyMangas from './pages/MyMangas';
import MyAnimes from './pages/MyAnimes';
import MangaDetail from './pages/MangaDetail';
import AnimeDetail from './pages/AnimeDetail';
import Ranking from './pages/Ranking';
import Estante3D from './pages/Estante3D';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchManga />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-mangas"
              element={
                <ProtectedRoute>
                  <MyMangas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-mangas/:id"
              element={
                <ProtectedRoute>
                  <MangaDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-animes"
              element={
                <ProtectedRoute>
                  <MyAnimes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-animes/:id"
              element={
                <ProtectedRoute>
                  <AnimeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <Ranking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estante-3d"
              element={
                <ProtectedRoute>
                  <Estante3D />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <Collections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collection/:id"
              element={
                <ProtectedRoute>
                  <CollectionDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
