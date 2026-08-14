import {
  ADMIN_NOTIFY_TOKEN,
  ADMIN_NOTIFY_URL,
  MERCHANT_NAME,
  OTP_HTTP_TOKEN,
  OTP_HTTP_URL,
  OTP_TRANSPORT,
  TWILIO,
  formatXof,
} from './config';
import { formatPhone, maskPhone } from './phone';

/**
 * Envoi du code OTP. Trois transports :
 *  - `console` : le code est ecrit dans les logs serveur (developpement / test prive).
 *  - `twilio`  : SMS ou WhatsApp reel via Twilio.
 *  - `http`    : POST generique { to, message } vers une passerelle de ton choix.
 */
export async function sendOtp(phone: string, code: string): Promise<{ delivered: boolean }> {
  const message = `${MERCHANT_NAME} : ton code de connexion est ${code}. Il expire dans 10 minutes. Ne le partage avec personne.`;

  if (OTP_TRANSPORT === 'twilio' && TWILIO.accountSid && TWILIO.authToken && TWILIO.fromNumber) {
    return sendViaTwilio(phone, message);
  }

  if (OTP_TRANSPORT === 'http' && OTP_HTTP_URL) {
    try {
      const res = await fetch(OTP_HTTP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(OTP_HTTP_TOKEN ? { Authorization: `Bearer ${OTP_HTTP_TOKEN}` } : {}),
        },
        body: JSON.stringify({ to: phone, message }),
      });
      if (!res.ok) {
        console.error('[otp] passerelle SMS en erreur', res.status, await res.text().catch(() => ''));
        return { delivered: false };
      }
      return { delivered: true };
    } catch (e) {
      console.error('[otp] passerelle SMS injoignable', e);
      return { delivered: false };
    }
  }

  console.log(`\n[OTP] ${maskPhone(phone)} -> code ${code}\n`);
  return { delivered: false };
}

/**
 * Envoi via l'API REST Twilio (SMS ou WhatsApp selon TWILIO_CHANNEL).
 * Aucune dependance npm : l'API Twilio est un simple POST forme + Basic Auth.
 */
async function sendViaTwilio(phone: string, message: string): Promise<{ delivered: boolean }> {
  const wrap = (n: string) =>
    TWILIO.channel === 'whatsapp' && !n.startsWith('whatsapp:') ? `whatsapp:${n}` : n;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO.accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${TWILIO.accountSid}:${TWILIO.authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: wrap(phone),
    From: wrap(TWILIO.fromNumber),
    Body: message,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      console.error('[otp] Twilio en erreur', res.status, await res.text().catch(() => ''));
      return { delivered: false };
    }
    return { delivered: true };
  } catch (e) {
    console.error('[otp] Twilio injoignable', e);
    return { delivered: false };
  }
}

/** Le code doit-il etre renvoye au navigateur ? Uniquement hors production. */
export function shouldEchoOtp(): boolean {
  return OTP_TRANSPORT === 'console' && process.env.NODE_ENV !== 'production';
}

/**
 * Previent l'admin qu'une commande manuelle attend une validation, plutot
 * que de compter sur une visite reguliere de /admin. Sans ADMIN_NOTIFY_URL
 * configuree, se contente d'un log serveur clair (meme repli que l'OTP).
 *
 * Le payload inclut `text` ET `content` : les webhooks entrants Slack et
 * Discord fonctionnent tous les deux directement en collant juste leur URL,
 * sans configuration supplementaire. N'importe quel autre endpoint recoit le
 * JSON structure complet.
 */
export async function notifyAdminNewOrder(order: {
  id: string;
  phone: string;
  amount: number;
  operator: string | null;
  proofRef: string | null;
}): Promise<void> {
  const line =
    `🔔 Nouvelle commande à valider — ${formatPhone(order.phone)} · ${formatXof(order.amount)}` +
    (order.operator ? ` · ${order.operator}` : '') +
    (order.proofRef ? `\nRéférence : ${order.proofRef}` : '') +
    `\nAdmin : ${process.env.APP_URL ?? ''}/admin`;

  if (!ADMIN_NOTIFY_URL) {
    console.log(`\n[admin] ${line.replace(/\n/g, ' — ')}\n`);
    return;
  }

  try {
    const res = await fetch(ADMIN_NOTIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_NOTIFY_TOKEN ? { Authorization: `Bearer ${ADMIN_NOTIFY_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        text: line,
        content: line,
        event: 'order.review_needed',
        orderId: order.id,
        phone: order.phone,
        amount: order.amount,
        operator: order.operator,
        proofRef: order.proofRef,
      }),
    });
    if (!res.ok) {
      console.error('[admin] webhook de notification en erreur', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    // Une notification ratee ne doit jamais faire echouer la soumission du
    // client : la commande reste visible dans /admin de toute facon.
    console.error('[admin] webhook de notification injoignable', e);
  }
}
