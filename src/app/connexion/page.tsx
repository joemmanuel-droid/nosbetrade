import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AUTH_MODE, TURNSTILE_SITE_KEY } from '@/lib/config';
import { AuthForm } from '@/components/AuthForm';

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') ? next : '/lire';

  const session = await getSession();
  if (session) redirect(safeNext);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <img src="/icons/icon-72.png" alt="" width={44} height={44} className="mx-auto rounded-[11px]" />
        <h1 className="mt-4 text-xl font-bold">Connexion</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Entre ton numéro pour lire ou débloquer le livre.
        </p>
      </div>

      <AuthForm
        next={safeNext}
        turnstileSiteKey={TURNSTILE_SITE_KEY || undefined}
        phoneOnly={AUTH_MODE === 'phone_only'}
      />

      <Link href="/" className="mt-6 text-center text-sm text-[var(--text-faint)] underline underline-offset-2">
        ← Retour à l'accueil
      </Link>
    </main>
  );
}
