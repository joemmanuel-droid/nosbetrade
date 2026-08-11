import type { NextRequest } from 'next/server';
import {
  HttpError,
  clientIp,
  requireUser,
  setAdminUnlockCookie,
  verifyAdminAccessCode,
} from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { audit } from '@/lib/db';

/**
 * Deuxieme facteur du back-office : distinct du numero de telephone admin
 * (voir lib/config.ts). Necessite deja une session valide sur un numero
 * present dans ADMIN_PHONES ; ne fait que lever le verrou supplementaire.
 */
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  if (!user.isAdmin) throw new HttpError(403, 'Accès réservé.');

  const { code } = await readJson<{ code: string }>(req);
  const ip = await clientIp();

  const ok = await verifyAdminAccessCode(code, user.id, ip);
  await audit({ actor: user.id, action: ok ? 'admin.unlocked' : 'admin.unlock_failed', ip });

  if (!ok) throw new HttpError(400, 'Code incorrect.');

  await setAdminUnlockCookie(user.id);
  return json({ ok: true });
});
