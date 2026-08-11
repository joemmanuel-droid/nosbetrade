import type { NextRequest } from 'next/server';
import { HttpError, requireUser } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { PRODUCT } from '@/lib/config';
import { execute, now, query } from '@/lib/db';
import { CHAPTER_IDS } from '@/content/book';

export const GET = withHandler(async () => {
  const user = await requireUser();
  const rows = await query<{ chapter_id: string; percent: number }>(
    'SELECT chapter_id, percent FROM reading_progress WHERE user_id = ? AND product_id = ?',
    [user.id, PRODUCT.id],
  );
  const progress: Record<string, number> = {};
  for (const r of rows) progress[r.chapter_id] = r.percent;
  return json({ progress });
});

export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const { chapterId, percent } = await readJson<{ chapterId: string; percent: number }>(req);

  if (!CHAPTER_IDS.includes(chapterId)) throw new HttpError(400, 'Chapitre inconnu.');
  const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));

  await execute(
    `INSERT INTO reading_progress (user_id, product_id, chapter_id, percent, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, product_id, chapter_id)
     DO UPDATE SET percent = excluded.percent, updated_at = excluded.updated_at`,
    [user.id, PRODUCT.id, chapterId, p, now()],
  );
  return json({ ok: true });
});
