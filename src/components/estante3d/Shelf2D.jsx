import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SHELF_CONFIG,
  getCarouselOffset,
  moveBookOnShelf,
  normalizeShelfConfig,
} from '../../utils/shelf3dHelpers';
import './Shelf2D.css';

const DRAG_MIME = 'application/x-shelf-book';

const MangaSpine = ({
  book,
  row,
  slot,
  examiningId,
  interactive,
  onExamine,
  onDragStart,
  onDragEnd,
}) => {
  const moved = useRef(false);

  return (
    <button
      type="button"
      className={[
        'shelf2d-spine',
        examiningId === book.id ? 'is-examining' : '',
        !interactive ? 'is-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--spine-color': book.color || '#3d2b1f' }}
      draggable={interactive}
      tabIndex={interactive ? 0 : -1}
      title={`${book.title} · Vol. ${book.volume || 1}`}
      aria-label={`${book.title}, volume ${book.volume || 1}`}
      onDragStart={(e) => {
        if (!interactive) {
          e.preventDefault();
          return;
        }
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
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        if (moved.current) return;
        onExamine(book, row, slot);
      }}
    >
      <span className="shelf2d-spine-edge" aria-hidden="true" />
      {book.coverUrl ? (
        <span
          className="shelf2d-spine-cover"
          style={{ backgroundImage: `url(${book.coverUrl})` }}
          aria-hidden="true"
        />
      ) : null}
      <span className="shelf2d-spine-label">
        <span
          className={[
            'shelf2d-spine-title',
            (book.title || '').length > 28 ? 'is-long' : '',
            (book.title || '').length > 40 ? 'is-xlong' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {book.title}
        </span>
        <span className="shelf2d-spine-vol">{book.volume || 1}</span>
      </span>
    </button>
  );
};

const EmptySlot = ({
  row,
  slot,
  interactive,
  isDropTarget,
  onDragOverSlot,
  onDropSlot,
  onDragLeaveSlot,
}) => (
  <div
    className={['shelf2d-slot', 'is-empty', isDropTarget ? 'is-drop-target' : ''].filter(Boolean).join(' ')}
    data-row={row}
    data-slot={slot}
    onDragOver={(e) => {
      if (!interactive) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOverSlot(row, slot);
    }}
    onDragLeave={() => {
      if (!interactive) return;
      onDragLeaveSlot(row, slot);
    }}
    onDrop={(e) => {
      if (!interactive) return;
      onDropSlot(e, row, slot);
    }}
  />
);

const ShelfUnit = ({
  layout,
  examiningId,
  interactive,
  onExamine,
  onLayoutChange,
  slotsPerRow,
}) => {
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);
  const rows = layout.length;

  const handleDrop = (e, toRow, toSlot) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    setDragging(null);

    let payload = e.dataTransfer.getData(DRAG_MIME);
    if (!payload) payload = e.dataTransfer.getData('text/plain');
    if (!payload) return;

    try {
      const from = JSON.parse(payload);
      if (typeof from.row !== 'number' || typeof from.slot !== 'number') return;
      onLayoutChange(moveBookOnShelf(layout, from.row, from.slot, toRow, toSlot));
    } catch {
      /* ignore bad payloads */
    }
  };

  const isTarget = (row, slot) =>
    interactive && dragOver?.row === row && dragOver?.slot === slot && dragging != null;

  return (
    <div
      className={['shelf2d-shell', interactive ? 'is-front' : 'is-back'].filter(Boolean).join(' ')}
      style={{ '--shelf-slots': slotsPerRow }}
    >
      <span className="shelf2d-face shelf2d-face-left" aria-hidden="true" />
      <span className="shelf2d-face shelf2d-face-right" aria-hidden="true" />
      <span className="shelf2d-face shelf2d-face-top" aria-hidden="true" />
      <span className="shelf2d-face shelf2d-face-back" aria-hidden="true" />

      <div className="shelf2d-frame">
        <span className="shelf2d-cast-shadow" aria-hidden="true" />
        <div className="shelf2d-top-molding" aria-hidden="true" />

        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="shelf2d-bay">
            <div
              className="shelf2d-row"
              onDragOver={(e) => {
                if (!interactive) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
            >
              {Array.from({ length: slotsPerRow }, (_, slot) => {
                const book = layout[row]?.[slot];
                const dropHere = isTarget(row, slot);

                if (book) {
                  return (
                    <div
                      key={`${row}-${slot}-${book.id}`}
                      className={['shelf2d-slot', dropHere ? 'is-drop-target' : ''].filter(Boolean).join(' ')}
                      onDragOver={(e) => {
                        if (!interactive) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOver({ row, slot });
                      }}
                      onDragLeave={() => {
                        setDragOver((prev) =>
                          prev?.row === row && prev?.slot === slot ? null : prev
                        );
                      }}
                      onDrop={(e) => handleDrop(e, row, slot)}
                    >
                      <MangaSpine
                        book={book}
                        row={row}
                        slot={slot}
                        examiningId={examiningId}
                        interactive={interactive}
                        onExamine={onExamine}
                        onDragStart={(r, s) => setDragging({ row: r, slot: s })}
                        onDragEnd={() => {
                          setDragging(null);
                          setDragOver(null);
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <EmptySlot
                    key={`${row}-${slot}`}
                    row={row}
                    slot={slot}
                    interactive={interactive}
                    isDropTarget={dropHere}
                    onDragOverSlot={(r, s) => setDragOver({ row: r, slot: s })}
                    onDragLeaveSlot={(r, s) => {
                      setDragOver((prev) => (prev?.row === r && prev?.slot === s ? null : prev));
                    }}
                    onDropSlot={handleDrop}
                  />
                );
              })}
            </div>
            <div className="shelf2d-plank" aria-hidden="true" />
          </div>
        ))}

        <div className="shelf2d-base" aria-hidden="true" />
      </div>
    </div>
  );
};

const Shelf2D = ({
  units,
  activeUnit = 0,
  onActiveUnitChange,
  examiningId,
  onExamine,
  onUnitLayoutChange,
  config = DEFAULT_SHELF_CONFIG,
}) => {
  const { unitCount, slotsPerRow } = normalizeShelfConfig(config);
  const count = units?.length || unitCount;
  const safeActive = ((activeUnit % count) + count) % count;

  const goBy = useCallback(
    (delta) => {
      if (!onActiveUnitChange || count < 2) return;
      onActiveUnitChange(((safeActive + delta) % count + count) % count);
    },
    [onActiveUnitChange, safeActive, count]
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

  return (
    <div className="shelf2d">
      <div className="shelf2d-carousel" style={{ '--shelf-unit-count': count }}>
        <button
          type="button"
          className="shelf2d-nav shelf2d-nav-prev"
          onClick={() => goBy(-1)}
          aria-label="Estante anterior"
          disabled={count < 2}
        >
          ◀
        </button>

        <div className="shelf2d-stage">
          {(units || []).map((layout, unitIndex) => {
            const offset = getCarouselOffset(unitIndex, safeActive, count);
            const isFront = offset === 0;

            return (
              <div
                key={unitIndex}
                className={[
                  'shelf2d-carousel-item',
                  isFront ? 'is-front' : 'is-back',
                  `offset-${offset}`,
                ].join(' ')}
                style={{ '--carousel-offset': offset }}
                onClick={() => {
                  if (!isFront) onActiveUnitChange?.(unitIndex);
                }}
                role={isFront ? undefined : 'button'}
                tabIndex={isFront ? undefined : 0}
                onKeyDown={(e) => {
                  if (isFront) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActiveUnitChange?.(unitIndex);
                  }
                }}
                aria-label={
                  isFront
                    ? `Estante ${unitIndex + 1} (ativa)`
                    : `Selecionar estante ${unitIndex + 1}`
                }
              >
                <ShelfUnit
                  layout={layout}
                  examiningId={isFront ? examiningId : null}
                  interactive={isFront}
                  onExamine={onExamine}
                  onLayoutChange={(next) => onUnitLayoutChange?.(unitIndex, next)}
                  slotsPerRow={slotsPerRow}
                />
                <span className="shelf2d-unit-tag" aria-hidden="true">
                  {unitIndex + 1}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="shelf2d-nav shelf2d-nav-next"
          onClick={() => goBy(1)}
          aria-label="Próxima estante"
          disabled={count < 2}
        >
          ▶
        </button>
      </div>

      <div className="shelf2d-dots" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className={['shelf2d-dot', i === safeActive ? 'is-active' : ''].filter(Boolean).join(' ')}
            onClick={() => onActiveUnitChange?.(i)}
            aria-label={`Ir para estante ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Shelf2D;
