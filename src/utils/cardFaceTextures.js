const NAVY = '#061A3F';
const CYAN = '#0BC0EF';
const LIGHT = '#F1F2F1';
const INDIGO = '#29398E';
export const CARD_EDGE_COLOR = '#9aa0a8';

/** Desenha o verso Trackeando num canvas e devolve data URL (CSS 3D / <img>). */
export const createCardBackDataUrl = ({ raro = false } = {}) => {
  const width = 512;
  const height = 716;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, NAVY);
  gradient.addColorStop(0.55, INDIGO);
  gradient.addColorStop(1, '#04122c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width / 2,
    height * 0.42,
    40,
    width / 2,
    height * 0.42,
    height * 0.55
  );
  vignette.addColorStop(0, 'rgba(11, 192, 239, 0.12)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.fillStyle = NAVY;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(241, 242, 241, 0.18)';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 68, -Math.PI * 0.55, Math.PI * 0.85);
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = LIGHT;
  ctx.font = '700 78px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', cx, cy + 4);

  ctx.fillStyle = LIGHT;
  ctx.font = '700 52px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.fillText('TRACKEANDO', cx, height * 0.62);

  ctx.fillStyle = 'rgba(11, 192, 239, 0.85)';
  ctx.font = '600 16px "Plus Jakarta Sans", Inter, sans-serif';
  ctx.fillText('MANGA CARD', cx, height * 0.68);

  // Moldura metálica (prata / ouro)
  const frameGrad = ctx.createLinearGradient(0, 0, width, height);
  if (raro) {
    frameGrad.addColorStop(0, '#fff6d0');
    frameGrad.addColorStop(0.18, '#f0d060');
    frameGrad.addColorStop(0.38, '#b8860b');
    frameGrad.addColorStop(0.52, '#ffe08a');
    frameGrad.addColorStop(0.72, '#8a6914');
    frameGrad.addColorStop(0.88, '#e8c547');
    frameGrad.addColorStop(1, '#fff1b0');
  } else {
    frameGrad.addColorStop(0, '#f4f6f8');
    frameGrad.addColorStop(0.2, '#c8ced6');
    frameGrad.addColorStop(0.4, '#8a929c');
    frameGrad.addColorStop(0.55, '#e2e6eb');
    frameGrad.addColorStop(0.75, '#6a727c');
    frameGrad.addColorStop(1, '#dfe3e8');
  }

  ctx.lineWidth = 36;
  ctx.strokeStyle = frameGrad;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.strokeStyle = raro ? 'rgba(80, 50, 0, 0.55)' : 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = raro ? 'rgba(255, 230, 140, 0.35)' : 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  return canvas.toDataURL('image/png');
};
