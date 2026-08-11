'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Spinner } from './ui';

type ManualTarget = { operator: string; label: string; number: string; color: string };

type Step =
  | { name: 'choose' }
  | { name: 'manual-proof'; orderId: string; target: ManualTarget };

export function PurchaseFlow({
  autoProviderId,
  showAutoPayment,
  manualEnabled,
  manualTargets,
  priceLabel,
  whatsapp,
}: {
  autoProviderId: string;
  showAutoPayment: boolean;
  manualEnabled: boolean;
  manualTargets: ManualTarget[];
  priceLabel: string;
  whatsapp: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: 'choose' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payAuto() {
    setError(null);
    setLoading('auto');
    try {
      const res = await fetch('/api/orders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de démarrer le paiement.');
      if (data.alreadyOwned) {
        router.push('/lire');
        return;
      }
      window.location.href = data.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
      setLoading(null);
    }
  }

  async function chooseManual(operator: string) {
    setError(null);
    setLoading(operator);
    try {
      const res = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Opérateur indisponible.');
      setStep({ name: 'manual-proof', orderId: data.orderId, target: data.target });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setLoading(null);
    }
  }

  if (step.name === 'manual-proof') {
    return (
      <ManualProofForm
        orderId={step.orderId}
        target={step.target}
        priceLabel={priceLabel}
        onBack={() => setStep({ name: 'choose' })}
        onSubmitted={() => router.push(`/acheter/retour/${step.orderId}`)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {showAutoPayment && (
        <div>
          <Button full size="lg" onClick={payAuto} disabled={loading === 'auto'}>
            {loading === 'auto' ? <Spinner /> : 'Payer par Mobile Money'}
          </Button>
          <p className="mt-2 text-center text-xs text-[var(--text-faint)]">
            {autoProviderId === 'simulation'
              ? 'Mode démonstration — aucun débit réel.'
              : 'Orange Money, Moov Money, Wave — paiement automatique et instantané.'}
          </p>
        </div>
      )}

      {error && <p className="text-center text-sm text-[var(--red-soft)]">{error}</p>}

      {manualEnabled && (
        <>
          {showAutoPayment && (
            <div className="flex items-center gap-3 text-xs text-[var(--text-faint)]">
              <span className="h-px flex-1 bg-[var(--border-soft)]" />
              ou payer directement
              <span className="h-px flex-1 bg-[var(--border-soft)]" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {manualTargets.map((t) => (
              <button
                key={t.operator}
                onClick={() => chooseManual(t.operator)}
                disabled={loading === t.operator}
                className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                {loading === t.operator ? (
                  <Spinner />
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.label}
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-center text-xs text-[var(--text-faint)]">
        Un souci pour payer ?{' '}
        <a
          href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
          className="underline underline-offset-2"
        >
          Écris-nous sur WhatsApp
        </a>
        .
      </p>
    </div>
  );
}

function ManualProofForm({
  orderId,
  target,
  priceLabel,
  onBack,
  onSubmitted,
}: {
  orderId: string;
  target: ManualTarget;
  priceLabel: string;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const [proofRef, setProofRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(target.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Presse-papiers indisponible : l'utilisateur peut toujours copier a la main.
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (proofRef.trim().length < 4) {
      setError('Colle la référence complète de la transaction reçue par SMS.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofRef, payerPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Envoi impossible.');
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-[var(--text-faint)] underline underline-offset-2">
        ← Choisir un autre moyen
      </button>

      <Card className="p-4">
        <p className="text-sm text-[var(--text-dim)]">
          1. Envoie <span className="font-semibold text-[var(--text)]">{priceLabel}</span> via{' '}
          <span className="font-semibold" style={{ color: target.color }}>
            {target.label}
          </span>{' '}
          au numéro :
        </p>
        <button
          onClick={copyNumber}
          className="mt-2.5 flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
        >
          <span className="text-lg font-bold tracking-wide text-[var(--text)]">{target.number}</span>
          <span className="text-xs text-[var(--gold-soft)]">{copied ? 'Copié ✓' : 'Copier'}</span>
        </button>
        <p className="mt-3 text-sm text-[var(--text-dim)]">
          2. Une fois le SMS de confirmation reçu, colle la référence de transaction ci-dessous.
        </p>
      </Card>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            Référence de transaction
          </label>
          <input
            value={proofRef}
            onChange={(e) => setProofRef(e.target.value)}
            placeholder="Ex : MP240811.1234.A56789"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[15px] outline-none focus:border-[var(--gold-dim)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            Numéro utilisé pour payer <span className="text-[var(--text-faint)]">(optionnel)</span>
          </label>
          <input
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="+226 70 12 34 56"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[15px] outline-none focus:border-[var(--gold-dim)]"
          />
        </div>

        {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}

        <Button type="submit" full size="lg" disabled={loading}>
          {loading ? <Spinner /> : "J'ai payé — envoyer la preuve"}
        </Button>
      </form>
    </div>
  );
}
