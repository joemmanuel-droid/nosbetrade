// Genere l'image de partage (Open Graph / Twitter Card), 1200x630, coherente
// avec l'identite visuelle sombre/or de l'app. Trace en SVG puis rasterisee :
// aucune ressource externe.
import sharp from 'sharp';
import path from 'node:path';

const W = 1200;
const H = 630;

function candle(x, bodyTop, bodyH, wickTop, wickBottom, color) {
  const bodyW = 34;
  return `
    <line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBottom}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bodyH}" rx="4" fill="${color}"/>
  `;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111726"/>
      <stop offset="1" stop-color="#080a11"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c766"/>
      <stop offset="1" stop-color="#c8922c"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- motif bougies, cote droit -->
  <g opacity="0.9">
    ${candle(920, 260, 90, 220, 400, '#3b6fee')}
    ${candle(980, 200, 130, 160, 400, '#22c48a')}
    ${candle(1040, 300, 60, 260, 400, '#3b6fee')}
    ${candle(1100, 150, 170, 110, 400, '#22c48a')}
  </g>
  <line x1="860" y1="330" x2="1160" y2="330" stroke="#d9a63e" stroke-width="2" stroke-dasharray="2 8" opacity="0.6"/>

  <!-- badge tagline -->
  <rect x="80" y="120" width="530" height="46" rx="23" fill="#d9a63e" fill-opacity="0.14"/>
  <text x="105" y="150" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#f0c766" letter-spacing="0.5">BOS · LIQUIDITÉ · CHOCH — M5 → M3</text>

  <!-- titre -->
  <text x="78" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700" fill="#eef1f8">Gold Strategy</text>
  <text x="80" y="320" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#9aa4bc">par Nosbe Trade</text>

  <!-- pitch -->
  <text x="80" y="390" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#9aa4bc">
    <tspan x="80" dy="0">Manuel pédagogique pour lire une structure simple</tspan>
    <tspan x="80" dy="34">sur l'or (XAUUSD) — BOS, liquidité, CHOCH, englobement.</tspan>
  </text>

  <!-- prix -->
  <rect x="80" y="470" width="290" height="70" rx="35" fill="url(#gold)"/>
  <text x="225" y="514" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#1a1305" text-anchor="middle">5 000 F CFA</text>
</svg>`;

const out = path.join(process.cwd(), 'public', 'og-image.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Image OG générée :', out);
