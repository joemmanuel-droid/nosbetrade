import type { NextRequest } from 'next/server';
import { HttpError, requireAdmin } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { audit, execute, now, queryOne } from '@/lib/db';

/**
 * Bloque ou debloque un compte. Un compte bloque perd sa session au prochain
 * appel (verifie dans getSession(), voir lib/auth.ts) : pas besoin de purger
 * ses appareils, le blocage prend effet immediatement.
 */
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { blocked } = await readJson<{ blocked: boolean }>(req);
  if (typeof blocked !== 'boolean') throw new HttpError(400, 'Paramètre "blocked" (booléen) requis.');

  const target = await queryOne<{ id: string; phone: string }>('SELECT id, phone FROM users WHERE id = ?', [id]);
  if (!target) throw new HttpError(404, 'Compte introuvable.');
  if (target.phone === admin.phone) throw new HttpError(400, 'Impossible de te bloquer toi-même.');

  await execute('UPDATE users SET blocked = ? WHERE id = ?', [blocked ? 1 : 0, id]);
  await audit({ actor: admin.id, action: blocked ? 'user.blocked' : 'user.unblocked', target: id });

  return json({ ok: true, blocked });
});
