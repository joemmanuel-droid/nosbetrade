import type { NextRequest } from 'next/server';
import {
  HttpError,
  clientIp,
  createSessionToken,
  findOrCreateUser,
  registerDevice,
  setSessionCookie,
  userAgent,
  verifyOtp,
} from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { audit } from '@/lib/db';
import { normalizePhone } from '@/lib/phone';

export const POST = withHandler(async (req: NextRequest) => {
  const { phone, code } = await readJson<{ phone: string; code: string }>(req);
  const normalized = normalizePhone(phone ?? '');
  if (!normalized) throw new HttpError(400, 'Numéro de téléphone invalide.');
  if (!code || !/^\d{6}$/.test(code.trim())) throw new HttpError(400, 'Code à 6 chiffres requis.');

  const ip = await clientIp();
  const ok = await verifyOtp(normalized, code, ip);
  if (!ok) throw new HttpError(400, 'Code incorrect.', 'invalid_code');

  const { id: userId, isNew } = await findOrCreateUser(normalized);
  const ua = await userAgent();
  const deviceId = await registerDevice(userId, ua);
  const token = await createSessionToken(userId, normalized, deviceId);
  await setSessionCookie(token);

  await audit({ actor: userId, action: isNew ? 'user.created' : 'user.login', ip });

  return json({ ok: true, isNew });
});
