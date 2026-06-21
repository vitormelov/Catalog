import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getMangaById,
  updateMangaInCollection,
} from '../services/firestoreService';
import { getConditionLabel, normalizeVolume } from '../utils/volumeHelpers';
import { sortVolumesByNumber, formatPublicRating } from '../utils/mangaStats';
import { formatLocalDate, formatLocalDateTime } from '../utils/dateHelpers';
import VolumeMarkModal from '../components/VolumeMarkModal';
import './MangaDetail.css';

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState('');
  const [totalVolumesInput, setTotalVolumesInput] = useState('');
  const [editingTotalVolumes, setEditingTotalVolumes] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [volumeModal, setVolumeModal] = useState({ open: false, volumeNumber: null });

  useEffect(() => {
    if (currentUser && id) {
      loadManga();
    }
  }, [currentUser, id]);

  const loadManga = async () => {
    try {
      const data = await getMangaById(id, currentUser.uid);
      if (!data) {
        navigate('/my-mangas');
        return;
      }
      setManga(data);
      setRating(
        data.rating !== null && data.rating !== undefined && data.rating > 0
          ? String(data.rating)
          : ''
      );
      setTotalVolumesInput(data.totalVolumes ? String(data.totalVolumes) : '');
      setEditingTotalVolumes(!data.totalVolumes);
    } catch (error) {
      console.error('Erro ao carregar mangá:', error);
      navigate('/my-mangas');
    } finally {
      setLoading(false);
    }
  };

  const ownedVolumes = manga?.volumes || [];
  const sortedOwnedVolumes = useMemo(
    () => sortVolumesByNumber(ownedVolumes),
    [ownedVolumes]
  );
  const totalVolumes = manga?.totalVolumes || null;
  const ownedMap = new Map(
    sortedOwnedVolumes.map((v) => [Number(v.volumeNumber), normalizeVolume(v)])
  );
  const totalSpent = sortedOwnedVolumes.reduce((sum, v) => sum + (v.price || 0), 0);

  const handleSaveRating = async () => {
    if (!rating) {
      await updateMangaInCollection(manga.id, currentUser.uid, { rating: 0 });
      setManga((prev) => ({ ...prev, rating: 0 }));
      return;
    }

    const numericRating = parseFloat(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      alert('Informe uma nota entre 1 e 10.');
      return;
    }

    setSavingRating(true);
    try {
      const rounded = Math.round(numericRating * 2) / 2;
      await updateMangaInCollection(manga.id, currentUser.uid, { rating: rounded });
      setManga((prev) => ({ ...prev, rating: rounded }));
      setRating(String(rounded));
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Erro ao salvar nota.');
    } finally {
      setSavingRating(false);
    }
  };

  const handleSaveTotalVolumes = async () => {
    const parsed = parseInt(totalVolumesInput, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      alert('Informe um número válido de volumes (mínimo 1).');
      return;
    }

    try {
      await updateMangaInCollection(manga.id, currentUser.uid, { totalVolumes: parsed });
      setManga((prev) => ({ ...prev, totalVolumes: parsed }));
      setEditingTotalVolumes(false);
    } catch (error) {
      console.error('Erro ao salvar total de volumes:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const handleVolumeClick = (volumeNumber) => {
    setVolumeModal({ open: true, volumeNumber });
  };

  const handleSaveVolume = async (volumeData) => {
    const sanitized = {
      ...normalizeVolume(volumeData),
      lastUpdated: new Date().toISOString(),
    };
    const filtered = ownedVolumes.filter(
      (v) => Number(v.volumeNumber) !== sanitized.volumeNumber
    );
    const updated = sortVolumesByNumber([...filtered, sanitized]);

    try {
      await updateMangaInCollection(manga.id, currentUser.uid, { volumes: updated });
      setManga((prev) => ({ ...prev, volumes: updated }));
      setVolumeModal({ open: false, volumeNumber: null });
    } catch (error) {
      console.error('Erro ao salvar volume:', error);
      alert('Erro ao salvar volume.');
    }
  };

  const handleRemoveVolume = async (volumeNumber) => {
    const updated = ownedVolumes.filter(
      (v) => Number(v.volumeNumber) !== volumeNumber
    );
    try {
      await updateMangaInCollection(manga.id, currentUser.uid, { volumes: updated });
      setManga((prev) => ({ ...prev, volumes: updated }));
      setVolumeModal({ open: false, volumeNumber: null });
    } catch (error) {
      console.error('Erro ao remover volume:', error);
      alert('Erro ao remover volume.');
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!manga) return null;

  const existingVolume = volumeModal.volumeNumber
    ? ownedMap.get(volumeModal.volumeNumber)
    : null;

  return (
    <div className="manga-detail-container">
      <Link to="/my-mangas" className="back-link">
        ← Voltar para Meus Mangás
      </Link>

      <div className="manga-detail-header">
        <img
          src={manga.imageUrl || '/placeholder-manga.jpg'}
          alt={manga.title}
          className="manga-detail-cover"
        />
        <div className="manga-detail-info">
          <h1>{manga.title}</h1>
          {manga.titleEnglish && manga.titleEnglish !== manga.title && (
            <p className="manga-detail-subtitle">{manga.titleEnglish}</p>
          )}

          <div className="ratings-comparison">
            <div className="rating-card public-rating">
              <span className="rating-label">Nota do público</span>
              <span className="rating-value">
                {manga.score != null ? formatPublicRating(manga.score) : '—'}
              </span>
            </div>
            <div className="rating-card personal-rating">
              <span className="rating-label">Minha nota</span>
              <div className="rating-input-group">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="1–10"
                  className="rating-input"
                />
                <span className="rating-scale">/10</span>
                <button
                  type="button"
                  onClick={handleSaveRating}
                  disabled={savingRating}
                  className="btn-save-rating"
                >
                  {savingRating ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>

          {sortedOwnedVolumes.length > 0 && (
            <div className="manga-detail-stats">
              <span>{sortedOwnedVolumes.length} volume{sortedOwnedVolumes.length !== 1 ? 's' : ''} adquirido{sortedOwnedVolumes.length !== 1 ? 's' : ''}</span>
              {totalSpent > 0 && (
                <span>Total investido: <strong>R$ {totalSpent.toFixed(2)}</strong></span>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="volumes-section">
        <div className="volumes-section-header">
          <h2>Meus Volumes</h2>
          {totalVolumes && !editingTotalVolumes ? (
            <div className="total-volumes-display">
              <span>{sortedOwnedVolumes.length} / {totalVolumes} volumes</span>
              <button
                type="button"
                className="btn-edit-total"
                onClick={() => setEditingTotalVolumes(true)}
              >
                Editar total
              </button>
            </div>
          ) : (
            <div className="total-volumes-edit">
              <label>Total de volumes:</label>
              <input
                type="number"
                min="1"
                value={totalVolumesInput}
                onChange={(e) => setTotalVolumesInput(e.target.value)}
                placeholder="Ex: 16"
              />
              <button type="button" onClick={handleSaveTotalVolumes} className="btn-save-total">
                {totalVolumes ? 'Salvar' : 'Definir'}
              </button>
              {totalVolumes && (
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={() => {
                    setEditingTotalVolumes(false);
                    setTotalVolumesInput(String(totalVolumes));
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>

        {!totalVolumes ? (
          <p className="volumes-hint">
            Defina o total de volumes acima para marcar quais você possui.
          </p>
        ) : (
          <>
            <div className="volume-grid">
              {Array.from({ length: totalVolumes }, (_, i) => i + 1).map((num) => {
                const owned = ownedMap.get(num);
                return (
                  <button
                    key={num}
                    type="button"
                    className={`volume-cell ${owned ? 'owned' : ''}`}
                    onClick={() => handleVolumeClick(num)}
                    title={
                      owned
                        ? `Vol. ${num} — ${getConditionLabel(owned.condition)} — R$ ${(owned.price || 0).toFixed(2)}`
                        : `Marcar volume ${num}`
                    }
                  >
                    <span className="volume-cell-number">{num}</span>
                    {owned && <span className="volume-cell-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {sortedOwnedVolumes.length > 0 && (
              <div className="owned-volumes-list">
                <h3>Detalhes dos volumes adquiridos</h3>
                <div className="owned-volume-row owned-volume-header">
                  <span>Volume</span>
                  <span>Situação</span>
                  <span>Preço</span>
                  <span>Aquisição</span>
                  <span>Atualizado</span>
                  <span />
                </div>
                {sortedOwnedVolumes.map((vol) => {
                    const normalized = normalizeVolume(vol);
                    return (
                      <div key={vol.volumeNumber} className="owned-volume-row">
                        <span className="owned-vol-num">
                          Vol. {normalized.volumeNumber}
                          {normalized.raro && (
                            <span className="owned-vol-rare-star" title="Volume raro" aria-label="Volume raro">
                              ★
                            </span>
                          )}
                        </span>
                        <span className="owned-vol-condition">
                          {getConditionLabel(normalized.condition)}
                        </span>
                        <span className="owned-vol-price">
                          R$ {(normalized.price || 0).toFixed(2)}
                        </span>
                        <span className="owned-vol-date">
                          {formatLocalDate(normalized.purchaseDate, '—')}
                        </span>
                        <span className="owned-vol-updated">
                          {formatLocalDateTime(normalized.lastUpdated, '—')}
                        </span>
                        <button
                          type="button"
                          className="btn-edit-vol"
                          onClick={() => handleVolumeClick(normalized.volumeNumber)}
                        >
                          Editar
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </section>

      {volumeModal.open && volumeModal.volumeNumber && (
        <VolumeMarkModal
          manga={manga}
          volumeNumber={volumeModal.volumeNumber}
          existingVolume={existingVolume}
          onClose={() => setVolumeModal({ open: false, volumeNumber: null })}
          onSave={handleSaveVolume}
          onRemove={existingVolume ? handleRemoveVolume : undefined}
        />
      )}
    </div>
  );
};

export default MangaDetail;
