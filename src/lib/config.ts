import 'server-only';
import { INDICATIF_PAYS as PUBLIC_INDICATIF_PAYS } from './public-constants';

/**
 * Configuration centrale, lue depuis l'environnement avec des defauts surs.
 *
 * Protege par 'server-only' : ce module valide des secrets au chargement
 * (voir SESSION_SECRET plus bas) et ne doit jamais atterrir dans le bundle
 * navigateur. Toute tentative d'import depuis un composant client echoue au
 * build plutot que de crasher silencieusement en production.
 * Les constantes non sensibles necessaires cote client vivent dans
 * ./public-constants.
 */

function env(key: string, fallback = ''): string {
  return (process.env[key] ?? fallback).trim();
}

function envInt(key: string, fallback: number): number {
  const v = parseInt(env(key), 10);
  return Number.isFinite(v) ? v : fallback;
}

export const APP_URL = env('APP_URL', 'http://localhost:3000').replace(/\/+$/, '');

export const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Secret de signature des sessions et des URLs de figures.
 * En production, l'absence de secret est une erreur : on refuse de demarrer
 * avec une valeur devinable.
 */
export const SESSION_SECRET = (() => {
  const s = env('SESSION_SECRET');
  if (s.length >= 32) return s;
  if (IS_PROD) {
    throw new Error(
      'SESSION_SECRET manquant ou trop court (32 caracteres minimum). Genere-le avec: node scripts/gen-secret.mjs',
    );
  }
  return 'dev-secret-non-securise-a-remplacer-en-production';
})();

export const DATABASE_URL = env('DATABASE_URL', 'file:./data/app.db');
export const DATABASE_AUTH_TOKEN = env('DATABASE_AUTH_TOKEN');

/** Produit unique : le livre. Achat a vie. */
export const PRODUCT = {
  id: 'gold-strategy',
  name: 'Gold Strategy by Nosbe Trade',
  priceXof: envInt('PRICE_XOF', 5000),
  currency: 'XOF' as const,
};

/** Prix affiche : 5 000 F CFA */
export function formatXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR').replace(/ | /g, ' ')} F CFA`;
}

/**
 * Fournisseur de paiement automatique.
 * - `simulation` : aucun appel reseau, sert au developpement et aux tests.
 * - `cinetpay` / `ligdicash` : agregateurs mobile money.
 * Le mode manuel reste toujours disponible en parallele.
 */
export type ProviderId = 'simulation' | 'cinetpay' | 'ligdicash';
export const PAYMENT_PROVIDER = (env('PAYMENT_PROVIDER', 'simulation') as ProviderId) || 'simulation';
export const MANUAL_PAYMENT_ENABLED = env('MANUAL_PAYMENT_ENABLED', 'true') !== 'false';

export const CINETPAY = {
  apiKey: env('CINETPAY_API_KEY'),
  siteId: env('CINETPAY_SITE_ID'),
  secretKey: env('CINETPAY_SECRET_KEY'),
  baseUrl: env('CINETPAY_BASE_URL', 'https://api-checkout.cinetpay.com/v2'),
};

export const LIGDICASH = {
  apiKey: env('LIGDICASH_API_KEY'),
  apiToken: env('LIGDICASH_API_TOKEN'),
  baseUrl: env('LIGDICASH_BASE_URL', 'https://app.ligdicash.com/pay/v01'),
};

/** Numeros marchands affiches pour le paiement manuel. */
export type ManualTarget = { operator: string; label: string; number: string; color: string };

export const MANUAL_TARGETS: ManualTarget[] = [
  { operator: 'orange', label: 'Orange Money', number: env('MM_ORANGE_NUMBER'), color: '#ff7900' },
  { operator: 'moov', label: 'Moov Money (Flooz)', number: env('MM_MOOV_NUMBER'), color: '#0a6cff' },
  { operator: 'telecel', label: 'Telecel Money', number: env('MM_TELECEL_NUMBER'), color: '#e2001a' },
  { operator: 'wave', label: 'Wave', number: env('MM_WAVE_NUMBER'), color: '#1dc3f4' },
].filter((t) => t.number.length > 0);

export const MERCHANT_NAME = env('MERCHANT_NAME', 'Nosbe Trade');
export const SUPPORT_WHATSAPP = env('SUPPORT_WHATSAPP', '+22606726239');

/** Numeros autorises a ouvrir le back-office (format international, sans espaces). */
export const ADMIN_PHONES = env('ADMIN_PHONES', '+22606726239')
  .split(',')
  .map((s) => s.replace(/[^\d+]/g, ''))
  .filter(Boolean);

/**
 * Second facteur pour le back-office : un secret distinct du numero de
 * telephone admin, exige en plus de la connexion OTP pour atteindre /admin.
 *
 * Pourquoi : le numero admin sert aussi souvent de numero marchand affiche a
 * tous les clients (paiement manuel) — un attaquant qui le connait pourrait
 * tenter de se connecter avec ce numero. Ce code, connu du seul admin,
 * empeche ce scenario meme si le numero est public.
 *
 * Vide = comportement precedent (telephone seul suffit) : n'affecte pas un
 * environnement de developpement qui n'a pas encore configure ce secret,
 * mais DOIT etre defini avant un vrai lancement des que le numero admin est
 * aussi utilise comme numero de paiement.
 */
export const ADMIN_ACCESS_CODE = env('ADMIN_ACCESS_CODE');
if (ADMIN_ACCESS_CODE && ADMIN_ACCESS_CODE.length < 10) {
  console.warn(
    '[config] ADMIN_ACCESS_CODE est court (< 10 caracteres) — prefere une valeur longue et aleatoire (npm run gen:secret).',
  );
}

/**
 * Mode d'authentification.
 * - `otp`         : comportement normal, code a 6 chiffres verifie (defaut, sur).
 * - `phone_only`  : AUCUNE verification — n'importe qui entrant un numero se
 *                   connecte instantanement avec ce numero. Decision produit
 *                   explicite pour lever la friction le temps qu'une
 *                   passerelle SMS soit branchee ; N'IMPORTE QUI connaissant
 *                   le numero d'un client peut alors lire son livre achete a
 *                   sa place. A desactiver (repasser a `otp`) des que
 *                   possible — voir README, section "Mode sans verification".
 *                   Le second facteur admin (ADMIN_ACCESS_CODE) reste actif
 *                   independamment : /admin n'est pas affaibli par ce mode.
 */
export const AUTH_MODE = (env('AUTH_MODE', 'otp') as 'otp' | 'phone_only') || 'otp';
if (AUTH_MODE === 'phone_only') {
  console.warn(
    '[config] AUTH_MODE=phone_only — AUCUNE verification de telephone. ' +
      "N'importe qui entrant le numero d'un client accede a son compte. Mode temporaire, voir README.",
  );
}

/**
 * Transport du code OTP (ignore si AUTH_MODE=phone_only).
 * - `console` : ecrit dans les logs serveur (developpement / test prive).
 * - `twilio`  : envoi reel par SMS ou WhatsApp via Twilio.
 * - `http`    : POST generique { to, message } vers OTP_HTTP_URL, pour
 *               brancher n'importe quelle autre passerelle.
 */
export const OTP_TRANSPORT = env('OTP_TRANSPORT', 'console') as 'console' | 'twilio' | 'http';
export const OTP_HTTP_URL = env('OTP_HTTP_URL');
export const OTP_HTTP_TOKEN = env('OTP_HTTP_TOKEN');
export const OTP_TTL_SECONDS = envInt('OTP_TTL_SECONDS', 600);
export const OTP_MAX_ATTEMPTS = envInt('OTP_MAX_ATTEMPTS', 5);

/**
 * Twilio — https://console.twilio.com
 * `channel: 'sms'` envoie un SMS classique ; `channel: 'whatsapp'` envoie un
 * message WhatsApp (le compte Twilio doit avoir WhatsApp active, sandbox ou
 * numero de production approuve par Meta). Le meme compte gere les deux :
 * changer de canal ne demande qu'une variable, pas un nouveau prestataire.
 */
export const TWILIO = {
  accountSid: env('TWILIO_ACCOUNT_SID'),
  authToken: env('TWILIO_AUTH_TOKEN'),
  // Optionnel : une cle API (SID commencant par "SK") peut remplacer le
  // couple AccountSid/AuthToken pour l'authentification Basic — Twilio
  // accepte les deux de facon interchangeable. Si presente, TWILIO_AUTH_TOKEN
  // doit alors contenir le "Client secret" de cette cle API.
  apiKeySid: env('TWILIO_API_KEY_SID'),
  fromNumber: env('TWILIO_FROM_NUMBER'), // ex: +15017122661, ou "whatsapp:+14155238886" pour le sandbox WhatsApp
  channel: (env('TWILIO_CHANNEL', 'sms') as 'sms' | 'whatsapp') || 'sms',
};

/**
 * Cloudflare Turnstile (anti-bot sur la demande de code OTP) — entierement
 * optionnel. Tant que les deux cles ne sont pas renseignees, le widget ne
 * s'affiche jamais et la verification est ignoree : comportement identique
 * a aujourd'hui. Cle gratuite sur https://dash.cloudflare.com/?to=/:account/turnstile
 */
export const TURNSTILE_SITE_KEY = env('TURNSTILE_SITE_KEY');
export const TURNSTILE_SECRET_KEY = env('TURNSTILE_SECRET_KEY');

export const SESSION_TTL_DAYS = envInt('SESSION_TTL_DAYS', 60);

/**
 * Webhook generique appele quand une commande manuelle attend une validation
 * admin. Compatible tel quel avec un webhook entrant Slack ou Discord (colle
 * juste l'URL) ; sinon n'importe quel endpoint qui accepte du JSON en POST.
 * Sans valeur : la notification est simplement loguee cote serveur.
 */
export const ADMIN_NOTIFY_URL = env('ADMIN_NOTIFY_URL');
export const ADMIN_NOTIFY_TOKEN = env('ADMIN_NOTIFY_TOKEN');

/** Nombre maximum d'appareils simultanes par compte (anti-partage). */
export const MAX_DEVICES = envInt('MAX_DEVICES', 2);

/** Reexporte depuis public-constants : source unique, lisible aussi cote client. */
export const INDICATIF_PAYS = PUBLIC_INDICATIF_PAYS;
