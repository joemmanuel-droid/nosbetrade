import Link from 'next/link';
import { BOOK, CHAPTERS, FREE_CHAPTER_COUNT, TOTAL_MINUTES, tableOfContents } from '@/content/book';
import { PRODUCT, formatXof } from '@/lib/config';
import { Badge, Button, Card } from '@/components/ui';

export default function LandingPage() {
  const toc = tableOfContents();

  return (
    <main className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-72.png" alt="" width={30} height={30} className="rounded-[8px]" />
            <span className="text-[15px] font-semibold tracking-tight">{BOOK.author}</span>
          </div>
          <Button href="/connexion" variant="ghost" size="sm">
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pb-8 pt-10 text-center">
        <Badge tone="gold">{BOOK.tagline}</Badge>
        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
          {BOOK.title}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--text-faint)]">par {BOOK.author}</p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
          {BOOK.pitch}
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <Button href="/lire" size="lg" full={false}>
            Lire l'aperçu gratuit
          </Button>
          <Button href="/acheter" variant="outline" size="md">
            Débloquer l'accès complet — {formatXof(PRODUCT.priceXof)}
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--text-faint)]">
          <span>{CHAPTERS.length} chapitres</span>
          <span aria-hidden>•</span>
          <span>~{TOTAL_MINUTES} min de lecture</span>
          <span aria-hidden>•</span>
          <span>{FREE_CHAPTER_COUNT} chapitres gratuits</span>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-2xl px-5 py-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--text-faint)]">COMMENT ÇA MARCHE</h2>
          <ol className="mt-4 space-y-4">
            {[
              ['Lis gratuitement', `Les ${FREE_CHAPTER_COUNT} premiers chapitres sont ouverts, sans compte payant.`],
              ['Paye par Mobile Money', 'Orange Money, Moov Money, Telecel Money ou Wave — en quelques secondes.'],
              ['Accède à vie', "Le livre reste disponible sur ton téléphone, à tout moment, même sur un nouvel appareil."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-semibold text-[var(--gold-soft)]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{title}</p>
                  <p className="text-sm text-[var(--text-dim)]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Sommaire */}
      <section className="mx-auto max-w-2xl px-5 py-6">
        <h2 className="px-1 text-sm font-semibold text-[var(--text-faint)]">SOMMAIRE</h2>
        <Card className="mt-3 divide-y divide-[var(--border-soft)] overflow-hidden">
          {toc.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {c.n}. {c.title}
                </p>
                <p className="truncate text-xs text-[var(--text-faint)]">{c.subtitle}</p>
              </div>
              {c.free ? <Badge tone="green">Gratuit</Badge> : <Badge tone="neutral">🔒 {c.minutes} min</Badge>}
            </div>
          ))}
        </Card>
      </section>

      {/* Paiement */}
      <section className="mx-auto max-w-2xl px-5 py-6">
        <Card className="p-5 text-center">
          <p className="text-sm text-[var(--text-dim)]">Accès complet, paiement unique</p>
          <p className="mt-1 text-3xl font-bold text-[var(--gold-soft)]">{formatXof(PRODUCT.priceXof)}</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">Sans abonnement · Accès à vie</p>
          <div className="mt-4">
            <Button href="/acheter" full>
              Débloquer maintenant
            </Button>
          </div>
        </Card>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-2xl px-5 pb-10 pt-2">
        <p className="text-center text-xs leading-relaxed text-[var(--text-faint)]">{BOOK.disclaimer}</p>
        <p className="mt-4 text-center text-xs text-[var(--text-faint)]">
          Assistance : <a href={`https://wa.me/${BOOK.whatsapp.replace(/[^\d]/g, '')}`} className="underline decoration-[var(--border)] underline-offset-2">WhatsApp {BOOK.whatsapp}</a>
        </p>
        <p className="mt-3 flex items-center justify-center gap-3 text-xs text-[var(--text-faint)]">
          <Link href="/cgv" className="underline decoration-[var(--border)] underline-offset-2">
            Conditions générales de vente
          </Link>
          <span aria-hidden>·</span>
          <Link href="/mentions-legales" className="underline decoration-[var(--border)] underline-offset-2">
            Mentions légales
          </Link>
        </p>
      </section>
    </main>
  );
}
