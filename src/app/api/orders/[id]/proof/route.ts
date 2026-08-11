import type { NextRequest } from 'next/server';
import { HttpError, requireUser } from '@/lib/auth';
import { json, readJson, withHandler } from '@/lib/api';
import { attachManualProof } from '@/lib/orders';
import { normalizePhone } from '@/lib/phone';

/** Le client colle la reference de transaction recue par SMS apres son depot. */
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { proofRef, payerPhone } = await readJson<{ proofRef: string; payerPhone: string }>(req);

  const ref = (proofRef ?? '').trim();
  if (ref.length < 4) throw new HttpError(400, 'Référence de transaction invalide.');

  const phone = normalizePhone(payerPhone ?? '') ?? user.phone;

  const order = await attachManualProof(id, user.id, ref, phone);
  return json({ ok: true, order });
});
