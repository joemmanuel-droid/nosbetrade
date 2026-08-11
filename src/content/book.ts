/**
 * Contenu du livre, transcrit depuis Gold_Strategy_by_Nosbe_Trade_v2.pdf.
 *
 * Le texte est stocke en blocs plutot qu'en HTML : cela permet de le rendre en
 * HTML natif (lecture confortable, mode nuit, taille de police, recherche) et
 * surtout de ne servir au client que les chapitres auxquels il a droit.
 *
 * Les figures ne sont PAS dans /public : elles vivent dans content/figures et
 * sont servies filigranees par /api/figure/[name].
 */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'lead'; text: string }
  | { t: 'sequence'; items: string[] }
  | { t: 'bullets'; items: string[] }
  | { t: 'steps'; items: { label: string; text: string }[] }
  | {
      t: 'callout';
      variant: 'gold' | 'green' | 'red' | 'blue' | 'neutral';
      title?: string;
      text?: string;
      items?: string[];
      ordered?: boolean;
    }
  | { t: 'figure'; src: string; alt: string; caption?: string; w: number; h: number }
  | { t: 'svg'; name: 'liquidity' | 'sltp'; caption?: string }
  | { t: 'checklist'; title: string; items: string[] };

export type Chapter = {
  id: string;
  n: number;
  title: string;
  subtitle: string;
  /** Chapitre lisible sans achat (accroche commerciale). */
  free: boolean;
  minutes: number;
  blocks: Block[];
};

export const BOOK = {
  slug: 'gold-strategy-nosbe-trade',
  title: 'Gold Strategy',
  author: 'Nosbe Trade',
  tagline: 'BOS • LIQUIDITÉ • CHOCH — M5 → M3',
  pitch:
    "Manuel pédagogique pour lire une structure simple sur l'or (XAUUSD), attendre une réaction, une prise de liquidité puis une bougie d'englobement avant l'entrée.",
  whatsapp: '+226 06726239',
  disclaimer:
    "Ce document est éducatif. Aucun setup ne garantit un résultat. La gestion du risque et la discipline restent prioritaires.",
  footnote:
    "Les exemples visuels fournis servent d'illustration pédagogique de la logique décrite. Ils ne constituent pas une promesse de performance future.",
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'introduction',
    n: 1,
    title: 'Introduction',
    subtitle: "Comprendre la logique générale avant de chercher une entrée.",
    free: true,
    minutes: 2,
    blocks: [
      {
        t: 'p',
        text: "La Gold Strategy by Nosbe Trade est une méthode discrétionnaire destinée à lire les mouvements de structure sur l'or en combinant deux unités de temps : M5 pour le contexte et M3 pour affiner l'exécution.",
      },
      {
        t: 'p',
        text: "L'idée centrale est de ne pas entrer simplement parce qu'un niveau est touché. On cherche d'abord une structure exploitable, puis une réaction sur le niveau, ensuite une prise de liquidité et enfin une bougie d'englobement qui confirme l'intention.",
      },
      { t: 'callout', variant: 'gold', title: 'La séquence à retenir' },
      {
        t: 'sequence',
        items: [
          'Tendance M5',
          'BOS / CHOCH',
          '1ʳᵉ réaction avec mèche',
          '2ᵉ réaction qui prend la mèche la plus longue',
          'Englobement',
          'Entrée',
          'SL',
          'TP',
        ],
      },
      {
        t: 'steps',
        items: [
          { label: 'M5', text: 'déterminer le contexte et la structure dominante.' },
          { label: 'M3', text: "attendre la réaction précise et construire l'entrée." },
          { label: 'Entrée', text: 'uniquement après la séquence complète, pas au premier contact.' },
          { label: 'Risque', text: 'conserver un stop cohérent et éviter de multiplier les trades.' },
        ],
      },
    ],
  },

  {
    id: 'tendance-m5',
    n: 2,
    title: 'Étape 1 — Repérer la tendance en M5',
    subtitle: "Le M5 donne le scénario ; le M3 donne l'exécution.",
    free: true,
    minutes: 3,
    blocks: [
      {
        t: 'p',
        text: "Avant de chercher un BOS ou un CHOCH, commence par identifier la façon dont le prix construit ses sommets et ses creux. La stratégie fonctionne uniquement dans une tendance claire : haussière ou baissière.",
      },
      {
        t: 'figure',
        src: 'trend-bullish',
        alt: 'Tendance haussière : sommets plus hauts (HH) et creux plus hauts (HL)',
        caption: 'Tendance haussière — HH + HL → privilégier les BUY',
        w: 911,
        h: 749,
      },
      {
        t: 'figure',
        src: 'trend-bearish',
        alt: 'Tendance baissière : sommets plus bas (LH) et creux plus bas (LL)',
        caption: 'Tendance baissière — LH + LL → privilégier les SELL',
        w: 910,
        h: 749,
      },
      {
        t: 'callout',
        variant: 'blue',
        title: 'Comment repérer la tendance ?',
        items: [
          'Haussière : les sommets deviennent plus hauts (HH) et les creux plus hauts (HL).',
          'Baissière : les sommets deviennent plus bas (LH) et les creux plus bas (LL).',
          "Si la structure n'est pas claire, on ne force pas le setup : la stratégie ne s'utilise pas en range.",
        ],
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Règle fondamentale',
        text: "La Gold Strategy by Nosbe Trade s'applique uniquement dans une tendance claire. En tendance haussière, on recherche les configurations BUY. En tendance baissière, on recherche les configurations SELL. Le M5 sert à filtrer le contexte avant de passer au M3.",
      },
      {
        t: 'p',
        text: "Règle pratique : le M5 sert à savoir « de quel côté du marché ai-je davantage de raisons de chercher un setup ? ».",
      },
    ],
  },

  {
    id: 'bos',
    n: 3,
    title: 'BOS — Break of Structure',
    subtitle: "La cassure qui confirme la poursuite d'une structure.",
    free: true,
    minutes: 2,
    blocks: [
      {
        t: 'callout',
        variant: 'green',
        title: 'BOS = cassure dans le sens de la structure',
        text: "BOS signifie Break of Structure, c'est-à-dire cassure de structure. Dans une lecture haussière, le prix casse un sommet structurel précédent. Dans une lecture baissière, il casse un creux structurel précédent.",
      },
      {
        t: 'p',
        text: "Le BOS est intéressant parce qu'il indique que le marché a réussi à dépasser un point important de la structure. Mais une cassure seule n'est pas, dans cette méthode, le signal d'entrée : elle sert d'abord à définir le contexte et le niveau à surveiller.",
      },
      {
        t: 'callout',
        variant: 'neutral',
        title: 'À vérifier',
        ordered: true,
        items: [
          'Le niveau cassé est-il réellement structurel ?',
          'La cassure est-elle lisible ?',
          'Le contexte M5 est-il cohérent ?',
          'Le niveau peut-il servir de zone de réaction ?',
        ],
      },
    ],
  },

  {
    id: 'choch',
    n: 4,
    title: 'CHOCH — Change of Character',
    subtitle: 'Le changement de comportement de la structure.',
    free: false,
    minutes: 2,
    blocks: [
      {
        t: 'callout',
        variant: 'red',
        title: 'CHOCH = changement de caractère / rupture opposée',
        text: "CHOCH signifie Change of Character. Il décrit un changement de comportement : après une structure qui avançait dans une direction, le prix casse un point structurel important dans le sens opposé.",
      },
      {
        t: 'p',
        text: "Exemple : le marché forme plusieurs sommets et creux ascendants, puis casse un creux significatif. Cette rupture peut signaler que la dynamique haussière perd sa domination et qu'un scénario baissier devient envisageable.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'BOS vs CHOCH',
        text: "BOS = continuité / confirmation de la structure. CHOCH = changement de caractère / première alerte d'un changement de direction. Dans les deux cas, on attend ensuite le comportement du prix avant de prendre une position.",
      },
    ],
  },

  {
    id: 'deux-reactions',
    n: 5,
    title: 'Les deux réactions',
    subtitle: 'Le cœur du setup : réaction, puis prise de liquidité.',
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'p',
        text: "Après avoir identifié le BOS ou le CHOCH, on ne prend pas immédiatement position. Il faut attendre deux réactions successives autour de la zone.",
      },
      {
        t: 'callout',
        variant: 'blue',
        title: 'Première réaction',
        text: "Le prix vient réagir sur le niveau et laisse une ou plusieurs mèches. Cette réaction nous montre où le marché a rejeté le niveau et crée une référence de liquidité potentielle.",
      },
      {
        t: 'callout',
        variant: 'green',
        title: 'Deuxième réaction',
        text: "Le prix revient ensuite et prend la liquidité de la mèche la plus longue laissée par la première réaction. Cette étape est importante : elle montre que le marché est allé chercher des ordres avant de choisir sa direction.",
      },
      {
        t: 'callout',
        variant: 'red',
        title: 'Attention',
        text: "Une simple mèche ne suffit pas. La séquence doit rester cohérente avec le contexte et le niveau identifié.",
      },
    ],
  },

  {
    id: 'liquidite',
    n: 6,
    title: "Qu'est-ce que la liquidité ?",
    subtitle: 'Une notion essentielle pour comprendre la prise de mèche.',
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'svg',
        name: 'liquidity',
        caption: 'LIQUIDITÉ : zone où se concentrent des ordres / stops',
      },
      {
        t: 'p',
        text: "En trading, on parle de liquidité pour désigner des zones où beaucoup d'ordres peuvent être concentrés : stops de positions, ordres en attente, ou réactions autour de niveaux visibles. Les sommets et creux récents sont donc souvent surveillés.",
      },
      {
        t: 'p',
        text: "Dans cette stratégie, la « prise de liquidité » correspond au mouvement qui dépasse brièvement une zone de mèche ou un extrême identifiable, avant de revenir. L'objectif n'est pas de prédire chaque chasse aux stops, mais d'attendre une réaction observable.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Image mentale',
        text: "Première réaction = création d'une mèche. Deuxième réaction = le prix dépasse cette mèche, récupère la liquidité, puis doit montrer une réponse directionnelle. C'est cette réponse qui prépare l'englobement.",
      },
    ],
  },

  {
    id: 'englobement',
    n: 7,
    title: "L'entrée — attendre l'englobement",
    subtitle: 'La confirmation finale avant de placer la position.',
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'p',
        text: "Après les deux réactions et la prise de liquidité, on attend une bougie englobante. L'englobement doit confirmer le sens recherché : bullish pour un BUY, bearish pour un SELL.",
      },
      {
        t: 'callout',
        variant: 'green',
        title: 'Pour un BUY',
        text: "Après la prise de liquidité sous la zone, attendre une réaction haussière nette et une bougie qui englobe la précédente ou la séquence de baisse immédiate. L'entrée peut alors être placée selon les règles d'exécution choisies.",
      },
      {
        t: 'callout',
        variant: 'red',
        title: 'Pour un SELL',
        text: "Après la prise de liquidité au-dessus de la zone, attendre une réaction baissière nette et une bougie englobante. L'entrée est ensuite construite avec le SL au-dessus de la zone protégée.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Checklist avant clic',
        text: "M5 clair ? BOS/CHOCH identifié ? première réaction ? deuxième réaction ? prise de liquidité ? englobement ? SL logique ? TP logique ? Si une étape manque, patienter.",
      },
    ],
  },

  {
    id: 'setup-buy-bos',
    n: 8,
    title: 'Setup BUY — BOS',
    subtitle: 'Lecture pédagogique du schéma BUY fourni.',
    free: false,
    minutes: 2,
    blocks: [
      {
        t: 'figure',
        src: 'setup-buy-bos',
        alt: 'Schéma du setup BUY après BOS : niveau structurel, réaction, prise de liquidité, englobement, zone de profit et zone de risque',
        caption: 'BOS BUY — lecture du setup',
        w: 891,
        h: 1567,
      },
      {
        t: 'p',
        text: "Sur ce schéma, la lecture recherchée est une structure qui reprend de la force vers le haut. Le niveau bleu sert de repère structurel. La réaction, la prise de liquidité puis l'englobement conduisent au scénario BUY.",
      },
      {
        t: 'p',
        text: "L'idée est d'attendre la confirmation plutôt que d'acheter simplement parce que le prix touche le niveau. Le rectangle vert représente la zone de profit et le rectangle rouge la zone de risque.",
      },
    ],
  },

  {
    id: 'setup-buy-choch',
    n: 9,
    title: 'Setup BUY — CHOCH',
    subtitle: 'Scénario de retournement haussier après changement de caractère.',
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'figure',
        src: 'setup-buy-choch',
        alt: 'Schéma du setup BUY après CHOCH : cassure haussière, retour sur zone, prise de liquidité, englobement haussier',
        caption: 'CHOCH BUY — lecture du setup',
        w: 928,
        h: 1487,
      },
      {
        t: 'p',
        text: "Le scénario CHOCH BUY cherche un changement de comportement : après une phase baissière, le prix casse une référence importante vers le haut. On surveille ensuite le retour sur la zone, la prise de liquidité et l'englobement haussier.",
      },
      {
        t: 'bullets',
        items: [
          "Après une phase baissière, le prix montre un changement de caractère et casse une référence structurelle vers le haut.",
          "On attend ensuite la réaction sur la zone, puis la deuxième réaction qui vient prendre la liquidité de la mèche la plus longue de la première réaction.",
          "Après cette prise de liquidité, on attend une bougie englobante haussière. C'est cette confirmation qui permet d'envisager l'entrée BUY.",
          "Le SL doit rester sous l'Order Block / zone d'invalidation, tandis que le TP vise la prochaine cassure de BOS pertinente.",
        ],
      },
      {
        t: 'callout',
        variant: 'red',
        title: 'Point clé',
        text: "Un CHOCH est une alerte de changement de caractère, pas une garantie de retournement. La confirmation sur M3 reste indispensable.",
      },
    ],
  },

  {
    id: 'setup-sell-bos',
    n: 10,
    title: 'Setup SELL — BOS',
    subtitle: 'Scénario de continuation baissière.',
    free: false,
    minutes: 2,
    blocks: [
      {
        t: 'figure',
        src: 'setup-sell-bos',
        alt: 'Schéma du setup SELL après BOS : cassure de creux structurel, retour sur zone, prise de liquidité, englobement baissier',
        caption: 'BOS SELL — lecture du setup',
        w: 931,
        h: 1501,
      },
      {
        t: 'p',
        text: "Ici, le scénario recherché est une structure baissière qui poursuit son mouvement après la cassure d'un creux structurel. Le retour sur la zone doit produire les réactions attendues, puis la prise de liquidité et l'englobement bearish.",
      },
      {
        t: 'p',
        text: "L'entrée SELL est alors envisagée avec un risque court et un objectif vers la prochaine zone de cassure structurelle.",
      },
    ],
  },

  {
    id: 'setup-sell-choch',
    n: 11,
    title: 'Setup SELL — CHOCH',
    subtitle: 'Scénario de retournement baissier.',
    free: false,
    minutes: 2,
    blocks: [
      {
        t: 'figure',
        src: 'setup-sell-choch',
        alt: 'Schéma du setup SELL après CHOCH : cassure baissière, retour, deux réactions, prise de liquidité, englobement baissier',
        caption: 'CHOCH SELL — lecture du setup',
        w: 931,
        h: 1396,
      },
      {
        t: 'p',
        text: "Le marché était précédemment orienté à la hausse, puis un point structurel important est cassé vers le bas. On ne vend pas au simple moment de la cassure : on attend le retour, les deux réactions, la prise de liquidité et l'englobement bearish.",
      },
      {
        t: 'p',
        text: "Cette séquence permet de transformer une idée de retournement en setup défini, avec un niveau d'invalidation clair.",
      },
    ],
  },

  {
    id: 'sl-tp',
    n: 12,
    title: 'Stop Loss & Take Profit',
    subtitle: "Construire le risque et l'objectif avant l'entrée.",
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'svg',
        name: 'sltp',
        caption: 'Objectif : risque court, cible jusqu\'à la prochaine cassure de structure',
      },
      {
        t: 'callout',
        variant: 'red',
        title: 'Stop Loss',
        text: "Placer le SL au-dessus ou en dessous de l'Order Block selon le sens de la position. Le niveau exact doit invalider le scénario, pas être choisi au hasard.",
      },
      {
        t: 'callout',
        variant: 'green',
        title: 'Take Profit',
        text: "Viser la prochaine cassure de BOS / prochaine zone structurelle pertinente. La stratégie fixe un RR maximum de 1:4 : ne pas transformer artificiellement un petit setup en cible irréaliste.",
      },
    ],
  },

  {
    id: 'risque-discipline',
    n: 13,
    title: 'Gestion du risque & discipline',
    subtitle: 'Les règles protègent le trader contre les décisions impulsives.',
    free: false,
    minutes: 3,
    blocks: [
      {
        t: 'callout',
        variant: 'gold',
        title: 'Règle 1 — Maximum 3 trades par jour',
        text: "Limiter le nombre de tentatives évite de chercher artificiellement un setup lorsque le marché n'offre plus de configuration claire.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Règle 2 — Deux SL = arrêt de la journée',
        text: "Après deux Stop Loss, pas de troisième trade. Le but est de protéger le capital et surtout l'état d'esprit.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Règle 3 — RR maximum 1:4',
        text: "Une cible de quatre fois le risque est un plafond, pas une obligation. Si la prochaine structure est trop proche, le trade peut être ignoré.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'Règle 4 — Pas de FOMO',
        text: "Si la prise de liquidité ou l'englobement est déjà passée, ne cours pas après le prix. Attends un nouveau setup propre.",
      },
      {
        t: 'p',
        text: "Journal recommandé : note la date, l'heure, le contexte M5, le BOS/CHOCH, les deux réactions, la prise de liquidité, l'englobement, l'entrée, le SL, le TP et le résultat.",
      },
    ],
  },

  {
    id: 'checklist',
    n: 14,
    title: 'Checklist finale',
    subtitle: 'La stratégie en une page.',
    free: false,
    minutes: 2,
    blocks: [
      {
        t: 'checklist',
        title: 'AVANT LE TRADE',
        items: [
          'Tendance M5 identifiée',
          'BOS ou CHOCH clairement identifié',
          'Zone de réaction définie',
          'Première réaction avec mèche',
          'Deuxième réaction',
          'Prise de liquidité de la mèche la plus longue',
          'Bougie englobante confirmée',
          "Order Block et invalidation identifiés",
          'SL placé',
          'TP vers la prochaine cassure de structure',
          'RR ≤ 1:4',
          "Moins de 3 trades aujourd'hui",
          "Pas déjà 2 SL aujourd'hui",
        ],
      },
      {
        t: 'p',
        text: "La force de cette méthode ne vient pas d'un signal isolé, mais de la confluence entre structure, réaction, liquidité et confirmation. La patience fait partie du setup.",
      },
      {
        t: 'callout',
        variant: 'gold',
        title: 'GOLD STRATEGY BY NOSBE TRADE',
        text: 'M5 → structure • M3 → exécution • Discipline → protection',
      },
    ],
  },
];

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

export function getChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Metadonnees de sommaire : toujours publiques, meme sans achat. */
export function tableOfContents() {
  return CHAPTERS.map(({ id, n, title, subtitle, free, minutes }) => ({
    id,
    n,
    title,
    subtitle,
    free,
    minutes,
  }));
}

export const TOTAL_MINUTES = CHAPTERS.reduce((s, c) => s + c.minutes, 0);
export const FREE_CHAPTER_COUNT = CHAPTERS.filter((c) => c.free).length;

/** Noms de figures autorises : garde-fou contre le path traversal. */
export const FIGURE_NAMES = CHAPTERS.flatMap((c) =>
  c.blocks.filter((b): b is Extract<Block, { t: 'figure' }> => b.t === 'figure').map((b) => b.src),
);
