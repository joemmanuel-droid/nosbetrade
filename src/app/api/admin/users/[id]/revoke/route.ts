import { requireAdmin } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { revokeAccess } from '@/lib/entitlements';

export const POST = withHandler(async (_req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  await revokeAccess(id, admin.id);
  return json({ ok: true });
});
