import { clearAdminUnlockCookie, requireUser } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { audit } from '@/lib/db';

/** Reverrouille manuellement le back-office (avant de preter l'appareil, par exemple). */
export const POST = withHandler(async () => {
  const user = await requireUser();
  await clearAdminUnlockCookie();
  await audit({ actor: user.id, action: 'admin.locked' });
  return json({ ok: true });
});
