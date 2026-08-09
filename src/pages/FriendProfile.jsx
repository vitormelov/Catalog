import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  areFriends,
  getUserAnimeCollection,
  getUserMangaCollection,
  getUserProfile,
} from '../services/firestoreService';
import MangaLibraryListItem from '../components/MangaLibraryListItem';
import AnimeLibraryListItem from '../components/AnimeLibraryListItem';
import {
  assignPersonalRanks,
  getRankLabel,
  getRankingDisplayValue,
  RANKING_PERSONAL,
} from '../utils/rankingHelpers';
import { sortMangas, SORT_ALPHA, getTotalMangaCollectionCost } from '../utils/mangaStats';
import { userShowsCostsToFriends } from '../utils/friendHelpers';
import { sortAnimes, SORT_ALPHA as ANIME_SORT_ALPHA } from '../utils/animeStats';
import '../pages/MyLibrary.css';
import '../pages/Ranking.css';
import './FriendProfile.css';
import './FriendMediaDetail.css';

const FriendRankingView = ({ items, mediaType }) => {
  const rankedItems = useMemo(
    () =>
      assignPersonalRanks(items, {
        tieBreakByFavoriteEpisodes: mediaType === 'anime',
      }),
    [items, mediaType]
  );

  if (rankedItems.length === 0) {
    return (
      <p className="friend-empty-tab">
        Nenhum {mediaType === 'manga' ? 'mangá' : 'anime'} com nota atribuída.
      </p>
    );
  }

  const podiumItems = rankedItems.slice(0, 3);
  const listItems = rankedItems.slice(3);
  const podiumOrder =
    podiumItems.length === 3
      ? [podiumItems[1], podiumItems[0], podiumItems[2]]
      : podiumItems.length === 2
        ? [null, podiumItems[0], podiumItems[1]]
        : podiumItems.length === 1
          ? [null, podiumItems[0], null]
          : [];
  const podiumSizes = ['second', 'first', 'third'];

  return (
    <div className="friend-ranking">
      {podiumItems.length > 0 && (
        <div className="podium">
          {podiumOrder.map((item, index) =>
            item ? (
              <div key={item.id} className={`podium-card podium-${podiumSizes[index]}`}>
                {podiumSizes[index] === 'first' && (
                  <div className="podium-first-badge" aria-hidden="true">
                    1
                  </div>
                )}
                <div className="podium-image-wrap">
                  <img src={item.imageUrl || '/placeholder-manga.jpg'} alt={item.title} />
                </div>
                <h3 className="podium-title">{item.title}</h3>
                <span className="podium-rating">
                  {getRankingDisplayValue(item, RANKING_PERSONAL)}
                </span>
                <span className="podium-place">{getRankLabel(item.rank)}</span>
              </div>
            ) : (
              <div key={`empty-${index}`} className="podium-spacer" />
            )
          )}
        </div>
      )}

      {listItems.length > 0 && (
        <div className="ranking-list">
          <h2>Demais colocações</h2>
          {listItems.map((item) => (
            <div key={item.id} className="ranking-list-item">
              <span className="ranking-list-place">{getRankLabel(item.rank)}</span>
              <img
                src={item.imageUrl || '/placeholder-manga.jpg'}
                alt={item.title}
                className="ranking-list-image"
              />
              <div className="ranking-list-info">
                <span className="ranking-list-title">{item.title}</span>
              </div>
              <span className="ranking-list-rating">
                {getRankingDisplayValue(item, RANKING_PERSONAL)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FriendProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [mangas, setMangas] = useState([]);
  const [animes, setAnimes] = useState([]);
  const [activeTab, setActiveTab] = useState('mangas');
  const [rankingMediaType, setRankingMediaType] = useState('manga');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser || !userId) return;

      try {
        const isFriend = await areFriends(currentUser.uid, userId);
        if (!isFriend) {
          navigate('/friends');
          return;
        }

        setAuthorized(true);
        const [userProfile, mangaData, animeData] = await Promise.all([
          getUserProfile(userId),
          getUserMangaCollection(userId),
          getUserAnimeCollection(userId),
        ]);
        setProfile(userProfile);
        setMangas(sortMangas(mangaData, SORT_ALPHA));
        setAnimes(sortAnimes(animeData, ANIME_SORT_ALPHA));
      } catch (error) {
        console.error('Erro ao carregar perfil do amigo:', error);
        navigate('/friends');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, userId, navigate]);

  const totalMangaCost = useMemo(
    () => getTotalMangaCollectionCost(mangas),
    [mangas]
  );
  const showCosts = userShowsCostsToFriends(profile);

  if (loading) {
    return <div className="loading">Carregando coleção...</div>;
  }

  if (!authorized || !profile) return null;

  return (
    <div className="friend-profile-container">
      <Link to="/friends" className="friend-back-link">
        ← Voltar para Amigos
      </Link>

      <div className="friend-profile-header">
        <h1>{profile.name}</h1>
        <p className="friend-profile-subtitle">Coleção de {profile.name}</p>
      </div>

      <div className="friend-tabs">
        <button
          type="button"
          className={`friend-tab ${activeTab === 'mangas' ? 'active' : ''}`}
          onClick={() => setActiveTab('mangas')}
        >
          Mangás ({mangas.length})
        </button>
        <button
          type="button"
          className={`friend-tab ${activeTab === 'animes' ? 'active' : ''}`}
          onClick={() => setActiveTab('animes')}
        >
          Animes ({animes.length})
        </button>
        <button
          type="button"
          className={`friend-tab ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ranking');
            setRankingMediaType('manga');
          }}
        >
          Ranking
        </button>
      </div>

      {activeTab === 'mangas' &&
        (mangas.length === 0 ? (
          <p className="friend-empty-tab">Nenhum mangá na coleção.</p>
        ) : (
          <div
            className={`manga-library-list friend-library-list${showCosts ? '' : ' friend-library-list--no-cost'}`}
          >
            <div className="manga-library-header friend-library-header">
              <span></span>
              <span>Nome</span>
              <span>Volumes</span>
              <span>Situação</span>
              <span>Notas</span>
              {showCosts && <span>Custo</span>}
            </div>
            {mangas.map((manga) => (
              <MangaLibraryListItem
                key={manga.id}
                manga={manga}
                hideCost={!showCosts}
                onRowClick={() => navigate(`/friends/${userId}/mangas/${manga.id}`)}
              />
            ))}
            {showCosts && (
              <div className="manga-library-total-row">
                <span className="total-label">Custo total da coleção</span>
                <span className="total-cost">R$ {totalMangaCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}

      {activeTab === 'animes' &&
        (animes.length === 0 ? (
          <p className="friend-empty-tab">Nenhum anime na coleção.</p>
        ) : (
          <div className="anime-library-list friend-library-list">
            <div className="anime-library-header friend-library-header">
              <span></span>
              <span>Nome</span>
              <span>Episódios</span>
              <span>Notas</span>
              <span>Situação</span>
              <span>Início</span>
              <span>Término</span>
            </div>
            {animes.map((anime) => (
              <AnimeLibraryListItem
                key={anime.id}
                anime={anime}
                onRowClick={() => navigate(`/friends/${userId}/animes/${anime.id}`)}
              />
            ))}
          </div>
        ))}

      {activeTab === 'ranking' && (
        <div className="friend-ranking-panel">
          <div className="friend-ranking-toggle">
            <button
              type="button"
              className={`friend-ranking-type-btn ${rankingMediaType === 'manga' ? 'active' : ''}`}
              onClick={() => setRankingMediaType('manga')}
            >
              Mangás
            </button>
            <button
              type="button"
              className={`friend-ranking-type-btn ${rankingMediaType === 'anime' ? 'active' : ''}`}
              onClick={() => setRankingMediaType('anime')}
            >
              Animes
            </button>
          </div>
          <FriendRankingView
            items={rankingMediaType === 'manga' ? mangas : animes}
            mediaType={rankingMediaType}
          />
        </div>
      )}
    </div>
  );
};

export default FriendProfile;
