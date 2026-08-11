import type { NextRequest } from 'next/server';
import { HttpError, requireUser } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { PAYMENT_PROVIDER } from '@/lib/config';
import { execute, now } from '@/lib/db';
import { getUserOrder, reconcileOrder } from '@/lib/orders';

/**
 * Route de developpement uniquement : simule le verdict d'un paiement pour
 * derouler le parcours complet sans compte marchand actif. Refuse tout appel
 * quand le fournisseur par defaut n'est pas `simulation`.
 */
export const POST = withHandler(async (req: NextRequest, { params }) => {
  if (PAYMENT_PROVIDER !== 'simulation') {
    throw new HttpError(404, 'Introuvable.');
  }

  const user = await requireUser();
  const { id } = await params;
  const { result } = await readJson<{ result: 'paid' | 'failed' }>(req);
  if (result !== 'paid' && result !== 'failed') throw new HttpError(400, 'Résultat invalide.');

  const order = await getUserOrder(user.id, id);
  if (!order) throw new HttpError(404, 'Commande introuvable.');
  if (order.provider !== 'simulation') throw new HttpError(400, "Cette commande n'est pas simulée.");

  await execute('UPDATE orders SET note = ?, updated_at = ? WHERE id = ?', [
    `sim:${result}`,
    now(),
    order.id,
  ]);
  const updated = await reconcileOrder(order);
  return json({ order: updated });
});
