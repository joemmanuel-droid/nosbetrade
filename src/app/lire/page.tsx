import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasAccess } from '@/lib/entitlements';
import { CHAPTERS } from '@/content/book';
import { query } from '@/lib/db';

export default async function ReaderEntryPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?next=/lire');

  const owns = await hasAccess(session.id);

  if (owns) {
    // Reprend le dernier chapitre non termine, sinon commence au debut.
    const rows = await query<{ chapter_id: string; percent: number }>(
      `SELECT chapter_id, percent FROM reading_progress
        WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5`,
      [session.id],
    );
    const unfinished = rows.find((r) => r.percent < 95);
    redirect(`/lire/${unfinished?.chapter_id ?? CHAPTERS[0].id}`);
  }

  redirect(`/lire/${CHAPTERS[0].id}`);
}
