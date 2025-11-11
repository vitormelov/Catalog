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
