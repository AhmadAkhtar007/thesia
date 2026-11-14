import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LuBadgeCheck, LuCalendar, LuClock, LuMapPin, LuMessageSquare, LuShieldCheck, LuUsers, LuWallet } from 'react-icons/lu';
import { ProjectRow } from '../components/rows';
import { ThreadSheet } from '../components/Thread';
import { Avatar, CopyButton, Empty, Field, Markdown, SamplePill, SaveButton, Sheet, ToggleChips } from '../components/ui';
import { useApp } from '../lib/app';
import { SITE_URL } from '../lib/config';
import { formatDate, relativeDays, daysFromToday } from '../lib/format';
import { parseQuery, projectFit, rankProjects } from '../lib/match';
import { repo } from '../lib/repo';
import { Link, useParams, useQueryState } from '../lib/router';
import { CREDIT_ROLES, creditLabel, fieldLabel, levelLabel } from '../lib/types';
import type { Application, CreditRole, Project } from '../lib/types';
import { useProjects, invalidateProjects } from '../lib/useData';
import { NotFound } from './NotFound';
import { roleHint } from '../components/rows';

const ETHICS: Record<Project['ethics'], { label: string; text: string }> = {
  approved: { label: 'Ethics approved', text: 'An ethics committee has approved this study. You will follow its consent and data rules.' },
  'in-review': { label: 'Ethics in review', text: 'Ethics approval is in progress. No data from people is collected until it is approved.' },
  'not-required': { label: 'No human participants', text: 'This project does not collect data from people, so ethics approval is not required.' },
};

const COMP: Record<Project['compensation'], string> = { paid: 'Paid', stipend: 'Stipend', unpaid: 'Volunteer', 'course-credit': 'Course credit' };

export function ProjectDetail() {
  const { id } = useParams();
  const { projects } = useProjects();
  const { user, profile, requireAuth, toast } = useApp();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [mine, setMine] = useState<Application[]>([]);
  const [applyRole, setApplyRole] = useState<string | null>(null);
  const [params, setParams] = useQueryState();
  const threadId = params.get('thread');

  useEffect(() => {
    let live = true;
    setProject(undefined);
    repo.getProject(id).then((p) => live && setProject(p)).catch(() => live && setProject(null));
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) return setMine([]);
    repo.myApplications(user.id).then((a) => setMine(a.filter((x) => x.projectId === id)));
  }, [user, id]);

  const similar = useMemo(() => {
    if (!project) return [];
    const q = parseQuery(project.tags.join(' ') + ' ' + project.fields.map(fieldLabel).join(' '));
    return rankProjects(projects.filter((p) => p.id !== project.id && p.status === 'open'), q)
      .slice(0, 3)
      .map((h) => h.item);
  }, [project, projects]);

  if (project === undefined)
    return (
      <div className="wrap page stack" aria-busy="true">
        <div className="skeleton" style={{ height: 40, maxWidth: 520 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  if (project === null) return <NotFound />;

  const p = project;
  const fit = projectFit(p, profile);
  const days = daysFromToday(p.applyBy);
  const isOwner = !!user && p.ownerId === user.id;
  const url = `${SITE_URL}/projects/${p.id}`;

  const startApply = (roleId: string) => {
    if (!requireAuth('apply')) return;
    setApplyRole(roleId);
  };

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/projects">Projects</Link> /<span className="faint">{p.fields.map(fieldLabel)[0]}</span>
      </nav>
      <div className="split split-right">
        <article className="stack min0" style={{ ['--gap' as any]: '28px' }}>
          <header className="stack" style={{ ['--gap' as any]: '14px' }}>
            <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
              {p.isSample && <SamplePill />}
              <span className={`pill ${p.ethics === 'in-review' ? 'pill-neutral' : 'pill-open'}`}>
                <LuShieldCheck /> {ETHICS[p.ethics].label}
              </span>
              {p.levels.map((l) => (
                <span key={l} className="pill pill-neutral">
                  {levelLabel(l)}
                </span>
              ))}
              {p.status === 'closed' && <span className="pill pill-closed">Closed</span>}
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)' }}>{p.title}</h1>
            <p className="lede">{p.summary}</p>
            <div className="ledger-meta" style={{ fontSize: 'var(--t-md)' }}>
              <span>
                <LuMapPin /> {p.mode === 'remote' ? 'Remote' : `${p.mode === 'hybrid' ? 'Hybrid' : 'On site'}, ${p.city}`}, {p.country}
              </span>
              <span>
                <LuClock /> {p.hoursPerWeek} hours a week, {p.durationWeeks} weeks
              </span>
              <span>
                <LuCalendar /> Starts {formatDate(p.startDate)}
              </span>
              <span>
                <LuWallet /> {COMP[p.compensation]}
                {p.stipend ? `: ${p.stipend}` : ''}
              </span>
            </div>
          </header>

          <Markdown source={p.description} />

          <section className="stack" aria-labelledby="roles-h">
            <h2 id="roles-h" style={{ fontSize: 'var(--t-xl)' }}>
              Roles on this project
            </h2>
            <div className="ledger">
              {p.roles.map((r) => {
                const applied = mine.find((a) => a.roleId === r.id);
                return (
                  <div key={r.id} className="ledger-row">
                    <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                      <span className="small faint" title={roleHint(r.credit)}>
                        CRediT role: <strong className="muted">{creditLabel(r.credit)}</strong>
                      </span>
                      <h3>{r.title}</h3>
                      <p className="muted">{r.description}</p>
                      <div className="tag-row">
                        {r.skills.map((s) => (
                          <span key={s} className="tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ledger-side">
                      <span className="small muted">
                        <LuUsers style={{ verticalAlign: '-2px' }} /> {r.spots} {r.spots === 1 ? 'spot' : 'spots'}
                      </span>
                      {applied ? (
                        <>
                          <span className="pill pill-open">Applied, {applied.status}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setParams({ thread: applied.id })}>
                            <LuMessageSquare aria-hidden="true" /> Message the lead
                          </button>
                        </>
                      ) : p.status === 'open' && days >= 0 && !isOwner ? (
                        <button className="btn btn-primary btn-sm" onClick={() => startApply(r.id)}>
                          Apply for this role
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>How contributors are credited</h2>
            <p className="muted" style={{ maxWidth: '68ch' }}>
              {p.credit}
            </p>
            <p className="small faint" style={{ maxWidth: '68ch' }}>
              Thesia records your CRediT role on your research passport when the project lead confirms your contribution.
            </p>
          </section>

          <section className="callout callout-ink">
            <strong>{ETHICS[p.ethics].label}.</strong> {ETHICS[p.ethics].text}
          </section>

          {isOwner && <OwnerApplications project={p} openThread={(id) => setParams({ thread: id })} threadId={threadId} onCloseThread={() => setParams({ thread: null })} />}
        </article>

        <aside className="stack" style={{ alignContent: 'start' }}>
          <div className="panel stack">
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <span className={days <= 14 && days >= 0 ? 'deadline' : 'muted'}>
                {p.status === 'closed' || days < 0 ? 'Applications closed' : `Apply by ${formatDate(p.applyBy)} (${relativeDays(p.applyBy)})`}
              </span>
              <SaveButton kind="project" id={p.id} label={p.title} />
            </div>
            {fit && (
              <div className="stack" style={{ ['--gap' as any]: '6px' }}>
                <span className="fit">
                  <b className="tabular">{fit.score}%</b> fit for you
                </span>
                {fit.reasons.length > 0 && <span className="small muted">Matches: {fit.reasons.join(', ')}.</span>}
              </div>
            )}
            {p.status === 'open' && days >= 0 && !isOwner && (
              <button className="btn btn-primary btn-block" onClick={() => startApply(p.roles[0].id)}>
                Apply to join
              </button>
            )}
            <div data-copy-scope className="cluster" style={{ ['--gap' as any]: '8px' }}>
              <CopyButton text={url} label="Copy link" />
              <span className="xsmall faint" data-copy-target style={{ overflowWrap: 'anywhere' }}>
                {url}
              </span>
            </div>
          </div>
          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <span className="small faint">Project lead</span>
            <div className="person-top">
              <Avatar name={p.lead.name} />
              <div className="min0">
                {p.lead.handle ? (
                  <Link to={`/people/${p.lead.handle}`}>
                    <strong>{p.lead.name}</strong>
                  </Link>
                ) : (
                  <strong>{p.lead.name}</strong>
                )}
                <div className="small muted">{p.lead.affiliation}</div>
              </div>
            </div>
          </div>
          {similar.length > 0 && (
            <div className="stack" style={{ ['--gap' as any]: '8px' }}>
              <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Similar projects</h3>
              <ul className="output-list">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link to={`/projects/${s.id}`}>{s.title}</Link>
                    <span className="xsmall faint">{s.mode === 'remote' ? 'Remote' : s.city}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {!isOwner &&
        mine
          .filter((a) => a.id === threadId)
          .map((a) => <ThreadSheet key={a.id} app={a} project={p} open onClose={() => setParams({ thread: null })} />)}

      <ApplySheet
        project={p}
        roleId={applyRole}
        onClose={() => setApplyRole(null)}
        onApplied={(a) => {
          setMine((m) => [a, ...m]);
          setApplyRole(null);
          toast('Application sent. The project lead will see it on their dashboard.');
        }}
      />
    </div>
  );
}

function ApplySheet({ project, roleId, onClose, onApplied }: { project: Project; roleId: string | null; onClose: () => void; onApplied: (a: Application) => void }) {
  const { user, profile } = useApp();
  const [role, setRole] = useState(roleId || '');
  const [pitch, setPitch] = useState('');
  const [hours, setHours] = useState(project.hoursPerWeek);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (roleId) {
      setRole(roleId);
      setErr('');
    }
  }, [roleId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (pitch.trim().length < 80) return setErr('Write at least a few sentences (80 characters) so the lead knows why you fit.');
    if (!agree) return setErr('Confirm that you will follow the project’s ethics and data rules.');
    if (!user) return;
    setBusy(true);
    try {
      const a = await repo.apply({
        projectId: project.id,
        roleId: role,
        userId: user.id,
        applicantName: profile?.name || user.email.split('@')[0],
        pitch: pitch.trim(),
        hoursPerWeek: hours,
      });
      onApplied(a);
      setPitch('');
      setAgree(false);
    } catch (e: any) {
      const msg = String(e?.message || '');
      setErr(
        msg.includes('monthly_application_limit')
          ? 'You have sent 5 applications in the last 30 days, the free limit. Scholar Pro has no limit.'
          : msg.includes('duplicate')
            ? 'You have already applied for this role.'
            : `Couldn’t send your application: ${msg || 'network error'}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const r = project.roles.find((x) => x.id === role);
  return (
    <Sheet open={!!roleId} onClose={onClose} title="Apply to join">
      <form className="stack" onSubmit={submit} style={{ ['--gap' as any]: '18px' }}>
        <p className="muted small">{project.title}</p>
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, ['--gap' as any]: '8px' }}>
          <legend className="field-label" style={{ marginBottom: 8 }}>
            Role
          </legend>
          {project.roles.map((x) => (
            <label key={x.id} className="option">
              <input type="radio" name="role" value={x.id} checked={role === x.id} onChange={() => setRole(x.id)} />
              <span>
                <strong>{x.title}</strong>
                <span className="faint">{creditLabel(x.credit)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Field label="Why you, for this role" htmlFor="pitch" hint={r ? `Mention your experience with ${r.skills.slice(0, 2).join(' or ')}, what you can commit, and one question about the project.` : undefined}>
          <textarea id="pitch" className="textarea" value={pitch} onChange={(e) => setPitch(e.target.value)} maxLength={2000} placeholder="I’m a second-year student in… I’ve used… I can give… My question is…" />
        </Field>
        <Field label="Hours you can give each week" htmlFor="hours" hint={`The lead asked for about ${project.hoursPerWeek}.`}>
          <input id="hours" className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} style={{ maxWidth: 140 }} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I will follow this project’s ethics, consent and data rules, and keep participant information confidential.
        </label>
        {!profile?.onboarded && (
          <p className="callout small">
            Leads usually check your profile. <Link to="/welcome">Finish your profile</Link> after applying so they see your fields and skills.
          </p>
        )}
        {err && <p className="field-error" role="alert">{err}</p>}
        <div className="cluster">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send application'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
}

const STATUSES: Application['status'][] = ['sent', 'viewed', 'shortlisted', 'accepted', 'declined'];

function OwnerApplications({ project, openThread, threadId, onCloseThread }: { project: Project; openThread: (id: string) => void; threadId: string | null; onCloseThread: () => void }) {
  const { toast } = useApp();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [confirming, setConfirming] = useState<Application | null>(null);
  useEffect(() => {
    repo.applicationsForProject(project.id).then(setApps).catch(() => setApps([]));
  }, [project.id]);
  const threadApp = apps?.find((a) => a.id === threadId);
  return (
    <section className="stack">
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Applications</h2>
        {project.status === 'open' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await repo.closeProject(project.id);
              invalidateProjects();
              toast('Project closed to new applications');
            }}
          >
            Close applications
          </button>
        )}
      </div>
      {!apps ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : apps.length === 0 ? (
        <Empty title="No applications yet">Share the project link in your class or department group. Most applications arrive in the first week.</Empty>
      ) : (
        <div className="ledger">
          {apps.map((a) => (
            <div className="ledger-row" key={a.id}>
              <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                <strong>{a.applicantName}</strong>
                <span className="small faint">
                  {project.roles.find((r) => r.id === a.roleId)?.title}, {a.hoursPerWeek} h/week, {formatDate(a.createdAt)}
                </span>
                <p className="small" style={{ whiteSpace: 'pre-wrap' }}>
                  {a.pitch}
                </p>
                <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
                  <ApplicantPassportLink userId={a.userId} />
                  <button className="btn btn-ghost btn-sm" onClick={() => openThread(a.id)}>
                    <LuMessageSquare aria-hidden="true" /> Message
                  </button>
                  {a.status === 'accepted' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirming(a)}>
                      <LuBadgeCheck aria-hidden="true" /> Confirm contribution
                    </button>
                  )}
                </div>
              </div>
              <div className="ledger-side">
                <label className="sr-only" htmlFor={`st-${a.id}`}>
                  Status
                </label>
                <select
                  id={`st-${a.id}`}
                  className="select"
                  value={a.status}
                  onChange={async (e) => {
                    const status = e.target.value as Application['status'];
                    await repo.setApplicationStatus(a.id, status);
                    setApps((xs) => xs!.map((x) => (x.id === a.id ? { ...x, status } : x)));
                    toast(`Marked ${status}`);
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      {threadApp && <ThreadSheet app={threadApp} project={project} open onClose={onCloseThread} />}
      {confirming && <ConfirmContributionSheet app={confirming} project={project} onClose={() => setConfirming(null)} />}
    </section>
  );
}

function ApplicantPassportLink({ userId }: { userId: string }) {
  const [handle, setHandle] = useState<string | null>(null);
  useEffect(() => {
    repo
      .getPersonById(userId)
      .then((p) => setHandle(p?.handle && p.handle !== p.id ? p.handle : null))
      .catch(() => setHandle(null));
  }, [userId]);
  if (!handle) return null;
  return (
    <Link to={`/people/${handle}`} className="btn btn-ghost btn-sm">
      View passport
    </Link>
  );
}

function ConfirmContributionSheet({ app, project, onClose }: { app: Application; project: Project; onClose: () => void }) {
  const { toast } = useApp();
  const role = project.roles.find((r) => r.id === app.roleId);
  const [roles, setRoles] = useState<CreditRole[]>(role ? [role.credit] : []);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!roles.length) return toast('Choose at least one CRediT role.');
    setBusy(true);
    try {
      await repo.confirmContribution(app.id, roles, note.trim());
      toast(`Confirmed. ${app.applicantName}’s passport now shows these roles.`);
      onClose();
    } catch (err: any) {
      toast(`Couldn’t confirm: ${err?.message || 'network error'}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title={`Confirm ${app.applicantName}’s contribution`} wide>
      <form className="stack" onSubmit={save}>
        <p className="small muted">
          Pick every CRediT role they actually held on this project. This appears on their public research passport as confirmed by you, so only confirm work that was done.
        </p>
        <ToggleChips label="CRediT roles" options={CREDIT_ROLES} value={roles} onChange={setRoles} />
        <Field label="A line about what they did (optional)" htmlFor="contrib-note" hint="Shown on their passport. 600 characters at most.">
          <textarea id="contrib-note" className="textarea" maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cleaned three winters of monitor data and wrote the data appendix." />
        </Field>
        <div className="cluster">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Confirm contribution'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
}

export function SimilarList({ items }: { items: Project[] }) {
  return (
    <div className="ledger">
      {items.map((p) => (
        <ProjectRow key={p.id} p={p} />
      ))}
    </div>
  );
}
