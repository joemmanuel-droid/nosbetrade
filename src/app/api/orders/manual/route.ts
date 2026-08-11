import type { NextRequest } from 'next/server';
import { HttpError, requireUser } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { MANUAL_TARGETS } from '@/lib/config';
import { rateLimit } from '@/lib/db';
import { hasAccess } from '@/lib/entitlements';
import { createManualOrder } from '@/lib/orders';

/** Cree une commande en mode manuel : le client va payer directement un numero marchand. */
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  if (await hasAccess(user.id)) throw new HttpError(400, 'Tu as déjà accès au livre.');

  // Cree une ligne dans la file d'attente admin : on limite pour eviter
  // qu'un compte ne noie la file avec des commandes fantomes.
  const ok = await rateLimit(`order-create:user:${user.id}`, 15, 60 * 60_000);
  if (!ok) throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.');

  const { operator } = await readJson<{ operator: string }>(req);

  const target = MANUAL_TARGETS.find((t) => t.operator === operator);
  if (!target) throw new HttpError(400, 'Opérateur non disponible.');

  const order = await createManualOrder(user.id, operator);
  return json({ orderId: order.id, target });
});
