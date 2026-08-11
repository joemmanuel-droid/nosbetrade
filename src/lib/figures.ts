import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CHAPTERS, FIGURE_NAMES, type Block } from '@/content/book';

const FIGURES_DIR = path.join(process.cwd(), 'content', 'figures');
const EXTENSIONS = ['png', 'jpeg', 'jpg', 'webp'];

/** Chapitre auquel appartient une figure, pour appliquer la bonne regle d'acces. */
export function chapterForFigure(name: string) {
  return CHAPTERS.find((c) =>
    c.blocks.some((b): b is Extract<Block, { t: 'figure' }> => b.t === 'figure' && b.src === name),
  );
}

/**
 * Charge le fichier source d'une figure depuis content/figures (hors de
 * /public : jamais accessible en statique, uniquement via la route API qui
 * verifie la session et l'entitlement avant de servir un octet).
 */
export async function loadFigureFile(name: string): Promise<{ buffer: Buffer; ext: string }> {
  if (!FIGURE_NAMES.includes(name)) {
    throw new Error(`Figure inconnue : ${name}`);
  }
  for (const ext of EXTENSIONS) {
    try {
      const buffer = await readFile(path.join(FIGURES_DIR, `${name}.${ext}`));
      return { buffer, ext };
    } catch {
      // essaie l'extension suivante
    }
  }
  throw new Error(`Fichier introuvable pour la figure : ${name}`);
}
