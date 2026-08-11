import type { Metadata } from 'next';
import { LegalPage, Placeholder, Section } from '@/components/LegalPage';
import { BOOK, CHAPTERS } from '@/content/book';
import { MERCHANT_NAME, SUPPORT_WHATSAPP, APP_URL } from '@/lib/config';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsLegalesPage() {
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP.replace(/[^\d]/g, '')}`;

  return (
    <LegalPage title="Mentions légales" updated="11 août 2026">
      <Section title="Éditeur du site">
        <p>
          Le présent site et l'application « {BOOK.title} » sont édités par <strong>{MERCHANT_NAME}</strong>,
          joignable via WhatsApp au {SUPPORT_WHATSAPP}.
        </p>
        <p>
          Statut juridique : <Placeholder>forme juridique (entreprise individuelle, société...)</Placeholder>
          <br />
          Numéro IFU / RCCM : <Placeholder>identifiant fiscal / registre du commerce</Placeholder>
          <br />
          Adresse : <Placeholder>adresse d'exploitation</Placeholder>
          <br />
          Responsable de la publication : <Placeholder>nom du responsable</Placeholder>
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          Ce site est hébergé par <Placeholder>nom de l'hébergeur, une fois choisi</Placeholder>, accessible à
          l'adresse {APP_URL}.
        </p>
      </Section>

      <Section title="Nature du service">
        <p>
          L'application donne accès, après paiement, au contenu numérique du livre « {BOOK.title} » (
          {CHAPTERS.length} chapitres). Le contenu a une vocation strictement éducative ; voir les{' '}
          <a href="/cgv" className="underline underline-offset-2">
            conditions générales de vente
          </a>{' '}
          pour le détail des modalités.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des textes, schémas et éléments visuels du livre sont la propriété de {MERCHANT_NAME}.
          Toute reproduction, revente ou diffusion sans autorisation est interdite. Les schémas fournis après
          achat sont personnalisés (filigrane) au compte de l'acheteur.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question relative au site ou au service :{' '}
          <a href={waHref} className="underline underline-offset-2">
            WhatsApp {SUPPORT_WHATSAPP}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
