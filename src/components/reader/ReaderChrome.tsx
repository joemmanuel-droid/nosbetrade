'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type TocEntry = { id: string; n: number; title: string; free: boolean };

const MIN_SIZE = 15;
const MAX_SIZE = 21;

export function ReaderChrome({
  chapterId,
  chapterN,
  chapterTitle,
  toc,
  hasAccess,
  children,
}: {
  chapterId: string;
  chapterN: number;
  chapterTitle: string;
  toc: TocEntry[];
  hasAccess: boolean;
  children: ReactNode;
}) {
  const [tocOpen, setTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [scrollPercent, setScrollPercent] = useState(0);
  const sentRef = useRef(-1);

  useEffect(() => {
    const saved = Number(localStorage.getItem('reader:fontSize'));
    if (saved >= MIN_SIZE && saved <= MAX_SIZE) setFontSize(saved);
  }, []);

  function changeFontSize(delta: number) {
    setFontSize((s) => {
      const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, s + delta));
      localStorage.setItem('reader:fontSize', String(next));
      return next;
    });
  }

  // Suivi de progression : pourcentage de defilement de la page.
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const pct = total > 0 ? Math.round((window.scrollY / total) * 100) : 100;
      setScrollPercent(Math.min(100, Math.max(0, pct)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sauvegarde throttlee de la progression (evite un appel a chaque pixel).
  useEffect(() => {
    if (!hasAccess) return;
    const meaningfulChange = Math.abs(scrollPercent - sentRef.current) >= 5;
    if (!meaningfulChange && scrollPercent < 100) return;

    const t = setTimeout(() => {
      sentRef.current = scrollPercent;
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, percent: scrollPercent }),
        keepalive: true,
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [scrollPercent, chapterId, hasAccess]);

  return (
    <div>
      {/* Barre de progression */}
      <div className="fixed inset-x-0 top-0 z-30 h-[3px] bg-[var(--border-soft)]">
        <div
          className="h-full bg-[linear-gradient(90deg,var(--gold),var(--gold-soft))] transition-[width] duration-150"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      {/* Barre superieure */}
      <header className="sticky top-0 z-20 border-b border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <button
            onClick={() => setTocOpen(true)}
            aria-label="Sommaire"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[var(--surface-2)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--text)]">
              {chapterN}. {chapterTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--border)] p-0.5">
            <button
              onClick={() => changeFontSize(-1)}
              disabled={fontSize <= MIN_SIZE}
              aria-label="Réduire le texte"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] text-[var(--text-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30"
            >
              A-
            </button>
            <button
              onClick={() => changeFontSize(1)}
              disabled={fontSize >= MAX_SIZE}
              aria-label="Agrandir le texte"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] text-[var(--text-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      <div style={{ ['--reader-size' as string]: `${fontSize}px` }}>{children}</div>

      {tocOpen && <TocDrawer toc={toc} activeId={chapterId} onClose={() => setTocOpen(false)} />}
    </div>
  );
}

function TocDrawer({ toc, activeId, onClose }: { toc: TocEntry[]; activeId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-[86%] max-w-sm flex-col bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3.5">
          <p className="text-sm font-semibold">Sommaire</p>
          <button onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {toc.map((c) => (
            <Link
              key={c.id}
              href={`/lire/${c.id}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                c.id === activeId ? 'bg-[var(--surface-2)] text-[var(--gold-soft)]' : 'text-[var(--text-dim)]'
              }`}
            >
              <span className="w-5 shrink-0 text-xs text-[var(--text-faint)]">{c.n}</span>
              <span className="flex-1 truncate">{c.title}</span>
              {!c.free && <span className="text-xs text-[var(--text-faint)]">🔒</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--border-soft)] p-4">
          <Link href="/compte" className="text-xs text-[var(--text-faint)] underline underline-offset-2">
            Mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}
