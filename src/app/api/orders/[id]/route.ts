import { HttpError, requireUser } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { getUserOrder, reconcileOrder } from '@/lib/orders';
import { hasAccess } from '@/lib/entitlements';

/** Statut d'une commande — reconfirme aupres de l'agregateur si elle est encore en attente. */
export const GET = withHandler(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  let order = await getUserOrder(user.id, id);
  if (!order) throw new HttpError(404, 'Commande introuvable.');

  if (order.status === 'pending') {
    order = await reconcileOrder(order);
  }

  return json({ order, hasAccess: await hasAccess(user.id) });
});
