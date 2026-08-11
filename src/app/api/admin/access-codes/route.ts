import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { requireAdmin } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { PRODUCT } from '@/lib/config';
import { audit, execute, now, query } from '@/lib/db';

function generateCode(): string {
  // Alphabet sans caracteres ambigus (0/O, 1/I/L) pour une saisie fiable au telephone.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  let out = '';
  for (let i = 0; i < 10; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

export const GET = withHandler(async () => {
  await requireAdmin();
  const codes = await query(
    'SELECT * FROM access_codes ORDER BY created_at DESC LIMIT 200',
  );
  return json({ codes });
});

/** Genere un code d'acces offert (support, promo, remplacement d'appareil perdu). */
export const POST = withHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const { note, expiresInDays } = await readJson<{ note?: string; expiresInDays?: number }>(req);

  const code = generateCode();
  const expiresAt = expiresInDays ? now() + expiresInDays * 86_400_000 : null;

  await execute(
    `INSERT INTO access_codes (code, product_id, note, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [code, PRODUCT.id, (note ?? '').slice(0, 200) || null, now(), expiresAt],
  );
  await audit({ actor: admin.id, action: 'access_code.created', target: code, meta: { note } });

  return json({ code });
});
