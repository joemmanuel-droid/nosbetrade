import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasAccess } from '@/lib/entitlements';
import { formatPhone } from '@/lib/phone';
import { BOOK } from '@/content/book';
import { Badge, Card } from '@/components/ui';
import { LogoutButton, RedeemCodeForm } from '@/components/AccountActions';

export default async function ComptePage() {
  const session = await getSession();
  if (!session) redirect('/connexion?next=/compte');

  const owns = await hasAccess(session.id);

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-5 py-10">
      <h1 className="text-xl font-bold">Mon compte</h1>

      <Card className="mt-5 p-4">
        <p className="text-xs text-[var(--text-faint)]">Numéro connecté</p>
        <p className="mt-1 text-[15px] font-medium">{formatPhone(session.phone)}</p>
        <div className="mt-3">
          {owns ? <Badge tone="green">Accès complet actif</Badge> : <Badge tone="neutral">Aperçu gratuit</Badge>}
        </div>
      </Card>

      {!owns && (
        <Card className="relative mt-4 p-4">
          <p className="text-sm font-medium">J'ai un code d'accès</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">Reçu par WhatsApp ou en promotion.</p>
          <div className="mt-3">
            <RedeemCodeForm />
          </div>
        </Card>
      )}

      {session.isAdmin && (
        <Link
          href="/admin"
          className="mt-4 block rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--gold-soft)] hover:bg-[var(--surface-2)]"
        >
          → Back-office admin
        </Link>
      )}

      <div className="mt-6 space-y-3">
        <LogoutButton />
        <a
          href={`https://wa.me/${BOOK.whatsapp.replace(/[^\d]/g, '')}`}
          className="block text-center text-sm text-[var(--text-faint)] underline underline-offset-2"
        >
          Contacter le support WhatsApp
        </a>
        <Link href="/lire" className="block text-center text-sm text-[var(--text-faint)] underline underline-offset-2">
          ← Retour à la lecture
        </Link>
        <p className="flex items-center justify-center gap-3 pt-2 text-xs text-[var(--text-faint)]">
          <Link href="/cgv" className="underline underline-offset-2">CGV</Link>
          <span aria-hidden>·</span>
          <Link href="/mentions-legales" className="underline underline-offset-2">Mentions légales</Link>
        </p>
      </div>
    </main>
  );
}
