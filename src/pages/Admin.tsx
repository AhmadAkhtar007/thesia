// The Thesia team's console: metrics, the enquiry inbox, enrollments and certificates,
// cohort delivery, organisations and profile verification. Every action is checked again
// by the database (is_admin), so hiding this page is a convenience, not the security.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { LuBadgeCheck, LuExternalLink, LuMail } from 'react-icons/lu';
import { CopyButton, Empty, Field, PageHead } from '../components/ui';
import { BOOTCAMPS, bootcampById } from '../data/bootcamps';
import { COUNTRIES } from '../data/countries';
import { useApp } from '../lib/app';
import { LIVE, SITE_URL } from '../lib/config';
import { downloadText, formatDate, plural, relativeTime, toCSV } from '../lib/format';
import { formatUsd } from '../lib/pricing';
import { repo, type AdminEnrollment, type AdminOverview, type AdminPerson, type InboxItem, type SubmissionStatus } from '../lib/repo';
import { Link, useNavigate, useQueryState } from '../lib/router';
import { ORG_KIND_LABEL, levelLabel, type Assignment, type EnrollmentStatus, type Organization, type OrgKind } from '../lib/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'enrollments', label: 'Enrollments' },
  { id: 'cohorts', label: 'Cohorts' },
  { id: 'orgs', label: 'Organisations' },
  { id: 'people', label: 'People' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const KIND_LABEL: Record<string, string> = {
  institution: 'Institution enquiry',
  teach: 'Teaching application',
  ambassador: 'Ambassador application',
  scholarship: 'Scholarship application',
  conference: 'Suggested conference',
  lab: 'Suggested lab',
  'country-waitlist': 'Country waitlist',
  feedback: 'Feedback',
  challenge: 'Company challenge',
  'challenge-interest': 'Student challenge interest',
};
const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  reserved: 'Reserved',
  paid: 'Paid',
  'scholarship-applied': 'Scholarship applied',
  waitlist: 'Waitlist',
  confirmed: 'Confirmed',
  completed: 'Completed',
};

function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setError('');
    load()
      .then(setData)
      .catch((e) => setError(e?.message || 'Could not load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(reload, [reload]);
  return { data, error, reload, setData };
}

function Loading({ error }: { error: string }) {
  return error ? (
    <p className="callout callout-margin" role="alert">
      {error}
    </p>
  ) : (
    <div className="skeleton" style={{ height: 160 }} />
  );
}

export function Admin() {
  const { user, ready, isAdmin } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useQueryState();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id || 'overview') as Tab;

  useEffect(() => {
    if (ready && !user) navigate('/signin?next=/admin', { replace: true });
  }, [ready, user]);

  if (!user) return null;
  if (LIVE && !isAdmin)
    return (
      <div className="wrap wrap-narrow page stack">
        <h1>This page is for the Thesia team</h1>
        <p className="muted">If you run a school or university programme, your coordinator dashboard is under Organisations.</p>
        <div className="cluster">
          <Link to="/org" className="btn btn-primary">
            Your organisations
          </Link>
          <Link to="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
        </div>
      </div>
    );

  return (
    <div className="wrap page">
      <PageHead title="Admin console" lede="Run Thesia day to day: answer enquiries, confirm seats, run cohorts and set up schools.">
        {!LIVE && (
          <div className="callout" style={{ maxWidth: 760 }}>
            <strong>Demo console.</strong> It shows what you’ve done in this browser. On the live site only the Thesia team can open this page, and the database checks every action.
          </div>
        )}
      </PageHead>
      <div className="tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setParams({ tab: t.id === 'overview' ? null : t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'overview' && <Overview go={(t, extra) => setParams({ tab: t, ...extra })} />}
        {tab === 'inbox' && <Inbox kindFilter={params.get('kind') || ''} setKind={(k) => setParams({ kind: k || null })} />}
        {tab === 'enrollments' && <Enrollments />}
        {tab === 'cohorts' && <Cohorts />}
        {tab === 'orgs' && <Orgs />}
        {tab === 'people' && <People />}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="kpi" role="listitem">
      <span className="small muted">{label}</span>
      <b className="big-number tabular">{value}</b>
      {sub && <span className="xsmall faint">{sub}</span>}
    </div>
  );
}

function TopList({ title, items, empty }: { title: string; items: { name: string; n: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
      <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>{title}</h3>
      {items.length ? (
        <div className="credit-bars">
          {items.map((i) => (
            <div className="credit-bar" key={i.name} style={{ gridTemplateColumns: 'minmax(0,1fr) 110px 32px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</span>
              <i>
                <b style={{ width: `${(i.n / max) * 100}%` }} />
              </i>
              <span className="tabular">{i.n}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="small muted">{empty}</p>
      )}
    </div>
  );
}

function Overview({ go }: { go: (tab: Tab, extra?: Record<string, string>) => void }) {
  const { data: o, error } = useLoad<AdminOverview>(() => repo.adminOverview(), []);
  if (!o) return <Loading error={error} />;
  const enr = o.enrollments || {};
  const seats = Object.values(enr).reduce((a, b) => a + b, 0);
  const maxWeek = Math.max(1, ...o.signups_by_week.map((w) => w.n));
  const newTotal = Object.values(o.new_submissions || {}).reduce((a, b) => a + b, 0);
  return (
    <div className="stack" style={{ ['--gap' as any]: '28px' }}>
      <div className="kpis" role="list">
        <Stat label="People" value={o.users} sub={`${o.onboarded} with a finished passport`} />
        <Stat label="New this week" value={o.signups_7d} sub={`${o.signups_30d} in 30 days`} />
        <Stat label="Lessons finished" value={o.lessons_completed} sub={`${plural(o.certificates, 'certificate')} issued`} />
        <Stat label="Applications" value={o.applications} sub={`${o.accepted} accepted, ${o.contributions} contributions confirmed`} />
        <Stat label="Bootcamp seats" value={seats} sub={`${enr.paid || 0} paid, ${enr.confirmed || 0} confirmed, ${enr['scholarship-applied'] || 0} scholarship`} />
        <Stat label="Bootcamp revenue" value={`$${Math.round(Number(o.revenue_usd) || 0).toLocaleString('en-US')}`} sub={`${o.pro_users} on Scholar Pro`} />
        <Stat label="Organisations" value={o.organizations} sub={`${o.org_members} people with an org seat`} />
        <Stat label="Real projects" value={o.projects} sub={`${o.open_projects} open, ${plural(o.countries, 'country', 'countries')}`} />
      </div>

      {newTotal > 0 && (
        <div className="callout">
          <strong>{newTotal} new in the inbox:</strong>{' '}
          {Object.entries(o.new_submissions).map(([k, n], i) => (
            <span key={k}>
              {i ? ', ' : ''}
              <button type="button" className="link-btn" onClick={() => go('inbox', { kind: k })}>
                {n} {KIND_LABEL[k]?.toLowerCase() || k}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
        <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Sign-ups by week</h3>
        {o.signups_by_week.length ? (
          <div className="week-bars" role="img" aria-label={`Sign-ups per week: ${o.signups_by_week.map((w) => `${formatDate(w.week, { year: false })} ${w.n}`).join(', ')}`}>
            {o.signups_by_week.map((w) => (
              <div key={w.week} className="week-bar">
                <span className="xsmall tabular">{w.n}</span>
                <i style={{ height: `${Math.max(4, (w.n / maxWeek) * 120)}px` }} />
                <span className="xsmall faint">{formatDate(w.week, { year: false })}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted">No sign-ups yet.</p>
        )}
      </div>

      <div className="grid" style={{ ['--min' as any]: '280px' }}>
        <TopList title="Top referrers" items={o.top_referrers} empty="No one has joined through a referral link yet." />
        <TopList title="Top universities and schools" items={o.top_affiliations} empty="Affiliations appear as people finish their passports." />
        <TopList title="Top countries" items={o.top_countries} empty="Countries appear as people finish their passports." />
      </div>
    </div>
  );
}

function payloadRows(p: Record<string, unknown>) {
  return Object.entries(p).filter(([, v]) => v !== '' && v !== null && v !== undefined);
}

function Inbox({ kindFilter, setKind }: { kindFilter: string; setKind: (k: string) => void }) {
  const { toast } = useApp();
  const { data, error, setData } = useLoad<InboxItem[]>(() => repo.adminInbox(), []);
  const [status, setStatus] = useState<SubmissionStatus | 'open' | 'all'>('open');
  const items = useMemo(
    () =>
      (data || []).filter(
        (s) => (!kindFilter || s.kind === kindFilter) && (status === 'all' || (status === 'open' ? s.status === 'new' || s.status === 'in-progress' : s.status === status))
      ),
    [data, kindFilter, status]
  );
  if (!data) return <Loading error={error} />;
  const kinds = [...new Set(data.map((d) => d.kind))];

  const update = async (s: InboxItem, next: SubmissionStatus, note: string) => {
    try {
      await repo.adminUpdateInbox(s.id, next, note);
      setData((xs) => (xs || []).map((x) => (x.id === s.id ? { ...x, status: next, adminNote: note } : x)));
      toast('Saved');
    } catch (e: any) {
      toast(`Couldn’t save: ${e?.message}`);
    }
  };

  const exportCsv = () => {
    const keys = [...new Set(items.flatMap((i) => Object.keys(i.payload)))];
    const rows = [['Received', 'Type', 'Status', 'Name', 'Email', 'Country', ...keys, 'Note'], ...items.map((i) => [i.createdAt.slice(0, 10), KIND_LABEL[i.kind] || i.kind, i.status, i.name || '', i.email, i.country || '', ...keys.map((k) => String(i.payload[k] ?? '')), i.adminNote])];
    if (!downloadText(`thesia-inbox-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows))) toast('Exports work on the live site, not in this preview.');
  };

  return (
    <div className="stack" style={{ ['--gap' as any]: '16px' }}>
      <div className="cluster">
        <label className="sr-only" htmlFor="inbox-kind">
          Type
        </label>
        <select id="inbox-kind" className="select" style={{ width: 'auto' }} value={kindFilter} onChange={(e) => setKind(e.target.value)}>
          <option value="">All types</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k] || k}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="inbox-status">
          Status
        </label>
        <select id="inbox-status" className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="open">New and in progress</option>
          <option value="new">New</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
          <option value="all">Everything</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!items.length}>
          Export CSV
        </button>
      </div>
      {items.length === 0 ? (
        <Empty title="Inbox zero">Enquiries from the institutions page, teaching and ambassador applications, scholarships and suggestions arrive here.</Empty>
      ) : (
        <div className="ledger">
          {items.map((s) => (
            <InboxRow key={s.id} s={s} onSave={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function InboxRow({ s, onSave }: { s: InboxItem; onSave: (s: InboxItem, status: SubmissionStatus, note: string) => void }) {
  const [open, setOpen] = useState(s.status === 'new');
  const [note, setNote] = useState(s.adminNote);
  const [st, setSt] = useState<SubmissionStatus>(s.status);
  const subject = encodeURIComponent(`Re: your Thesia ${KIND_LABEL[s.kind]?.toLowerCase() || 'message'}`);
  return (
    <div className="ledger-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <button type="button" className="link-btn" style={{ textDecoration: 'none', textAlign: 'left' }} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="cluster" style={{ justifyContent: 'space-between' }}>
          <span className="stack min0" style={{ ['--gap' as any]: '2px' }}>
            <strong>
              {KIND_LABEL[s.kind] || s.kind}: {s.name || s.email}
            </strong>
            <span className="small muted">
              {String(s.payload.organisation || s.payload.university || s.payload.company || s.payload.title || s.payload.type || s.country || '')}
            </span>
          </span>
          <span className="cluster" style={{ ['--gap' as any]: '8px' }}>
            <span className={`pill ${s.status === 'new' ? 'pill-mark' : s.status === 'done' ? 'pill-open' : 'pill-neutral'}`}>{s.status}</span>
            <span className="xsmall faint">{relativeTime(s.createdAt)}</span>
          </span>
        </span>
      </button>
      {open && (
        <div className="stack" style={{ ['--gap' as any]: '12px' }}>
          <dl className="kv">
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${s.email}?subject=${subject}`}>
                <LuMail aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {s.email}
              </a>
            </dd>
            {s.country && (
              <>
                <dt>Country</dt>
                <dd>{s.country}</dd>
              </>
            )}
            {payloadRows(s.payload).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</dt>
                <dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
              </div>
            ))}
          </dl>
          <div className="form-grid">
            <Field label="Status" htmlFor={`st-${s.id}`}>
              <select id={`st-${s.id}`} className="select" value={st} onChange={(e) => setSt(e.target.value as SubmissionStatus)}>
                <option value="new">New</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Team note" htmlFor={`nt-${s.id}`} hint="Only the team sees this.">
              <input id={`nt-${s.id}`} className="input" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
          <div className="cluster">
            <button className="btn btn-primary btn-sm" onClick={() => onSave(s, st, note)}>
              Save
            </button>
            <a className="btn btn-ghost btn-sm" href={`mailto:${s.email}?subject=${subject}`}>
              Reply by email
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Enrollments() {
  const { toast } = useApp();
  const { data, error, setData } = useLoad<AdminEnrollment[]>(() => repo.adminEnrollments(), []);
  const [bootcamp, setBootcamp] = useState('');
  if (!data) return <Loading error={error} />;
  const rows = data.filter((e) => !bootcamp || e.bootcampId === bootcamp);

  const setStatus = async (e: AdminEnrollment, status: EnrollmentStatus) => {
    if (status === 'completed' && !window.confirm(`Mark ${e.name || e.email} as completed and issue their certificate?`)) return;
    try {
      const cert = await repo.adminSetEnrollment(e.id, status);
      setData((xs) => (xs || []).map((x) => (x.id === e.id ? { ...x, status, certificateId: cert || x.certificateId } : x)));
      toast(status === 'completed' ? 'Completed. Certificate issued and the student notified.' : status === 'confirmed' ? 'Seat confirmed. The student can open the cohort space.' : 'Saved');
    } catch (err: any) {
      toast(`Couldn’t update: ${err?.message}`);
    }
  };

  const exportCsv = () => {
    const out = [['Bootcamp', 'Name', 'Email', 'Status', 'Price (USD)', 'Payment ref', 'Reserved', 'Certificate'], ...rows.map((e) => [bootcampById(e.bootcampId)?.title || e.bootcampId, e.name, e.email, e.status, e.priceUsd, e.paymentRef, e.createdAt.slice(0, 10), e.certificateId || ''])];
    if (!downloadText(`thesia-enrollments-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(out))) toast('Exports work on the live site, not in this preview.');
  };

  return (
    <div className="stack" style={{ ['--gap' as any]: '16px' }}>
      <div className="cluster">
        <label className="sr-only" htmlFor="enr-bc">
          Bootcamp
        </label>
        <select id="enr-bc" className="select" style={{ width: 'auto' }} value={bootcamp} onChange={(e) => setBootcamp(e.target.value)}>
          <option value="">All bootcamps</option>
          {BOOTCAMPS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
          Export CSV
        </button>
      </div>
      <p className="small muted">
        Confirm a seat to open the cohort space (approved scholarships, school-funded seats). Paid seats confirm themselves through the payment webhook. Mark a seat completed to issue the certificate.
      </p>
      {rows.length === 0 ? (
        <Empty title="No enrollments yet">Seats appear here as soon as someone reserves one.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Bootcamp</th>
                <th scope="col">Status</th>
                <th scope="col">Price</th>
                <th scope="col">Reserved</th>
                <th scope="col">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="stack" style={{ ['--gap' as any]: '2px' }}>
                      <strong style={{ fontWeight: 600 }}>{e.name || '—'}</strong>
                      <a className="xsmall" href={`mailto:${e.email}`} style={{ overflowWrap: 'anywhere' }}>
                        {e.email}
                      </a>
                    </span>
                  </td>
                  <td>{bootcampById(e.bootcampId)?.title || e.bootcampId}</td>
                  <td>
                    <label className="sr-only" htmlFor={`es-${e.id}`}>
                      Status
                    </label>
                    <select id={`es-${e.id}`} className="select" style={{ minWidth: 170 }} value={e.status} onChange={(ev) => setStatus(e, ev.target.value as EnrollmentStatus)}>
                      {(Object.keys(STATUS_LABEL) as EnrollmentStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="tabular">{formatUsd(e.priceUsd)}</td>
                  <td className="small">{formatDate(e.createdAt)}</td>
                  <td>{e.certificateId ? <Link to={`/certificate/${e.certificateId}`} className="mono small">{e.certificateId}</Link> : <span className="faint small">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Cohorts() {
  const { toast } = useApp();
  const [bootcampId, setBootcampId] = useState(BOOTCAMPS[0].id);
  const b = bootcampById(bootcampId)!;
  const [form, setForm] = useState({ meetingUrl: '', scheduleNote: '', materialsUrl: '', instructor: '', announcement: '' });
  const [loaded, setLoaded] = useState(false);
  const { data: work, error, setData: setWork } = useLoad<Assignment[]>(() => repo.adminAssignments(bootcampId), [bootcampId]);

  useEffect(() => {
    setLoaded(false);
    repo
      .getCohort(bootcampId)
      .then((c) => setForm({ meetingUrl: c?.meetingUrl || '', scheduleNote: c?.scheduleNote || '', materialsUrl: c?.materialsUrl || '', instructor: c?.instructor || '', announcement: c?.announcement || '' }))
      .catch(() => setForm({ meetingUrl: '', scheduleNote: '', materialsUrl: '', instructor: '', announcement: '' }))
      .finally(() => setLoaded(true));
  }, [bootcampId]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await repo.adminSaveCohort({ bootcampId, ...form });
      toast('Cohort details saved. Enrolled students see them now.');
    } catch (err: any) {
      toast(`Couldn’t save: ${err?.message}`);
    }
  };
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="stack" style={{ ['--gap' as any]: '28px' }}>
      <div className="cluster">
        <label className="small muted" htmlFor="co-bc">
          Bootcamp
        </label>
        <select id="co-bc" className="select" style={{ width: 'auto' }} value={bootcampId} onChange={(e) => setBootcampId(e.target.value)}>
          {BOOTCAMPS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}, starts {formatDate(x.start)}
            </option>
          ))}
        </select>
        <Link to={`/bootcamps/${bootcampId}/cohort`} className="small">
          Open the student view <LuExternalLink aria-hidden="true" style={{ verticalAlign: '-2px' }} />
        </Link>
      </div>
      <form className="panel stack" onSubmit={save} aria-busy={!loaded}>
        <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Cohort details</h3>
        <div className="form-grid">
          <Field label="Live session link" htmlFor="co-meet" hint="Zoom, Meet or Teams. Only enrolled students see it.">
            <input id="co-meet" className="input" value={form.meetingUrl} onChange={set('meetingUrl')} placeholder="https://" />
          </Field>
          <Field label="Course materials link" htmlFor="co-mat" hint="A shared Drive folder works well.">
            <input id="co-mat" className="input" value={form.materialsUrl} onChange={set('materialsUrl')} placeholder="https://" />
          </Field>
          <Field label="Instructor" htmlFor="co-ins">
            <input id="co-ins" className="input" value={form.instructor} onChange={set('instructor')} placeholder="Dr. Name, University" />
          </Field>
          <Field label="Schedule" htmlFor="co-sch" hint={`${b.weeks} weeks from ${formatDate(b.start)}`}>
            <input id="co-sch" className="input" value={form.scheduleNote} onChange={set('scheduleNote')} placeholder="Saturdays, 11:00–12:30 Pakistan time" />
          </Field>
        </div>
        <Field label="Announcement" htmlFor="co-ann" hint="Markdown. Shown at the top of the cohort space.">
          <textarea id="co-ann" className="textarea" value={form.announcement} onChange={set('announcement')} maxLength={2000} />
        </Field>
        <div>
          <button className="btn btn-primary" type="submit">
            Save cohort details
          </button>
        </div>
      </form>

      <section className="stack" style={{ ['--gap' as any]: '12px' }}>
        <h3 style={{ fontSize: 'var(--t-lg)' }}>Handed-in work</h3>
        {!work ? (
          <Loading error={error} />
        ) : work.length === 0 ? (
          <p className="small muted">Nothing handed in yet for this bootcamp.</p>
        ) : (
          <div className="ledger">
            {work.map((w) => (
              <FeedbackRow key={w.id} w={w} onSent={(fb) => setWork((xs) => (xs || []).map((x) => (x.id === w.id ? { ...x, feedback: fb, status: 'reviewed' } : x)))} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackRow({ w, onSent }: { w: Assignment; onSent: (fb: string) => void }) {
  const { toast } = useApp();
  const [fb, setFb] = useState(w.feedback);
  const send = async () => {
    if (fb.trim().length < 5) return toast('Write a little more feedback first.');
    try {
      await repo.adminFeedback(w.id, fb.trim());
      onSent(fb.trim());
      toast('Feedback sent');
    } catch (e: any) {
      toast(`Couldn’t send: ${e?.message}`);
    }
  };
  return (
    <div className="ledger-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <strong>
          Week {w.week}: {w.name || w.email}
        </strong>
        <span className={`pill ${w.status === 'reviewed' ? 'pill-open' : 'pill-mark'}`}>{w.status === 'reviewed' ? 'Reviewed' : 'Needs feedback'}</span>
      </div>
      {w.url && (
        <a href={w.url} target="_blank" rel="noreferrer noopener" className="small" style={{ overflowWrap: 'anywhere' }}>
          {w.url}
        </a>
      )}
      {w.note && <p className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{w.note}</p>}
      <label className="sr-only" htmlFor={`fb-${w.id}`}>
        Feedback
      </label>
      <textarea id={`fb-${w.id}`} className="textarea" style={{ minHeight: 70 }} value={fb} maxLength={4000} onChange={(e) => setFb(e.target.value)} placeholder="What works, one thing to fix, and the next step." />
      <div>
        <button className="btn btn-secondary btn-sm" onClick={send}>
          {w.status === 'reviewed' ? 'Update feedback' : 'Send feedback'}
        </button>
      </div>
    </div>
  );
}

function Orgs() {
  const { toast } = useApp();
  const { data, error, setData } = useLoad<Organization[]>(() => repo.adminOrgs(), []);
  const [form, setForm] = useState({ name: '', kind: 'school' as OrgKind, city: '', country: 'Pakistan', seats: 30, note: '' });
  const [busy, setBusy] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast('Add the organisation’s name.');
    setBusy(true);
    try {
      const o = await repo.adminCreateOrg({ ...form, name: form.name.trim(), seats: Math.max(1, Number(form.seats) || 1) });
      setData((xs) => [o, ...(xs || [])]);
      setForm({ name: '', kind: 'school', city: '', country: 'Pakistan', seats: 30, note: '' });
      toast(`Created. Invite code ${o.inviteCode}`);
    } catch (err: any) {
      toast(`Couldn’t create: ${err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ ['--gap' as any]: '28px' }}>
      <form className="panel stack" onSubmit={create}>
        <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Add an organisation</h3>
        <p className="small muted">Create one after a school or university signs. You get an invite link for its students and can make their teacher a coordinator.</p>
        <div className="form-grid">
          <Field label="Name" htmlFor="org-name">
            <input id="org-name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Beaconhouse, Gulberg campus" />
          </Field>
          <Field label="Type" htmlFor="org-kind">
            <select id="org-kind" className="select" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as OrgKind }))}>
              {(Object.keys(ORG_KIND_LABEL) as OrgKind[]).map((k) => (
                <option key={k} value={k}>
                  {ORG_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City" htmlFor="org-city">
            <input id="org-city" className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </Field>
          <Field label="Country" htmlFor="org-country">
            <select id="org-country" className="select" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
              {COUNTRIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Seats" htmlFor="org-seats">
            <input id="org-seats" className="input" type="number" min={1} value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))} />
          </Field>
          <Field label="Programme note" htmlFor="org-note" hint="Shown to coordinators.">
            <input id="org-note" className="input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Young Researchers Programme, spring 2027" />
          </Field>
        </div>
        <div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create organisation'}
          </button>
        </div>
      </form>
      {!data ? (
        <Loading error={error} />
      ) : data.length === 0 ? (
        <Empty title="No organisations yet" action={<Link to="/org/sample" className="btn btn-secondary">See the sample school dashboard</Link>}>
          Your first school or university will appear here.
        </Empty>
      ) : (
        <div className="ledger">
          {data.map((o) => (
            <OrgRow key={o.id} o={o} onSeats={(seats) => setData((xs) => (xs || []).map((x) => (x.id === o.id ? { ...x, seats } : x)))} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgRow({ o, onSeats }: { o: Organization; onSeats: (n: number) => void }) {
  const { toast } = useApp();
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(o.seats);
  const link = `${SITE_URL}/join/${o.inviteCode}`;
  return (
    <div className="ledger-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <span className="stack" style={{ ['--gap' as any]: '2px' }}>
          <strong>{o.name}</strong>
          <span className="small muted">
            {ORG_KIND_LABEL[o.kind]}
            {o.city ? `, ${o.city}` : ''}. Code <span className="mono">{o.inviteCode}</span>. Added {formatDate(o.createdAt)}.
          </span>
        </span>
        <Link to={`/org/${o.id}`} className="btn btn-secondary btn-sm">
          Open dashboard
        </Link>
      </div>
      <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
        <CopyButton text={link} label="Copy invite link" className="btn btn-ghost btn-sm" />
        <form
          className="cluster"
          style={{ ['--gap' as any]: '6px' }}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await repo.adminUpdateOrg(o.id, { seats: Math.max(1, seats) });
              onSeats(Math.max(1, seats));
              toast('Seats updated');
            } catch (err: any) {
              toast(`Couldn’t update: ${err?.message}`);
            }
          }}
        >
          <label htmlFor={`seats-${o.id}`} className="small muted">
            Seats
          </label>
          <input id={`seats-${o.id}`} className="input" type="number" min={1} style={{ width: 90 }} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
          <button className="btn btn-ghost btn-sm" type="submit">
            Save
          </button>
        </form>
        <form
          className="cluster"
          style={{ ['--gap' as any]: '6px' }}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await repo.adminAddOrgAdmin(o.id, email);
              setEmail('');
              toast('Coordinator added and notified');
            } catch (err: any) {
              toast(String(err?.message || '').includes('no_account') ? 'No account uses that email yet. Ask them to sign up first.' : `Couldn’t add: ${err?.message}`);
            }
          }}
        >
          <label htmlFor={`coord-${o.id}`} className="sr-only">
            Coordinator email
          </label>
          <input id={`coord-${o.id}`} className="input" type="email" style={{ width: 240 }} placeholder="Coordinator’s email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-ghost btn-sm" type="submit" disabled={!email.includes('@')}>
            Make coordinator
          </button>
        </form>
      </div>
    </div>
  );
}

function People() {
  const { toast } = useApp();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, setData } = useLoad<AdminPerson[]>(() => repo.adminPeople(search), [search]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const toggle = async (p: AdminPerson) => {
    try {
      await repo.adminSetVerified(p.id, !p.verified);
      setData((xs) => (xs || []).map((x) => (x.id === p.id ? { ...x, verified: !p.verified } : x)));
      toast(p.verified ? 'Verification removed' : `${p.name || p.email} is verified`);
    } catch (e: any) {
      toast(`Couldn’t update: ${e?.message}`);
    }
  };

  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Handle', 'Affiliation', 'Country', 'Level', 'Passport finished', 'Verified', 'Plan', 'Referred by', 'Joined'], ...(data || []).map((p) => [p.name, p.email, p.handle, p.affiliation, p.country, p.level, p.onboarded, p.verified, p.plan, p.referredBy, p.createdAt.slice(0, 10)])];
    if (!downloadText(`thesia-people-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows))) toast('Exports work on the live site, not in this preview.');
  };

  return (
    <div className="stack" style={{ ['--gap' as any]: '16px' }}>
      <div className="cluster">
        <label htmlFor="ppl-search" className="sr-only">
          Search people
        </label>
        <input id="ppl-search" className="input" style={{ maxWidth: 360 }} placeholder="Search name, email, handle or university" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!data?.length}>
          Export CSV
        </button>
      </div>
      <p className="small muted">Verify someone after checking their identity and affiliation, for example a university email or a faculty page. Verified passports show a mark.</p>
      {!data ? (
        <Loading error={error} />
      ) : data.length === 0 ? (
        <Empty title="No one found" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Affiliation</th>
                <th scope="col">Level</th>
                <th scope="col">Joined</th>
                <th scope="col">Verified</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="stack" style={{ ['--gap' as any]: '2px' }}>
                      {p.handle && p.onboarded ? <Link to={`/people/${p.handle}`}>{p.name || p.handle}</Link> : <strong style={{ fontWeight: 600 }}>{p.name || '—'}</strong>}
                      <a className="xsmall" href={`mailto:${p.email}`} style={{ overflowWrap: 'anywhere' }}>
                        {p.email}
                      </a>
                    </span>
                  </td>
                  <td className="small">
                    {p.affiliation || <span className="faint">—</span>}
                    {p.country ? <span className="faint">, {p.country}</span> : ''}
                  </td>
                  <td className="small">{p.level ? levelLabel(p.level) : <span className="faint">—</span>}</td>
                  <td className="small">
                    {formatDate(p.createdAt)}
                    {p.referredBy && <span className="xsmall faint" style={{ display: 'block' }}>via {p.referredBy}</span>}
                  </td>
                  <td>
                    <button type="button" className={`btn btn-sm ${p.verified ? 'btn-secondary' : 'btn-ghost'}`} aria-pressed={p.verified} onClick={() => toggle(p)}>
                      <LuBadgeCheck aria-hidden="true" /> {p.verified ? 'Verified' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
