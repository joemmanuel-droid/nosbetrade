import { clearAdminUnlockCookie, clearSessionCookie } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';

export const POST = withHandler(async () => {
  await clearSessionCookie();
  await clearAdminUnlockCookie();
  return json({ ok: true });
});
