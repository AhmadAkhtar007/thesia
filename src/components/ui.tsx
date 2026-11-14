import { useEffect, useId, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { marked } from 'marked';
import { LuBookmark, LuX } from 'react-icons/lu';
import { useApp } from '../lib/app';
import { Link, useNavigate } from '../lib/router';
import { initials } from '../lib/format';
import type { SavedKind } from '../lib/repo';

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <path d="M8.5 10.5h15" stroke="var(--highlight)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M16 10.5v13" stroke="var(--paper)" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ name, large }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar${large ? ' avatar-lg' : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function SamplePill() {
  return (
    <span className="pill pill-sample" title="Example content for the beta">
      Sample
    </span>
  );
}

export function SaveButton({ kind, id, label }: { kind: SavedKind; id: string; label: string }) {
  const { isSaved, toggleSaved } = useApp();
  const saved = isSaved(kind, id);
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved` : `Save ${label}`}
      title={saved ? 'Saved' : 'Save'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(kind, id);
      }}
    >
      <LuBookmark />
    </button>
  );
}

export function Markdown({ source, className = 'prose' }: { source: string; className?: string }) {
  const navigate = useNavigate();
  const html = useMemo(() => marked.parse(source, { async: false, gfm: true, breaks: false }) as string, [source]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (href.startsWith('/')) {
          e.preventDefault();
          navigate(href);
        } else if (/^https?:/.test(href)) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noreferrer noopener');
        }
      }}
    />
  );
}

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} style={wide ? { width: 'min(760px, 100%)' } : undefined}>
        <div className="sheet-head">
          <h2 id={id} style={{ fontSize: 'var(--t-xl)' }}>
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <div>{children}</div>}
      {action}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function ToggleChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label?: string;
}) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className="chip"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHead({ title, lede, crumbs, children }: { title: ReactNode; lede?: ReactNode; crumbs?: { to: string; label: string }[]; children?: ReactNode }) {
  return (
    <header className="page-head">
      {crumbs && (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.to}>
              <Link to={c.to}>{c.label}</Link>
              {i < crumbs.length - 1 ? ' /' : ''}
            </span>
          ))}
        </nav>
      )}
      <h1>{title}</h1>
      {lede && <p>{lede}</p>}
      {children}
    </header>
  );
}

export function CopyButton({ text, label = 'Copy', className = 'btn btn-secondary btn-sm' }: { text: string; label?: string; className?: string }) {
  const { toast } = useApp();
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        const btn = e.currentTarget;
        const fallback = () => {
          const pre = btn.closest('[data-copy-scope]')?.querySelector('[data-copy-target]');
          if (pre) {
            const range = document.createRange();
            range.selectNodeContents(pre);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            toast('Selected. Press Ctrl+C or Cmd+C to copy.');
          } else toast('Copy isn’t available here. Select the text and copy it.');
        };
        try {
          navigator.clipboard.writeText(text).then(() => toast('Copied'), fallback);
        } catch {
          fallback();
        }
      }}
    >
      {label}
    </button>
  );
}
