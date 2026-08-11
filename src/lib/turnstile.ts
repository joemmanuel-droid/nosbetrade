import 'server-only';
import { TURNSTILE_SECRET_KEY } from './config';

/**
 * Verifie un jeton Cloudflare Turnstile aupres de Cloudflare. Si aucune cle
 * secrete n'est configuree, la fonction renvoie toujours `true` (fonction
 * desactivee) : c'est le meme principe que le reste du projet — une feature
 * optionnelle qui ne casse jamais le parcours tant qu'elle n'est pas activee
 * explicitement via l'environnement.
 */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true; // widget desactive cote configuration
  if (!token) return false; // widget active mais aucun jeton fourni : refuse

  try {
    const res = await fetch('https://challenge.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error('[turnstile] verification injoignable', e);
    // Cloudflare injoignable : on ne bloque pas la connexion pour une panne
    // tierce, le rate limiting reste la protection de base dans ce cas.
    return true;
  }
}
