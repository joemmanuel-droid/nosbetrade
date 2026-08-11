import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import {
  ADMIN_ACCESS_CODE,
  ADMIN_PHONES,
  IS_PROD,
  MAX_DEVICES,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
  SESSION_SECRET,
  SESSION_TTL_DAYS,
} from './config';
import { audit, execute, newId, now, query, queryOne, rateLimit } from './db';

const SECRET = new TextEncoder().encode(SESSION_SECRET);
export const SESSION_COOKIE = 'nb_session';
export const ADMIN_UNLOCK_COOKIE = 'nb_admin_unlock';
const ADMIN_UNLOCK_TTL_HOURS = 12;

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  deviceId: string;
  isAdmin: boolean;
};

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export async function createSessionToken(userId: string, phone: string, deviceId: string) {
  return new SignJWT({ phone, did: deviceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(SECRET);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 3600,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Lit la session courante. Verifie la signature du jeton ET que l'appareil
 * associe n'a pas ete revoque : un jeton vole reste inutilisable une fois
 * l'appareil retire depuis le compte.
 */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let sub: string, did: string;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    sub = String(payload.sub ?? '');
    did = String(payload.did ?? '');
    if (!sub || !did) return null;
  } catch {
    return null;
  }

  const row = await queryOne<{
    id: string;
    phone: string;
    name: string | null;
    blocked: number;
    device_revoked: number | null;
  }>(
    `SELECT u.id, u.phone, u.name, u.blocked, d.revoked_at AS device_revoked
       FROM users u
       JOIN devices d ON d.id = ? AND d.user_id = u.id
      WHERE u.id = ?`,
    [did, sub],
  );

  if (!row || row.blocked || row.device_revoked) return null;

  void execute('UPDATE devices SET last_seen_at = ? WHERE id = ?', [now(), did]).catch(() => {});

  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    deviceId: did,
    isAdmin: ADMIN_PHONES.includes(row.phone),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new HttpError(401, 'Connexion requise.');
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireUser();
  if (!s.isAdmin) throw new HttpError(403, 'Accès réservé.');
  if (adminUnlockRequired() && !(await isAdminUnlocked(s.id))) {
    throw new HttpError(401, 'Code d’accès admin requis.', 'admin_locked');
  }
  return s;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Appareils                                                           */
/* ------------------------------------------------------------------ */

export async function registerDevice(userId: string, userAgent: string): Promise<string> {
  const active = await query<{ id: string }>(
    'SELECT id FROM devices WHERE user_id = ? AND revoked_at IS NULL ORDER BY last_seen_at ASC',
    [userId],
  );

  // Au-dela de la limite, on revoque le plus ancien appareil plutot que de
  // bloquer la connexion : l'utilisateur legitime qui change de telephone ne
  // doit jamais rester dehors.
  if (active.length >= MAX_DEVICES) {
    const toRevoke = active.slice(0, active.length - MAX_DEVICES + 1);
    for (const d of toRevoke) {
      await execute('UPDATE devices SET revoked_at = ? WHERE id = ?', [now(), d.id]);
    }
    await audit({ actor: userId, action: 'device.auto_revoked', meta: { count: toRevoke.length } });
  }

  const id = newId('dev');
  await execute(
    `INSERT INTO devices (id, user_id, label, user_agent, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, deviceLabel(userAgent), userAgent.slice(0, 300), now(), now()],
  );
  return id;
}

function deviceLabel(ua: string): string {
  if (/iPhone|iPad/i.test(ua)) return 'iPhone / iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS/i.test(ua)) return 'Mac';
  return 'Navigateur';
}

/* ------------------------------------------------------------------ */
/* OTP                                                                 */
/* ------------------------------------------------------------------ */

function hashCode(phone: string, code: string): string {
  return createHmac('sha256', SESSION_SECRET).update(`${phone}:${code}`).digest('hex');
}

export async function issueOtp(
  phone: string,
  ip: string | null,
): Promise<{ code: string; expiresAt: number }> {
  const okPhone = await rateLimit(`otp:phone:${phone}`, 5, 15 * 60_000);
  if (!okPhone) throw new HttpError(429, 'Trop de demandes. Réessaie dans 15 minutes.');
  if (ip) {
    const okIp = await rateLimit(`otp:ip:${ip}`, 20, 15 * 60_000);
    if (!okIp) throw new HttpError(429, 'Trop de demandes depuis ce réseau.');
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = now() + OTP_TTL_SECONDS * 1000;

  // Un seul code actif par numero : les precedents sont invalides.
  await execute('UPDATE otp_codes SET consumed_at = ? WHERE phone = ? AND consumed_at IS NULL', [
    now(),
    phone,
  ]);
  await execute(
    `INSERT INTO otp_codes (id, phone, code_hash, expires_at, created_at, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId('otp'), phone, hashCode(phone, code), expiresAt, now(), ip],
  );

  return { code, expiresAt };
}

export async function verifyOtp(phone: string, code: string, ip?: string | null): Promise<boolean> {
  // Limite par IP en plus de la limite par code (OTP_MAX_ATTEMPTS) : sans ca,
  // un attaquant qui fait tourner des numeros de telephone differents depuis
  // la meme adresse contourne la limite par code. 30 essais / 15 min laisse
  // largement de la marge a un utilisateur legitime qui se trompe.
  if (ip) {
    const okIp = await rateLimit(`otp-verify:ip:${ip}`, 30, 15 * 60_000);
    if (!okIp) throw new HttpError(429, 'Trop de tentatives depuis ce réseau. Réessaie dans 15 minutes.');
  }

  const row = await queryOne<{ id: string; code_hash: string; expires_at: number; attempts: number }>(
    `SELECT id, code_hash, expires_at, attempts FROM otp_codes
      WHERE phone = ? AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  if (!row) throw new HttpError(400, 'Aucun code en cours. Demande un nouveau code.');
  if (row.expires_at < now()) throw new HttpError(400, 'Code expiré. Demande un nouveau code.');
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    throw new HttpError(429, 'Trop de tentatives. Demande un nouveau code.');
  }

  await execute('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);

  const expected = Buffer.from(row.code_hash, 'hex');
  const given = Buffer.from(hashCode(phone, code.trim()), 'hex');
  const ok = expected.length === given.length && timingSafeEqual(expected, given);
  if (!ok) return false;

  await execute('UPDATE otp_codes SET consumed_at = ? WHERE id = ?', [now(), row.id]);
  return true;
}

export async function findOrCreateUser(phone: string): Promise<{ id: string; isNew: boolean }> {
  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing) {
    await execute('UPDATE users SET last_seen_at = ? WHERE id = ?', [now(), existing.id]);
    return { id: existing.id, isNew: false };
  }
  const id = newId('usr');
  await execute(
    'INSERT INTO users (id, phone, created_at, last_seen_at) VALUES (?, ?, ?, ?)',
    [id, phone, now(), now()],
  );
  return { id, isNew: true };
}

/* ------------------------------------------------------------------ */
/* Second facteur admin                                                */
/* ------------------------------------------------------------------ */

/**
 * Faut-il un code d'acces admin en plus du telephone ? Desactive tant que
 * ADMIN_ACCESS_CODE n'est pas configure (voir config.ts pour le pourquoi).
 */
export function adminUnlockRequired(): boolean {
  return ADMIN_ACCESS_CODE.length > 0;
}

/**
 * Jeton de deverrouillage : un JWT distinct de la session, avec son propre
 * "purpose" pour ne jamais pouvoir etre confondu avec un jeton de session
 * normal, lie a l'utilisateur precis qui l'a obtenu, et de duree courte.
 */
async function signAdminUnlockToken(userId: string): Promise<string> {
  return new SignJWT({ purpose: 'admin-unlock' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_UNLOCK_TTL_HOURS}h`)
    .sign(SECRET);
}

export async function setAdminUnlockCookie(userId: string) {
  const token = await signAdminUnlockToken(userId);
  const jar = await cookies();
  jar.set(ADMIN_UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_UNLOCK_TTL_HOURS * 3600,
  });
}

export async function clearAdminUnlockCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_UNLOCK_COOKIE);
}

export async function isAdminUnlocked(userId: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_UNLOCK_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.purpose === 'admin-unlock' && payload.sub === userId;
  } catch {
    return false;
  }
}

/**
 * Verifie le code d'acces admin. Fortement rate-limite : c'est desormais la
 * cle du back-office, elle doit resister au brute force meme si le numero
 * de telephone admin est connu (voir le commentaire sur ADMIN_ACCESS_CODE).
 */
export async function verifyAdminAccessCode(
  code: string,
  userId: string,
  ip: string | null,
): Promise<boolean> {
  const okUser = await rateLimit(`admin-unlock:user:${userId}`, 5, 30 * 60_000);
  const okIp = ip ? await rateLimit(`admin-unlock:ip:${ip}`, 8, 30 * 60_000) : true;
  if (!okUser || !okIp) {
    throw new HttpError(429, 'Trop de tentatives. Réessaie dans 30 minutes.');
  }

  const expected = Buffer.from(ADMIN_ACCESS_CODE);
  const given = Buffer.from((code ?? '').trim());
  return expected.length > 0 && expected.length === given.length && timingSafeEqual(expected, given);
}

/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip');
}

export async function userAgent(): Promise<string> {
  const h = await headers();
  return h.get('user-agent') ?? '';
}
