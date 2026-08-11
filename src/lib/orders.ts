import { MANUAL_PAYMENT_ENABLED, PRODUCT } from './config';
import { audit, execute, newId, now, queryOne } from './db';
import { grantAccess, hasAccess } from './entitlements';
import { notifyAdminNewOrder } from './notify';
import { defaultProvider, getProvider, type Order, type OrderStatus } from './payments';

export async function getOrder(id: string): Promise<Order | null> {
  return queryOne<Order>('SELECT * FROM orders WHERE id = ?', [id]);
}

export async function getUserOrder(userId: string, id: string): Promise<Order | null> {
  return queryOne<Order>('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
}

/**
 * Cree une commande pour le fournisseur automatique par defaut. Si l'acces
 * est deja actif, on le signale plutot que de facturer une seconde fois.
 */
export async function createAutoOrder(userId: string): Promise<{ order: Order; alreadyOwned: boolean }> {
  if (await hasAccess(userId)) {
    const existing = await queryOne<Order>(
      `SELECT * FROM orders WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (existing) return { order: existing, alreadyOwned: true };
  }

  const provider = defaultProvider();
  const id = newId('ord');
  const t = now();
  await execute(
    `INSERT INTO orders
       (id, user_id, product_id, provider, amount, currency, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, userId, PRODUCT.id, provider.id, PRODUCT.priceXof, PRODUCT.currency, t, t],
  );
  const order = await getOrder(id);
  if (!order) throw new Error('Échec de création de commande.');
  return { order, alreadyOwned: false };
}

/** Cree une commande en mode manuel (depot direct puis reference collee par le client). */
export async function createManualOrder(
  userId: string,
  operator: string,
): Promise<Order> {
  if (!MANUAL_PAYMENT_ENABLED) throw new Error('Le paiement manuel est désactivé.');
  const id = newId('ord');
  const t = now();
  await execute(
    `INSERT INTO orders
       (id, user_id, product_id, provider, operator, amount, currency, status, created_at, updated_at)
     VALUES (?, ?, ?, 'manual', ?, ?, ?, 'awaiting_proof', ?, ?)`,
    [id, userId, PRODUCT.id, operator, PRODUCT.priceXof, PRODUCT.currency, t, t],
  );
  const order = await getOrder(id);
  if (!order) throw new Error('Échec de création de commande.');
  return order;
}

/** Le client colle la reference de transaction (SMS de confirmation mobile money). */
export async function attachManualProof(
  orderId: string,
  userId: string,
  proofRef: string,
  payerPhone: string,
): Promise<Order> {
  const order = await getUserOrder(userId, orderId);
  if (!order) throw new Error('Commande introuvable.');
  if (order.status !== 'awaiting_proof') throw new Error('Cette commande ne peut plus recevoir de preuve.');

  await execute(
    `UPDATE orders SET status = 'review', proof_ref = ?, payer_phone = ?, updated_at = ? WHERE id = ?`,
    [proofRef.trim().slice(0, 120), payerPhone, now(), orderId],
  );
  await audit({ actor: userId, action: 'order.proof_submitted', target: orderId, meta: { proofRef } });

  // Fire-and-forget : une notification ratee ne doit jamais bloquer le client,
  // la commande est de toute facon visible dans /admin.
  void notifyAdminNewOrder({
    id: orderId,
    phone: payerPhone,
    amount: order.amount,
    operator: order.operator,
    proofRef,
  });

  return (await getOrder(orderId))!;
}

export async function attachProviderRef(orderId: string, providerRef: string) {
  await execute('UPDATE orders SET provider_ref = ?, updated_at = ? WHERE id = ?', [
    providerRef,
    now(),
    orderId,
  ]);
}

async function setStatus(orderId: string, status: OrderStatus, raw?: unknown) {
  const settled = status === 'paid' ? now() : null;
  await execute(
    `UPDATE orders SET status = ?, raw = ?, updated_at = ?, settled_at = COALESCE(?, settled_at) WHERE id = ?`,
    [status, raw !== undefined ? JSON.stringify(raw) : null, now(), settled, orderId],
  );
}

/**
 * Marque une commande payee et accorde l'acces. Idempotent par construction :
 * `grantAccess` ne cree pas de doublon, donc rejouer un webhook ou un retry
 * est toujours sans danger.
 */
export async function settleOrderPaid(order: Order, raw?: unknown): Promise<void> {
  if (order.status === 'paid') return; // deja traite
  await setStatus(order.id, 'paid', raw);
  await grantAccess({ userId: order.user_id, source: 'purchase', orderId: order.id, actor: 'system' });
  await audit({ actor: 'system', action: 'order.paid', target: order.id, meta: { provider: order.provider } });
}

export async function settleOrderFailed(order: Order, raw?: unknown): Promise<void> {
  if (order.status === 'paid') return;
  await setStatus(order.id, 'failed', raw);
  await audit({ actor: 'system', action: 'order.failed', target: order.id, meta: { provider: order.provider } });
}

/**
 * Reconfirme le statut d'une commande automatique aupres de l'agregateur.
 * Utilise a la fois par le webhook et par le polling cote client : les deux
 * chemins convergent vers la meme fonction, donc aucune course n'est possible.
 */
export async function reconcileOrder(order: Order): Promise<Order> {
  if (order.status === 'paid' || order.provider === 'manual') return order;

  const provider = getProvider(order.provider);
  if (!provider) return order;

  const { status, raw } = await provider.checkStatus(order);
  if (status === 'paid') await settleOrderPaid(order, raw);
  else if (status === 'failed') await settleOrderFailed(order, raw);

  return (await getOrder(order.id)) ?? order;
}
