import { NextRequest, NextResponse } from 'next/server';
import { HttpError } from './auth';

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

/**
 * Enveloppe commune pour les routes API : toute HttpError levee par la couche
 * metier devient une reponse JSON avec le bon statut ; toute autre erreur est
 * loguee cote serveur et renvoyee comme 500 generique (jamais le detail brut).
 */
export function withHandler(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      }
      console.error('[api] erreur non gérée', e);
      return NextResponse.json({ error: 'Une erreur est survenue. Réessaie.' }, { status: 500 });
    }
  };
}

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === 'number' ? { status: init } : init);
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Corps de requête JSON invalide.');
  }
}
