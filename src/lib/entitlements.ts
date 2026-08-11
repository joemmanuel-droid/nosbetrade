import { PRODUCT } from './config';
import { audit, execute, newId, now, queryOne } from './db';

export type EntitlementSource = 'purchase' | 'access_code' | 'admin_grant';

/** L'utilisateur a-t-il un acces actif au livre ? */
export async function hasAccess(userId: string, productId = PRODUCT.id): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND revoked_at IS NULL',
    [userId, productId],
  );
  return !!row;
}

/**
 * Octroie l'acces. Idempotent : rappeler la fonction pour un utilisateur qui a
 * deja l'acces ne cree pas de doublon (l'index unique partiel le garantit) et
 * ne provoque pas d'erreur — un webhook rejoue ne casse donc rien.
 */
export async function grantAccess(opts: {
  userId: string;
  source: EntitlementSource;
  orderId?: string | null;
  actor?: string | null;
  productId?: string;
}): Promise<{ granted: boolean }> {
  const productId = opts.productId ?? PRODUCT.id;
  if (await hasAccess(opts.userId, productId)) return { granted: false };

  await execute(
    `INSERT INTO entitlements (id, user_id, product_id, source, order_id, granted_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT DO NOTHING`,
    [newId('ent'), opts.userId, productId, opts.source, opts.orderId ?? null, now()],
  );

  await audit({
    actor: opts.actor ?? opts.userId,
    action: 'entitlement.granted',
    target: opts.userId,
    meta: { source: opts.source, orderId: opts.orderId ?? null, productId },
  });
  return { granted: true };
}

export async function revokeAccess(userId: string, actor: string, productId = PRODUCT.id) {
  await execute(
    'UPDATE entitlements SET revoked_at = ? WHERE user_id = ? AND product_id = ? AND revoked_at IS NULL',
    [now(), userId, productId],
  );
  await audit({ actor, action: 'entitlement.revoked', target: userId, meta: { productId } });
}
