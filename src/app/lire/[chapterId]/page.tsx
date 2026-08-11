import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CHAPTERS, getChapter, tableOfContents } from '@/content/book';
import { getSession } from '@/lib/auth';
import { hasAccess } from '@/lib/entitlements';
import { BlockRenderer } from '@/components/reader/BlockRenderer';
import { ReaderChrome } from '@/components/reader/ReaderChrome';
import { Button } from '@/components/ui';
import { PRODUCT, formatXof } from '@/lib/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = getChapter(chapterId);
  return { title: chapter ? `${chapter.n}. ${chapter.title}` : 'Chapitre' };
}

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const chapter = getChapter(chapterId);
  if (!chapter) notFound();

  const session = await getSession();
  if (!session) redirect(`/connexion?next=/lire/${chapterId}`);

  const owns = chapter.free ? true : await hasAccess(session.id);
  const toc = tableOfContents();
  const idx = CHAPTERS.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
  const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;

  if (!owns) {
    return (
      <ReaderChrome chapterId={chapter.id} chapterN={chapter.n} chapterTitle={chapter.title} toc={toc} hasAccess={false}>
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-2xl">
            🔒
          </div>
          <h1 className="mt-5 text-xl font-bold">
            {chapter.n}. {chapter.title}
          </h1>
          <p className="mt-2 max-w-sm text-[15px] text-[var(--text-dim)]">{chapter.subtitle}</p>
          <p className="mt-6 max-w-sm text-sm text-[var(--text-faint)]">
            Ce chapitre fait partie du contenu complet du livre. Débloque l'accès à vie pour continuer la
            lecture.
          </p>
          <div className="mt-6 w-full max-w-xs">
            <Button href="/acheter" full size="lg">
              Débloquer — {formatXof(PRODUCT.priceXof)}
            </Button>
          </div>
          {prev && (
            <Link href={`/lire/${prev.id}`} className="mt-4 text-sm text-[var(--text-faint)] underline underline-offset-2">
              ← Revenir au chapitre précédent
            </Link>
          )}
        </main>
      </ReaderChrome>
    );
  }

  return (
    <ReaderChrome chapterId={chapter.id} chapterN={chapter.n} chapterTitle={chapter.title} toc={toc} hasAccess>
      <main className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
          Chapitre {chapter.n}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight">{chapter.title}</h1>
        <p className="mt-1.5 text-[15px] text-[var(--text-faint)]">{chapter.subtitle}</p>

        <div className="reader-prose mt-7">
          {chapter.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} figureBase="/api/figure" />
          ))}
        </div>

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-6">
          {prev ? (
            <Link href={`/lire/${prev.id}`} className="text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/lire/${next.id}`}
              className="rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-3)]"
            >
              {next.title} →
            </Link>
          ) : (
            <span className="text-sm text-[var(--text-faint)]">Fin du livre 🎉</span>
          )}
        </nav>
      </main>
    </ReaderChrome>
  );
}
