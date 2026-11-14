import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LuDownload, LuEye, LuSchool, LuShare2 } from 'react-icons/lu';
import { CopyButton, Empty, PageHead, SamplePill } from '../components/ui';
import { ALL_LESSONS } from '../data/academy';
import { bootcampById } from '../data/bootcamps';
import { useApp } from '../lib/app';
import { CONTACT_EMAIL, SITE_URL } from '../lib/config';
import { downloadText, formatDate, relativeTime, toCSV } from '../lib/format';
import { repo } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import { ORG_KIND_LABEL, levelLabel, type Organization, type OrgMembership, type OrgReportRow } from '../lib/types';
import { NotFound } from './NotFound';

const joinUrl = (code: string) => `${SITE_URL}/join/${code}`;
const shortBootcamp = (id: string) => (bootcampById(id)?.title || id).replace(/^(Research|From|Fellowship and) /, '').replace(/ (for Researchers|Programme|Sprint|Clinic|and Meta-analysis)$/, '');
const ACTIVE_DAYS = 14;
const isActive = (r: OrgReportRow) => Date.now() - Date.parse(r.lastActive) < ACTIVE_DAYS * 86400000;

function JoinCodeForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  return (
    <form
      className="cluster"
      style={{ ['--gap' as any]: '8px' }}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (code.trim()) navigate(`/join/${encodeURIComponent(code.trim().toUpperCase())}`);
      }}
    >
      <label htmlFor="org-code" className="sr-only">
        Invite code
      </label>
      <input id="org-code" className="input mono" style={{ maxWidth: 200, textTransform: 'uppercase' }} placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn btn-secondary" type="submit">
        Join
      </button>
    </form>
  );
}

/** /org: the organisations you belong to. */
export function OrgHome() {
  const { user, ready } = useApp();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrgMembership[] | null>(null);
  useEffect(() => {
    if (ready && !user) navigate('/signin?next=/org', { replace: true });
  }, [ready, user]);
  useEffect(() => {
    if (!user) return;
    repo
      .myOrgs(user.id)
      .then(setOrgs)
      .catch(() => setOrgs([]));
  }, [user]);
  if (!user) return null;
  return (
    <div className="wrap wrap-narrow page">
      <PageHead title="Your organisations" lede="Schools, universities and companies that give you a Thesia seat." />
      {!orgs ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : orgs.length ? (
        <div className="ledger" style={{ marginBottom: 32 }}>
          {orgs.map((m) => (
            <Link key={m.org.id} to={`/org/${m.org.id}`} className="ledger-row">
              <div className="stack min0" style={{ ['--gap' as any]: '4px' }}>
                <strong>{m.org.name}</strong>
                <span className="small muted">
                  {ORG_KIND_LABEL[m.org.kind]}
                  {m.org.city ? `, ${m.org.city}` : ''}
                </span>
              </div>
              <div className="ledger-side">
                <span className={`pill ${m.role === 'admin' ? 'pill-mark' : 'pill-neutral'}`}>{m.role === 'admin' ? 'Coordinator' : 'Member'}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="You’re not part of an organisation yet">If your school or university gave you an invite code, enter it below.</Empty>
      )}
      <section className="stack" style={{ ['--gap' as any]: '10px', marginTop: 24 }}>
        <h2 style={{ fontSize: 'var(--t-lg)' }}>Have an invite code?</h2>
        <JoinCodeForm />
        <p className="small muted">
          Want Thesia for your institution? <Link to="/org/sample">See a sample school dashboard</Link> or <Link to="/institutions#contact">talk to us</Link>.
        </p>
      </section>
    </div>
  );
}

/** /join/:code: join an organisation with an invite code. */
export function JoinOrg() {
  const { code } = useParams();
  const { user, ready, toast } = useApp();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Pick<Organization, 'id' | 'name' | 'kind' | 'city' | 'country'> | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setOrg(undefined);
    repo
      .orgByCode(code)
      .then(setOrg)
      .catch(() => setOrg(null));
  }, [code]);

  const join = async () => {
    if (!user) return;
    setBusy(true);
    setErr('');
    try {
      const r = await repo.joinOrg(user.id, code);
      toast(`You’ve joined ${r.name}`);
      navigate('/dashboard');
    } catch (e: any) {
      const m = String(e?.message || '');
      setErr(m.includes('org_full') ? 'Every seat is taken. Ask your coordinator to add seats.' : m.includes('invalid_code') ? 'That code doesn’t match an organisation.' : m || 'Couldn’t join. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const next = encodeURIComponent(`/join/${code}`);
  return (
    <div className="wrap wrap-narrow page stack" style={{ ['--gap' as any]: '20px' }}>
      {org === undefined ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : org === null ? (
        <>
          <PageHead title="That invite code didn’t work" lede="Check it with your teacher or coordinator. Codes are eight letters and numbers." />
          <JoinCodeForm />
        </>
      ) : (
        <>
          <PageHead title={`Join ${org.name} on Thesia`} lede={`${ORG_KIND_LABEL[org.kind]}${org.city ? `, ${org.city}` : ''}. Your seat includes the Academy, research tools and any cohorts your ${org.kind === 'school' ? 'school' : 'organisation'} has booked.`} />
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>What your coordinator will see</h2>
            <ul className="feature-list small">
              {[
                'Your name, level and when you joined',
                'How many Academy lessons and tracks you’ve finished, and your certificates',
                'How many project applications you’ve sent and how many were accepted',
                'Which bootcamps you’re enrolled in',
              ].map((t) => (
                <li key={t}>
                  <LuEye aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="small muted">They never see your messages, application text, scholarship details or payments. You can leave the organisation at any time.</p>
          </div>
          {err && (
            <p className="field-error" role="alert">
              {err}
            </p>
          )}
          {!ready ? null : user ? (
            <div>
              <button className="btn btn-primary btn-lg" onClick={join} disabled={busy}>
                {busy ? 'Joining…' : `Join ${org.name}`}
              </button>
            </div>
          ) : (
            <div className="cluster">
              <Link to={`/signup?next=${next}`} className="btn btn-primary btn-lg">
                Create your free account
              </Link>
              <Link to={`/signin?next=${next}`} className="btn btn-ghost">
                I already have one
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** /org/:id: the coordinator dashboard (and /org/sample for demos). */
export function OrgDashboard() {
  const { id } = useParams();
  const { user, ready, toast } = useApp();
  const navigate = useNavigate();
  const isSample = id === 'sample';
  const [org, setOrg] = useState<Organization | null | undefined>(undefined);
  const [rows, setRows] = useState<OrgReportRow[] | null>(null);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [sort, setSort] = useState<'name' | 'lessons' | 'active'>('lessons');

  useEffect(() => {
    if (!isSample && ready && !user) navigate(`/signin?next=${encodeURIComponent(`/org/${id}`)}`, { replace: true });
  }, [ready, user, id, isSample]);

  useEffect(() => {
    if (!isSample && !user) return;
    setOrg(undefined);
    repo
      .getOrg(id)
      .then(setOrg)
      .catch(() => setOrg(null));
    repo
      .orgReport(id)
      .then((r) => {
        setRows(r);
        setIsCoordinator(true);
      })
      .catch(() => {
        setRows([]);
        setIsCoordinator(false);
      });
  }, [id, user, isSample]);

  const members = useMemo(() => (rows || []).filter((r) => r.role === 'member'), [rows]);
  const sorted = useMemo(() => {
    const xs = [...(rows || [])];
    if (sort === 'name') xs.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'lessons') xs.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted);
    if (sort === 'active') xs.sort((a, b) => b.lastActive.localeCompare(a.lastActive));
    return xs.sort((a, b) => (a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1));
  }, [rows, sort]);

  if (org === undefined || rows === null)
    return (
      <div className="wrap page" aria-busy="true">
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  if (org === null) return <NotFound />;

  if (!isCoordinator)
    return (
      <div className="wrap wrap-narrow page stack">
        <PageHead title={org.name} lede={`You’re a member. Your coordinator can see your learning progress, applications count and certificates, never your messages or payments.`} />
        <div className="cluster">
          <Link to="/dashboard" className="btn btn-primary">
            Go to your dashboard
          </Link>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              if (!user || !window.confirm(`Leave ${org.name}? Your coordinator will no longer see your progress.`)) return;
              await repo.leaveOrg(user.id, org.id);
              toast(`You left ${org.name}`);
              navigate('/dashboard');
            }}
          >
            Leave organisation
          </button>
        </div>
      </div>
    );

  const sum = (f: (r: OrgReportRow) => number) => members.reduce((n, r) => n + f(r), 0);
  const kpis: [string, string, string][] = [
    ['Students', `${members.length}`, `of ${org.seats} seats`],
    [`Active in ${ACTIVE_DAYS} days`, `${members.filter(isActive).length}`, members.length ? `${Math.round((members.filter(isActive).length / members.length) * 100)}% of students` : '—'],
    ['Lessons finished', `${sum((r) => r.lessonsCompleted)}`, members.length ? `${(sum((r) => r.lessonsCompleted) / members.length).toFixed(1)} per student` : '—'],
    ['Tracks finished', `${sum((r) => r.tracksCompleted)}`, `${members.filter((r) => r.tracksCompleted > 0).length} students with one or more`],
    ['Project applications', `${sum((r) => r.applications)}`, `${sum((r) => r.accepted)} accepted`],
    ['Certificates', `${sum((r) => r.certificates)}`, 'each one verifiable online'],
  ];

  const csv = () => {
    const header = ['Name', 'Role', 'Level', 'Joined', 'Lessons completed', 'Tracks completed', 'Applications', 'Accepted', 'Bootcamps', 'Certificates', 'Last active'];
    const body = sorted.map((r) => [
      r.name,
      r.role === 'admin' ? 'Coordinator' : 'Student',
      r.level ? levelLabel(r.level) : '',
      r.joinedAt.slice(0, 10),
      r.lessonsCompleted,
      r.tracksCompleted,
      r.applications,
      r.accepted,
      r.bootcamps.map((b) => `${bootcampById(b.split(':')[0])?.title || b.split(':')[0]} (${b.split(':')[1]})`).join('; '),
      r.certificates,
      r.lastActive.slice(0, 10),
    ]);
    const ok = downloadText(`thesia-${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${new Date().toISOString().slice(0, 10)}.csv`, toCSV([header, ...body]));
    if (!ok) toast('Exports work on the live site (thesia-gamma.vercel.app), not in this preview.');
  };

  const link = joinUrl(org.inviteCode);
  const wa = `https://wa.me/?text=${encodeURIComponent(`Join ${org.name} on Thesia to start the research programme: ${link}`)}`;

  return (
    <div className="wrap page">
      <PageHead
        title={org.name}
        lede={`${ORG_KIND_LABEL[org.kind]}${org.city ? `, ${org.city}` : ''}. Coordinator dashboard, updated live.`}
        crumbs={isSample ? [{ to: '/institutions', label: 'For institutions' }] : [{ to: '/org', label: 'Organisations' }]}
      >
        {isSample && (
          <div className="callout" style={{ maxWidth: 720 }}>
            <SamplePill /> This is a sample school with made-up students, to show what coordinators see. <Link to="/institutions#contact">Ask for a pilot</Link>.
          </div>
        )}
      </PageHead>

      <div className="kpis" role="list">
        {kpis.map(([label, value, sub]) => (
          <div className="kpi" role="listitem" key={label}>
            <span className="small muted">{label}</span>
            <b className="big-number tabular">{value}</b>
            <span className="xsmall faint">{sub}</span>
          </div>
        ))}
      </div>

      <div className="dash" style={{ marginTop: 32 }}>
        <section className="stack min0" style={{ ['--gap' as any]: '12px' }}>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Students</h2>
            <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
              <label htmlFor="org-sort" className="small muted">
                Sort by
              </label>
              <select id="org-sort" className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="lessons">Lessons finished</option>
                <option value="active">Last active</option>
                <option value="name">Name</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={csv}>
                <LuDownload aria-hidden="true" /> Export CSV
              </button>
            </div>
          </div>
          {sorted.length <= 1 ? (
            <Empty title="No students yet">Share the invite link. Students join with a free account and appear here straight away.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Lessons</th>
                    <th scope="col">Tracks</th>
                    <th scope="col">Applications</th>
                    <th scope="col">Bootcamps</th>
                    <th scope="col">Certificates</th>
                    <th scope="col">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.userId}>
                      <td>
                        <span className="stack" style={{ ['--gap' as any]: '2px' }}>
                          {r.handle ? <Link to={`/people/${r.handle}`} style={{ whiteSpace: 'nowrap' }}>{r.name}</Link> : <strong style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</strong>}
                          <span className="xsmall faint">{r.role === 'admin' ? 'Coordinator' : `Joined ${formatDate(r.joinedAt, { year: false })}`}</span>
                        </span>
                      </td>
                      <td className="tabular">
                        <span className="meter" aria-hidden="true">
                          <b style={{ width: `${Math.min(100, (r.lessonsCompleted / ALL_LESSONS.length) * 100)}%` }} />
                        </span>{' '}
                        {r.lessonsCompleted}
                      </td>
                      <td className="tabular">{r.tracksCompleted}</td>
                      <td className="tabular">
                        {r.applications}
                        {r.accepted ? <span className="xsmall faint"> ({r.accepted} accepted)</span> : ''}
                      </td>
                      <td className="small" style={{ minWidth: 140 }}>{r.bootcamps.length ? r.bootcamps.map((b) => shortBootcamp(b.split(':')[0])).join(', ') : <span className="faint">None</span>}</td>
                      <td className="tabular">{r.certificates}</td>
                      <td className={isActive(r) ? '' : 'faint'} style={{ whiteSpace: 'nowrap' }}>{relativeTime(r.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="xsmall faint">
            Students agreed to share this progress when they joined with your code. Coordinators never see messages, application text, scholarship details or payments.
          </p>
        </section>

        <aside className="stack" style={{ alignContent: 'start', ['--gap' as any]: '16px' }}>
          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>
              <LuSchool aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Invite students
            </h3>
            <p className="small muted">Share this link in your class WhatsApp group or on the board. Each student uses one seat.</p>
            <div data-copy-scope className="stack" style={{ ['--gap' as any]: '6px' }}>
              <span className="mono small" data-copy-target style={{ overflowWrap: 'anywhere' }}>
                {link}
              </span>
              <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
                <CopyButton text={link} label="Copy link" />
                <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noreferrer noopener">
                  <LuShare2 aria-hidden="true" /> WhatsApp
                </a>
              </div>
            </div>
            <p className="small">
              Or give them the code <strong className="mono">{org.inviteCode}</strong> to enter at {SITE_URL.replace(/^https?:\/\//, '')}/org.
            </p>
            <p className="xsmall faint">
              {members.length} of {org.seats} seats used. Need more? <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('More seats: ' + org.name)}`}>Email us</a>.
            </p>
          </div>
          {org.note && (
            <div className="panel panel-sunk stack" style={{ ['--gap' as any]: '6px' }}>
              <span className="small faint">Programme</span>
              <p className="small">{org.note}</p>
            </div>
          )}
          <div className="panel stack" style={{ ['--gap' as any]: '8px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>For your reports</h3>
            <p className="small muted">The CSV has one row per student and opens in Excel or Google Sheets, ready for QA, ORIC or funder reporting.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
