import { requireAdmin } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { queryOne } from '@/lib/db';

export const GET = withHandler(async () => {
  await requireAdmin();

  const sales = await queryOne<{ count: number; revenue: number }>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS revenue FROM orders WHERE status = 'paid'`,
  );
  const pendingReview = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM orders WHERE status = 'review'`,
  );
  const users = await queryOne<{ count: number }>(`SELECT COUNT(*) AS count FROM users`);
  const last7d = await queryOne<{ count: number; revenue: number }>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS revenue FROM orders
      WHERE status = 'paid' AND settled_at > ?`,
    [Date.now() - 7 * 86_400_000],
  );

  return json({
    totalSales: sales?.count ?? 0,
    totalRevenue: sales?.revenue ?? 0,
    pendingReview: pendingReview?.count ?? 0,
    totalUsers: users?.count ?? 0,
    last7dSales: last7d?.count ?? 0,
    last7dRevenue: last7d?.revenue ?? 0,
  });
});
