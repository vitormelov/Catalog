import * as THREE from 'three';

const textureCache = new Map();

const hashSeed = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const shadeColor = (hex, amount) => {
  const raw = (hex || '#29398E').replace('#', '');
  const num = parseInt(raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw, 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp(((num >> 16) & 255) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return `rgb(${r},${g},${b})`;
};

const makeCanvasTexture = (canvas) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const SPINE_FONT = '"Plus Jakarta Sans", "Segoe UI", sans-serif';

/** Divide o título em até 2 linhas bem balanceadas (como na estante 2D). */
const splitSpineTitle = (ctx, text, maxWidth) => {
  const raw = String(text || '').trim() || 'MANGA';

  // Nomes curtos: uma linha só
  if (raw.length <= 12 && ctx.measureText(raw).width <= maxWidth) {
    return [raw];
  }

  const words = raw.split(/\s+/).filter(Boolean);

  // Preferir quebra em espaço, balanceando as duas linhas
  if (words.length >= 2) {
    let best = null;
    let bestScore = Infinity;
    for (let i = 1; i < words.length; i += 1) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const wa = ctx.measureText(a).width;
      const wb = ctx.measureText(b).width;
      if (wa <= maxWidth && wb <= maxWidth) {
        const score = Math.abs(wa - wb) + Math.max(wa, wb) * 0.15;
        if (score < bestScore) {
          bestScore = score;
          best = [a, b];
        }
      }
    }
    if (best) return best;
  }

  // Sem espaços (ou palavras enormes): quebra no meio por caracteres
  let mid = Math.ceil(raw.length / 2);
  for (let delta = 0; delta < raw.length; delta += 1) {
    for (const m of [mid - delta, mid + delta]) {
      if (m < 1 || m >= raw.length) continue;
      const a = raw.slice(0, m);
      const b = raw.slice(m);
      if (ctx.measureText(a).width <= maxWidth && ctx.measureText(b).width <= maxWidth) {
        return [a, b];
      }
    }
  }

  // Último recurso: encurta com reticências em 2 pedaços
  const half = Math.max(4, Math.floor(raw.length / 2));
  let a = raw.slice(0, half);
  let b = raw.slice(half);
  while (a.length > 2 && ctx.measureText(a).width > maxWidth) a = a.slice(0, -1);
  while (b.length > 2 && ctx.measureText(`${b}…`).width > maxWidth) b = b.slice(0, -1);
  return [a, `${b}…`];
};

/** Escolhe tamanho de fonte e linhas para caber no espaço da lombada. */
const fitSpineTitle = (ctx, title, maxLen, maxCross) => {
  const label = String(title || 'MANGA').toUpperCase();
  let fontSize = 28;
  const minSize = 10;

  while (fontSize >= minSize) {
    ctx.font = `bold ${fontSize}px ${SPINE_FONT}`;
    const lineHeight = fontSize * 1.18;
    const lines = splitSpineTitle(ctx, label, maxLen);
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);
    const blockCross = lines.length * lineHeight;
    if (widest <= maxLen + 0.5 && blockCross <= maxCross + 0.5) {
      return { fontSize, lines, lineHeight };
    }
    fontSize -= 1;
  }

  ctx.font = `bold ${minSize}px ${SPINE_FONT}`;
  const lines = splitSpineTitle(ctx, label, maxLen);
  return { fontSize: minSize, lines, lineHeight: minSize * 1.18 };
};

/**
 * Lombada vertical com título, volume e faixa típica de mangá.
 */
export const createSpineTexture = ({ title = 'MANGA', volume = 1, color = '#29398E' }) => {
  const key = `spine:v3:${color}:${title}:${volume}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const width = 160;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(hashSeed(key));

  const base = color || '#29398E';
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, shadeColor(base, -28));
  gradient.addColorStop(0.18, shadeColor(base, -8));
  gradient.addColorStop(0.5, base);
  gradient.addColorStop(0.82, shadeColor(base, -8));
  gradient.addColorStop(1, shadeColor(base, -32));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Textura / ruído sutil
  for (let i = 0; i < 900; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    ctx.fillStyle = `rgba(255,255,255,${0.015 + rand() * 0.04})`;
    ctx.fillRect(x, y, 1, 1 + rand() * 2);
  }

  // Filetes tipográficos da lombada
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.14, height * 0.08);
  ctx.lineTo(width * 0.14, height * 0.92);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.86, height * 0.08);
  ctx.lineTo(width * 0.86, height * 0.92);
  ctx.stroke();

  // Faixa inferior
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, height * 0.78, width, height * 0.14);

  // Título vertical: até 2 linhas + fonte menor (igual à estante 2D)
  // maxLen = comprimento ao longo da lombada; maxCross = largura para 2 colunas
  const maxLen = height * 0.58;
  const maxCross = width * 0.62;
  ctx.save();
  ctx.translate(width * 0.5, height * 0.74);
  ctx.rotate(-Math.PI / 2);
  const { fontSize, lines, lineHeight } = fitSpineTitle(ctx, title, maxLen, maxCross);
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.font = `bold ${fontSize}px ${SPINE_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const block = lines.length * lineHeight;
  let y = -block / 2 + lineHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, 0, y);
    y += lineHeight;
  }
  ctx.restore();

  // Número do volume
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 34px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(volume || 1), width * 0.5, height * 0.85);

  const texture = makeCanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
};

/**
 * Bloco de páginas (corte da frente / topo / base).
 * direction: 'page-edge' = linhas verticais (corte frontal das páginas)
 *            'page-stack' = linhas horizontais (topo/base do bloco)
 */
export const createPageBlockTexture = ({ direction = 'page-edge', seed = 'pages' } = {}) => {
  const key = `pages:${direction}:${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const isPageEdge = direction === 'page-edge' || direction === 'horizontal';
  const width = isPageEdge ? 96 : 256;
  const height = isPageEdge ? 512 : 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(hashSeed(key));

  const paper = ctx.createLinearGradient(0, 0, width, height);
  paper.addColorStop(0, '#f7f1e4');
  paper.addColorStop(0.45, '#efe6d4');
  paper.addColorStop(1, '#e7dcc8');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  // Borda mais escura (lado da costa / envelhecimento)
  if (isPageEdge) {
    const edge = ctx.createLinearGradient(0, 0, width, 0);
    edge.addColorStop(0, 'rgba(180,160,130,0.35)');
    edge.addColorStop(0.25, 'rgba(180,160,130,0)');
    edge.addColorStop(0.75, 'rgba(180,160,130,0)');
    edge.addColorStop(1, 'rgba(120,100,75,0.25)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  } else {
    const edge = ctx.createLinearGradient(0, 0, 0, height);
    edge.addColorStop(0, 'rgba(160,140,110,0.3)');
    edge.addColorStop(0.4, 'rgba(160,140,110,0)');
    edge.addColorStop(1, 'rgba(140,120,95,0.22)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  }

  // page-edge: linhas verticais (folhas em pé); page-stack: linhas horizontais (topo/base)
  const lineCount = isPageEdge ? 70 : 110;
  for (let i = 0; i < lineCount; i += 1) {
    const alpha = 0.08 + rand() * 0.18;
    ctx.strokeStyle = `rgba(120,100,80,${alpha})`;
    ctx.lineWidth = 1;

    if (isPageEdge) {
      const x = (i / lineCount) * width + (rand() - 0.5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 2);
      ctx.lineTo(x + (rand() - 0.5) * 0.8, height - 2);
      ctx.stroke();
    } else {
      const y = (i / lineCount) * height + (rand() - 0.5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(2, y);
      ctx.lineTo(width - 2, y + (rand() - 0.5) * 0.8);
      ctx.stroke();
    }
  }

  // Faixas mais escuras simulando densidades de página
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = `rgba(150,130,100,${0.04 + rand() * 0.06})`;
    if (isPageEdge) {
      const x = rand() * width;
      ctx.fillRect(x, 0, 2 + rand() * 4, height);
    } else {
      const y = rand() * height;
      ctx.fillRect(0, y, width, 2 + rand() * 4);
    }
  }

  const texture = makeCanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
};

/**
 * Materiais das 6 faces do box:
 * +X páginas (corte), -X lombada, +Y/-Y páginas, +Z capa, -Z contra-capa
 */
export const createBookMaterials = ({ front, back, book }) => {
  const spineMap = createSpineTexture({
    title: book.title || 'Manga',
    volume: book.volume || 1,
    color: book.color || '#29398E',
  });
  const pagesSide = createPageBlockTexture({
    direction: 'page-edge',
    seed: `${book.id || book.title}-side-v2`,
  });
  const pagesTop = createPageBlockTexture({
    direction: 'page-stack',
    seed: `${book.id || book.title}-top-v2`,
  });

  const spineMat = new THREE.MeshStandardMaterial({
    map: spineMap,
    roughness: 0.72,
    metalness: 0.02,
  });
  const pagesSideMat = new THREE.MeshStandardMaterial({
    map: pagesSide,
    roughness: 0.92,
    metalness: 0,
  });
  const pagesTopMat = new THREE.MeshStandardMaterial({
    map: pagesTop,
    roughness: 0.94,
    metalness: 0,
  });
  const frontMat = new THREE.MeshStandardMaterial({
    map: front,
    roughness: 0.48,
    metalness: 0.02,
  });
  const backMat = new THREE.MeshStandardMaterial({
    map: back,
    roughness: 0.5,
    metalness: 0.02,
  });

  return [pagesSideMat, spineMat, pagesTopMat, pagesTopMat.clone(), frontMat, backMat];
};

/** Textura de madeira para a estrutura da estante. */
export const createWoodTexture = ({
  tint = '#8B5E2F',
  seed = 'wood',
  width = 512,
  height = 256,
} = {}) => {
  const key = `wood:${tint}:${seed}:${width}x${height}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(hashSeed(key));

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, shadeColor(tint, 18));
  base.addColorStop(0.5, tint);
  base.addColorStop(1, shadeColor(tint, -22));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 70; i += 1) {
    const y = rand() * height;
    ctx.strokeStyle = `rgba(60,30,10,${0.05 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + rand()) * (2 + rand() * 4));
    }
    ctx.stroke();
  }

  for (let i = 0; i < 400; i += 1) {
    ctx.fillStyle = `rgba(255,220,180,${rand() * 0.035})`;
    ctx.fillRect(rand() * width, rand() * height, 1, 1 + rand() * 2);
  }

  const texture = makeCanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
};

