'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Spinner } from './ui';
import { TurnstileWidget } from './TurnstileWidget';

type Step = 'phone' | 'code';

export function AuthForm({ next, turnstileSiteKey }: { next: string; turnstileSiteKey?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [localNumber, setLocalNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const candidate = `+226${localNumber.replace(/\D/g, '')}`;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: candidate, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Numéro invalide.');
      setPhone(data.phone);
      setDevCode(data.devCode ?? null);
      setCooldown(60);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code incorrect.');
      router.push(next || '/lire');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'phone') {
    return (
      <Card className="p-5">
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Numéro de téléphone</label>
            <div className="flex items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] focus-within:border-[var(--gold-dim)]">
              <span className="flex items-center px-3 text-sm text-[var(--text-faint)]">+226</span>
              <input
                autoFocus
                inputMode="numeric"
                placeholder="70 12 34 56"
                value={localNumber}
                onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))}
                className="w-full bg-transparent px-1 py-3 text-[15px] outline-none placeholder:text-[var(--text-faint)]"
              />
            </div>
          </div>

          {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />}

          {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}

          <Button
            type="submit"
            full
            size="lg"
            disabled={
              loading ||
              localNumber.replace(/\D/g, '').length !== 8 ||
              (!!turnstileSiteKey && !turnstileToken)
            }
          >
            {loading ? <Spinner /> : 'Recevoir le code'}
          </Button>

          <p className="text-center text-xs text-[var(--text-faint)]">
            Un code à 6 chiffres te sera envoyé par SMS pour confirmer ce numéro.
          </p>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={verifyCode} className="space-y-4">
        <div>
          <p className="text-sm text-[var(--text-dim)]">
            Code envoyé au <span className="font-medium text-[var(--text)]">{phone}</span>
          </p>
          {devCode && (
            <p className="mt-1 text-xs text-[var(--gold-soft)]">Mode test — code : {devCode}</p>
          )}
        </div>

        <input
          ref={codeInputRef}
          inputMode="numeric"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-[var(--gold-dim)]"
        />

        {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}

        <Button type="submit" full size="lg" disabled={loading || code.length !== 6}>
          {loading ? <Spinner /> : 'Confirmer'}
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setCode('');
              setError(null);
            }}
            className="text-[var(--text-faint)] underline underline-offset-2"
          >
            Changer de numéro
          </button>
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => requestCode()}
            className="text-[var(--text-faint)] underline underline-offset-2 disabled:no-underline disabled:opacity-50"
          >
            {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
          </button>
        </div>
      </form>
    </Card>
  );
}
