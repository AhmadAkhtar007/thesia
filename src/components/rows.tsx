import { LuBadgeCheck, LuCalendar, LuClock, LuExternalLink, LuMapPin, LuUsers } from 'react-icons/lu';
import { conferenceStatus, type ConferenceStatus } from '../data/conferences';
import { useApp } from '../lib/app';
import { formatDate, formatRange, relativeDays, daysFromToday } from '../lib/format';
import { highlightParts, projectFit } from '../lib/match';
import { fairPrice, formatUsd } from '../lib/pricing';
import { Link } from '../lib/router';
import { CREDIT_ROLES, creditLabel, fieldLabel, levelLabel, OPEN_TO_LABEL } from '../lib/types';
import type { Bootcamp, Conference, Person, Project } from '../lib/types';
import { Avatar, SamplePill, SaveButton } from './ui';

const COMP_LABEL: Record<Project['compensation'], string> = {
  paid: 'Paid',
  stipend: 'Stipend',
  unpaid: 'Volunteer',
  'course-credit': 'Course credit',
};
const MODE_LABEL: Record<Project['mode'], string> = { remote: 'Remote', onsite: 'On site', hybrid: 'Hybrid' };

export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightParts(text, terms).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </>
  );
}

export function ProjectRow({ p, terms = [] }: { p: Project; terms?: string[] }) {
  const { profile } = useApp();
  const fit = projectFit(p, profile);
  const days = daysFromToday(p.applyBy);
  const spots = p.roles.reduce((n, r) => n + r.spots, 0);
  return (
    <div className="ledger-row is-link" style={{ cursor: 'pointer' }}>
      <div className="stack min0" style={{ ['--gap' as any]: '8px' }}>
        <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
          {p.isSample && <SamplePill />}
          {p.levels.includes('high-school') && <span className="pill pill-neutral">High school friendly</span>}
          {p.status === 'closed' && <span className="pill pill-closed">Closed</span>}
        </div>
        <h3>
          <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
            <span style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
            <Highlighted text={p.title} terms={terms} />
          </Link>
        </h3>
        <p className="muted" style={{ maxWidth: '72ch' }}>
          <Highlighted text={p.summary} terms={terms} />
        </p>
        <div className="ledger-meta">
          <span>
            <LuMapPin /> {p.mode === 'remote' ? 'Remote' : `${MODE_LABEL[p.mode]}, ${p.city}`}
            {p.country !== 'Pakistan' ? `, ${p.country}` : ''}
          </span>
          <span>
            <LuClock /> {p.hoursPerWeek} h/week for {p.durationWeeks} weeks
          </span>
          <span>
            <LuUsers /> {spots} {spots === 1 ? 'spot' : 'spots'}
          </span>
          <span>{COMP_LABEL[p.compensation]}</span>
          <span>{p.lead.name}</span>
        </div>
      </div>
      <div className="ledger-side">
        {fit && fit.score >= 40 && (
          <span className="fit" title={fit.reasons.join(', ')}>
            <b className="tabular">{fit.score}%</b> fit
          </span>
        )}
        {p.status === 'open' && (
          <span className={days <= 14 ? 'deadline small' : 'small muted'}>
            {days < 0 ? 'Applications closed' : `Apply by ${formatDate(p.applyBy, { year: false })}`}
          </span>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SaveButton kind="project" id={p.id} label={p.title} />
        </div>
      </div>
    </div>
  );
}

export const STATUS_TEXT: Record<ConferenceStatus, string> = {
  open: 'Accepting papers',
  closing: 'Deadline soon',
  closed: 'Submissions closed',
  upcoming: 'Upcoming',
  past: 'Took place',
};

export function StatusPill({ status }: { status: ConferenceStatus }) {
  const cls = status === 'open' ? 'pill-open' : status === 'closing' ? 'pill-closing' : status === 'upcoming' ? 'pill-neutral' : 'pill-closed';
  return <span className={`pill ${cls}`}>{STATUS_TEXT[status]}</span>;
}

export function ConferenceRow({ c, terms = [] }: { c: Conference & { dateText?: string }; terms?: string[] }) {
  const status = conferenceStatus(c);
  return (
    <div className={`ledger-row${status === 'past' ? ' is-past' : ''}`} id={c.id} style={{ scrollMarginTop: 90 }}>
      <div className="stack min0" style={{ ['--gap' as any]: '8px' }}>
        <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
          <StatusPill status={status} />
          {c.studentFriendly && <span className="pill pill-neutral">Student friendly</span>}
          {c.format === 'online' && <span className="pill pill-neutral">Online</span>}
        </div>
        <h3>
          <Highlighted text={c.short} terms={terms} />
          <span className="faint" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-sm)', fontWeight: 400 }}>
            {' '}
            <Highlighted text={c.name} terms={terms} />
          </span>
        </h3>
        <div className="ledger-meta">
          <span>
            <LuCalendar /> <span className="conf-date">{c.dateText || formatRange(c.start, c.end)}</span>
          </span>
          <span>
            <LuMapPin /> {c.city}
          </span>
          <span>{c.host}</span>
        </div>
        <div className="tag-row">
          {c.topics.slice(0, 5).map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        {(c.indexing || c.note) && <p className="small muted">{[c.indexing, c.note].filter(Boolean).join('. ')}</p>}
      </div>
      <div className="ledger-side">
        {c.deadline && status !== 'past' && (
          <span className={status === 'closing' ? 'deadline small' : 'small muted'}>
            {status === 'closed' ? 'Deadline passed' : `Papers due ${formatDate(c.deadline)}`}
            {status === 'closing' ? ` (${relativeDays(c.deadline)})` : ''}
          </span>
        )}
        {c.deadlineNote && status !== 'past' && <span className="xsmall faint" style={{ maxWidth: '28ch' }}>{c.deadlineNote}</span>}
        <div className="cluster" style={{ ['--gap' as any]: '4px' }}>
          <a className="btn btn-secondary btn-sm" href={c.url} target="_blank" rel="noreferrer noopener">
            Official site <LuExternalLink />
          </a>
          <SaveButton kind="conference" id={c.id} label={c.short} />
        </div>
      </div>
    </div>
  );
}

export function BootcampCard({ b }: { b: Bootcamp }) {
  const { country } = useApp();
  const price = fairPrice(b.priceUsd, country);
  return (
    <Link to={`/bootcamps/${b.id}`} className="card card-link" style={{ gap: 14 }}>
      <div className="cluster" style={{ ['--gap' as any]: '8px', justifyContent: 'space-between' }}>
        <span className="small muted">Starts {formatDate(b.start)}</span>
        {b.priceUsd === 0 ? <span className="pill pill-mark">Free</span> : b.b2b ? <span className="pill pill-neutral">For schools</span> : null}
      </div>
      <h3 style={{ fontSize: 'var(--t-xl)' }}>{b.title}</h3>
      <p className="muted small">{b.tagline}</p>
      <div className="ledger-meta" style={{ marginTop: 'auto' }}>
        <span>{b.weeks} weeks</span>
        <span>{b.hoursPerWeek} h/week</span>
        <span>{b.levels.map(levelLabel).join(', ')}</span>
      </div>
      <div className="price" style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
        <b style={{ fontSize: 'var(--t-xl)' }}>{formatUsd(price)}</b>
        {price !== b.priceUsd && b.priceUsd > 0 && (
          <span className="small muted">
            <s>{formatUsd(b.priceUsd)}</s> fair price for {country}
          </span>
        )}
        {b.b2b && <span className="small muted">per student, through your school</span>}
      </div>
    </Link>
  );
}

export function PersonCard({ p }: { p: Person }) {
  const roles = Object.entries(p.credit).sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 3);
  const max = Math.max(1, ...roles.map(([, n]) => n || 0));
  return (
    <Link to={`/people/${p.handle}`} className="card card-link person-card">
      <div className="person-top">
        <Avatar name={p.name} />
        <div className="min0">
          <h3>
            {p.name}
            {p.verified && (
              <span title="Verified by the Thesia team" style={{ color: 'var(--leaf)', marginLeft: 6 }}>
                <LuBadgeCheck aria-label="Verified" style={{ verticalAlign: '-2px', width: 18, height: 18 }} />
              </span>
            )}
          </h3>
          <div className="small muted">{p.affiliation}</div>
        </div>
      </div>
      <p className="small">{p.headline}</p>
      {roles.length > 0 && (
        <div className="credit-bars" aria-label="Most frequent contribution roles">
          {roles.map(([role, n]) => (
            <div className="credit-bar" key={role}>
              <span>{creditLabel(role)}</span>
              <i>
                <b style={{ width: `${((n || 0) / max) * 100}%` }} />
              </i>
              <span className="tabular">{n}</span>
            </div>
          ))}
        </div>
      )}
      <div className="cluster" style={{ ['--gap' as any]: '6px', marginTop: 'auto' }}>
        {p.isSample && <SamplePill />}
        <span className="tag">
          {p.city}
          {p.country !== 'Pakistan' ? `, ${p.country}` : ''}
        </span>
        {p.fields.slice(0, 1).map((f) => (
          <span className="tag" key={f}>
            {fieldLabel(f)}
          </span>
        ))}
        {p.openTo.includes('mentor') && <span className="tag">{OPEN_TO_LABEL.mentor}</span>}
      </div>
    </Link>
  );
}

export const roleHint = (id: string) => CREDIT_ROLES.find((r) => r.id === id)?.hint || '';
