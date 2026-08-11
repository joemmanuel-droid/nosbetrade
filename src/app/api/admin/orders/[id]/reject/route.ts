import type { NextRequest } from 'next/server';
import { HttpError, requireAdmin } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { audit, execute, now } from '@/lib/db';
import { getOrder, settleOrderFailed } from '@/lib/orders';

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { reason } = await readJson<{ reason?: string }>(req).catch(() => ({ reason: undefined }));

  const order = await getOrder(id);
  if (!order) throw new HttpError(404, 'Commande introuvable.');
  if (order.status === 'paid') throw new HttpError(400, 'Commande déjà payée, impossible à rejeter.');

  await settleOrderFailed(order, { rejectedBy: admin.phone, reason });
  if (reason) await execute('UPDATE orders SET note = ? WHERE id = ?', [reason.slice(0, 300), id]);
  await audit({ actor: admin.id, action: 'order.rejected', target: order.id, meta: { reason } });

  return json({ ok: true, order: await getOrder(id) });
});
