// Regenere toutes les icones de l'app a partir du logo officiel fourni
// (remplace le monogramme genere automatiquement au tout debut du projet).
import sharp from 'sharp';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const SOURCE = path.join(process.cwd(), '..', 'WhatsApp Image 2026-08-14 at 18.32.25.jpeg');
const OUT = path.join(process.cwd(), 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

for (const size of sizes) {
  await sharp(SOURCE).resize(size, size).png().toFile(path.join(OUT, `icon-${size}.png`));
}

// Icone "maskable" : Android decoupe l'icone selon des formes variees
// (cercle, squircle...) et peut rogner jusqu'a ~20% sur les bords. On
// recompose donc le logo a ~78% de la taille sur un canvas de la meme
// couleur de fond, pour garantir que le texte ne soit jamais coupe.
const CANVAS = 512;
const LOGO_SIZE = Math.round(CANVAS * 0.78);
const offset = Math.round((CANVAS - LOGO_SIZE) / 2);

const resizedLogo = await sharp(SOURCE).resize(LOGO_SIZE, LOGO_SIZE).toBuffer();
await sharp({
  create: { width: CANVAS, height: CANVAS, channels: 3, background: { r: 5, g: 8, b: 14 } },
})
  .composite([{ input: resizedLogo, left: offset, top: offset }])
  .png()
  .toFile(path.join(OUT, 'icon-maskable-512.png'));

// Favicon + apple-touch-icon
await sharp(SOURCE).resize(180, 180).png().toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));
await sharp(SOURCE).resize(32, 32).png().toFile(path.join(process.cwd(), 'public', 'favicon-32.png'));
await sharp(SOURCE).resize(64, 64).png().toFile(path.join(process.cwd(), 'public', 'favicon.ico'));

console.log('Icônes régénérées à partir du logo dans public/icons/');
