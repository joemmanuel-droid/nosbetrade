import { getSession } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { hasAccess } from '@/lib/entitlements';

export const GET = withHandler(async () => {
  const session = await getSession();
  if (!session) return json({ user: null, hasAccess: false });

  return json({
    user: { phone: session.phone, name: session.name, isAdmin: session.isAdmin },
    hasAccess: await hasAccess(session.id),
  });
});
