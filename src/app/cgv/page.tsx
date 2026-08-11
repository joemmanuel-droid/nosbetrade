import type { Metadata } from 'next';
import { LegalPage, Placeholder, Section } from '@/components/LegalPage';
import { BOOK, CHAPTERS, FREE_CHAPTER_COUNT } from '@/content/book';
import { MANUAL_TARGETS, MERCHANT_NAME, PRODUCT, SUPPORT_WHATSAPP, formatXof } from '@/lib/config';

export const metadata: Metadata = { title: 'Conditions générales de vente' };

export default function CgvPage() {
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP.replace(/[^\d]/g, '')}`;
  const operators = MANUAL_TARGETS.map((t) => t.label).join(', ') || 'Orange Money, Moov Money, Telecel Money, Wave';

  return (
    <LegalPage title="Conditions générales de vente" updated="11 août 2026">
      <Section title="1. Objet">
        <p>
          Les présentes conditions régissent la vente de l'accès numérique au livre «&nbsp;{BOOK.title}&nbsp;»
          par {MERCHANT_NAME} (« le Vendeur ») à toute personne effectuant un achat via l'application («
          l'Acheteur »). Le fait de payer vaut acceptation pleine et entière de ces conditions.
        </p>
      </Section>

      <Section title="2. Produit et prix">
        <p>
          Le produit est un accès numérique à vie au livre « {BOOK.title} » ({CHAPTERS.length} chapitres, dont{' '}
          {FREE_CHAPTER_COUNT} consultables gratuitement sans achat). Le prix est de{' '}
          <strong>{formatXof(PRODUCT.priceXof)}</strong>, payable en une seule fois. Le Vendeur se réserve le
          droit de modifier ce prix pour les achats futurs ; le prix payé par un Acheteur ne change pas
          rétroactivement.
        </p>
      </Section>

      <Section title="3. Paiement">
        <p>
          Le paiement s'effectue par Mobile Money ({operators}), soit automatiquement via un prestataire de
          paiement, soit manuellement par dépôt direct suivi d'une vérification par le Vendeur. En cas de
          paiement manuel, l'accès est activé après vérification, généralement sous quelques heures.
        </p>
      </Section>

      <Section title="4. Livraison / activation de l'accès">
        <p>
          L'accès est délivré exclusivement de façon numérique, via le compte associé au numéro de téléphone
          utilisé pour la connexion. Aucun support physique n'est fourni. L'accès reste disponible tant que le
          compte n'est pas révoqué dans les conditions prévues à l'article 7.
        </p>
      </Section>

      <Section title="5. Droit de rétractation">
        <p>
          Conformément à la pratique applicable aux contenus numériques délivrés immédiatement après
          confirmation du paiement, l'Acheteur reconnaît que l'accès étant fourni sans délai, il ne peut pas
          exercer de droit de rétractation une fois l'accès activé. Toute demande de remboursement avant
          activation de l'accès peut être adressée via WhatsApp et sera étudiée au cas par cas.
        </p>
        <p className="text-sm">
          <Placeholder>À confirmer avec un professionnel du droit local : délai légal de rétractation applicable, le cas échéant, aux contenus numériques au Burkina Faso.</Placeholder>
        </p>
      </Section>

      <Section title="6. Propriété intellectuelle et usage autorisé">
        <p>
          L'accès est strictement personnel. La revente, le partage de compte, la capture et la redistribution
          du contenu sont interdits. Les schémas fournis sont personnalisés (filigrane) au numéro de
          l'acheteur ; toute diffusion non autorisée pourra être tracée jusqu'au compte concerné.
        </p>
      </Section>

      <Section title="7. Résiliation / révocation d'accès">
        <p>
          Le Vendeur se réserve le droit de suspendre ou révoquer l'accès d'un compte en cas d'usage abusif
          (partage de compte, tentative de contournement des protections, comportement frauduleux), sans
          remboursement.
        </p>
      </Section>

      <Section title="8. Nature du contenu et responsabilité">
        <p>
          {BOOK.disclaimer} Le Vendeur ne saurait être tenu responsable des décisions de trading prises par
          l'Acheteur sur la base du contenu du livre.
        </p>
      </Section>

      <Section title="9. Données personnelles">
        <p>
          Le numéro de téléphone de l'Acheteur est utilisé uniquement pour l'authentification, la gestion de
          l'accès et le support client. Il n'est ni revendu ni transmis à des tiers à des fins commerciales.
        </p>
        <p className="text-sm">
          <Placeholder>Politique de confidentialité détaillée et base légale de traitement à formaliser avec un professionnel, conformément à la réglementation applicable en matière de protection des données personnelles.</Placeholder>
        </p>
      </Section>

      <Section title="10. Droit applicable et litiges">
        <p>
          Les présentes conditions sont soumises au droit{' '}
          <Placeholder>pays/juridiction à confirmer — Burkina Faso par défaut</Placeholder>. En cas de litige,
          l'Acheteur est invité à contacter le Vendeur via WhatsApp avant toute autre démarche.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          <a href={waHref} className="underline underline-offset-2">
            WhatsApp {SUPPORT_WHATSAPP}
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}
