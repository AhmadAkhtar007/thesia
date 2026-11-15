import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LuAward, LuBell, LuCheck, LuMessageSquare, LuPlus, LuSchool, LuSettings, LuShare2, LuTrash2 } from 'react-icons/lu';
import { ProjectRow } from '../components/rows';
import { ThreadSheet } from '../components/Thread';
import { Avatar, CopyButton, Empty, Field, Sheet, ToggleChips } from '../components/ui';
import { TRACKS } from '../data/academy';
import { bootcampById } from '../data/bootcamps';
import { CONFERENCES, conferenceStatus } from '../data/conferences';
import { LABS } from '../data/labs';
import { PROGRAMS } from '../data/programs';
import { useApp } from '../lib/app';
import { LIVE, SITE_URL } from '../lib/config';
import { formatDate, relativeDays } from '../lib/format';
import { projectFit } from '../lib/match';
import { repo, lessonKey } from '../lib/repo';
import { Link, useNavigate } from '../lib/router';
import { CREDIT_ROLES, levelLabel } from '../lib/types';
import type { Application, Certificate, CreditRole, Enrollment, OrgMembership, Output, OutputType, Project } from '../lib/types';
import { useProjects } from '../lib/useData';
import { hasCohortAccess } from './Cohort';

const STATUS_PILL: Record<Application['status'], string> = {
  sent: 'pill-neutral',
  viewed: 'pill-neutral',
  shortlisted: 'pill-mark',
  accepted: 'pill-open',
  declined: 'pill-closed',
};

export function Dashboard() {
  const { user, profile, saved, progress, signOut, ready, isAdmin, unread } = useApp();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const [apps, setApps] = useState<Application[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [mine, setMine] = useState<Project[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);
  const [thread, setThread] = useState<Application | null>(null);

  useEffect(() => {
    if (ready && !user) navigate('/signin?next=/dashboard', { replace: true });
  }, [ready, user]);

  useEffect(() => {
    if (!user) return;
    repo.myApplications(user.id).then(setApps).catch(() => {});
    repo.myEnrollments(user.id).then(setEnrollments).catch(() => {});
    repo.myProjects(user.id).then(setMine).catch(() => {});
    repo.certificatesFor(user.id).then(setCerts).catch(() => {});
    repo.myOrgs(user.id).then(setOrgs).catch(() => {});
  }, [user]);

  const recommended = useMemo(
    () =>
      projects
        .filter((p) => p.status === 'open' && !apps.some((a) => a.projectId === p.id) && p.ownerId !== user?.id)
        .map((p) => ({ p, s: projectFit(p, profile)?.score || 0 }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map((x) => x.p),
    [projects, apps, profile, user]
  );

  if (!user) return null;
  const lessonsDone = Object.keys(progress).length;
  const steps = [
    { done: !!profile?.onboarded, title: 'Set up your research passport', to: '/welcome', cta: 'Set up' },
    { done: lessonsDone > 0, title: 'Finish your first applied research lesson', to: '/learn/scoping/company-question', cta: 'Start' },
    { done: apps.length > 0, title: 'Apply to a project role', to: '/projects', cta: 'Browse' },
    { done: saved.some((s) => s.kind === 'conference'), title: 'Save a conference to track its deadline', to: '/conferences', cta: 'Find one' },
    { done: enrollments.length > 0, title: 'Reserve a seat in a bootcamp', to: '/bootcamps', cta: 'See cohorts' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const first = (profile?.name || user.email).split(/\s+/)[0];

  const savedProjects = saved.filter((s) => s.kind === 'project').map((s) => projects.find((p) => p.id === s.refId)).filter(Boolean) as Project[];
  const savedConfs = saved.filter((s) => s.kind === 'conference').map((s) => CONFERENCES.find((c) => c.id === s.refId)).filter(Boolean);
  const savedLabs = saved.filter((s) => s.kind === 'lab').map((s) => LABS.find((l) => l.id === s.refId)).filter(Boolean);
  const savedPrograms = saved.filter((s) => s.kind === 'program').map((s) => PROGRAMS.find((p) => p.id === s.refId)).filter(Boolean);

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1>Hi {first}</h1>
        <p>
          {doneCount === steps.length ? 'You’ve done every first step. Here’s what’s moving.' : `You’ve done ${doneCount} of ${steps.length} first steps. Pick up the next one.`}
        </p>
      </header>
      <div className="dash">
        <div className="stack min0" style={{ ['--gap' as any]: '48px' }}>
          {doneCount < steps.length && (
            <section className="stack" style={{ ['--gap' as any]: '10px' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>First steps</h2>
              <ol className="next-steps">
                {steps.map((s) => (
                  <li key={s.title} className={s.done ? 'is-done' : ''}>
                    <span className="check-circle" aria-hidden="true">
                      {s.done && <LuCheck />}
                    </span>
                    <span className="step-title">{s.title}</span>
                    {!s.done && (
                      <Link to={s.to} className="btn btn-secondary btn-sm">
                        {s.cta}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Your applications</h2>
              <span className="small faint">{profile?.plan === 'pro' ? 'Unlimited applications' : 'Free plan: 5 every 30 days'}</span>
            </div>
            {apps.length ? (
              <div className="ledger">
                {apps.map((a) => {
                  const p = projects.find((x) => x.id === a.projectId);
                  return (
                    <div key={a.id} className="ledger-row">
                      <div className="stack min0" style={{ ['--gap' as any]: '4px' }}>
                        <Link to={`/projects/${a.projectId}`}>
                          <strong>{p?.title || 'Project'}</strong>
                        </Link>
                        <span className="small muted">
                          {p?.roles.find((r) => r.id === a.roleId)?.title}, sent {formatDate(a.createdAt)}
                        </span>
                      </div>
                      <div className="ledger-side">
                        <span className={`pill ${STATUS_PILL[a.status]}`}>{a.status[0].toUpperCase() + a.status.slice(1)}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setThread(a)}>
                          <LuMessageSquare aria-hidden="true" /> Messages
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty title="No applications yet" action={<Link to="/projects" className="btn btn-primary">Find a project</Link>}>
                Most students start with a remote role of three to six hours a week.
              </Empty>
            )}
          </section>

          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>{profile?.onboarded ? 'Projects that fit you' : 'Projects to explore'}</h2>
              <Link to="/projects" className="small">
                All projects
              </Link>
            </div>
            <div className="ledger">
              {recommended.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </div>
          </section>

          {mine.length > 0 && (
            <section className="stack" style={{ ['--gap' as any]: '10px' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Projects you lead</h2>
              <div className="ledger">
                {mine.map((p) => (
                  <ProjectRow key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          <OutputsSection />

          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Saved</h2>
            {savedProjects.length + savedConfs.length + savedLabs.length + savedPrograms.length === 0 ? (
              <p className="muted small">Use the bookmark on any project, conference, lab or programme to keep it here.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <tbody>
                    {savedConfs.map((c) => {
                      const st = conferenceStatus(c!);
                      return (
                        <tr key={c!.id}>
                          <td>Conference</td>
                          <td>
                            <Link to={`/conferences#${c!.id}`}>{c!.short}</Link>
                          </td>
                          <td className={st === 'closing' ? 'deadline' : 'muted'}>
                            {c!.deadline && (st === 'open' || st === 'closing') ? `Papers due ${relativeDays(c!.deadline)}` : `Starts ${formatDate(c!.start)}`}
                          </td>
                        </tr>
                      );
                    })}
                    {savedProjects.map((p) => (
                      <tr key={p.id}>
                        <td>Project</td>
                        <td>
                          <Link to={`/projects/${p.id}`}>{p.title}</Link>
                        </td>
                        <td className="muted">Apply by {formatDate(p.applyBy, { year: false })}</td>
                      </tr>
                    ))}
                    {savedLabs.map((l) => (
                      <tr key={l!.id}>
                        <td>Lab</td>
                        <td>
                          <Link to={`/labs#${l!.id}`}>{l!.name}</Link>
                        </td>
                        <td className="muted">{l!.city}</td>
                      </tr>
                    ))}
                    {savedPrograms.map((p) => (
                      <tr key={p!.id}>
                        <td>Programme</td>
                        <td>
                          <Link to={`/opportunities#${p!.id}`}>{p!.name}</Link>
                        </td>
                        <td className="muted">{p!.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="stack" style={{ alignContent: 'start', ['--gap' as any]: '20px' }}>
          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <div className="person-top">
              <Avatar name={profile?.name || user.email} />
              <div className="min0">
                <strong>{profile?.name || 'Your name'}</strong>
                <div className="small muted">{profile?.level ? levelLabel(profile.level) : 'Profile incomplete'}</div>
              </div>
            </div>
            <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
              {profile?.handle && profile.onboarded && (
                <Link to={`/people/${profile.handle}`} className="btn btn-secondary btn-sm">
                  View passport
                </Link>
              )}
              <Link to="/welcome" className="btn btn-ghost btn-sm">
                Edit
              </Link>
            </div>
            <p className="xsmall faint" style={{ overflowWrap: 'anywhere' }}>
              Signed in as {user.email}. Plan: {profile?.plan === 'pro' ? 'Scholar Pro' : 'Free'}.
            </p>
            <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
              <Link to="/notifications" className="btn btn-ghost btn-sm">
                <LuBell aria-hidden="true" /> {unread ? `${unread} new` : 'Notifications'}
              </Link>
              {(isAdmin || !LIVE) && (
                <Link to="/admin" className="btn btn-ghost btn-sm">
                  <LuSettings aria-hidden="true" /> Admin{LIVE ? '' : ' (demo)'}
                </Link>
              )}
            </div>
          </div>

          {certs.length > 0 && (
            <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
              <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>
                <LuAward aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Certificates
              </h3>
              {certs.map((c) => (
                <Link key={c.id} to={`/certificate/${c.id}`} className="stack" style={{ ['--gap' as any]: '2px', textDecoration: 'none' }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{c.title}</span>
                  <span className="xsmall faint">
                    {formatDate(c.issuedAt)} · <span className="mono">{c.id}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <OrgPanel orgs={orgs} />
          <InviteCard />

          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Academy</h3>
            {TRACKS.map((t) => {
              const done = t.lessons.filter((l) => progress[lessonKey(t.id, l.id)]).length;
              return (
                <Link key={t.id} to={`/learn/${t.id}`} className="progress" style={{ textDecoration: 'none' }}>
                  <span className="cluster" style={{ justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink)' }}>{t.title}</span>
                    <span className="tabular">
                      {done}/{t.lessons.length}
                    </span>
                  </span>
                  <span className="progress-bar">
                    <b style={{ width: `${(done / t.lessons.length) * 100}%` }} />
                  </span>
                </Link>
              );
            })}
          </div>

          {enrollments.length > 0 && (
            <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
              <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Bootcamps</h3>
              {enrollments.map((e) => {
                const b = bootcampById(e.bootcampId);
                return (
                  <div key={e.id} className="stack" style={{ ['--gap' as any]: '2px' }}>
                    <Link to={`/bootcamps/${e.bootcampId}`}>{b?.title || e.bootcampId}</Link>
                    <span className="xsmall faint">
                      {ENROLLMENT_LABEL[e.status]}
                      {b ? `, starts ${formatDate(b.start)}` : ''}
                    </span>
                    {b && hasCohortAccess(e, b) && (
                      <Link to={`/bootcamps/${b.id}/cohort`} className="small">
                        Open cohort space
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="stack" style={{ ['--gap' as any]: '8px' }}>
            <Link to="/projects/new" className="btn btn-secondary">
              Post a project
            </Link>
            <button type="button" className="btn btn-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
      </div>
      {thread && <ThreadSheet app={thread} project={projects.find((p) => p.id === thread.projectId)} open onClose={() => setThread(null)} />}
    </div>
  );
}

const ENROLLMENT_LABEL: Record<Enrollment['status'], string> = {
  paid: 'Enrolled',
  confirmed: 'Seat confirmed',
  completed: 'Completed',
  reserved: 'Seat reserved',
  'scholarship-applied': 'Scholarship under review',
  waitlist: 'Waitlist',
};

function OrgPanel({ orgs }: { orgs: OrgMembership[] }) {
  return (
    <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
      <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>
        <LuSchool aria-hidden="true" style={{ verticalAlign: '-2px' }} /> School or university
      </h3>
      {orgs.length ? (
        orgs.map((m) => (
          <div key={m.org.id} className="stack" style={{ ['--gap' as any]: '2px' }}>
            <Link to={`/org/${m.org.id}`}>{m.org.name}</Link>
            <span className="xsmall faint">{m.role === 'admin' ? 'You coordinate this organisation' : 'Your coordinator can see your progress'}</span>
          </div>
        ))
      ) : (
        <p className="small muted">
          Got an invite code from your school or university? <Link to="/org">Enter it here</Link>.
        </p>
      )}
    </div>
  );
}

function InviteCard() {
  const { user, profile } = useApp();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!user || !profile?.handle) return;
    repo
      .referralCount(user.id)
      .then(setCount)
      .catch(() => setCount(null));
  }, [user, profile?.handle]);
  if (!profile?.handle) return null;
  const link = `${SITE_URL}/?ref=${profile.handle}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`I’m using Thesia to find research projects and learn research methods. Free to join: ${link}`)}`;
  return (
    <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
      <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Invite classmates</h3>
      <p className="small muted">
        {count ? `${count} ${count === 1 ? 'person has' : 'people have'} joined with your link.` : 'Share your link. Everyone who joins with it is counted here.'} Campus ambassadors are chosen partly on this number.
      </p>
      <div data-copy-scope className="stack" style={{ ['--gap' as any]: '6px' }}>
        <span className="mono xsmall" data-copy-target style={{ overflowWrap: 'anywhere' }}>
          {link}
        </span>
        <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
          <CopyButton text={link} label="Copy link" />
          <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noreferrer noopener">
            <LuShare2 aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

const OUTPUT_TYPES: { id: OutputType; label: string }[] = [
  { id: 'paper', label: 'Paper' },
  { id: 'preprint', label: 'Preprint' },
  { id: 'poster', label: 'Poster' },
  { id: 'talk', label: 'Talk' },
  { id: 'dataset', label: 'Dataset' },
  { id: 'code', label: 'Code' },
  { id: 'report', label: 'Report' },
];

function OutputsSection() {
  const { profile, saveProfile, toast } = useApp();
  const [open, setOpen] = useState(false);
  const outputs = profile?.outputs || [];
  const remove = async (i: number) => {
    if (!window.confirm(`Remove “${outputs[i].title}” from your passport?`)) return;
    await saveProfile({ outputs: outputs.filter((_, j) => j !== i) });
    toast('Removed');
  };
  return (
    <section className="stack" style={{ ['--gap' as any]: '10px' }}>
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Your outputs</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)} disabled={!profile?.onboarded} title={profile?.onboarded ? undefined : 'Set up your passport first'}>
          <LuPlus aria-hidden="true" /> Add an output
        </button>
      </div>
      {outputs.length ? (
        <ul className="output-list">
          {outputs.map((o, i) => (
            <li key={`${o.title}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
              <span className="stack min0" style={{ ['--gap' as any]: '2px' }}>
                <strong>{o.url ? <a href={o.url} target="_blank" rel="noreferrer noopener">{o.title}</a> : o.title}</strong>
                <span className="small muted">
                  {OUTPUT_TYPES.find((t) => t.id === o.type)?.label}
                  {o.venue ? `, ${o.venue}` : ''}, {o.year}
                </span>
              </span>
              <button type="button" className="icon-btn" aria-label={`Remove ${o.title}`} onClick={() => remove(i)}>
                <LuTrash2 />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Papers, posters, talks, datasets and code you’ve worked on. They show on your passport as self-reported, next to contributions your project leads confirm.</p>
      )}
      <OutputSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function OutputSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, saveProfile, toast } = useApp();
  const [o, setO] = useState<Output>({ title: '', type: 'paper', venue: '', year: new Date().getFullYear(), url: '', roles: [] });
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (o.title.trim().length < 4) return setErr('Add the title.');
    if (o.url && !/^https?:\/\//.test(o.url.trim())) return setErr('Links start with https://');
    if (!o.roles.length) return setErr('Pick at least one CRediT role you held.');
    const clean: Output = { ...o, title: o.title.trim(), venue: o.venue?.trim() || undefined, url: o.url?.trim() || undefined, year: Math.min(2100, Math.max(1950, Number(o.year) || new Date().getFullYear())) };
    await saveProfile({ outputs: [clean, ...(profile?.outputs || [])].slice(0, 50) });
    toast('Added to your passport');
    setO({ title: '', type: 'paper', venue: '', year: new Date().getFullYear(), url: '', roles: [] });
    setErr('');
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add an output" wide>
      <form className="stack" onSubmit={submit}>
        <Field label="Title" htmlFor="out-title">
          <input id="out-title" className="input" value={o.title} maxLength={240} onChange={(e) => setO({ ...o, title: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Type" htmlFor="out-type">
            <select id="out-type" className="select" value={o.type} onChange={(e) => setO({ ...o, type: e.target.value as OutputType })}>
              {OUTPUT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" htmlFor="out-year">
            <input id="out-year" className="input" type="number" min={1950} max={2100} value={o.year} onChange={(e) => setO({ ...o, year: Number(e.target.value) })} />
          </Field>
          <Field label="Journal, conference or venue" htmlFor="out-venue">
            <input id="out-venue" className="input" value={o.venue || ''} maxLength={200} onChange={(e) => setO({ ...o, venue: e.target.value })} />
          </Field>
          <Field label="Link (DOI, PDF or repo)" htmlFor="out-url">
            <input id="out-url" className="input" value={o.url || ''} maxLength={500} placeholder="https://" onChange={(e) => setO({ ...o, url: e.target.value })} />
          </Field>
        </div>
        <div className="field">
          <span className="field-label">Your CRediT roles</span>
          <ToggleChips label="CRediT roles" options={CREDIT_ROLES} value={o.roles} onChange={(roles) => setO({ ...o, roles: roles as CreditRole[] })} />
        </div>
        {err && (
          <p className="field-error" role="alert">
            {err}
          </p>
        )}
        <div className="cluster">
          <button className="btn btn-primary" type="submit">
            Add to passport
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
}
