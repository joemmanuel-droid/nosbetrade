'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Spinner } from '../ui';

export function AdminUnlockForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code incorrect.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xl">
          🔐
        </div>
        <h1 className="mt-4 text-xl font-bold">Code d'accès admin</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Ce numéro a les droits admin, mais une deuxième vérification est requise pour ouvrir le
          back-office.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code d'accès admin"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[15px] outline-none focus:border-[var(--gold-dim)]"
          />
          {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}
          <Button type="submit" full size="lg" disabled={loading || code.length === 0}>
            {loading ? <Spinner /> : 'Déverrouiller'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
