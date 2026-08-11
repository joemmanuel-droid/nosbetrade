import type { NextRequest } from 'next/server';
import { json, withHandler } from '@/lib/api';
import { audit } from '@/lib/db';
import { getOrder, reconcileOrder } from '@/lib/orders';
import { getProvider } from '@/lib/payments';

/**
 * Point d'entree webhook pour chaque agregateur.
 *
 * Principe de securite central : le contenu du webhook n'est JAMAIS la
 * source de verite du statut. Il sert uniquement a identifier QUELLE commande
 * verifier ; `reconcileOrder` rappelle ensuite l'agregateur en sortant
 * (server-to-server) pour connaitre le vrai statut. Un webhook falsifie ne
 * peut donc jamais, a lui seul, declencher un octroi d'acces.
 *
 * On repond toujours 200 rapidement (sauf agregateur inconnu) : les
 * agregateurs re-essaient en boucle sur les codes d'erreur, et un aller-retour
 * de reconciliation lent ne doit pas provoquer de tempete de retries.
 */
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) return json({ error: 'Fournisseur inconnu.' }, 404);

  const body = await req.text();

  let orderId: string | null = null;
  try {
    const parsed = await provider.parseWebhook(req, body);
    orderId = parsed.orderId;
  } catch (e) {
    await audit({ action: 'webhook.rejected', target: providerId, meta: { reason: String(e) } });
    return json({ error: 'Signature invalide.' }, 400);
  }

  if (!orderId) return json({ ok: true, note: 'sans identifiant de commande' });

  const order = await getOrder(orderId);
  if (!order || order.provider !== providerId) {
    return json({ ok: true, note: 'commande introuvable' });
  }

  await reconcileOrder(order);
  return json({ ok: true });
});
