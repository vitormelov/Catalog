import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_BINDER_CONFIG,
  estimateBinderCols,
  moveBookOnShelf,
  normalizeBinderConfig,
} from '../../utils/shelf3dHelpers';
import './BinderView.css';

const DRAG_MIME = 'application/x-binder-card';

const MangaCard = ({
  book,
  row,
  slot,
  examiningId,
  onExamine,
  onDragStart,
  onDragEnd,
}) => {
  const moved = useRef(false);
  const isRare = Boolean(book.raro);

  return (
    <button
      type="button"
      className={[
        'manga-card',
        isRare ? 'is-rare' : '',
        examiningId === book.id ? 'is-examining' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable
      title={`${book.title} · Vol. ${book.volume || 1}${isRare ? ' · Raro' : ''}`}
      aria-label={`${book.title}, volume ${book.volume || 1}${isRare ? ', raro' : ''}`}
      onDragStart={(e) => {
        moved.current = false;
        const payload = JSON.stringify({ row, slot, id: book.id });
        e.dataTransfer.setData(DRAG_MIME, payload);
        e.dataTransfer.setData('text/plain', payload);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('is-dragging');
        onDragStart?.(row, slot);
      }}
      onDrag={() => {
        moved.current = true;
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('is-dragging');
        onDragEnd?.();
      }}
      onClick={() => {
        if (moved.current) return;
        onExamine(book, row, slot);
      }}
    >
      <span className="manga-card-frame">
        <span className="manga-card-art">
          {book.coverUrl ? (
            <img
              className="manga-card-cover"
              src={book.coverUrl}
              alt=""
              loading="lazy"
              draggable={false}
            />
          ) : (
            <span className="manga-card-cover-fallback">{book.title}</span>
          )}
        </span>

        <span className="manga-card-overlay">
          <span className="manga-card-header">
            <span className="manga-card-name">{book.title}</span>
            <span className="manga-card-hp">
              <small>VOL</small>
              {book.volume || 1}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
};

const BinderPocket = ({
  book,
  row,
  slot,
  examiningId,
  isDropTarget,
  onExamine,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}) => (
  <div
    className={[
      'binder-pocket',
      book ? 'has-card' : 'is-empty',
      isDropTarget ? 'is-drop-target' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    onDragOver={(e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(row, slot);
    }}
    onDragLeave={() => onDragLeave(row, slot)}
    onDrop={(e) => onDrop(e, row, slot)}
  >
    <div className="binder-pocket-sleeve">
      <div className="binder-card-slot">
        {book ? (
          <MangaCard
            book={book}
            row={row}
            slot={slot}
            examiningId={examiningId}
            onExamine={onExamine}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ) : (
          <div className="binder-pocket-empty">
            <span>Slot vazio</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const BinderView = ({
  pages,
  activePage = 0,
  onActivePageChange,
  examiningId,
  onExamine,
  onPageLayoutChange,
  onColsChange,
  config = DEFAULT_BINDER_CONFIG,
}) => {
  const { pageCount, rows, cols } = normalizeBinderConfig(config);
  const count = pages?.length || pageCount;
  const safePage = ((activePage % count) + count) % count;
  const layout = pages?.[safePage] || [];

  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [flipClass, setFlipClass] = useState('');
  const pageRef = useRef(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el || !onColsChange) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const nextCols = estimateBinderCols({
        width: rect.width,
        height: rect.height,
        rows,
      });
      if (nextCols !== cols) onColsChange(nextCols);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows, onColsChange]);

  const goBy = useCallback(
    (delta) => {
      if (!onActivePageChange || count < 2) return;
      setFlipClass(delta > 0 ? 'flip-next' : 'flip-prev');
      window.setTimeout(() => setFlipClass(''), 420);
      onActivePageChange(((safePage + delta) % count + count) % count);
    },
    [onActivePageChange, safePage, count]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBy(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goBy(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBy]);

  const handleDrop = (e, toRow, toSlot) => {
    e.preventDefault();
    setDragOver(null);
    setDragging(null);

    let payload = e.dataTransfer.getData(DRAG_MIME);
    if (!payload) payload = e.dataTransfer.getData('text/plain');
    if (!payload) return;

    try {
      const from = JSON.parse(payload);
      if (typeof from.row !== 'number' || typeof from.slot !== 'number') return;
      onPageLayoutChange?.(
        safePage,
        moveBookOnShelf(layout, from.row, from.slot, toRow, toSlot)
      );
    } catch {
      /* ignore */
    }
  };

  const isTarget = (row, slot) =>
    dragOver?.row === row && dragOver?.slot === slot && dragging != null;

  return (
    <div className="binder-view">
      <div className="binder-stage">
        <button
          type="button"
          className="binder-nav binder-nav-prev"
          onClick={() => goBy(-1)}
          aria-label="Página anterior"
          disabled={count < 2}
        >
          ◀
        </button>

        <div className={['binder-book', flipClass].filter(Boolean).join(' ')}>
          <div className="binder-rings" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="binder-ring" />
            ))}
          </div>

          <div
            ref={pageRef}
            className="binder-page"
            style={{
              '--binder-rows': rows,
              '--binder-cols': cols,
            }}
          >
            <div className="binder-page-label">
              Página {safePage + 1} <span>/ {count}</span>
            </div>

            <div className="binder-grid">
              {Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, slot) => {
                  const book = layout[row]?.[slot] ?? null;
                  return (
                    <BinderPocket
                      key={`${safePage}-${row}-${slot}-${book?.id || 'empty'}`}
                      book={book}
                      row={row}
                      slot={slot}
                      examiningId={examiningId}
                      isDropTarget={isTarget(row, slot)}
                      onExamine={onExamine}
                      onDragOver={(r, s) => setDragOver({ row: r, slot: s })}
                      onDragLeave={(r, s) => {
                        setDragOver((prev) =>
                          prev?.row === r && prev?.slot === s ? null : prev
                        );
                      }}
                      onDrop={handleDrop}
                      onDragStart={(r, s) => setDragging({ row: r, slot: s })}
                      onDragEnd={() => {
                        setDragging(null);
                        setDragOver(null);
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="binder-nav binder-nav-next"
          onClick={() => goBy(1)}
          aria-label="Próxima página"
          disabled={count < 2}
        >
          ▶
        </button>
      </div>

      <div className="binder-dots" role="tablist" aria-label="Páginas do binder">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === safePage}
            className={['binder-dot', i === safePage ? 'is-active' : ''].filter(Boolean).join(' ')}
            onClick={() => onActivePageChange?.(i)}
            aria-label={`Ir para página ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BinderView;
