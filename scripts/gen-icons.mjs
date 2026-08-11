// Genere les icones PWA a partir d'un monogramme SVG (bougie + "NT"),
// coherent avec l'identite visuelle sombre/or du livre. Aucune ressource
// externe : tout est trace en code.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'icons');
mkdirSync(OUT, { recursive: true });

function svgIcon(size, { padding = 0 } = {}) {
  const s = size;
  const p = padding;
  const inner = s - p * 2;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#111726"/>
        <stop offset="1" stop-color="#0a0e17"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f0c766"/>
        <stop offset="1" stop-color="#c8922c"/>
      </linearGradient>
    </defs>
    <rect width="${s}" height="${s}" rx="${Math.round(s * 0.22)}" fill="url(#bg)"/>
    <g transform="translate(${p},${p})">
      <!-- bougie haussiere stylisee -->
      <line x1="${inner * 0.34}" y1="${inner * 0.12}" x2="${inner * 0.34}" y2="${inner * 0.30}" stroke="url(#gold)" stroke-width="${Math.max(2, inner * 0.03)}" stroke-linecap="round"/>
      <rect x="${inner * 0.26}" y="${inner * 0.30}" width="${inner * 0.16}" height="${inner * 0.30}" rx="${inner * 0.02}" fill="url(#gold)"/>
      <line x1="${inner * 0.34}" y1="${inner * 0.60}" x2="${inner * 0.34}" y2="${inner * 0.74}" stroke="url(#gold)" stroke-width="${Math.max(2, inner * 0.03)}" stroke-linecap="round"/>

      <line x1="${inner * 0.64}" y1="${inner * 0.20}" x2="${inner * 0.64}" y2="${inner * 0.40}" stroke="#5fd9a4" stroke-width="${Math.max(2, inner * 0.03)}" stroke-linecap="round"/>
      <rect x="${inner * 0.56}" y="${inner * 0.40}" width="${inner * 0.16}" height="${inner * 0.42}" rx="${inner * 0.02}" fill="#22c48a"/>
      <line x1="${inner * 0.64}" y1="${inner * 0.82}" x2="${inner * 0.64}" y2="${inner * 0.90}" stroke="#22c48a" stroke-width="${Math.max(2, inner * 0.03)}" stroke-linecap="round"/>
    </g>
  </svg>`;
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

for (const size of sizes) {
  const buf = Buffer.from(svgIcon(size));
  await sharp(buf).png().toFile(path.join(OUT, `icon-${size}.png`));
}

// Maskable : plus de padding pour respecter la zone de securite (safe zone ~80%).
const maskableBuf = Buffer.from(svgIcon(512, { padding: 512 * 0.1 }));
await sharp(maskableBuf).png().toFile(path.join(OUT, 'icon-maskable-512.png'));

// Favicon + apple-touch-icon
await sharp(Buffer.from(svgIcon(180))).png().toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));
await sharp(Buffer.from(svgIcon(32))).png().toFile(path.join(process.cwd(), 'public', 'favicon-32.png'));
await sharp(Buffer.from(svgIcon(64))).png().toFile(path.join(process.cwd(), 'public', 'favicon.ico'));

console.log('Icônes générées dans public/icons/');
