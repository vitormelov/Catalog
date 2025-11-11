// Página de busca de mangás
import { useState } from 'react';
import { searchManga } from '../services/mangaApi';
import { useAuth } from '../contexts/AuthContext';
import { addMangaToCollection } from '../services/firestoreService';
import MangaCard from '../components/MangaCard';
import AddMangaModal from '../components/AddMangaModal';
import './SearchManga.css';

const SearchManga = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedManga, setSelectedManga] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const results = await searchManga(searchQuery);
      setMangas(results);
    } catch (error) {
      setError('Erro ao buscar mangás. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManga = (manga) => {
    setSelectedManga(manga);
    setShowModal(true);
  };

  const handleSaveManga = async (mangaData) => {
    try {
      if (!mangaData.collectionId) {
        alert('Selecione uma coleção para adicionar o mangá');
        return;
      }
      await addMangaToCollection(currentUser.uid, mangaData.collectionId, {
        mangaId: selectedManga.mal_id,
        title: selectedManga.title,
        titleEnglish: selectedManga.title_english || selectedManga.title,
        imageUrl: selectedManga.images?.jpg?.image_url || selectedManga.images?.webp?.image_url,
        synopsis: selectedManga.synopsis,
        chapters: selectedManga.chapters,
        totalVolumes: selectedManga.volumes, // Total de volumes do mangá (da API)
        score: selectedManga.score,
        status: selectedManga.status,
        published: selectedManga.published,
        rating: 0,
        notes: '',
        volumes: [] // Volumes que o usuário possui (vazio inicialmente)
      });
      setShowModal(false);
      setSelectedManga(null);
      alert('Mangá adicionado à coleção! Agora você pode editar para adicionar nota e volumes.');
    } catch (error) {
      console.error('Erro ao adicionar mangá:', error);
      alert('Erro ao adicionar mangá. Tente novamente.');
    }
  };

  return (
    <div className="search-container">
      <h1>Buscar Mangás</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Digite o nome do mangá..."
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-btn">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {mangas.length > 0 && (
        <div className="mangas-grid">
          {mangas.map((manga) => (
            <MangaCard
              key={manga.mal_id}
              manga={manga}
              onAdd={() => handleAddManga(manga)}
            />
          ))}
        </div>
      )}

      {showModal && selectedManga && (
        <AddMangaModal
          manga={selectedManga}
          onClose={() => {
            setShowModal(false);
            setSelectedManga(null);
          }}
          onSave={handleSaveManga}
        />
      )}
    </div>
  );
};

export default SearchManga;
