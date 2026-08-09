import { useEffect, useRef, useState } from 'react';
import { createCardBackDataUrl } from '../../utils/cardFaceTextures';
import './MangaCard3D.css';

const MangaCard3D = ({ coverUrl, title = 'Mangá', raro = false }) => {
  const stageRef = useRef(null);
  const drag = useRef({ active: false, lastX: 0, angle: 28 });
  const angleRef = useRef(28);
  const [backUrl] = useState(() => createCardBackDataUrl({ raro }));
  const [angle, setAngle] = useState(28);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag.current.active) {
        angleRef.current += dt * 32;
        setAngle(angleRef.current);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onPointerDown = (e) => {
    drag.current.active = true;
    drag.current.lastX = e.clientX;
    stageRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e) => {
    drag.current.active = false;
    stageRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    drag.current.lastX = e.clientX;
    angleRef.current += dx * 0.55;
    setAngle(angleRef.current);
  };

  const tiltX = Math.sin((angle * Math.PI) / 180) * 6;

  return (
    <div className={['manga-card-3d', raro ? 'is-rare' : ''].filter(Boolean).join(' ')}>
      <div
        ref={stageRef}
        className="manga-card-3d-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <div
          className="manga-card-3d-object"
          style={{
            transform: `rotateX(${tiltX}deg) rotateY(${angle}deg)`,
          }}
        >
          <div className="manga-card-3d-face manga-card-3d-face--front">
            <div className="manga-card-3d-art">
              {coverUrl ? (
                <img src={coverUrl} alt="" draggable={false} />
              ) : (
                <div className="manga-card-3d-fallback">{title}</div>
              )}
            </div>
          </div>

          <div className="manga-card-3d-face manga-card-3d-face--back">
            <div className="manga-card-3d-art">
              <img src={backUrl} alt="Trackeando" draggable={false} />
            </div>
          </div>

          <div className="manga-card-3d-face manga-card-3d-face--left" />
          <div className="manga-card-3d-face manga-card-3d-face--right" />
          <div className="manga-card-3d-face manga-card-3d-face--top" />
          <div className="manga-card-3d-face manga-card-3d-face--bottom" />
        </div>
      </div>
      <p className="manga-card-3d-hint">Gira sozinha · arraste para controlar</p>
    </div>
  );
};

export default MangaCard3D;
