import type { NextRequest } from 'next/server';
import { HttpError, clientIp, requireUser } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { PRODUCT } from '@/lib/config';
import { execute, now, queryOne, rateLimit } from '@/lib/db';
import { grantAccess, hasAccess } from '@/lib/entitlements';

/** Echange un code d'acces (offert, promo, remplacement) contre l'acces au livre. */
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  // L'espace des codes est enorme (10 caracteres sur un alphabet de 32 =
  // impossible a deviner en pratique), mais on limite quand meme les essais :
  // defense en profondeur bon marche contre un script qui balaierait des
  // codes au hasard.
  const ip = await clientIp();
  const okUser = await rateLimit(`redeem:user:${user.id}`, 10, 60 * 60_000);
  const okIp = ip ? await rateLimit(`redeem:ip:${ip}`, 20, 60 * 60_000) : true;
  if (!okUser || !okIp) throw new HttpError(429, 'Trop de tentatives. Réessaie dans une heure.');

  const { code } = await readJson<{ code: string }>(req);
  const normalized = (code ?? '').trim().toUpperCase();
  if (!normalized) throw new HttpError(400, 'Code requis.');

  const row = await queryOne<{
    code: string;
    product_id: string;
    expires_at: number | null;
    used_by: string | null;
  }>('SELECT code, product_id, expires_at, used_by FROM access_codes WHERE code = ?', [normalized]);

  if (!row) throw new HttpError(404, 'Code invalide.');
  if (row.used_by) throw new HttpError(400, 'Ce code a déjà été utilisé.');
  if (row.expires_at && row.expires_at < now()) throw new HttpError(400, 'Ce code a expiré.');

  if (await hasAccess(user.id, row.product_id)) {
    return json({ ok: true, alreadyOwned: true });
  }

  await execute('UPDATE access_codes SET used_by = ?, used_at = ? WHERE code = ?', [
    user.id,
    now(),
    normalized,
  ]);
  await grantAccess({ userId: user.id, source: 'access_code', actor: user.id, productId: row.product_id });

  return json({ ok: true, alreadyOwned: false, product: row.product_id === PRODUCT.id ? PRODUCT.name : row.product_id });
});
