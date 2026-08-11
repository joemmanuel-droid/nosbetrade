import type { NextRequest } from 'next/server';
import { HttpError, requireUser } from '@/lib/auth';
import { json, withHandler } from '@/lib/api';
import { APP_URL } from '@/lib/config';
import { rateLimit } from '@/lib/db';
import { attachProviderRef, createAutoOrder } from '@/lib/orders';
import { defaultProvider } from '@/lib/payments';

/** Cree une commande via l'agregateur automatique par defaut et renvoie l'URL de paiement. */
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();

  // Cree potentiellement un appel sortant facture chez l'agregateur : on
  // limite les tentatives repetees (bouton spamme, script) sans genrer un
  // client legitime qui retente apres un paiement echoue.
  const ok = await rateLimit(`order-create:user:${user.id}`, 15, 60 * 60_000);
  if (!ok) throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.');

  const { order, alreadyOwned } = await createAutoOrder(user.id);

  if (alreadyOwned) return json({ alreadyOwned: true, orderId: order.id });
  if (order.status === 'paid') return json({ alreadyOwned: true, orderId: order.id });

  const provider = defaultProvider();
  try {
    const result = await provider.init({
      order,
      customerPhone: user.phone,
      customerName: user.name,
      returnUrl: `${APP_URL}/acheter/retour/${order.id}`,
      notifyUrl: `${APP_URL}/api/payments/webhook/${provider.id}`,
    });
    await attachProviderRef(order.id, result.providerRef);
    return json({ orderId: order.id, redirectUrl: result.redirectUrl });
  } catch (e) {
    console.error('[orders] échec init paiement', e);
    throw new HttpError(502, "Le paiement n'a pas pu être initialisé. Réessaie dans un instant.");
  }
});
