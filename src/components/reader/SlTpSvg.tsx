/**
 * Redessine le schema Stop Loss / Take Profit (page 13 du PDF source, ou les
 * rectangles debordaient sur le titre a cause d'un bug de mise en page).
 */
function Panel({ label, tone }: { label: 'BUY' | 'SELL'; tone: string }) {
  const isBuy = label === 'BUY';
  // Zone de profit (verte) du cote de l'objectif, zone de risque (rouge) du cote du SL.
  const tpY = isBuy ? 18 : 96;
  const slY = isBuy ? 96 : 18;
  const entryY = isBuy ? 96 : 96;

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="mb-3 text-sm font-semibold" style={{ color: tone }}>
        Entrée {label}
      </p>
      <svg viewBox="0 0 260 150" className="h-auto w-full" role="img" aria-label={`Schéma SL/TP pour une entrée ${label}`}>
        <rect x={70} y={tpY} width={54} height={60} rx={4} fill="var(--green)" opacity={0.85} />
        <text x={132} y={tpY + 14} fill="var(--green-soft)" fontSize={13} fontWeight={700}>TP</text>

        <rect x={70} y={slY} width={54} height={36} rx={4} fill="var(--red)" opacity={0.85} />
        <text x={132} y={slY + 24} fill="var(--red-soft)" fontSize={13} fontWeight={700}>SL</text>

        <line x1={10} y1={entryY} x2={190} y2={entryY} stroke="var(--text)" strokeWidth={2} />
        <text x={10} y={entryY - 10} fill="var(--text)" fontSize={12} fontWeight={600}>Entrée</text>
      </svg>
    </div>
  );
}

export function SlTpSvg() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Panel label="BUY" tone="var(--green-soft)" />
      <Panel label="SELL" tone="var(--red-soft)" />
    </div>
  );
}
