export type OrderStatus =
  /** Commande creee, paiement en cours chez l'agregateur. */
  | 'pending'
  /** Mode manuel : on attend que le client colle sa reference de transaction. */
  | 'awaiting_proof'
  /** Mode manuel : preuve recue, en attente de validation par l'admin. */
  | 'review'
  /** Encaisse : l'acces est accorde. */
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type Order = {
  id: string;
  user_id: string;
  product_id: string;
  provider: string;
  operator: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  provider_ref: string | null;
  payer_phone: string | null;
  proof_ref: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
  settled_at: number | null;
  raw: string | null;
};

export type InitContext = {
  order: Order;
  /** Numero du client, au format +226XXXXXXXX. */
  customerPhone: string;
  customerName?: string | null;
  returnUrl: string;
  notifyUrl: string;
};

export type InitResult = {
  /** URL vers laquelle rediriger le client pour payer. */
  redirectUrl: string;
  /** Reference cote agregateur, stockee pour la reconciliation. */
  providerRef: string;
  raw?: unknown;
};

/** Statut normalise renvoye par un agregateur. */
export type RemoteStatus = 'pending' | 'paid' | 'failed';

export interface PaymentProvider {
  id: string;
  label: string;
  /** Cree la transaction chez l'agregateur et renvoie l'URL de paiement. */
  init(ctx: InitContext): Promise<InitResult>;
  /**
   * Verifie l'authenticite d'une notification entrante et en extrait
   * l'identifiant de commande. Ne decide PAS du statut : celui-ci est
   * toujours reconfirme par un appel sortant a `checkStatus`.
   */
  parseWebhook(req: Request, body: string): Promise<{ orderId: string | null; providerRef: string | null }>;
  /** Interroge l'agregateur pour connaitre le statut reel de la transaction. */
  checkStatus(order: Order): Promise<{ status: RemoteStatus; raw?: unknown }>;
}
