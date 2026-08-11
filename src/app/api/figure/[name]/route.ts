import { FIGURE_NAMES } from '@/content/book';
import { getSession } from '@/lib/auth';
import { hasAccess } from '@/lib/entitlements';
import { chapterForFigure, loadFigureFile } from '@/lib/figures';
import { maskPhone } from '@/lib/phone';
import { watermarkImage } from '@/lib/watermark';

/**
 * Sert les schemas du livre filigranes au telephone de l'acheteur.
 *
 * Gate d'acces : session httpOnly obligatoire, puis achat requis sauf pour
 * les chapitres marques `free`. Le fichier source n'est jamais dans /public,
 * donc il n'existe aucun chemin de contournement statique.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const name = raw.replace(/\.[a-z0-9]+$/i, ''); // tolere une extension ajoutee cote client

  if (!FIGURE_NAMES.includes(name)) {
    return new Response('Introuvable.', { status: 404 });
  }

  const session = await getSession();
  if (!session) return new Response('Connexion requise.', { status: 401 });

  const chapter = chapterForFigure(name);
  const isFree = chapter?.free ?? false;
  if (!isFree && !(await hasAccess(session.id))) {
    return new Response('Achat requis.', { status: 403 });
  }

  let buffer: Buffer;
  try {
    ({ buffer } = await loadFigureFile(name));
  } catch (e) {
    console.error('[figure] fichier manquant', name, e);
    return new Response('Introuvable.', { status: 404 });
  }

  const label = isFree ? 'APERÇU GRATUIT · Gold Strategy' : `${maskPhone(session.phone)} · usage personnel`;
  const out = await watermarkImage(buffer, label, { opacity: isFree ? 0.12 : 0.18 });

  return new Response(new Uint8Array(out), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      'Content-Disposition': 'inline',
    },
  });
}
