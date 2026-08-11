import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { query } from '@/lib/db';

/** Liste des commandes, filtrable par statut (par defaut : celles a valider manuellement). */
export const GET = withHandler(async (req: NextRequest) => {
  await requireAdmin();
  const status = req.nextUrl.searchParams.get('status');

  const rows = await query<Record<string, unknown>>(
    status
      ? `SELECT o.*, u.phone AS user_phone FROM orders o JOIN users u ON u.id = o.user_id
          WHERE o.status = ? ORDER BY o.created_at DESC LIMIT 200`
      : `SELECT o.*, u.phone AS user_phone FROM orders o JOIN users u ON u.id = o.user_id
          ORDER BY o.created_at DESC LIMIT 200`,
    status ? [status] : [],
  );

  return json({ orders: rows });
});
