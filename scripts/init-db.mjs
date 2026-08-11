// Cree les tables si elles n'existent pas encore. Utile avant le premier
// deploiement (ex: Turso) pour ne pas faire porter la premiere requete HTTP
// du cout de creation du schema. Le schema est aussi cree paresseusement au
// premier appel a la base par l'application (voir src/lib/db.ts) : ce script
// est un confort, pas une etape obligatoire.
//
// IMPORTANT : la liste de tables ci-dessous doit rester synchronisee avec
// SCHEMA dans src/lib/db.ts si ce fichier est modifie.
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/app.db';
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || undefined;

let client;
if (DATABASE_URL.startsWith('file:')) {
  const abs = path.resolve(process.cwd(), DATABASE_URL.slice('file:'.length));
  mkdirSync(path.dirname(abs), { recursive: true });
  client = createClient({ url: 'file:' + abs });
} else {
  client = createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE, name TEXT,
     created_at INTEGER NOT NULL, last_seen_at INTEGER, blocked INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS otp_codes (
     id TEXT PRIMARY KEY, phone TEXT NOT NULL, code_hash TEXT NOT NULL,
     expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
     consumed_at INTEGER, created_at INTEGER NOT NULL, ip TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at)`,
  `CREATE TABLE IF NOT EXISTS devices (
     id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT, user_agent TEXT,
     created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, revoked_at INTEGER,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id)`,
  `CREATE TABLE IF NOT EXISTS orders (
     id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL,
     provider TEXT NOT NULL, operator TEXT, amount INTEGER NOT NULL, currency TEXT NOT NULL,
     status TEXT NOT NULL, provider_ref TEXT, payer_phone TEXT, proof_ref TEXT, note TEXT,
     created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, settled_at INTEGER, raw TEXT,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_ref ON orders(provider, provider_ref) WHERE provider_ref IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS entitlements (
     id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL, source TEXT NOT NULL,
     order_id TEXT, granted_at INTEGER NOT NULL, revoked_at INTEGER,
     FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_active ON entitlements(user_id, product_id) WHERE revoked_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS access_codes (
     code TEXT PRIMARY KEY, product_id TEXT NOT NULL, note TEXT, created_at INTEGER NOT NULL,
     expires_at INTEGER, used_by TEXT, used_at INTEGER
   )`,
  `CREATE TABLE IF NOT EXISTS reading_progress (
     user_id TEXT NOT NULL, product_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
     percent INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL,
     PRIMARY KEY (user_id, product_id, chapter_id)
   )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id TEXT PRIMARY KEY, actor TEXT, action TEXT NOT NULL, target TEXT, meta TEXT, ip TEXT,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
     key TEXT PRIMARY KEY, count INTEGER NOT NULL, window_at INTEGER NOT NULL
   )`,
];

for (const stmt of SCHEMA) await client.execute(stmt);
console.log(`Schéma prêt sur ${DATABASE_URL}`);
