import { APP_URL } from '../config';
import { queryOne } from '../db';
import type { InitContext, InitResult, Order, PaymentProvider, RemoteStatus } from './types';

/**
 * Fournisseur factice pour le developpement et la recette.
 * Aucun appel reseau : il redirige vers une page interne ou l'on choisit
 * "paiement reussi" ou "paiement echoue", ce qui permet de derouler tout le
 * parcours d'achat sans compte marchand.
 */
export const simulation: PaymentProvider = {
  id: 'simulation',
  label: 'Simulation (développement)',

  async init(ctx: InitContext): Promise<InitResult> {
    return {
      redirectUrl: `${APP_URL}/acheter/simulation/${ctx.order.id}`,
      providerRef: `sim_${ctx.order.id}`,
    };
  },

  async parseWebhook(_req: Request, body: string) {
    const params = new URLSearchParams(body);
    return { orderId: params.get('order_id'), providerRef: null };
  },

  async checkStatus(order: Order): Promise<{ status: RemoteStatus }> {
    // La page de simulation ecrit le verdict dans `note`.
    const row = await queryOne<{ note: string | null; status: string }>(
      'SELECT note, status FROM orders WHERE id = ?',
      [order.id],
    );
    if (row?.status === 'paid') return { status: 'paid' };
    if (row?.note === 'sim:paid') return { status: 'paid' };
    if (row?.note === 'sim:failed') return { status: 'failed' };
    return { status: 'pending' };
  },
};
