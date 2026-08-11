import { HttpError, requireAdmin } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { audit } from '@/lib/db';
import { getOrder, settleOrderPaid } from '@/lib/orders';

/** Validation manuelle : l'admin a verifie le depot mobile money et accorde l'acces. */
export const POST = withHandler(async (_req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const order = await getOrder(id);
  if (!order) throw new HttpError(404, 'Commande introuvable.');
  if (order.status === 'paid') return json({ ok: true, order });
  if (order.provider !== 'manual') throw new HttpError(400, "Cette commande n'est pas manuelle.");

  await settleOrderPaid(order, { approvedBy: admin.phone });
  await audit({ actor: admin.id, action: 'order.approved_manually', target: order.id });

  return json({ ok: true, order: await getOrder(id) });
});
