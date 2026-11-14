import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LuAward, LuCalendar, LuCircleCheck, LuExternalLink, LuFileText, LuVideo } from 'react-icons/lu';
import { Field, Markdown, PageHead } from '../components/ui';
import { bootcampById } from '../data/bootcamps';
import { useApp } from '../lib/app';
import { CONTACT_EMAIL } from '../lib/config';
import { addDays, daysFromToday, formatDate, relativeDays } from '../lib/format';
import { repo } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import { COHORT_ACCESS, type Assignment, type Bootcamp, type Certificate, type Cohort as CohortT, type Enrollment } from '../lib/types';
import { NotFound } from './NotFound';

const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());

export function hasCohortAccess(e: Enrollment | null | undefined, b: Bootcamp) {
  if (!e) return false;
  return COHORT_ACCESS.includes(e.status) || (e.status === 'reserved' && b.priceUsd === 0);
}

export function Cohort() {
  const { id } = useParams();
  const b = bootcampById(id);
  const { user, ready } = useApp();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);
  const [cohort, setCohort] = useState<CohortT | null>(null);
  const [work, setWork] = useState<Assignment[]>([]);
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (ready && !user) navigate(`/signin?next=${encodeURIComponent(`/bootcamps/${id}/cohort`)}`, { replace: true });
  }, [ready, user, id]);

  useEffect(() => {
    if (!user || !b) return;
    repo
      .myEnrollments(user.id)
      .then((es) => setEnrollment(es.find((e) => e.bootcampId === b.id) || null))
      .catch(() => setEnrollment(null));
  }, [user, b]);

  const access = !!b && hasCohortAccess(enrollment, b);

  useEffect(() => {
    if (!user || !b || !access) return;
    repo.getCohort(b.id).then(setCohort).catch(() => setCohort(null));
    repo.myAssignments(user.id, b.id).then(setWork).catch(() => setWork([]));
    repo
      .certificatesFor(user.id)
      .then((cs) => setCert(cs.find((c) => c.kind === 'bootcamp' && c.refId === b.id) || null))
      .catch(() => {});
  }, [user, b, access]);

  if (!b) return <NotFound />;
  if (!user || enrollment === undefined)
    return (
      <div className="wrap page" aria-busy="true">
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );

  if (!access) {
    const msg = !enrollment
      ? 'You don’t have a seat in this cohort yet.'
      : enrollment.status === 'scholarship-applied'
        ? 'Your scholarship application is being reviewed. The cohort space opens as soon as it’s approved.'
        : enrollment.status === 'waitlist'
          ? 'You’re on the waitlist. We’ll email you if a seat opens.'
          : 'Your seat is reserved. The cohort space opens once payment is confirmed.';
    return (
      <div className="wrap wrap-narrow page stack">
        <PageHead crumbs={[{ to: '/bootcamps', label: 'Bootcamps' }, { to: `/bootcamps/${b.id}`, label: b.title }]} title="Cohort space" lede={msg} />
        <div className="cluster">
          <Link to={`/bootcamps/${b.id}`} className="btn btn-primary">
            {enrollment ? 'See your seat' : 'Reserve a seat'}
          </Link>
          <a className="btn btn-ghost" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Cohort access: ' + b.title)}`}>
            Email the team
          </a>
        </div>
      </div>
    );
  }

  const weeks = b.syllabus.map((w, i) => ({ ...w, n: i + 1, date: addDays(b.start, i * 7) }));
  const done = work.length;
  const started = weeks.filter((w) => daysFromToday(w.date) <= 0);
  const currentWeek = started.length ? started[started.length - 1].n : 1;

  return (
    <div className="wrap page">
      <PageHead crumbs={[{ to: '/bootcamps', label: 'Bootcamps' }, { to: `/bootcamps/${b.id}`, label: b.title }]} title={`${b.title}: cohort space`} lede={`Starts ${formatDate(b.start)} (${relativeDays(b.start)}). ${b.weeks} weeks, ${b.hoursPerWeek} hours a week.`} />
      <div className="dash">
        <div className="stack min0" style={{ ['--gap' as any]: '36px' }}>
          {cohort?.announcement && (
            <div className="callout">
              <Markdown source={cohort.announcement} className="prose small" />
            </div>
          )}
          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Week by week</h2>
              <span className="small faint tabular">
                {done} of {weeks.length} handed in
              </span>
            </div>
            <ol className="week-list">
              {weeks.map((w) => (
                <WeekItem key={w.n} bootcamp={b} week={w} current={w.n === currentWeek} sub={work.find((x) => x.week === w.n)} onSaved={(a) => setWork((xs) => [...xs.filter((x) => x.week !== a.week), a])} />
              ))}
            </ol>
          </section>
        </div>

        <aside className="stack" style={{ alignContent: 'start', ['--gap' as any]: '16px' }}>
          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Live sessions</h3>
            {cohort && isUrl(cohort.meetingUrl) ? (
              <a className="btn btn-primary btn-block" href={cohort.meetingUrl} target="_blank" rel="noreferrer noopener">
                <LuVideo aria-hidden="true" /> Join the live session
              </a>
            ) : (
              <p className="small muted">The joining link appears here at least 24 hours before the first session.</p>
            )}
            {cohort?.scheduleNote ? (
              <p className="small" style={{ whiteSpace: 'pre-wrap' }}>
                <LuCalendar aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {cohort.scheduleNote}
              </p>
            ) : (
              <p className="small muted">
                <LuCalendar aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {b.format}.
              </p>
            )}
            {cohort?.instructor && <p className="small">Taught by {cohort.instructor}</p>}
            {cohort && isUrl(cohort.materialsUrl) && (
              <a className="small" href={cohort.materialsUrl} target="_blank" rel="noreferrer noopener">
                <LuFileText aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Course materials <LuExternalLink aria-hidden="true" style={{ verticalAlign: '-2px' }} />
              </a>
            )}
          </div>
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Certificate</h3>
            {cert ? (
              <Link to={`/certificate/${cert.id}`} className="btn btn-mark btn-block">
                <LuAward aria-hidden="true" /> View your certificate
              </Link>
            ) : (
              <p className="small muted">Hand in the weekly work and present your final piece. Your instructor then marks the cohort complete and your certificate is issued here.</p>
            )}
          </div>
          <p className="xsmall faint">
            Questions about the cohort? <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(b.title)}`}>{CONTACT_EMAIL}</a>. Sessions follow our <Link to="/safeguarding">safeguarding commitments</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}

function WeekItem({ bootcamp, week, sub, current, onSaved }: { bootcamp: Bootcamp; week: { n: number; title: string; outcome: string; date: string }; sub?: Assignment; current: boolean; onSaved: (a: Assignment) => void }) {
  const { user, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(sub?.url || '');
  const [note, setNote] = useState(sub?.note || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (url && !isUrl(url)) return setErr('Paste a full link starting with https://, for example a Google Doc set to “anyone with the link can view”.');
    if (!url && note.trim().length < 20) return setErr('Add a link to your work, or describe it in at least 20 characters.');
    setErr('');
    setBusy(true);
    try {
      const a = await repo.submitAssignment(user!.id, bootcamp.id, week.n, url.trim(), note.trim());
      onSaved(a);
      setOpen(false);
      toast(`Week ${week.n} handed in`);
    } catch (e: any) {
      setErr(`Couldn’t save: ${e?.message || 'network error'}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`week${current ? ' is-current' : ''}`}>
      <div className="week-head">
        <span className="lesson-num">{week.n}</span>
        <div className="min0 stack" style={{ ['--gap' as any]: '4px' }}>
          <strong>{week.title}</strong>
          <span className="small muted">{week.outcome}</span>
          <span className="xsmall faint">Week of {formatDate(week.date)}</span>
        </div>
        <div className="week-side">
          {sub ? (
            <span className={`pill ${sub.status === 'reviewed' ? 'pill-open' : 'pill-neutral'}`}>
              <LuCircleCheck aria-hidden="true" /> {sub.status === 'reviewed' ? 'Reviewed' : 'Handed in'}
            </span>
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {sub ? 'Edit' : 'Hand in'}
          </button>
        </div>
      </div>
      {sub?.feedback && (
        <div className="msg msg-assistant" style={{ marginLeft: 46 }}>
          <span className="msg-meta">Instructor feedback</span>
          <span style={{ whiteSpace: 'pre-wrap' }}>{sub.feedback}</span>
        </div>
      )}
      {open && (
        <form className="stack week-form" onSubmit={save} style={{ ['--gap' as any]: '10px' }}>
          <Field label="Link to your work" htmlFor={`w-url-${week.n}`} hint="A Google Doc, Drive folder, GitHub repo or similar, shared so your instructor can open it.">
            <input id={`w-url-${week.n}`} className="input" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Note for your instructor (optional)" htmlFor={`w-note-${week.n}`} error={err}>
            <textarea id={`w-note-${week.n}`} className="textarea" style={{ minHeight: 80 }} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="cluster">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
              {busy ? 'Saving…' : sub ? 'Update' : 'Hand in'}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
