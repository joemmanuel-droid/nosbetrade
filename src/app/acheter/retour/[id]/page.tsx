import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserOrder, reconcileOrder } from '@/lib/orders';
import { OrderStatusView } from '@/components/OrderStatusView';
import { BOOK } from '@/content/book';

export default async function RetourAchatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/connexion?next=/acheter/retour/${id}`);

  let order = await getUserOrder(session.id, id);
  if (!order) redirect('/acheter');
  if (order.status === 'pending') order = await reconcileOrder(order);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <OrderStatusView orderId={id} initialStatus={order.status} whatsapp={BOOK.whatsapp} />
    </main>
  );
}
