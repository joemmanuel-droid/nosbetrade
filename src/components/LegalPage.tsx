import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from './ui';

/**
 * Mise en page commune aux pages legales. Le bandeau "brouillon" est
 * volontairement visible et non-decoratif : ces textes sont un point de
 * depart redige automatiquement, pas un document valide juridiquement tant
 * qu'un professionnel local ne l'a pas relu.
 */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-[var(--text-faint)] underline underline-offset-2">
        ← Accueil
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-[var(--text-faint)]">Dernière mise à jour : {updated}</p>

      <Card className="mt-5 border-l-[3px] !border-l-[var(--gold)] bg-[rgba(217,166,62,0.07)] p-4">
        <p className="text-sm font-semibold text-[var(--gold-soft)]">Document à faire relire</p>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Ce texte a été rédigé automatiquement à titre de point de départ raisonnable. Il doit être relu et
          validé par un professionnel du droit avant d'être considéré comme définitif, notamment pour les
          obligations locales (immatriculation, fiscalité, protection des données) applicables au Burkina Faso.
        </p>
      </Card>

      <div className="legal-prose mt-8 space-y-6 text-[15px] leading-relaxed text-[var(--text-dim)]">
        {children}
      </div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-[var(--text)]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[var(--gold-soft)]">
      [{children} — à compléter]
    </span>
  );
}
