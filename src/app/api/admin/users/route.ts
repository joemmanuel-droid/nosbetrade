import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { query } from '@/lib/db';

/** Recherche de comptes par numero (support client, verification d'achat). */
export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();

  const rows = await query<Record<string, unknown>>(
    `SELECT u.id, u.phone, u.created_at, u.last_seen_at, u.blocked,
            EXISTS(
              SELECT 1 FROM entitlements e
              WHERE e.user_id = u.id AND e.revoked_at IS NULL
            ) AS has_access
       FROM users u
      WHERE (? = '' OR u.phone LIKE '%' || ? || '%')
      ORDER BY u.created_at DESC
      LIMIT 50`,
    [q, q],
  );

  return json({ users: rows });
});
