import { redirect } from 'next/navigation';
import { adminUnlockRequired, getSession, isAdminUnlocked } from '@/lib/auth';
import { AUTH_MODE, formatXof } from '@/lib/config';
import { query, queryOne } from '@/lib/db';
import { Badge, Card } from '@/components/ui';
import { AdminOrders, type AdminOrder } from '@/components/admin/AdminOrders';
import { AdminAccessCodes, type AccessCode } from '@/components/admin/AdminAccessCodes';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminUnlockForm } from '@/components/admin/AdminUnlockForm';
import { AdminLockButton } from '@/components/admin/AdminLockButton';

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?next=/admin');

  if (!session.isAdmin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-lg font-bold">Accès réservé</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">
          Ce numéro n'a pas les droits d'administration.
        </p>
      </main>
    );
  }

  // Deuxieme facteur : le numero admin peut aussi etre affiche publiquement
  // comme numero de paiement manuel (voir lib/config.ts ADMIN_ACCESS_CODE).
  if (adminUnlockRequired() && !(await isAdminUnlocked(session.id))) {
    return <AdminUnlockForm />;
  }

  const [sales, pendingReview, totalUsers, reviewOrders, codes] = await Promise.all([
    queryOne<{ count: number; revenue: number }>(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS revenue FROM orders WHERE status = 'paid'`,
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*) AS count FROM orders WHERE status = 'review'`),
    queryOne<{ count: number }>(`SELECT COUNT(*) AS count FROM users`),
    query<AdminOrder>(
      `SELECT o.id, u.phone AS user_phone, o.provider, o.operator, o.amount, o.status,
              o.proof_ref, o.payer_phone, o.created_at
         FROM orders o JOIN users u ON u.id = o.user_id
        WHERE o.status IN ('review', 'awaiting_proof')
        ORDER BY o.created_at DESC LIMIT 50`,
    ),
    query<AccessCode>('SELECT * FROM access_codes ORDER BY created_at DESC LIMIT 50'),
  ]);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Back-office</h1>
        <div className="flex items-center gap-2">
          <Badge tone="gold">{session.phone}</Badge>
          {adminUnlockRequired() && <AdminLockButton />}
        </div>
      </div>

      {AUTH_MODE === 'phone_only' && (
        <div className="mb-6 rounded-[var(--radius-sm)] border-l-[3px] border-l-[var(--red)] bg-[var(--red-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--red-soft)]">
            ⚠️ Mode sans vérification actif (AUTH_MODE=phone_only)
          </p>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            N'importe qui entrant un numéro se connecte avec ce numéro, sans preuve. À désactiver dès
            qu'une passerelle SMS est branchée — voir le README.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-[var(--text-faint)]">Ventes</p>
          <p className="mt-1 text-lg font-bold">{sales?.count ?? 0}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-[var(--text-faint)]">Revenu total</p>
          <p className="mt-1 text-lg font-bold text-[var(--gold-soft)]">{formatXof(sales?.revenue ?? 0)}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-[var(--text-faint)]">Comptes</p>
          <p className="mt-1 text-lg font-bold">{totalUsers?.count ?? 0}</p>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-faint)]">À VALIDER</h2>
          {pendingReview && pendingReview.count > 0 && <Badge tone="gold">{pendingReview.count}</Badge>}
        </div>
        <AdminOrders orders={reviewOrders} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-faint)]">CODES D'ACCÈS</h2>
        <AdminAccessCodes initialCodes={codes} />
      </section>

      <section className="mt-8 mb-10">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-faint)]">UTILISATEURS</h2>
        <AdminUsers />
      </section>
    </main>
  );
}
