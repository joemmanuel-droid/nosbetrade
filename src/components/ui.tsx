import Link from 'next/link';
import type { ReactNode } from 'react';

export function Button({
  children,
  variant = 'gold',
  size = 'md',
  full,
  type = 'button',
  disabled,
  onClick,
  href,
}: {
  children: ReactNode;
  variant?: 'gold' | 'ghost' | 'outline' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  full?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-[15px] px-5 py-3',
    lg: 'text-base px-6 py-3.5',
  }[size];
  const variants = {
    gold: 'bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] text-[#1a1305] shadow-[0_6px_20px_rgba(217,166,62,0.28)] hover:brightness-105',
    ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]',
    outline: 'bg-transparent border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]',
    danger: 'bg-[var(--red)] text-white hover:brightness-110',
  }[variant];
  const cls = `${base} ${sizes} ${variants} ${full ? 'w-full' : ''}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'gold' | 'green' | 'red' | 'blue';
}) {
  const tones = {
    neutral: 'bg-[var(--surface-3)] text-[var(--text-dim)]',
    gold: 'bg-[rgba(217,166,62,0.14)] text-[var(--gold-soft)]',
    green: 'bg-[var(--green-bg)] text-[var(--green-soft)]',
    red: 'bg-[var(--red-bg)] text-[var(--red-soft)]',
    blue: 'bg-[var(--blue-bg)] text-[var(--blue-soft)]',
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones}`}>
      {children}
    </span>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color: 'currentColor' }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
