'use client';

import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '../ui';

export type AccessCode = {
  code: string;
  note: string | null;
  created_at: number;
  expires_at: number | null;
  used_by: string | null;
  used_at: number | null;
};

export function AdminAccessCodes({ initialCodes }: { initialCodes: AccessCode[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodes((c) => [
          { code: data.code, note: note.trim() || null, created_at: Date.now(), expires_at: null, used_by: null, used_at: null },
          ...c,
        ]);
        setNote('');
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (ex : offert à Jean)"
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold-dim)]"
          />
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? <Spinner size={14} /> : 'Générer'}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {codes.map((c) => (
          <Card key={c.code} className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <button
                onClick={() => copy(c.code)}
                className="font-mono text-sm font-semibold text-[var(--text)] underline decoration-dotted underline-offset-4"
              >
                {c.code}
              </button>
              {c.note && <p className="truncate text-xs text-[var(--text-faint)]">{c.note}</p>}
            </div>
            {copied === c.code ? (
              <Badge tone="green">Copié</Badge>
            ) : c.used_by ? (
              <Badge tone="neutral">Utilisé</Badge>
            ) : (
              <Badge tone="gold">Disponible</Badge>
            )}
          </Card>
        ))}
        {codes.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--text-faint)]">Aucun code généré.</p>
        )}
      </div>
    </div>
  );
}
