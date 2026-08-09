import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMangaDexVolumeCovers, searchMangaDex } from '../services/mangadexApi';
import { getMangaDetails } from '../services/mangaApi';
import { getUserMangaCollection, updateMangaInCollection } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_BINDER_CONFIG,
  countCardsInBinder,
  createEmptyBinder,
  createShelfBookFromMangaDex,
  placeBookOnShelf,
  removeBookFromShelf,
  resizeBinderPages,
} from '../utils/shelf3dHelpers';
import { normalizeVolume } from '../utils/volumeHelpers';
import BinderView from '../components/estante3d/BinderView';
import MangaExamine from '../components/estante3d/MangaExamine';
import '../components/estante3d/MangaExamine.css';
import './Estante3D.css';

const Estante3D = () => {
  const { currentUser } = useAuth();
  const [binderConfig, setBinderConfig] = useState(DEFAULT_BINDER_CONFIG);
  const [pages, setPages] = useState(() => createEmptyBinder(DEFAULT_BINDER_CONFIG));
  const [activePage, setActivePage] = useState(0);
  const [examining, setExamining] = useState(null);
  const jikanCacheRef = useRef({});

  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [pendingVolume, setPendingVolume] = useState(null);
  const [pendingManga, setPendingManga] = useState(null);
  const [mdCandidates, setMdCandidates] = useState([]);
  const [coverOptions, setCoverOptions] = useState([]);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLibrary([]);
      setLibraryLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLibraryLoading(true);
    getUserMangaCollection(currentUser.uid)
      .then((data) => {
        if (!cancelled) setLibrary(data || []);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setLibrary([]);
          setError('Não foi possível carregar seus mangás.');
        }
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  const filteredLibrary = useMemo(() => {
    const q = libraryFilter.trim().toLowerCase();
    const withVolumes = (library || []).filter((m) => (m.volumes || []).length > 0);
    if (!q) return withVolumes;
    return withVolumes.filter((m) => {
      const title = String(m.title || '').toLowerCase();
      const en = String(m.titleEnglish || '').toLowerCase();
      return title.includes(q) || en.includes(q);
    });
  }, [library, libraryFilter]);

  const ownedVolumes = useMemo(() => {
    if (!selectedLibrary) return [];
    const map = new Map();
    (selectedLibrary.volumes || []).forEach((raw) => {
      const vol = normalizeVolume(raw);
      if (vol?.volumeNumber == null) return;
      map.set(Number(vol.volumeNumber), vol);
    });
    return [...map.values()].sort((a, b) => Number(a.volumeNumber) - Number(b.volumeNumber));
  }, [selectedLibrary]);

  const handleExamine = useCallback(
    (book, row, slot) => {
      setExamining({ book, row, slot, page: activePage });
    },
    [activePage]
  );

  const updateActivePage = useCallback(
    (nextLayout) => {
      setPages((prev) => prev.map((page, i) => (i === activePage ? nextLayout : page)));
    },
    [activePage]
  );

  const closeExamine = useCallback(() => {
    setExamining(null);
  }, []);

  useEffect(() => {
    if (!examining) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeExamine();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [examining, closeExamine]);

  const clearFlow = () => {
    setCoverOptions([]);
    setPendingManga(null);
    setPendingVolume(null);
    setMdCandidates([]);
  };

  const fetchJikanStats = async (malId) => {
    if (!malId) return null;
    const key = String(malId);
    const cached = jikanCacheRef.current[key];
    if (cached && (cached.rank != null || cached.popularity != null || cached.members != null)) {
      return cached;
    }
    try {
      const details = await getMangaDetails(malId);
      const stats = {
        title: details?.title || null,
        titleEnglish: details?.title_english || null,
        score: details?.score ?? null,
        rank: details?.rank ?? null,
        popularity: details?.popularity ?? null,
        members: details?.members ?? null,
        synopsis: details?.synopsis || null,
        status: details?.status || null,
        genres: (details?.genres || []).map((g) => g.name).filter(Boolean),
      };
      if (stats.rank != null || stats.popularity != null || stats.members != null || stats.score != null) {
        jikanCacheRef.current[key] = stats;
      }
      return stats;
    } catch (err) {
      console.error('Erro ao buscar stats Jikan:', err);
      return null;
    }
  };

  const placeBook = async (mdManga, cover, volumeNumber, libraryManga) => {
    const malId = libraryManga?.mangaId || mdManga.malId || null;
    const enrichedLibrary = libraryManga ? await enrichLibraryMangaStats(libraryManga) : null;
    const jikan = await fetchJikanStats(malId);
    const source = enrichedLibrary || libraryManga;
    const ownedVolume = (source?.volumes || []).find(
      (vol) => Number(vol.volumeNumber) === Number(volumeNumber)
    );
    const raro = Boolean(ownedVolume?.raro);

    const score = jikan?.score ?? source?.score ?? null;
    const rank = jikan?.rank ?? source?.rank ?? null;
    const popularity = jikan?.popularity ?? source?.popularity ?? null;
    const members = jikan?.members ?? source?.members ?? null;

    const book = createShelfBookFromMangaDex(
      {
        ...mdManga,
        title: jikan?.title || source?.title || mdManga.title,
        titleEnglish:
          jikan?.titleEnglish || source?.titleEnglish || mdManga.titleEnglish,
        malId,
        synopsis: jikan?.synopsis || source?.synopsis || mdManga.synopsis,
        status: jikan?.status || source?.status || mdManga.status,
        genres: jikan?.genres?.length ? jikan.genres : mdManga.genres,
        score,
        rank,
        popularity,
        members,
        raro,
      },
      {
        coverUrl: cover?.coverUrl || mdManga.coverUrl || source?.imageUrl,
        volume: volumeNumber,
        score,
        rank,
        popularity,
        members,
        raro,
      }
    );
    const current = pages[activePage];
    const next = placeBookOnShelf(current, book, examining?.row ?? 0);
    if (!next) {
      setError('Esta página do binder está cheia. Troque de página ou remova um card.');
      return;
    }
    updateActivePage(next);
    setError('');
    setInfo(
      `“${jikan?.title || source?.title || mdManga.title}” vol. ${volumeNumber} adicionado à página ${activePage + 1}.`
    );
    clearFlow();
  };

  const fetchCoversFor = async (mdManga, volumeNumber, libraryManga) => {
    setLoadingCovers(true);
    setError('');
    setInfo('');
    setPendingManga(mdManga);
    setPendingVolume(volumeNumber);
    try {
      const covers = await getMangaDexVolumeCovers(mdManga.id, String(volumeNumber));
      if (covers.length === 0) {
        setCoverOptions([]);
        // Fallback: usa capa da biblioteca se existir
        if (libraryManga?.imageUrl) {
          await placeBook(
            mdManga,
            { coverUrl: libraryManga.imageUrl, volume: volumeNumber },
            volumeNumber,
            libraryManga
          );
          setInfo(
            `Sem capa específica do vol. ${volumeNumber} no MangaDex — usamos a capa da sua biblioteca.`
          );
          return;
        }
        setError(
          `Não achamos cover art do volume ${volumeNumber} para “${mdManga.title}” no MangaDex.`
        );
        return;
      }

      if (covers.length === 1) {
        await placeBook(mdManga, covers[0], volumeNumber, libraryManga);
        return;
      }

      setCoverOptions(covers);
      setInfo(`Achamos ${covers.length} capas do vol. ${volumeNumber}. Escolha a art cover.`);
    } catch (err) {
      console.error(err);
      setCoverOptions([]);
      setError('Erro ao buscar as capas do volume no MangaDex.');
    } finally {
      setLoadingCovers(false);
    }
  };

  const resolveMangaDexEntry = async (libraryManga) => {
    const query = libraryManga.titleEnglish || libraryManga.title;
    const results = await searchMangaDex(query);
    if (!results.length && libraryManga.title && libraryManga.title !== query) {
      return searchMangaDex(libraryManga.title);
    }
    return results;
  };

  const enrichLibraryMangaStats = async (manga) => {
    if (!manga?.mangaId) return manga;
    const needsStats =
      manga.rank == null || manga.popularity == null || manga.members == null || manga.score == null;
    if (!needsStats) return manga;

    const jikan = await fetchJikanStats(manga.mangaId);
    if (!jikan) return manga;

    const patch = {
      score: jikan.score ?? manga.score ?? null,
      rank: jikan.rank ?? manga.rank ?? null,
      popularity: jikan.popularity ?? manga.popularity ?? null,
      members: jikan.members ?? manga.members ?? null,
    };
    const enriched = { ...manga, ...patch };

    setLibrary((prev) => prev.map((item) => (item.id === manga.id ? { ...item, ...patch } : item)));
    setSelectedLibrary((prev) => (prev?.id === manga.id ? { ...prev, ...patch } : prev));

    if (currentUser?.uid && manga.id) {
      try {
        await updateMangaInCollection(manga.id, currentUser.uid, patch);
      } catch (err) {
        console.error('Erro ao salvar stats Jikan na biblioteca:', err);
      }
    }

    return enriched;
  };

  const handleSelectLibraryManga = (manga) => {
    setSelectedLibrary(manga);
    clearFlow();
    setError('');
    setInfo(
      (manga.volumes || []).length
        ? `Selecione um volume de “${manga.title}” para criar o card.`
        : `“${manga.title}” não tem volumes marcados em Meus Mangás.`
    );
    // Busca ranked/popularity/members no Jikan e grava na biblioteca (mangás antigos só tinham score).
    void enrichLibraryMangaStats(manga);
  };

  const handleSelectOwnedVolume = async (volumeNumber) => {
    if (!selectedLibrary) return;
    setError('');
    setInfo('');
    setCoverOptions([]);
    setMdCandidates([]);
    setPendingVolume(volumeNumber);
    setLoadingCovers(true);

    try {
      const results = await resolveMangaDexEntry(selectedLibrary);
      if (!results.length) {
        if (selectedLibrary.imageUrl) {
          const fallbackMd = {
            id: `lib-${selectedLibrary.id}`,
            title: selectedLibrary.title,
            titleEnglish: selectedLibrary.titleEnglish || '',
            coverUrl: selectedLibrary.imageUrl,
            malId: selectedLibrary.mangaId || null,
            synopsis: selectedLibrary.synopsis || '',
            status: selectedLibrary.status || '',
            genres: [],
            mangadexUrl: null,
          };
          await placeBook(
            fallbackMd,
            { coverUrl: selectedLibrary.imageUrl, volume: volumeNumber },
            volumeNumber,
            selectedLibrary
          );
          setInfo(`Card criado com a capa da sua biblioteca (vol. ${volumeNumber}).`);
        } else {
          setError(`Não encontramos “${selectedLibrary.title}” no MangaDex.`);
        }
        return;
      }

      const malMatch = results.find(
        (r) => selectedLibrary.mangaId && Number(r.malId) === Number(selectedLibrary.mangaId)
      );
      const chosen = malMatch || (results.length === 1 ? results[0] : null);

      if (chosen) {
        await fetchCoversFor(chosen, volumeNumber, selectedLibrary);
        return;
      }

      setMdCandidates(results);
      setPendingManga(null);
      setInfo(
        `Vários títulos no MangaDex para “${selectedLibrary.title}”. Escolha o correto para o vol. ${volumeNumber}.`
      );
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar o mangá no MangaDex.');
    } finally {
      setLoadingCovers(false);
    }
  };

  const handleSelectMdCandidate = async (mdManga) => {
    if (pendingVolume == null) return;
    setMdCandidates([]);
    await fetchCoversFor(mdManga, pendingVolume, selectedLibrary);
  };

  const handleSelectCover = async (cover) => {
    if (!pendingManga || pendingVolume == null) return;
    setLoadingCovers(true);
    try {
      await placeBook(pendingManga, cover, pendingVolume, selectedLibrary);
    } finally {
      setLoadingCovers(false);
    }
  };

  const removeExamining = () => {
    if (!examining?.book) return;
    const pageIndex = examining.page ?? activePage;
    setPages((prev) =>
      prev.map((page, i) =>
        i === pageIndex ? removeBookFromShelf(page, examining.book.id) : page
      )
    );
    setExamining(null);
  };

  const handlePageLayoutChange = useCallback((pageIndex, nextLayout) => {
    setPages((prev) => prev.map((page, i) => (i === pageIndex ? nextLayout : page)));
  }, []);

  const handleColsChange = useCallback((nextCols) => {
    setBinderConfig((prev) => {
      if (prev.cols === nextCols && prev.rows === 2) return prev;
      return { ...prev, rows: 2, cols: nextCols };
    });
    setPages((prev) => {
      const currentRows = prev.length;
      const currentCols = prev[0]?.length ?? 0;
      if (currentCols === nextCols && currentRows === 2) return prev;
      return resizeBinderPages(prev, 2, nextCols);
    });
  }, []);

  const cardCount = countCardsInBinder(pages);

  return (
    <div className={`estante3d-page ${panelOpen ? '' : 'panel-collapsed'}`.trim()}>
      <aside className="estante3d-panel">
        <div className="estante3d-panel-header">
          <div className="estante3d-panel-title-row">
            <h1>Binder</h1>
            <button
              type="button"
              className="estante3d-panel-toggle"
              onClick={() => setPanelOpen(false)}
              aria-label="Recolher painel"
            >
              ←
            </button>
          </div>
          <p>
            Escolha um mangá de <strong>Meus Mangás</strong> e um volume que você já tem. Buscamos a
            capa no MangaDex e criamos o card.
          </p>
          <p className="estante3d-card-count">{cardCount} card{cardCount === 1 ? '' : 's'} no binder</p>
        </div>

        <div className="estante3d-search">
          <label htmlFor="binder-library-filter">Filtrar minha biblioteca</label>
          <input
            id="binder-library-filter"
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
            placeholder="Ex: Berserk, One Piece..."
            disabled={libraryLoading}
          />
        </div>

        {info && <p className="estante3d-status">{info}</p>}
        {error && <p className="estante3d-error">{error}</p>}
        {loadingCovers && <p className="estante3d-status">Buscando cover art no MangaDex...</p>}
        {libraryLoading && <p className="estante3d-status">Carregando Meus Mangás...</p>}

        {!libraryLoading && filteredLibrary.length === 0 && (
          <p className="estante3d-error">
            Nenhum mangá com volumes em Meus Mangás
            {libraryFilter.trim() ? ' para esse filtro' : ''}. Marque volumes em Meus Mangás para
            criar cards.
          </p>
        )}

        {filteredLibrary.length > 0 && (
          <div className="estante3d-results">
            <h2>1. Seu mangá</h2>
            <ul>
              {filteredLibrary.map((manga) => {
                const owned = (manga.volumes || []).length;
                const active = selectedLibrary?.id === manga.id;
                return (
                  <li key={manga.id}>
                    <button
                      type="button"
                      className={active ? 'is-selected' : ''}
                      onClick={() => handleSelectLibraryManga(manga)}
                      disabled={loadingCovers}
                    >
                      {manga.imageUrl && <img src={manga.imageUrl} alt="" loading="lazy" />}
                      <span>
                        <strong>{manga.title}</strong>
                        {manga.titleEnglish && manga.titleEnglish !== manga.title && (
                          <small>{manga.titleEnglish}</small>
                        )}
                        <small className="estante3d-vol-hint">
                          {owned} volume{owned === 1 ? '' : 's'} na coleção
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {selectedLibrary && ownedVolumes.length > 0 && (
          <div className="estante3d-results">
            <h2>2. Volume de “{selectedLibrary.title}”</h2>
            <div className="estante3d-volume-grid">
              {ownedVolumes.map((vol) => (
                <button
                  key={vol.volumeNumber}
                  type="button"
                  className={[
                    pendingVolume != null && Number(pendingVolume) === Number(vol.volumeNumber)
                      ? 'is-selected'
                      : '',
                    vol.raro ? 'is-rare' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelectOwnedVolume(vol.volumeNumber)}
                  disabled={loadingCovers}
                  title={vol.raro ? 'Volume raro' : undefined}
                >
                  Vol. {vol.volumeNumber}
                  {vol.raro ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {mdCandidates.length > 0 && pendingVolume != null && (
          <div className="estante3d-results">
            <h2>3. Confirme o título no MangaDex</h2>
            <ul>
              {mdCandidates.map((manga) => (
                <li key={manga.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectMdCandidate(manga)}
                    disabled={loadingCovers}
                  >
                    {manga.coverUrl && <img src={manga.coverUrl} alt="" loading="lazy" />}
                    <span>
                      <strong>{manga.title}</strong>
                      {manga.titleEnglish && manga.titleEnglish !== manga.title && (
                        <small>{manga.titleEnglish}</small>
                      )}
                      <small className="estante3d-vol-hint">
                        Buscar capa do vol. {pendingVolume}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {coverOptions.length > 0 && pendingManga && pendingVolume != null && (
          <div className="estante3d-results estante3d-covers">
            <h2>Escolha a cover art (vol. {pendingVolume})</h2>
            <ul className="estante3d-cover-grid">
              {coverOptions.map((cover) => (
                <li key={cover.id}>
                  <button type="button" onClick={() => handleSelectCover(cover)}>
                    {cover.coverUrl && <img src={cover.coverUrl} alt="" loading="lazy" />}
                    <span>
                      <strong>Vol. {cover.volume || pendingVolume}</strong>
                      <small>{cover.locale ? `Locale: ${cover.locale}` : 'Sem locale'}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="estante3d-credit">
          Volumes de Meus Mangás · capas via{' '}
          <a href="https://mangadex.org" target="_blank" rel="noreferrer">
            MangaDex
          </a>
          .
        </p>
      </aside>

      {!panelOpen && (
        <button
          type="button"
          className="estante3d-open-panel"
          onClick={() => setPanelOpen(true)}
          aria-label="Abrir painel"
        >
          + Adicionar
        </button>
      )}

      <div className="estante3d-viewport">
        <BinderView
          pages={pages}
          activePage={activePage}
          onActivePageChange={setActivePage}
          config={binderConfig}
          examiningId={examining?.book?.id ?? null}
          onExamine={handleExamine}
          onPageLayoutChange={handlePageLayoutChange}
          onColsChange={handleColsChange}
        />
        <div className="estante3d-viewport-hint">
          Clique = examinar card · Arraste = trocar de bolso · ◀ ▶ viram a página
        </div>
      </div>

      {examining && (
        <MangaExamine
          book={examining.book}
          row={examining.row}
          slot={examining.slot}
          onClose={closeExamine}
          onRemove={removeExamining}
        />
      )}
    </div>
  );
};

export default Estante3D;
