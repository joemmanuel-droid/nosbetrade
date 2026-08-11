/**
 * Redessine proprement le schema "liquidite" de la page 7 du livre (le PDF
 * source chevauchait un label sur une mèche). Purement decoratif/pedagogique,
 * aucune donnee de marche reelle.
 */
export function LiquiditySvg() {
  const wick = (x: number, topY: number, bottomY: number, tickY1: number, tickY2: number, color: string) => (
    <g stroke={color} strokeWidth={3} strokeLinecap="round">
      <line x1={x} y1={topY} x2={x} y2={bottomY} />
      <line x1={x - 14} y1={tickY1} x2={x + 14} y2={tickY1} />
      <line x1={x - 14} y1={tickY2} x2={x + 14} y2={tickY2} />
    </g>
  );

  return (
    <svg viewBox="0 0 640 240" className="h-auto w-full" role="img" aria-label="Schéma illustrant une mèche puis une prise de liquidité">
      <rect x={0.5} y={0.5} width={639} height={239} rx={16} fill="var(--surface-2)" stroke="var(--border)" />

      <text x={24} y={34} fill="var(--gold-soft)" fontSize={13} fontWeight={700} letterSpacing={0.3}>
        LIQUIDITÉ : zone où se concentrent des ordres / stops
      </text>

      <text x={70} y={78} fill="var(--text-dim)" fontSize={12}>mèche</text>
      {wick(150, 78, 176, 100, 152, 'var(--blue)')}

      {wick(280, 92, 178, 112, 150, 'var(--blue)')}

      <text x={378} y={116} fill="var(--text-dim)" fontSize={12}>prise de liquidité</text>
      {wick(420, 70, 190, 96, 142, 'var(--red)')}

      <line x1={420} y1={120} x2={560} y2={120} stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="1 7" strokeLinecap="round" />
      <line x1={468} y1={132} x2={468} y2={188} stroke="var(--green)" strokeWidth={3} strokeLinecap="round" />
      <path d="M 458 178 L 468 194 L 478 178" fill="none" stroke="var(--green)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
