import type { NextRequest } from 'next/server';
import {
  HttpError,
  clientIp,
  createSessionToken,
  findOrCreateUser,
  registerDevice,
  setSessionCookie,
  userAgent,
} from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { AUTH_MODE } from '@/lib/config';
import { audit, rateLimit } from '@/lib/db';
import { normalizePhone } from '@/lib/phone';

/**
 * Connexion SANS verification — actif uniquement si AUTH_MODE=phone_only.
 * Voir le commentaire sur AUTH_MODE dans lib/config.ts pour le contexte et
 * le risque accepte. Renvoie 404 dans le mode normal, pour qu'on ne puisse
 * pas s'en servir comme porte derobee meme si l'URL est devinee.
 */
export const POST = withHandler(async (req: NextRequest) => {
  if (AUTH_MODE !== 'phone_only') {
    throw new HttpError(404, 'Introuvable.');
  }

  const { phone } = await readJson<{ phone: string }>(req);
  const normalized = normalizePhone(phone ?? '');
  if (!normalized) throw new HttpError(400, 'Numéro de téléphone invalide.');

  const ip = await clientIp();
  const okPhone = await rateLimit(`phone-only:phone:${normalized}`, 10, 15 * 60_000);
  const okIp = ip ? await rateLimit(`phone-only:ip:${ip}`, 30, 15 * 60_000) : true;
  if (!okPhone || !okIp) throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.');

  const { id: userId, isNew } = await findOrCreateUser(normalized);
  const ua = await userAgent();
  const deviceId = await registerDevice(userId, ua);
  const token = await createSessionToken(userId, normalized, deviceId);
  await setSessionCookie(token);

  // Trace explicitement que cette connexion n'a subi aucune verification,
  // pour pouvoir auditer facilement une fois revenu au mode normal.
  await audit({ actor: userId, action: isNew ? 'user.created_unverified' : 'user.login_unverified', ip });

  return json({ ok: true, isNew });
});
