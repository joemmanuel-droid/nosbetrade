import 'server-only';
import { createClient, type Client, type InValue } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from './config';

/**
 * SQLite via libsql : un simple fichier en local, et exactement le meme code
 * pointe vers Turso en production (DATABASE_URL=libsql://... + token).
 */

let _client: Client | null = null;
let _schemaReady: Promise<void> | null = null;

function client(): Client {
  if (_client) return _client;

  if (DATABASE_URL.startsWith('file:')) {
    const rel = DATABASE_URL.slice('file:'.length);
    const abs = path.resolve(process.cwd(), rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    _client = createClient({ url: 'file:' + abs });
  } else {
    _client = createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN || undefined });
  }
  return _client;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id          TEXT PRIMARY KEY,
     phone       TEXT NOT NULL UNIQUE,
     name        TEXT,
     created_at  INTEGER NOT NULL,
     last_seen_at INTEGER,
     blocked     INTEGER NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS otp_codes (
     id         TEXT PRIMARY KEY,
     phone      TEXT NOT NULL,
     code_hash  TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     attempts   INTEGER NOT NULL DEFAULT 0,
     consumed_at INTEGER,
     created_at INTEGER NOT NULL,
     ip         TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at)`,

  `CREATE TABLE IF NOT EXISTS devices (
     id           TEXT PRIMARY KEY,
     user_id      TEXT NOT NULL,
     label        TEXT,
     user_agent   TEXT,
     created_at   INTEGER NOT NULL,
     last_seen_at INTEGER NOT NULL,
     revoked_at   INTEGER,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id)`,

  `CREATE TABLE IF NOT EXISTS orders (
     id           TEXT PRIMARY KEY,
     user_id      TEXT NOT NULL,
     product_id   TEXT NOT NULL,
     provider     TEXT NOT NULL,
     operator     TEXT,
     amount       INTEGER NOT NULL,
     currency     TEXT NOT NULL,
     status       TEXT NOT NULL,
     provider_ref TEXT,
     payer_phone  TEXT,
     proof_ref    TEXT,
     note         TEXT,
     created_at   INTEGER NOT NULL,
     updated_at   INTEGER NOT NULL,
     settled_at   INTEGER,
     raw          TEXT,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_ref ON orders(provider, provider_ref)
     WHERE provider_ref IS NOT NULL`,

  `CREATE TABLE IF NOT EXISTS entitlements (
     id          TEXT PRIMARY KEY,
     user_id     TEXT NOT NULL,
     product_id  TEXT NOT NULL,
     source      TEXT NOT NULL,
     order_id    TEXT,
     granted_at  INTEGER NOT NULL,
     revoked_at  INTEGER,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_active
     ON entitlements(user_id, product_id) WHERE revoked_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS access_codes (
     code        TEXT PRIMARY KEY,
     product_id  TEXT NOT NULL,
     note        TEXT,
     created_at  INTEGER NOT NULL,
     expires_at  INTEGER,
     used_by     TEXT,
     used_at     INTEGER
   )`,

  `CREATE TABLE IF NOT EXISTS reading_progress (
     user_id     TEXT NOT NULL,
     product_id  TEXT NOT NULL,
     chapter_id  TEXT NOT NULL,
     percent     INTEGER NOT NULL DEFAULT 0,
     updated_at  INTEGER NOT NULL,
     PRIMARY KEY (user_id, product_id, chapter_id)
   )`,

  `CREATE TABLE IF NOT EXISTS audit_log (
     id         TEXT PRIMARY KEY,
     actor      TEXT,
     action     TEXT NOT NULL,
     target     TEXT,
     meta       TEXT,
     ip         TEXT,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`,

  `CREATE TABLE IF NOT EXISTS rate_limits (
     key        TEXT PRIMARY KEY,
     count      INTEGER NOT NULL,
     window_at  INTEGER NOT NULL
   )`,
];

export async function ensureSchema(): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = (async () => {
      const c = client();
      for (const stmt of SCHEMA) await c.execute(stmt);
    })().catch((e) => {
      _schemaReady = null;
      throw e;
    });
  }
  return _schemaReady;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  await ensureSchema();
  const res = await client().execute({ sql, args });
  // Les lignes libsql sont des objets hybrides (indices numeriques + cles
  // nommees), pas de simples objets litteraux. Passees telles quelles a un
  // composant client depuis un composant serveur, React les rejette ("Only
  // plain objects can be passed..."). On reconstruit donc explicitement un
  // objet plat par ligne, a partir de la liste de colonnes — la seule
  // methode fiable quelle que soit l'implementation interne de Row.
  const cols = res.columns;
  return res.rows.map((row) => {
    const plain: Record<string, unknown> = {};
    const r = row as unknown as Record<string, unknown>;
    for (const c of cols) plain[c] = r[c];
    return plain;
  }) as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function execute(sql: string, args: InValue[] = []) {
  await ensureSchema();
  return client().execute({ sql, args });
}

/** Transaction simple pour les operations critiques (encaissement, octroi d'acces). */
export async function transaction<T>(fn: (tx: Client) => Promise<T>): Promise<T> {
  await ensureSchema();
  const c = client();
  const tx = await c.transaction('write');
  try {
    const out = await fn(tx as unknown as Client);
    await tx.commit();
    return out;
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function now(): number {
  return Date.now();
}

export async function audit(entry: {
  actor?: string | null;
  action: string;
  target?: string | null;
  meta?: unknown;
  ip?: string | null;
}) {
  await execute(
    `INSERT INTO audit_log (id, actor, action, target, meta, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('log'),
      entry.actor ?? null,
      entry.action,
      entry.target ?? null,
      entry.meta === undefined ? null : JSON.stringify(entry.meta),
      entry.ip ?? null,
      now(),
    ],
  );
}

/**
 * Limiteur de debit a fenetre fixe, stocke en base : suffisant pour proteger
 * l'envoi d'OTP et la creation de commandes sur un deploiement mono-region.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const t = now();
  const windowStart = t - (t % windowMs);
  const row = await queryOne<{ count: number; window_at: number }>(
    'SELECT count, window_at FROM rate_limits WHERE key = ?',
    [key],
  );
  if (!row || row.window_at !== windowStart) {
    await execute(
      `INSERT INTO rate_limits (key, count, window_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_at = excluded.window_at`,
      [key, windowStart],
    );
    return true;
  }
  if (row.count >= max) return false;
  await execute('UPDATE rate_limits SET count = count + 1 WHERE key = ?', [key]);
  return true;
}
