import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasAccess } from '@/lib/entitlements';
import { BOOK } from '@/content/book';
import { IS_PROD, MANUAL_PAYMENT_ENABLED, MANUAL_TARGETS, PAYMENT_PROVIDER, PRODUCT, formatXof } from '@/lib/config';
import { PurchaseFlow } from '@/components/PurchaseFlow';
import { Badge } from '@/components/ui';

export default async function AcheterPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?next=/acheter');
  if (await hasAccess(session.id)) redirect('/lire');

  // Le fournisseur "simulation" n'encaisse jamais reellement : on ne montre
  // le bouton automatique que si un vrai agregateur est branche, ou hors
  // production (pour pouvoir continuer a tester/demo le parcours). Un vrai
  // client ne doit jamais tomber sur un faux ecran de paiement.
  const showAutoPayment = PAYMENT_PROVIDER !== 'simulation' || !IS_PROD;

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-5 py-10">
      <div className="mb-7 text-center">
        <img src="/icons/icon-72.png" alt="" width={44} height={44} className="mx-auto rounded-[11px]" />
        <h1 className="mt-4 text-xl font-bold">{BOOK.title}</h1>
        <p className="mt-1 text-[15px] text-[var(--text-dim)]">Accès complet, paiement unique</p>
        <p className="mt-3 text-3xl font-bold text-[var(--gold-soft)]">{formatXof(PRODUCT.priceXof)}</p>
        <div className="mt-2 flex justify-center">
          <Badge tone="neutral">Accès à vie · Tous les chapitres</Badge>
        </div>
      </div>

      <PurchaseFlow
        autoProviderId={PAYMENT_PROVIDER}
        showAutoPayment={showAutoPayment}
        manualEnabled={MANUAL_PAYMENT_ENABLED && MANUAL_TARGETS.length > 0}
        manualTargets={MANUAL_TARGETS}
        priceLabel={formatXof(PRODUCT.priceXof)}
        whatsapp={BOOK.whatsapp}
      />
    </main>
  );
}
