import { createHmac, timingSafeEqual } from 'node:crypto';
import { CINETPAY } from '../config';
import type { InitContext, InitResult, Order, PaymentProvider, RemoteStatus } from './types';

/**
 * Agregateur CinetPay (Orange Money, Moov, Wave, cartes) — couvre le Burkina.
 * Doc : https://docs.cinetpay.com
 *
 * Point de securite : la notification entrante n'est jamais consideree comme
 * source de verite. On verifie le HMAC quand la cle secrete est configuree,
 * puis on reconfirme systematiquement le statut via /payment/check.
 */

/** Champs concatenes, dans cet ordre exact, pour former le HMAC du header x-token. */
const HMAC_FIELDS = [
  'cpm_site_id',
  'cpm_trans_id',
  'cpm_trans_date',
  'cpm_amount',
  'cpm_currency',
  'signature',
  'payment_method',
  'cel_phone_num',
  'cpm_phone_prefixe',
  'cpm_language',
  'cpm_version',
  'cpm_payment_config',
  'cpm_page_action',
  'cpm_custom',
  'cpm_designation',
  'cpm_error_message',
];

export const cinetpay: PaymentProvider = {
  id: 'cinetpay',
  label: 'CinetPay',

  async init(ctx: InitContext): Promise<InitResult> {
    if (!CINETPAY.apiKey || !CINETPAY.siteId) {
      throw new Error('CINETPAY_API_KEY / CINETPAY_SITE_ID ne sont pas configures.');
    }

    const res = await fetch(`${CINETPAY.baseUrl}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY.apiKey,
        site_id: CINETPAY.siteId,
        transaction_id: ctx.order.id,
        amount: ctx.order.amount,
        currency: ctx.order.currency,
        description: 'Acces au livre Gold Strategy',
        channels: 'MOBILE_MONEY',
        lang: 'fr',
        return_url: ctx.returnUrl,
        notify_url: ctx.notifyUrl,
        customer_name: ctx.customerName || 'Client',
        customer_surname: '',
        customer_phone_number: ctx.customerPhone,
        metadata: ctx.order.user_id,
      }),
    });

    const data = (await res.json()) as {
      code?: string;
      message?: string;
      description?: string;
      data?: { payment_token?: string; payment_url?: string };
    };

    if (data.code !== '201' || !data.data?.payment_url) {
      throw new Error(`CinetPay a refuse la creation : ${data.message ?? data.description ?? res.status}`);
    }

    return {
      redirectUrl: data.data.payment_url,
      providerRef: data.data.payment_token ?? ctx.order.id,
      raw: data,
    };
  },

  async parseWebhook(req: Request, body: string) {
    const params = new URLSearchParams(body);
    const orderId = params.get('cpm_trans_id');

    // Verification du HMAC quand la cle secrete est disponible.
    const token = req.headers.get('x-token');
    if (CINETPAY.secretKey && token) {
      const payload = HMAC_FIELDS.map((f) => params.get(f) ?? '').join('');
      const expected = createHmac('sha256', CINETPAY.secretKey).update(payload).digest('hex');
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(token, 'utf8');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new Error('Signature CinetPay invalide.');
      }
    }

    return { orderId, providerRef: params.get('cpm_payid') };
  },

  async checkStatus(order: Order): Promise<{ status: RemoteStatus; raw?: unknown }> {
    const res = await fetch(`${CINETPAY.baseUrl}/payment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY.apiKey,
        site_id: CINETPAY.siteId,
        transaction_id: order.id,
      }),
    });

    const data = (await res.json()) as {
      code?: string;
      data?: { status?: string; amount?: string | number; currency?: string };
    };

    const remote = data.data?.status;
    let status: RemoteStatus = 'pending';
    if (remote === 'ACCEPTED') status = 'paid';
    else if (remote === 'REFUSED' || remote === 'CANCELED') status = 'failed';

    // Garde-fou : on n'encaisse jamais un montant different de celui commande.
    if (status === 'paid') {
      const amount = Number(data.data?.amount ?? 0);
      if (amount && amount < order.amount) {
        return { status: 'failed', raw: { ...data, reason: 'montant_insuffisant' } };
      }
    }

    return { status, raw: data };
  },
};
