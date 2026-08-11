import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PAYMENT_PROVIDER, formatXof } from '@/lib/config';
import { getUserOrder } from '@/lib/orders';
import { SimulateButtons } from '@/components/SimulateButtons';
import { Card } from '@/components/ui';

/**
 * Page atteinte uniquement quand PAYMENT_PROVIDER=simulation (developpement).
 * Reproduit l'ecran de paiement d'un agregateur pour derouler tout le parcours
 * sans compte marchand actif.
 */
export default async function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (PAYMENT_PROVIDER !== 'simulation') redirect('/');

  const session = await getSession();
  if (!session) redirect(`/connexion?next=/acheter/simulation/${id}`);

  const order = await getUserOrder(session.id, id);
  if (!order) redirect('/acheter');

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Card className="p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
          Simulation — développement
        </p>
        <h1 className="mt-2 text-lg font-bold">Écran agrégateur simulé</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">
          Aucun agrégateur mobile money n'est configuré. Choisis une issue pour tester le parcours complet.
        </p>
        <p className="mt-4 text-2xl font-bold text-[var(--gold-soft)]">{formatXof(order.amount)}</p>

        <div className="mt-6">
          <SimulateButtons orderId={order.id} />
        </div>
      </Card>
    </main>
  );
}
