import type { Block } from '@/content/book';
import { LiquiditySvg } from './LiquiditySvg';
import { SlTpSvg } from './SlTpSvg';

const CALLOUT_STYLES: Record<string, { border: string; title: string; bg: string }> = {
  gold: { border: 'border-l-[var(--gold)]', title: 'text-[var(--gold-soft)]', bg: 'bg-[rgba(217,166,62,0.07)]' },
  green: { border: 'border-l-[var(--green)]', title: 'text-[var(--green-soft)]', bg: 'bg-[var(--green-bg)]' },
  red: { border: 'border-l-[var(--red)]', title: 'text-[var(--red-soft)]', bg: 'bg-[var(--red-bg)]' },
  blue: { border: 'border-l-[var(--blue)]', title: 'text-[var(--blue-soft)]', bg: 'bg-[var(--blue-bg)]' },
  neutral: { border: 'border-l-[var(--border)]', title: 'text-[var(--text)]', bg: 'bg-[var(--surface-2)]' },
};

export function BlockRenderer({ block, figureBase }: { block: Block; figureBase: string }) {
  switch (block.t) {
    case 'lead':
      return <p className="text-[15px] font-medium text-[var(--text-faint)]">{block.text}</p>;

    case 'p':
      return <p>{block.text}</p>;

    case 'sequence':
      return (
        <div className="my-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          {block.items.map((item, i) => (
            <span key={item} className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--surface-3)] px-3 py-1.5 text-[13px] font-medium text-[var(--text)]">
                {item}
              </span>
              {i < block.items.length - 1 && (
                <span className="text-[var(--text-faint)]" aria-hidden>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      );

    case 'bullets':
      return (
        <ul className="my-4 space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[var(--text-dim)]">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <dl className="my-4 space-y-3">
          {block.items.map((s) => (
            <div key={s.label} className="flex gap-3">
              <dt className="w-20 shrink-0 text-[13px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
                {s.label}
              </dt>
              <dd className="text-[var(--text-dim)]">{s.text}</dd>
            </div>
          ))}
        </dl>
      );

    case 'callout': {
      const style = CALLOUT_STYLES[block.variant];
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <div className={`my-5 rounded-[var(--radius-sm)] border-l-[3px] ${style.border} ${style.bg} p-4`}>
          {block.title && <p className={`text-[15px] font-semibold ${style.title}`}>{block.title}</p>}
          {block.text && <p className="mt-1.5 text-[var(--text-dim)]">{block.text}</p>}
          {block.items && (
            <ListTag className={`mt-1.5 space-y-1.5 text-[var(--text-dim)] ${block.ordered ? 'list-decimal pl-5' : ''}`}>
              {block.items.map((item) => (
                <li key={item} className={block.ordered ? '' : 'flex gap-2.5'}>
                  {!block.ordered && <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />}
                  <span>{item}</span>
                </li>
              ))}
            </ListTag>
          )}
        </div>
      );
    }

    case 'figure':
      return (
        <figure className="my-6">
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${figureBase}/${block.src}`}
              alt={block.alt}
              width={block.w}
              height={block.h}
              loading="lazy"
              className="block w-full select-none"
              draggable={false}
              style={{ aspectRatio: `${block.w} / ${block.h}` }}
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-[13px] text-[var(--text-faint)]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'svg':
      return (
        <figure className="my-6">
          {block.name === 'liquidity' ? <LiquiditySvg /> : <SlTpSvg />}
          {block.caption && (
            <figcaption className="mt-2 text-center text-[13px] text-[var(--text-faint)]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'checklist':
      return (
        <div className="my-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
            {block.title}
          </p>
          <ul className="space-y-2.5">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[var(--text-dim)]">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border border-[var(--border)] text-[10px]">
                  ✓
                </span>
                <span className="text-[14.5px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
}
