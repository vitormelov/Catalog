import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import MangaBook, { BOOK_H, BOOK_THICK, BOOK_COVER_W } from './MangaBook';
import { SHELF_ROWS, SLOTS_PER_ROW, moveBookOnShelf } from '../../utils/shelf3dHelpers';
import { createWoodTexture } from '../../utils/bookFaceTextures';

const SHELF_WIDTH = 3.35;
const SHELF_DEPTH = 0.52;
const SHELF_THICKNESS = 0.055;
const ROW_GAP = 0.5;
const SIDE_HEIGHT = SHELF_ROWS * ROW_GAP + 0.22;
const CLICK_THRESHOLD_PX = 8;
const BOOK_GAP = 0.012;
const USABLE_WIDTH = SHELF_WIDTH - 0.28;

function ShelfFrame() {
  const woodLight = useMemo(() => {
    const tex = createWoodTexture({ tint: '#9a6a38', seed: 'shelf-light' });
    return tex.clone();
  }, []);
  const woodDark = useMemo(() => {
    const tex = createWoodTexture({ tint: '#5c3a1c', seed: 'shelf-dark' });
    return tex.clone();
  }, []);
  const woodBack = useMemo(() => {
    const tex = createWoodTexture({ tint: '#4a2f18', seed: 'shelf-back', width: 512, height: 512 });
    const clone = tex.clone();
    clone.wrapS = THREE.RepeatWrapping;
    clone.wrapT = THREE.RepeatWrapping;
    clone.repeat.set(2, 2);
    clone.needsUpdate = true;
    return clone;
  }, []);

  const levels = useMemo(
    () => Array.from({ length: SHELF_ROWS }, (_, i) => -i * ROW_GAP),
    []
  );

  return (
    <group>
      {/* Laterais */}
      <mesh position={[-SHELF_WIDTH / 2, -SIDE_HEIGHT / 2 + 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, SIDE_HEIGHT, SHELF_DEPTH + 0.04]} />
        <meshStandardMaterial map={woodDark} color="#6b4423" roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[SHELF_WIDTH / 2, -SIDE_HEIGHT / 2 + 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, SIDE_HEIGHT, SHELF_DEPTH + 0.04]} />
        <meshStandardMaterial map={woodDark} color="#6b4423" roughness={0.78} metalness={0.02} />
      </mesh>

      {/* Fundo */}
      <mesh position={[0, -SIDE_HEIGHT / 2 + 0.16, -SHELF_DEPTH / 2 + 0.015]} receiveShadow>
        <boxGeometry args={[SHELF_WIDTH - 0.02, SIDE_HEIGHT - 0.04, 0.035]} />
        <meshStandardMaterial map={woodBack} color="#4a2f18" roughness={0.88} metalness={0.01} />
      </mesh>

      {/* Moldura superior */}
      <mesh position={[0, 0.18, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[SHELF_WIDTH + 0.16, 0.07, SHELF_DEPTH + 0.08]} />
        <meshStandardMaterial map={woodDark} color="#5c3a1c" roughness={0.75} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.12, SHELF_DEPTH / 2 - 0.02]} castShadow>
        <boxGeometry args={[SHELF_WIDTH + 0.12, 0.035, 0.06]} />
        <meshStandardMaterial map={woodLight} color="#9a6a38" roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Prateleiras + borda frontal */}
      {levels.map((y, i) => (
        <group key={i} position={[0, y - BOOK_H / 2 - 0.01, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[SHELF_WIDTH, SHELF_THICKNESS, SHELF_DEPTH]} />
            <meshStandardMaterial map={woodLight} color="#9a6a38" roughness={0.7} metalness={0.02} />
          </mesh>
          <mesh position={[0, 0.01, SHELF_DEPTH / 2 - 0.015]} castShadow>
            <boxGeometry args={[SHELF_WIDTH - 0.04, 0.028, 0.04]} />
            <meshStandardMaterial map={woodDark} color="#5c3a1c" roughness={0.75} metalness={0.02} />
          </mesh>
        </group>
      ))}

      {/* Base / rodapé */}
      <mesh position={[0, -SIDE_HEIGHT + 0.1, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[SHELF_WIDTH + 0.18, 0.12, SHELF_DEPTH + 0.1]} />
        <meshStandardMaterial map={woodDark} color="#5c3a1c" roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[0, -SIDE_HEIGHT + 0.18, SHELF_DEPTH / 2]} castShadow>
        <boxGeometry args={[SHELF_WIDTH + 0.1, 0.04, 0.05]} />
        <meshStandardMaterial map={woodLight} color="#9a6a38" roughness={0.7} metalness={0.02} />
      </mesh>
    </group>
  );
}

function BooksOnShelf({ layout, examiningId, onExamine, onLayoutChange, setOrbitEnabled }) {
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const { camera, gl, size } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.06), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  const slotPitch = BOOK_THICK + BOOK_GAP;

  const slotX = (slotIndex) => {
    const totalSpan = (SLOTS_PER_ROW - 1) * slotPitch;
    const start = -Math.min(USABLE_WIDTH, totalSpan) / 2;
    return start + slotIndex * slotPitch;
  };

  const slotY = (row) => -row * ROW_GAP;
  const shelfZ = 0.06;

  const findNearestSlot = (point) => {
    let best = { row: 0, slot: 0, dist: Infinity };
    for (let r = 0; r < SHELF_ROWS; r += 1) {
      for (let s = 0; s < SLOTS_PER_ROW; s += 1) {
        const x = slotX(s);
        const y = slotY(r);
        const d = (point.x - x) ** 2 * 1.2 + (point.y - y) ** 2;
        if (d < best.dist) best = { row: r, slot: s, dist: d };
      }
    }
    return best;
  };

  const projectPointer = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointerNdc.x = ((clientX - rect.left) / size.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / size.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const ok = raycaster.ray.intersectPlane(plane, hit);
    return ok ? hit.clone() : null;
  };

  const handlePointerDown = (book, row, slot, e) => {
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    const point = projectPointer(e.clientX, e.clientY);
    dragRef.current = {
      book,
      row,
      slot,
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
    setDragging({
      bookId: book.id,
      row,
      slot,
      position: point
        ? [point.x, point.y + 0.08, shelfZ + 0.1]
        : [slotX(slot), slotY(row) + 0.08, shelfZ + 0.1],
    });
    setOrbitEnabled?.(false);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current || !dragging) return;
    e.stopPropagation();
    const dist = Math.hypot(e.clientX - dragRef.current.clientX, e.clientY - dragRef.current.clientY);
    if (dist > CLICK_THRESHOLD_PX) dragRef.current.moved = true;

    const point = projectPointer(e.clientX, e.clientY);
    if (!point) return;

    const clampedX = Math.max(-USABLE_WIDTH / 2, Math.min(USABLE_WIDTH / 2, point.x));
    const minY = slotY(SHELF_ROWS - 1) - 0.05;
    const maxY = slotY(0) + 0.15;
    const clampedY = Math.max(minY, Math.min(maxY, point.y));

    setDragging((prev) =>
      prev
        ? {
            ...prev,
            position: [clampedX, clampedY + 0.06, shelfZ + 0.12],
            hover: findNearestSlot({ x: clampedX, y: clampedY }),
          }
        : prev
    );
  };

  const finishPointer = (e) => {
    if (!dragRef.current) return;
    const { book, row, slot, moved } = dragRef.current;
    try {
      e.target.releasePointerCapture?.(dragRef.current.pointerId);
    } catch {
      /* ignore */
    }

    if (!moved) {
      onExamine?.(book, row, slot);
    } else {
      const point = projectPointer(e.clientX, e.clientY) || {
        x: dragging?.position?.[0] ?? slotX(slot),
        y: dragging?.position?.[1] ?? slotY(row),
      };
      const nearest = findNearestSlot(point);
      if (nearest.row !== row || nearest.slot !== slot) {
        onLayoutChange?.(moveBookOnShelf(layout, row, slot, nearest.row, nearest.slot));
      }
    }

    dragRef.current = null;
    setDragging(null);
    setOrbitEnabled?.(true);
  };

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerLeave={(e) => {
        if (dragRef.current && e.buttons === 0) finishPointer(e);
      }}
    >
      {dragging?.hover && (
        <mesh
          position={[
            slotX(dragging.hover.slot),
            slotY(dragging.hover.row) - BOOK_H / 2 + 0.01,
            shelfZ,
          ]}
        >
          <boxGeometry args={[BOOK_THICK + 0.01, 0.01, BOOK_COVER_W + 0.02]} />
          <meshBasicMaterial color="#0BC0EF" transparent opacity={0.55} />
        </mesh>
      )}

      {layout.map((rowBooks, row) =>
        rowBooks.map((book, slot) => {
          if (!book) return null;
          const isDragging = dragging?.bookId === book.id;
          const position = isDragging
            ? dragging.position
            : [slotX(slot), slotY(row), shelfZ];

          return (
            <Suspense key={book.id} fallback={null}>
              <MangaBook
                book={book}
                row={row}
                slot={slot}
                selected={examiningId === book.id}
                lifted={isDragging}
                position={position}
                onPointerDown={handlePointerDown}
              />
            </Suspense>
          );
        })
      )}
    </group>
  );
}

const ShelfScene = ({ layout, examiningId, onExamine, onLayoutChange }) => {
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  return (
    <Canvas
      shadows
      camera={{ position: [0.15, -0.15, 3.55], fov: 40 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
      <color attach="background" args={['#d4dee9']} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[3.2, 5.5, 4.2]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2.5, 1.5]} intensity={0.45} color="#cfe4ff" />
      <hemisphereLight args={['#f0f5ff', '#6b4f2a', 0.35]} />

      <ShelfFrame />
      <BooksOnShelf
        layout={layout}
        examiningId={examiningId}
        onExamine={onExamine}
        onLayoutChange={onLayoutChange}
        setOrbitEnabled={setOrbitEnabled}
      />

      <ContactShadows
        position={[0, -SIDE_HEIGHT + 0.04, 0.05]}
        opacity={0.4}
        scale={7}
        blur={2.5}
        far={4}
      />
      <Environment preset="apartment" />
      <OrbitControls
        makeDefault
        enabled={orbitEnabled}
        enablePan
        minDistance={1.8}
        maxDistance={7}
        maxPolarAngle={Math.PI * 0.78}
        minPolarAngle={Math.PI * 0.2}
        target={[0, -0.55, 0]}
      />
    </Canvas>
  );
};

export default ShelfScene;
