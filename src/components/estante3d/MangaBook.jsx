import { useMemo, useState } from 'react';
import { useCursor, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { createBookMaterials } from '../../utils/bookFaceTextures';

/** Largura da capa (profundidade na estante após rotacionar lombada à frente). */
const BOOK_COVER_W = 0.22;
const BOOK_H = 0.34;
/** Espessura do volume (= largura aparente entre lombadas na prateleira). */
const BOOK_THICK = 0.048;

const FALLBACK_COVER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="#29398E" width="200" height="300"/><text x="100" y="160" fill="#F1F2F1" font-size="28" text-anchor="middle" font-family="sans-serif">MANGA</text></svg>`
  );

/** Lombada (-X) vira para a câmera (+Z). */
const SPINE_FORWARD = [0, Math.PI / 2, 0];

function BookTextures({ book, children }) {
  const [front, back] = useTexture([
    book.coverUrl || FALLBACK_COVER,
    book.backUrl || book.coverUrl || FALLBACK_COVER,
  ]);

  useMemo(() => {
    front.colorSpace = THREE.SRGBColorSpace;
    back.colorSpace = THREE.SRGBColorSpace;
  }, [front, back]);

  return children(front, back);
}

const MangaBookMesh = ({
  book,
  front,
  back,
  position,
  selected,
  lifted,
  onPointerDown,
  row,
  slot,
}) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered || lifted ? 'grabbing' : 'grab');

  const materials = useMemo(
    () => createBookMaterials({ front, back, book }),
    [front, back, book.id, book.title, book.volume, book.color]
  );

  const scale = lifted ? 1.08 : selected || hovered ? 1.04 : 1;

  return (
    <mesh
      position={position}
      rotation={SPINE_FORWARD}
      castShadow
      receiveShadow
      material={materials}
      scale={[scale, scale, scale]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(book, row, slot, e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Local: X capa→capa, Y altura, Z espessura. Após rot Y90: lombada (-X) à frente. */}
      <boxGeometry args={[BOOK_COVER_W, BOOK_H, BOOK_THICK]} />
    </mesh>
  );
};

const MangaBook = (props) => (
  <BookTextures book={props.book}>
    {(front, back) => <MangaBookMesh {...props} front={front} back={back} />}
  </BookTextures>
);

export { BOOK_COVER_W, BOOK_H, BOOK_THICK };
export const BOOK_W = BOOK_THICK;
export default MangaBook;
