import { LIGDICASH, MERCHANT_NAME, APP_URL } from '../config';
import type { InitContext, InitResult, Order, PaymentProvider, RemoteStatus } from './types';

/**
 * Agregateur LigdiCash (burkinabe) — Orange Money BF, Moov, Coris, cartes.
 * Doc : https://developers.ligdicash.com
 *
 * LigdiCash ne signe pas ses callbacks : on ne fait donc que recuperer le token
 * de la notification, puis on confirme le statut via l'endpoint /confirm.
 */

function headers() {
  if (!LIGDICASH.apiKey || !LIGDICASH.apiToken) {
    throw new Error('LIGDICASH_API_KEY / LIGDICASH_API_TOKEN ne sont pas configures.');
  }
  return {
    Apikey: LIGDICASH.apiKey,
    Authorization: `Bearer ${LIGDICASH.apiToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export const ligdicash: PaymentProvider = {
  id: 'ligdicash',
  label: 'LigdiCash',

  async init(ctx: InitContext): Promise<InitResult> {
    const res = await fetch(`${LIGDICASH.baseUrl}/redirect/checkout-invoice/create`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        commande: {
          invoice: {
            items: [
              {
                name: 'Gold Strategy by Nosbe Trade',
                description: 'Acces a vie au livre numerique',
                quantity: 1,
                unit_price: ctx.order.amount,
                total_price: ctx.order.amount,
              },
            ],
            total_amount: ctx.order.amount,
            devise: ctx.order.currency,
            description: 'Acces au livre Gold Strategy',
            customer: ctx.customerPhone,
            customer_firstname: ctx.customerName || 'Client',
            customer_lastname: '',
            customer_email: '',
          },
          store: { name: MERCHANT_NAME, website_url: APP_URL },
          actions: {
            cancel_url: ctx.returnUrl,
            return_url: ctx.returnUrl,
            callback_url: ctx.notifyUrl,
          },
          custom_data: { order_id: ctx.order.id, user_id: ctx.order.user_id },
        },
      }),
    });

    const data = (await res.json()) as {
      response_code?: string;
      token?: string;
      response_text?: string;
      description?: string;
    };

    if (data.response_code !== '00' || !data.response_text || !data.token) {
      throw new Error(`LigdiCash a refuse la creation : ${data.description ?? data.response_code ?? res.status}`);
    }

    return { redirectUrl: data.response_text, providerRef: data.token, raw: data };
  },

  async parseWebhook(_req: Request, body: string) {
    // Le callback arrive en JSON ou en form-urlencoded selon la configuration.
    let orderId: string | null = null;
    let providerRef: string | null = null;

    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      const custom = (json.custom_data ?? {}) as Record<string, unknown>;
      orderId = (custom.order_id as string) ?? null;
      providerRef = (json.token as string) ?? (json.invoice_token as string) ?? null;
    } catch {
      const params = new URLSearchParams(body);
      orderId = params.get('order_id');
      providerRef = params.get('token') ?? params.get('invoice_token');
    }

    return { orderId, providerRef };
  },

  async checkStatus(order: Order): Promise<{ status: RemoteStatus; raw?: unknown }> {
    if (!order.provider_ref) return { status: 'pending' };

    const url = `${LIGDICASH.baseUrl}/redirect/checkout-invoice/confirm/?invoiceToken=${encodeURIComponent(order.provider_ref)}`;
    const res = await fetch(url, { method: 'GET', headers: headers() });
    const data = (await res.json()) as {
      response_code?: string;
      status?: string;
      amount?: string | number;
    };

    let status: RemoteStatus = 'pending';
    if (data.status === 'completed') status = 'paid';
    else if (data.status === 'nocompleted' || data.status === 'canceled') status = 'failed';

    if (status === 'paid') {
      const amount = Number(data.amount ?? 0);
      if (amount && amount < order.amount) {
        return { status: 'failed', raw: { ...data, reason: 'montant_insuffisant' } };
      }
    }

    return { status, raw: data };
  },
};
