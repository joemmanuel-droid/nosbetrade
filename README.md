# Gold Strategy — Lecteur payant (Nosbe Trade)

PWA de lecture pour *Gold Strategy by Nosbe Trade*. Accès exclusivement payant
par Mobile Money (Orange Money, Moov Money, Telecel Money, Wave), pensé pour
le Burkina Faso.

## Fonctionnalités

- **Authentification par téléphone** : code OTP à 6 chiffres, pas de mot de passe. Anti-abus : rate limiting par téléphone/IP, Cloudflare Turnstile optionnel.
- **Aperçu gratuit** : les 3 premiers chapitres sont ouverts pour convertir ; le reste est verrouillé.
- **Paiement hybride** :
  - *Automatique* : agrégateur (CinetPay ou LigdiCash) avec webhook → déblocage instantané.
  - *Manuel* : le client dépose sur un numéro marchand affiché, colle sa référence de transaction, un admin valide depuis le back-office (notifié automatiquement par webhook — voir plus bas).
- **Contenu protégé** : le texte est servi en HTML uniquement aux ayants droit (rendu serveur, jamais exposé en JSON public) ; les schémas sont filigranés au numéro de l'acheteur, générés à la volée, jamais mis en cache.
- **PWA installable** : manifest + service worker actif uniquement en production (app shell seul — le contenu payant n'est jamais mis en cache pour éviter une fuite sur appareil partagé) + image de partage (Open Graph).
- **Back-office admin** : validation des paiements manuels, génération de codes d'accès offerts, recherche/révocation/**blocage** de compte, statistiques de vente.
- **Pages légales** : CGV et mentions légales (brouillon généré automatiquement — voir checklist ci-dessous).
- **Sauvegardes** : script prêt à planifier (`npm run db:backup`).

## Démarrage rapide

```bash
npm install
cp .env.example .env
npm run gen:secret   # colle le résultat dans SESSION_SECRET (.env)
npm run db:init
npm run dev
```

Par défaut `PAYMENT_PROVIDER=simulation` et `OTP_TRANSPORT=console` : tout le
parcours (inscription, achat, admin) fonctionne sans aucun compte externe —
le code OTP et l'écran de paiement s'affichent directement dans l'app. Bascule
ces deux variables avant la mise en production (voir plus bas).

Le numéro `ADMIN_PHONES` (par défaut `+22606726239`, celui du livre) a accès à
`/admin` dès qu'il se connecte — **et doit ensuite saisir `ADMIN_ACCESS_CODE`**
(déjà généré et actif dans `.env` local). Ce deuxième facteur existe parce que
ce numéro est aussi le numéro Orange Money affiché à tous les clients : voir
la section [Sécurité du back-office](#sécurité-du-back-office).

## Checklist de mise en ligne

Tout ce qui pouvait être construit ou automatisé sans compte externe est fait
et testé. Ce qui reste dépend d'informations propres à l'activité (numéros
réels, choix de prestataires) ou de la création de comptes tiers — je ne
peux pas le faire à ta place.

### ✅ Prêt (code écrit, testé)

- **Second facteur admin** — code d'accès séparé du numéro de téléphone, déjà généré et actif (voir [Sécurité du back-office](#sécurité-du-back-office))
- Rate limiting renforcé (OTP, connexion, commandes, codes d'accès, déverrouillage admin)
- Anti-bot Cloudflare Turnstile — juste coller une clé pour l'activer (voir plus bas)
- Notification automatique de l'admin sur nouvelle commande à valider — juste coller une URL de webhook (voir plus bas)
- Image de partage (Open Graph) pour un bel aperçu WhatsApp/réseaux sociaux
- Blocage/déblocage de compte depuis `/admin`
- Pages `/cgv` et `/mentions-légales` (brouillon, voir note plus bas)
- Script de sauvegarde de la base (`npm run db:backup`)
- Service worker désactivé en développement (ne s'active qu'en production)

### 🔧 Nécessite une action de ta part

| Quoi | Pourquoi je ne peux pas le faire | Où |
|---|---|---|
| **Vrais numéros Mobile Money** | Ce sont tes numéros marchands | `.env` → `MM_ORANGE_NUMBER` etc. |
| **Compte Turso** (base de données production) | Création de compte tiers | [turso.tech](https://turso.tech) → `DATABASE_URL`/`DATABASE_AUTH_TOKEN` |
| **Compte Twilio (SMS/WhatsApp réel pour l'OTP)** | Création de compte + coût récurrent | [twilio.com](https://www.twilio.com/try-twilio) → `.env` → `OTP_TRANSPORT=twilio` + `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`. Intégration déjà codée. |
| **Compte CinetPay ou LigdiCash** (paiement auto) | Création de compte + KYC business | `.env` → `PAYMENT_PROVIDER` + clés. Sinon rester en manuel seul, déjà pleinement fonctionnel |
| **Nom de domaine + hébergement** | Achat + choix d'hébergeur | Puis mettre à jour `APP_URL` |
| **Relecture des pages légales** | Rédaction automatique = point de départ, pas un avis juridique | `/cgv`, `/mentions-legales` — remplacer les `[à compléter]` |
| **Obligations locales** (immatriculation, fiscalité) | Hors de mon champ, spécifique au Burkina Faso | À valider avec un professionnel sur place |
| *Optionnel* — Clé Cloudflare Turnstile | Création de compte gratuit | [dash.cloudflare.com](https://dash.cloudflare.com/?to=/:account/turnstile) → `.env` → `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` |
| *Optionnel* — URL de notification admin | Choisir où recevoir l'alerte (Slack, Discord, autre) | `.env` → `ADMIN_NOTIFY_URL` (colle une URL de webhook entrant Slack ou Discord, ça marche directement) |

Chemin le plus rapide pour être en ligne : numéros Mobile Money réels + Turso
+ une passerelle SMS + domaine/hébergement, en restant en paiement **manuel
uniquement**. Tant que `PAYMENT_PROVIDER=simulation`, le bouton de paiement
automatique reste **masqué en production** (visible seulement en développement,
pour pouvoir continuer à tester) — un vrai client ne peut donc jamais tomber
sur un faux écran de paiement. Le paiement automatique peut être ajouté plus
tard sans rien casser : il réapparaît de lui-même dès qu'un vrai
`PAYMENT_PROVIDER` est configuré.

## Sécurité du back-office

`ADMIN_PHONES` sert à deux choses dans un usage typique : recevoir les
paiements manuels (numéro affiché à **tous les clients** sur l'écran
d'achat) et ouvrir `/admin`. Si le même numéro fait les deux, n'importe quel
client connaît déjà « le » numéro qui donnerait accès au back-office.

`ADMIN_ACCESS_CODE` ajoute un second facteur, indépendant du téléphone :
après connexion normale (téléphone + OTP), un numéro admin doit *en plus*
saisir ce code secret pour atteindre `/admin` — voir `AdminUnlockForm.tsx` et
`requireAdmin()` dans `lib/auth.ts`. Sans ce code, impossible d'ouvrir le
back-office même en réussissant à se connecter avec le numéro admin.

- **Déjà actif** dans `.env` local (valeur générée automatiquement).
- **En production**, génère ta propre valeur (`npm run gen:secret`) et
  garde-la uniquement dans le gestionnaire de secrets de ton hébergeur — ne
  la partage avec personne, pas même par WhatsApp.
- Le déverrouillage dure 12h puis redemande le code ; un bouton 🔒 en haut du
  back-office permet de reverrouiller manuellement (utile avant de prêter le
  téléphone).
- Fortement rate-limité (5 essais / 30 min par compte et par IP) — voir
  `verifyAdminAccessCode()`.
- **Solution complémentaire, gratuite et immédiate** : utiliser un numéro
  *différent* pour `ADMIN_PHONES` et pour le numéro Mobile Money affiché aux
  clients, si tu as accès à une deuxième ligne. Les deux protections se
  cumulent sans conflit.

## Mode sans vérification (temporaire)

`AUTH_MODE=phone_only` supprime toute vérification à la connexion : quiconque
tape un numéro se connecte immédiatement avec ce numéro, sans code, sans
preuve. **Décision produit assumée** le temps qu'une passerelle SMS soit
branchée (voir la section Twilio ci-dessus) — pas un défaut.

**Le risque concret** : n'importe qui connaissant le numéro d'un client (visible
sur son reçu Mobile Money, dans tes contacts WhatsApp...) peut taper ce numéro
et lire **son** livre acheté à sa place. Le paywall lui-même reste intact —
c'est l'identité qui n'est plus vérifiée.

- **Non affaibli par ce mode** : `/admin` reste protégé par
  `ADMIN_ACCESS_CODE` (second facteur indépendant, voir ci-dessus) — une
  connexion sans vérification sur le numéro admin ne suffit pas à ouvrir le
  back-office.
- Chaque connexion dans ce mode est marquée `user.login_unverified` /
  `user.created_unverified` dans `audit_log`, pour pouvoir distinguer après
  coup les comptes créés sans preuve.
- **Pour désactiver** (dès qu'une passerelle SMS ou WhatsApp est prête) :
  repasse `AUTH_MODE=otp` (ou supprime la variable, `otp` est le défaut) et
  redéploie. Aucune autre modification necessaire — le systeme de code à 6
  chiffres n'a jamais été retiré du code, juste court-circuité.
- Un bandeau rouge visible s'affiche en haut de `/admin` tant que ce mode est
  actif, pour ne pas l'oublier.

## Architecture

```
src/
  content/book.ts          Contenu du livre (texte structuré en blocs, hors HTML brut)
  content/figures/         Schémas sources (hors /public : jamais accessibles en statique)
  lib/
    config.ts              Toute la configuration env — importe 'server-only'
    public-constants.ts    Les quelques constantes non sensibles utilisables côté client
    db.ts                  SQLite/libsql — schéma, requêtes, audit log, rate limiting
    auth.ts                Session JWT (cookie httpOnly) + OTP + appareils
    entitlements.ts        Octroi/révocation d'accès (idempotent)
    orders.ts               Cycle de vie d'une commande, réconciliation
    payments/               Un adaptateur par fournisseur (cinetpay, ligdicash, simulation)
    watermark.ts / figures.ts   Filigrane serveur (sharp) des schémas
  app/
    page.tsx                Landing page (publique)
    connexion/               Connexion par OTP
    lire/[chapterId]/        Lecteur (gate serveur : gratuit OU acheteur)
    acheter/                 Achat (auto + manuel) et écrans de retour
    compte/                  Compte, déconnexion, code d'accès
    admin/                   Back-office (réservé à ADMIN_PHONES)
    api/                     Toutes les routes ci-dessus, + webhook paiement
```

### Pourquoi ces choix

- **Rendu serveur du texte** : chaque page de chapitre vérifie la session et
  l'achat côté serveur avant de générer le HTML. Un utilisateur non ayant droit
  ne reçoit jamais le texte protégé, même dans le JS envoyé au navigateur.
- **Filigrane, pas chiffrement** : les schémas sont des images ; on ne peut pas
  empêcher une capture d'écran. Le filigrane (numéro de l'acheteur) dissuade
  la revente et permet de tracer une fuite. Chaque image est régénérée à
  chaque requête (`Cache-Control: no-store`), jamais servie brute.
- **Webhook non-source-de-vérité** : `POST /api/payments/webhook/[provider]`
  ne fait que déclencher une vérification *sortante* (`checkStatus`) auprès de
  l'agrégateur. Un webhook falsifié ne peut donc jamais, à lui seul, débloquer
  un accès — voir le commentaire en tête de ce fichier de route.
- **`server-only`** sur `config.ts`, `db.ts`, `auth.ts`, `watermark.ts`,
  `figures.ts` : si un composant client importe un jour, même indirectement,
  un de ces modules, le *build* échoue avec un message clair — au lieu d'un
  crash silencieux en production (ça a failli arriver avec `SESSION_SECRET`
  pendant le développement de ce projet, voir `public-constants.ts`).

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète et commentée.
Les plus importantes :

| Variable | Rôle |
|---|---|
| `SESSION_SECRET` | Signature des sessions. Génère avec `npm run gen:secret`. **Obligatoire en production** (l'app refuse de démarrer sans). |
| `DATABASE_URL` | `file:./data/app.db` en local, `libsql://...` (Turso) en production. |
| `PAYMENT_PROVIDER` | `simulation` (dev) / `cinetpay` / `ligdicash`. Le bouton auto reste masqué aux vrais clients tant que c'est `simulation`. |
| `AUTH_MODE` | `otp` (défaut, sûr) / `phone_only` (**aucune vérification**, voir [Mode sans vérification](#mode-sans-vérification-temporaire)). |
| `OTP_TRANSPORT` | `console` (dev/test privé, code dans les logs serveur) / `twilio` (SMS ou WhatsApp réel, voir ci-dessous) / `http` (passerelle générique). |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Identifiants Twilio pour l'envoi réel des codes OTP. |
| `TWILIO_CHANNEL` | `sms` (défaut) ou `whatsapp` — même compte Twilio pour les deux, un seul réglage à changer. |
| `ADMIN_PHONES` | Numéros (séparés par virgules) autorisés sur `/admin`. |
| `ADMIN_ACCESS_CODE` | Second facteur admin, distinct du téléphone — voir [Sécurité du back-office](#sécurité-du-back-office). **Fortement recommandé** dès que `ADMIN_PHONES` sert aussi de numéro de paiement. |
| `ADMIN_NOTIFY_URL` | Webhook notifié à chaque commande manuelle à valider (URL Slack/Discord ou autre). Optionnel. |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Anti-bot Cloudflare Turnstile sur la demande d'OTP. Optionnel. |
| `MM_ORANGE_NUMBER`, `MM_MOOV_NUMBER`, ... | Numéros marchands affichés pour le paiement manuel. |

## Mise en production

1. **Base de données** — créer un groupe [Turso](https://turso.tech) (libsql
   managé, gratuit pour ce volume) : `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.
   Lancer `npm run db:init` une fois avant le premier déploiement.
2. **Secret de session** — `npm run gen:secret`, coller dans `SESSION_SECRET`
   de l'hébergeur. Ne jamais réutiliser le secret de développement.
3. **SMS/OTP** — sans ça, les codes ne sont visibles que dans les logs
   serveur : inutilisable pour de vrais clients (seulement pour toi, en test
   privé, avant l'ouverture au public). Deux options :
   - **Twilio** (intégration déjà codée) — crée un compte sur
     [twilio.com](https://www.twilio.com/try-twilio), récupère `Account SID`,
     `Auth Token` et un numéro d'envoi, puis `OTP_TRANSPORT=twilio` +
     `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`. Vérifie
     toi-même la fiabilité de livraison SMS vers le Burkina Faso avant de
     t'engager (l'essai gratuit suffit pour tester) ; `TWILIO_CHANNEL=whatsapp`
     bascule sur WhatsApp avec le même compte si le SMS ne convient pas.
   - **Autre passerelle** — `OTP_TRANSPORT=http` + `OTP_HTTP_URL` vers
     n'importe quel service qui accepte `POST { to, message }`.
4. **Paiement automatique** (optionnel, le manuel fonctionne sans) —
   ouvrir un compte [CinetPay](https://cinetpay.com) ou
   [LigdiCash](https://ligdicash.com), renseigner les clés, `PAYMENT_PROVIDER`,
   et configurer l'URL de notification sur `https://ton-domaine/api/payments/webhook/cinetpay`
   (ou `ligdicash`) côté back-office de l'agrégateur.
5. **Paiement manuel** — renseigner les numéros marchands (`MM_ORANGE_NUMBER`,
   etc.). Toujours actif en parallèle de l'automatique, utile dès le premier
   jour même sans compte agrégateur validé.
6. **Hébergement** — n'importe quel hébergeur Next.js (Vercel, ou un VPS avec
   `npm run build && npm run start`). HTTPS obligatoire : la PWA et les
   cookies de session l'exigent en production.
7. **`APP_URL`** — doit être l'URL publique exacte (sert aux `return_url`
   et `notify_url` envoyés aux agrégateurs).
8. **Notification admin** (recommandé) — colle une URL de webhook entrant
   Slack ou Discord dans `ADMIN_NOTIFY_URL` pour être alerté à chaque
   commande manuelle à valider, plutôt que de devoir vérifier `/admin`
   régulièrement.
9. **Anti-bot** (recommandé une fois le SMS branché, pour éviter les
   abus qui feraient grimper la facture) — clé gratuite sur
   [dash.cloudflare.com](https://dash.cloudflare.com/?to=/:account/turnstile),
   coller dans `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
10. **Sauvegardes** — planifier `npm run db:backup` (cron quotidien sur un
    VPS, tâche planifiée Windows, ou équivalent chez ton hébergeur). Sur
    Turso, utiliser plutôt ses sauvegardes intégrées ou `turso db shell
    <nom> ".dump"`.
11. **Pages légales** — remplacer les `[à compléter]` dans `/cgv` et
    `/mentions-legales` (src/app/cgv, src/app/mentions-legales) et faire
    relire par un professionnel local avant un vrai lancement.

## Modifier le contenu du livre

Tout le texte vit dans [src/content/book.ts](src/content/book.ts), sous forme
de blocs typés (`p`, `callout`, `bullets`, `figure`, `checklist`, ...) plutôt
que de HTML brut — ça permet la recherche, le mode lecture confortable, et un
rendu cohérent. Les schémas sources sont dans `content/figures/` (hors
`/public`, jamais accessibles en dehors de la route `/api/figure/[name]`, qui
vérifie la session et l'achat avant de filigraner et servir chaque image).

Pour ajouter un chapitre : ajouter une entrée dans le tableau `CHAPTERS`, avec
un `id` unique (utilisé dans l'URL `/lire/[id]`) et `free: true/false`.

## Notes de développement

- Le service worker (`public/sw.js`) ne met en cache **que** l'app shell
  (icônes, manifest, page hors-ligne). Le contenu du livre et les figures ne
  sont jamais mis en cache navigateur : ce sont des routes privées gardées
  par cookie de session, et les mettre en cache exposerait le contenu payant
  sur un appareil partagé après déconnexion.
- En développement, chaque route se compile à la demande au premier appel
  (normal avec Next.js/Turbopack) — les premières requêtes après un
  redémarrage du serveur peuvent sembler lentes ; ça n'existe plus une fois
  `npm run build` fait (toutes les routes précompilées).
