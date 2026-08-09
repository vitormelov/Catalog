import MangaCard3D from './MangaCard3D';

const MangaExamine = ({ book, row, slot, onClose, onRemove }) => {
  if (!book) return null;

  const genres = book.genres?.length ? book.genres.join(' · ') : null;
  const synopsis = book.synopsis?.trim() || null;

  return (
    <div className="manga-examine" role="dialog" aria-modal="true" aria-label="Examinar card">
      <div className="manga-examine-scrim" onClick={onClose} />

      <div className="manga-examine-frame">
        <header className="manga-examine-topbar">
          <span className="manga-examine-label">CARD INSPECT</span>
          <button type="button" className="manga-examine-close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="manga-examine-body">
          <div className="manga-examine-stage">
            <MangaCard3D coverUrl={book.coverUrl} title={book.title} raro={book.raro} />
          </div>

          <aside className="manga-examine-info">
            <p className="manga-examine-file-id">
              Página · Linha {row + 1} · Bolso {slot + 1}
            </p>
            <h2>{book.title}</h2>
            {book.titleEnglish && book.titleEnglish !== book.title && (
              <p className="manga-examine-aka">{book.titleEnglish}</p>
            )}

            <dl className="manga-examine-stats">
              <div>
                <dt>Volume</dt>
                <dd>{book.volume || 1}</dd>
              </div>
              {book.raro && (
                <div>
                  <dt>Raridade</dt>
                  <dd>Raro ★</dd>
                </div>
              )}
              {book.status && (
                <div>
                  <dt>Status</dt>
                  <dd>{book.status}</dd>
                </div>
              )}
              {genres && (
                <div className="manga-examine-span">
                  <dt>Gêneros</dt>
                  <dd>{genres}</dd>
                </div>
              )}
            </dl>

            <div className="manga-examine-desc">
              <h3>Descrição</h3>
              <p>{synopsis || 'Card adicionado ao seu binder.'}</p>
            </div>

            <div className="manga-examine-actions">
              {book.mangadexUrl && (
                <a
                  className="manga-examine-link"
                  href={book.mangadexUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir no MangaDex
                </a>
              )}
              {book.malId && (
                <a
                  className="manga-examine-link"
                  href={`https://myanimelist.net/manga/${book.malId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir no MyAnimeList
                </a>
              )}
              <button type="button" className="manga-examine-remove" onClick={onRemove}>
                Remover do binder
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MangaExamine;
