import 'server-only';
import sharp from 'sharp';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Applique un filigrane texte repete en diagonale sur une image.
 * Utilise pour tracer une fuite eventuelle jusqu'a l'acheteur sans rendre la
 * lecture inconfortable (faible opacite, motif regulier).
 */
export async function watermarkImage(
  input: Buffer,
  text: string,
  opts: { opacity?: number } = {},
): Promise<Buffer> {
  const src = sharp(input).rotate(); // rotate() applique l'orientation EXIF si presente
  const meta = await src.metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const fontSize = Math.max(13, Math.round(w / 34));
  const label = escapeXml(text);
  const tileW = Math.max(220, Math.round(fontSize * label.length * 0.58));
  const tileH = fontSize * 7;
  const opacity = opts.opacity ?? 0.15;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <text x="0" y="${fontSize}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}"
              font-weight="600" fill="#ffffff" fill-opacity="${opacity}">${label}</text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>`;

  return src
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
