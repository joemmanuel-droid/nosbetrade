'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '../ui';
import { formatPhone } from '@/lib/phone';

// Formateur local (plutot qu'un import de '@/lib/config') : ce fichier est un
// composant client, et lib/config.ts valide des secrets serveur a l'import —
// il ne doit jamais finir dans le bundle navigateur.
function formatXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export type AdminOrder = {
  id: string;
  user_phone: string;
  provider: string;
  operator: string | null;
  amount: number;
  status: string;
  proof_ref: string | null;
  payer_phone: string | null;
  created_at: number;
};

const STATUS_TONE: Record<string, 'neutral' | 'gold' | 'green' | 'red' | 'blue'> = {
  review: 'gold',
  awaiting_proof: 'neutral',
  pending: 'blue',
  paid: 'green',
  failed: 'red',
  cancelled: 'red',
  expired: 'red',
};

export function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        setHandled((s) => new Set(s).add(id));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const visible = orders.filter((o) => !handled.has(o.id));

  if (visible.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-faint)]">Aucune commande à valider. 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {visible.map((o) => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{formatPhone(o.user_phone)}</p>
              <p className="text-xs text-[var(--text-faint)]">
                {new Date(o.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <Badge tone={STATUS_TONE[o.status] ?? 'neutral'}>{o.status}</Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[var(--text-faint)]">Montant</p>
              <p className="font-medium text-[var(--text)]">{formatXof(o.amount)}</p>
            </div>
            <div>
              <p className="text-[var(--text-faint)]">Opérateur</p>
              <p className="font-medium text-[var(--text)]">{o.operator ?? o.provider}</p>
            </div>
            {o.proof_ref && (
              <div className="col-span-2">
                <p className="text-[var(--text-faint)]">Référence transaction</p>
                <p className="break-all font-mono text-[13px] text-[var(--text)]">{o.proof_ref}</p>
              </div>
            )}
            {o.payer_phone && (
              <div className="col-span-2">
                <p className="text-[var(--text-faint)]">Numéro payeur</p>
                <p className="font-medium text-[var(--text)]">{formatPhone(o.payer_phone)}</p>
              </div>
            )}
          </div>

          {o.status === 'review' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" full onClick={() => act(o.id, 'approve')} disabled={busy === o.id}>
                {busy === o.id ? <Spinner size={14} /> : 'Valider'}
              </Button>
              <Button size="sm" full variant="danger" onClick={() => act(o.id, 'reject')} disabled={busy === o.id}>
                Rejeter
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
