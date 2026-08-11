import type { NextRequest } from 'next/server';
import { HttpError, clientIp, issueOtp } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { shouldEchoOtp, sendOtp } from '@/lib/notify';
import { normalizePhone } from '@/lib/phone';
import { verifyTurnstile } from '@/lib/turnstile';

export const POST = withHandler(async (req: NextRequest) => {
  const { phone, turnstileToken } = await readJson<{ phone: string; turnstileToken?: string }>(req);
  const normalized = normalizePhone(phone ?? '');
  if (!normalized) throw new HttpError(400, 'Numéro de téléphone invalide.');

  const ip = await clientIp();

  const humanVerified = await verifyTurnstile(turnstileToken, ip);
  if (!humanVerified) throw new HttpError(400, 'Vérification anti-robot échouée. Réessaie.');

  const { code, expiresAt } = await issueOtp(normalized, ip);
  await sendOtp(normalized, code);

  return json({
    ok: true,
    phone: normalized,
    expiresInSeconds: Math.round((expiresAt - Date.now()) / 1000),
    // Uniquement en developpement local, quand aucune passerelle SMS n'est branchee.
    devCode: shouldEchoOtp() ? code : undefined,
  });
});
