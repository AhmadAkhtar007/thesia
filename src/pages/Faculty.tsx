// Faculty workspace: a React port of the standalone "thesia-faculty" prototype
// (Day 1 pitch demo). All data is illustrative; changes persist in this browser
// only. Faculty judgment is simulated end to end — no live AI or server.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  LuArrowLeft,
  LuArrowRight,
  LuChartLine,
  LuCheck,
  LuChevronRight,
  LuClock,
  LuDownload,
  LuFileText,
  LuFolder,
  LuInbox,
  LuLayoutDashboard,
  LuMenu,
  LuPlus,
  LuRotateCcw,
  LuSettings,
  LuShieldCheck,
  LuSparkles,
  LuUsers,
} from 'react-icons/lu';
import { FACULTY_SEED, type FacultyState, type FacultyTask } from '../data/faculty';
import { readJSON, writeJSON } from '../lib/storage';
import { Sheet } from '../components/ui';
import { useApp } from '../lib/app';
import { useNavigate, useParams } from '../lib/router';

const STORE_KEY = 'faculty-workspace';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LuLayoutDashboard },
  { id: 'projects', label: 'Projects', icon: LuFolder },
  { id: 'students', label: 'Students', icon: LuUsers },
  { id: 'review', label: 'Review queue', icon: LuInbox },
  { id: 'signoff', label: 'Sign-off', icon: LuShieldCheck },
  { id: 'analytics', label: 'Analytics', icon: LuChartLine },
  { id: 'settings', label: 'Settings', icon: LuSettings },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const CRITERIA = [
  'The research question is answered',
  'The methods are appropriate',
  'Data sources are documented',
  'Conclusions follow from evidence',
  'Limitations are clearly stated',
];

const WALKTHROUGH: [string, string, string][] = [
  ['1', 'Open review queue', 'Critical AI issues are held back; only refined work reaches faculty.'],
  ['2', 'Review Literature review V3', 'Compare previous and current versions; inspect AI feedback; approve.'],
  ['3', 'Open Interview protocol', 'Simulate a student revision to demonstrate how the AI gate works.'],
  ['4', 'Approve Final report', 'Open Sign-off, check the research quality criteria and sign the report.'],
  ['5', 'Confirm contributions and view Analytics', 'Show the verified-record concept and logged faculty minutes.'],
];

type Modal =
  | { kind: 'assign'; projectId?: string }
  | { kind: 'student'; studentId: string }
  | { kind: 'task'; taskId: string }
  | { kind: 'sign'; projectId: string }
  | { kind: 'reset' }
  | { kind: 'walkthrough' };

// ---------- small helpers ----------

function loadFacultyState(): FacultyState {
  const stored = readJSON<FacultyState | null>(STORE_KEY, null);
  // Merge over the seed so newer fields always exist.
  return { ...structuredClone(FACULTY_SEED), ...stored };
}

const initials = (name: string) => name.split(' ').map((x) => x[0]).slice(0, 2).join('');
const fmtDate = (s?: string) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No date');
const today = () => new Date().toISOString().slice(0, 10);
const projectById = (d: FacultyState, id: string) => d.projects.find((p) => p.id === id);
const studentById = (d: FacultyState, id: string) => d.students.find((s) => s.id === id);
const tasksOf = (d: FacultyState, projectId?: string) => d.tasks.filter((t) => !projectId || t.p === projectId);
const readyTasks = (d: FacultyState) => d.tasks.filter((t) => t.status === 'Ready for review').sort((a, b) => a.due.localeCompare(b.due));
const totalMinutes = (d: FacultyState) => d.logs.reduce((a, x) => a + x.minutes, 0);
const completion = (d: FacultyState, projectId: string) => {
  const ts = tasksOf(d, projectId);
  return ts.length ? Math.round((ts.filter((x) => x.status === 'Approved').length / ts.length) * 100) : 0;
};

function FacAvatar({ name }: { name: string }) {
  return (
    <span className="fac-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function Badge({ status }: { status: string }) {
  const cls =
    status === 'Approved' || status === 'Signed off' || status === 'Confirmed'
      ? 'fac-tag-ok'
      : status === 'Ready for review'
        ? 'fac-tag-info'
        : status === 'AI revision required' || status === 'Changes requested'
          ? 'fac-tag-warn'
          : '';
  return <span className={`fac-tag ${cls}`}>{status}</span>;
}

function Head({ title, sub, action }: { title: ReactNode; sub: ReactNode; action?: ReactNode }) {
  return (
    <div className="fac-heading">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, sub, right, children }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="fac-panel">
      <header className="fac-panel-head">
        <div>
          <h2>{title}</h2>
          {sub && <p className="fac-muted">{sub}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="fac-link-btn" onClick={onClick}>
      {children}
      <LuArrowRight size={14} />
    </button>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="fac-progress">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ---------- main component ----------

export function Faculty() {
  const { section = 'overview', id } = useParams() as { section?: string; id?: string };
  const navigate = useNavigate();
  const { toast } = useApp();
  const [d, setD] = useState<FacultyState>(loadFacultyState);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);

  // Every mutation runs on a deep clone and is written straight back to storage.
  const update = useCallback((fn: (draft: FacultyState) => void) => {
    setD((prev) => {
      const next = structuredClone(prev);
      fn(next);
      writeJSON(STORE_KEY, next);
      return next;
    });
  }, []);

  const go = useCallback(
    (s: SectionId, detailId?: string) => {
      setMenu(false);
      navigate(detailId ? `/faculty/${s}/${detailId}` : `/faculty/${s}`);
    },
    [navigate]
  );

  const active = SECTIONS.find((s) => s.id === section)?.id ?? 'overview';
  const pending = readyTasks(d).length;
  const detailTitle =
    active === 'projects' && id ? projectById(d, id)?.name : active === 'review' && id ? d.tasks.find((t) => t.id === id)?.title : null;

  // ---------- actions ----------

  const saveTask = useCallback(
    (draft: { projectId: string; studentId: string; title: string; due: string; brief: string }) => {
      if (!draft.title.trim() || !draft.brief.trim()) return toast('Enter a title and task brief.');
      if (d.signed[draft.projectId]) return toast('This project is already signed off.');
      update((s) => {
        s.tasks.push({
          id: 't' + Date.now(),
          p: draft.projectId,
          s: draft.studentId,
          title: draft.title.trim(),
          due: draft.due,
          desc: draft.brief.trim(),
          status: 'In progress',
          v: 0,
        });
      });
      setModal(null);
      toast('Task assigned in demo workspace.');
    },
    [d.signed, toast, update]
  );

  const decide = useCallback(
    (task: FacultyTask, status: 'Approved' | 'Changes requested', comment: string, minutes: number) => {
      if (task.status !== 'Ready for review' || (task.flags || []).some((f) => f.level === 'Critical' && !f.resolved)) {
        toast('This submission cannot be approved yet.');
        return;
      }
      if (status === 'Changes requested' && !comment.trim()) return toast('Add a revision comment first.');
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) return toast('Enter a valid review duration.');
      update((s) => {
        const t = s.tasks.find((x) => x.id === task.id)!;
        t.status = status;
        t.decision = comment.trim() || 'Reviewed and approved by faculty.';
        t.minutes = minutes;
        s.logs.push({ date: today(), p: t.p, task: t.title, minutes });
      });
      toast(status === 'Approved' ? 'Submission approved. Review time recorded.' : 'Revision requested. Review time recorded.');
      go('review');
    },
    [go, toast, update]
  );

  const simulateRevision = useCallback(
    (task: FacultyTask) => {
      if (!['AI revision required', 'Changes requested'].includes(task.status)) return;
      update((s) => {
        const t = s.tasks.find((x) => x.id === task.id)!;
        t.previous = t.work;
        t.v++;
        t.work =
          t.id === 't5'
            ? 'What factors influence your choice among available brands? How do you evaluate price relative to product features and service quality?'
            : (t.work || '') + ' A revised section has been added to address the faculty feedback (simulation).';
        t.summary = 'Simulated revision: critical flags have been marked resolved and the updated work is ready for faculty review.';
        t.flags = (t.flags || []).map((x) => ({ ...x, resolved: true }));
        t.status = 'Ready for review';
        t.decision = '';
      });
      toast('Simulated resubmission added to the faculty queue.');
    },
    [toast, update]
  );

  const toggleCheck = useCallback(
    (projectId: string, index: number, on: boolean) => {
      update((s) => {
        const list = s.checks[projectId] || [];
        s.checks[projectId] = on ? [...new Set([...list, index])] : list.filter((x) => x !== index);
      });
    },
    [update]
  );

  const finishSign = useCallback(
    (projectId: string) => {
      update((s) => {
        s.signed[projectId] = {
          id: 'TH-DEMO-' + projectId.toUpperCase() + '-' + Date.now().toString(36).slice(-5).toUpperCase(),
          by: s.profile,
        };
      });
      setModal(null);
      toast('Demo report signed off.');
    },
    [toast, update]
  );

  const confirmCredit = useCallback(
    (projectId: string, studentId: string) => {
      update((s) => {
        s.confirmed[projectId + ':' + studentId] = true;
      });
      toast('Contribution confirmed in the demo record.');
    },
    [toast, update]
  );

  const saveSettings = useCallback(
    (name: string, cap: number) => {
      if (!name || cap < 15 || cap > 10080) return;
      update((s) => {
        s.profile = name;
        s.weeklyCap = cap;
      });
      toast('Preferences saved locally.');
    },
    [toast, update]
  );

  const resetDemo = useCallback(() => {
    const fresh = structuredClone(FACULTY_SEED);
    setD(fresh);
    writeJSON(STORE_KEY, fresh);
    setModal(null);
    go('overview');
    toast('Original demonstration data restored.');
  }, [go, toast]);

  const exportLog = useCallback(() => {
    const quote = (x: unknown) => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    const csv = [
      'Date,Activity,Project,Minutes',
      ...d.logs.map((x) => [x.date, x.task, projectById(d, x.p)?.name ?? '', x.minutes].map(quote).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesia-demo-time-log.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Time log exported.');
  }, [d, toast]);

  // ---------- views ----------

  const views: Record<SectionId, ReactNode> = {
    overview: <Overview d={d} onAssign={() => setModal({ kind: 'assign' })} go={go} />,
    projects: <Projects d={d} onAssign={(projectId) => setModal({ kind: 'assign', projectId })} onTaskDetails={(taskId) => setModal({ kind: 'task', taskId })} go={go} id={id} />,
    students: <Students d={d} onRecord={(studentId) => setModal({ kind: 'student', studentId })} />,
    review: <Reviews d={d} id={id} decide={decide} simulateRevision={simulateRevision} go={go} />,
    signoff: <SignOff d={d} onToggleCheck={toggleCheck} onConfirm={confirmCredit} onSign={(projectId) => setModal({ kind: 'sign', projectId })} />,
    analytics: <Analytics d={d} onExport={exportLog} />,
    settings: <SettingsView d={d} onSave={saveSettings} onReset={() => setModal({ kind: 'reset' })} />,
  };

  return (
    <div className="fac">
      <div className="fac-shell">
        <aside className={`fac-sidebar${menu ? ' fac-sidebar-open' : ''}`}>
          <div className="fac-brand">
            <div className="fac-mark">T.</div>
            <div>
              <strong>thesia.</strong>
              <small>Faculty workspace</small>
            </div>
          </div>
          <div className="fac-eyebrow fac-nav-label">Workspace</div>
          <nav className="fac-nav" aria-label="Faculty workspace">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={active === s.id ? 'active' : ''}
                aria-current={active === s.id ? 'page' : undefined}
                onClick={() => go(s.id)}
              >
                <s.icon size={18} />
                <span>{s.label}</span>
                {s.id === 'review' && pending > 0 && <span className="fac-nav-count">{pending}</span>}
              </button>
            ))}
          </nav>
          <div className="fac-side-bottom">
            <div className="fac-demo-box">
              <span className="fac-eyebrow">Day 1 prototype</span>
              <p>Illustrative research data. AI screening is simulated.</p>
              <LinkBtn onClick={() => setModal({ kind: 'walkthrough' })}>Demo walkthrough</LinkBtn>
            </div>
            <div className="fac-profile">
              <FacAvatar name={d.profile} />
              <div>
                <b>{d.profile}</b>
                <small>Faculty supervisor · Demo</small>
              </div>
            </div>
          </div>
        </aside>
        <main className="fac-main">
          <header className="fac-topbar">
            <div className="fac-crumb">
              <button type="button" className="fac-icon-btn fac-mobile-menu" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                <LuMenu size={18} />
              </button>
              <span className="fac-muted">Faculty</span>
              <LuChevronRight size={14} />
              <b>{SECTIONS.find((s) => s.id === active)?.label}</b>
              {detailTitle && (
                <>
                  <LuChevronRight size={14} />
                  <span className="fac-muted">{detailTitle}</span>
                </>
              )}
            </div>
            <div className="fac-top-actions">
              <span className="fac-pill">
                <span className="fac-dot" /> Demo workspace
              </span>
              <button type="button" className="fac-icon-btn" onClick={() => setModal({ kind: 'walkthrough' })} title="Demo guide" aria-label="Demo guide">
                <LuSparkles size={18} />
              </button>
              <FacAvatar name={d.profile} />
            </div>
          </header>
          <div className="fac-content">{views[active]}</div>
        </main>
      </div>

      {modal?.kind === 'assign' && (
        <AssignModal d={d} preset={modal.projectId} onClose={() => setModal(null)} onSave={saveTask} />
      )}
      {modal?.kind === 'student' && <StudentModal d={d} studentId={modal.studentId} onClose={() => setModal(null)} />}
      {modal?.kind === 'task' && <TaskModal d={d} taskId={modal.taskId} onClose={() => setModal(null)} />}
      {modal?.kind === 'sign' && <SignModal onClose={() => setModal(null)} onConfirm={() => finishSign(modal.projectId)} />}
      {modal?.kind === 'reset' && <ResetModal onClose={() => setModal(null)} onReset={resetDemo} />}
      {modal?.kind === 'walkthrough' && <WalkthroughModal onClose={() => setModal(null)} onStart={() => { setModal(null); go('review'); }} onReset={() => setModal({ kind: 'reset' })} />}
    </div>
  );
}

// ---------- section views ----------

function Metric({ label, value, note, icon: Icon }: { label: string; value: ReactNode; note: string; icon: typeof LuFolder }) {
  return (
    <div className="fac-metric">
      <div className="fac-metric-top">
        <span>{label}</span>
        <span className="fac-metric-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="fac-value">{value}</div>
      <small>{note}</small>
    </div>
  );
}

function ProjectRow({ d, p, onOpen }: { d: FacultyState; p: FacultyState['projects'][number]; onOpen: () => void }) {
  const v = completion(d, p.id);
  return (
    <div
      className="fac-project-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className="fac-spread">
        <div className="fac-project-info">
          <div className="fac-project-icon">
            <LuFolder size={18} />
          </div>
          <div>
            <h3>{p.name}</h3>
            <small>
              {p.type} · {p.students.length} researchers
            </small>
          </div>
        </div>
        <LuChevronRight size={16} />
      </div>
      <Progress value={v} />
      <div className="fac-subline">
        <span>{p.phase}</span>
        <span>{v}% tasks approved</span>
      </div>
    </div>
  );
}

function QueueRow({ t, d, icon, onOpen }: { t: FacultyTask; d: FacultyState; icon?: ReactNode; onOpen: () => void }) {
  return (
    <div className="fac-queue-row" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="fac-project-icon">{icon ?? <LuFileText size={18} />}</div>
      <div>
        <h3>{t.title}</h3>
        <small>
          {studentById(d, t.s)?.name} · V{t.v} · {fmtDate(t.due)}
        </small>
      </div>
      <Badge status={t.status} />
      <LuChevronRight size={14} />
    </div>
  );
}

function TaskRow({ t, d }: { t: FacultyTask; d: FacultyState }) {
  return (
    <tr>
      <td>
        <b>{t.title}</b>
      </td>
      <td>{studentById(d, t.s)?.name}</td>
      <td>{projectById(d, t.p)?.name}</td>
      <td>{fmtDate(t.due)}</td>
      <td>
        <Badge status={t.status} />
      </td>
    </tr>
  );
}

function Overview({ d, onAssign, go }: { d: FacultyState; onAssign: () => void; go: (s: SectionId, id?: string) => void }) {
  const r = readyTasks(d);
  const blocked = d.tasks.filter((t) => t.status === 'AI revision required' || t.status === 'Changes requested').length;
  const activeCount = d.projects.filter((p) => !d.signed[p.id]).length;
  return (
    <>
      <Head
        title={`Welcome, ${d.profile.split(' ').slice(-1)[0]}.`}
        sub="Your research teams, prioritised for your attention."
        action={
          <button type="button" className="fac-btn fac-btn-primary" onClick={onAssign}>
            <LuPlus size={15} /> Assign task
          </button>
        }
      />
      <div className="fac-banner">
        <div>
          <div className="fac-eyebrow">
            <LuSparkles size={15} />
          </div>
          <h2>{r.length} submissions are ready for your judgment.</h2>
          <p>
            {blocked} {blocked === 1 ? 'submission is' : 'submissions are'} held for AI-guided revision before reaching your queue.
          </p>
        </div>
        <button type="button" className="fac-btn" onClick={() => go('review')}>
          Open review queue <LuArrowRight size={15} />
        </button>
      </div>
      <div className="fac-metrics">
        <Metric label="Active projects" value={activeCount} note="Across your research portfolio" icon={LuFolder} />
        <Metric label="Student researchers" value={d.students.length} note="Assigned to research teams" icon={LuUsers} />
        <Metric label="Pending reviews" value={r.length} note="Critical AI checks cleared" icon={LuInbox} />
        <Metric label="Supervision this week" value={totalMinutes(d) + ' min'} note={`Of ${d.weeklyCap} min target cap`} icon={LuClock} />
      </div>
      <div className="fac-columns">
        <Panel
          title="Active projects"
          sub="Research progress at a glance"
          right={<LinkBtn onClick={() => go('projects')}>All projects</LinkBtn>}
        >
          {d.projects.map((p) => (
            <ProjectRow key={p.id} d={d} p={p} onOpen={() => go('projects', p.id)} />
          ))}
        </Panel>
        <Panel
          title="Review queue"
          sub="AI-screened submissions"
          right={<LinkBtn onClick={() => go('review')}>View all</LinkBtn>}
        >
          {r.length ? r.slice(0, 4).map((t) => <QueueRow key={t.id} t={t} d={d} onOpen={() => go('review', t.id)} />) : <div className="fac-empty">You are all caught up.</div>}
        </Panel>
      </div>
      <Panel title="Research activity" sub="Latest tasks across your teams">
        <div className="fac-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Research task</th>
                <th>Student</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>{d.tasks.slice(0, 6).map((t) => <TaskRow key={t.id} t={t} d={d} />)}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Projects({
  d,
  id,
  go,
  onAssign,
  onTaskDetails,
}: {
  d: FacultyState;
  id?: string;
  go: (s: SectionId, detailId?: string) => void;
  onAssign: (projectId?: string) => void;
  onTaskDetails: (taskId: string) => void;
}) {
  if (id) {
    const p = projectById(d, id);
    if (!p) return <div className="fac-empty">Project not found.</div>;
    return (
      <>
        <div style={{ marginBottom: 13 }}>
          <button type="button" className="fac-link-btn" onClick={() => go('projects')}>
            <LuArrowLeft size={14} /> All projects
          </button>
        </div>
        <Head
          title={p.name}
          sub={`${p.type} · ${p.client} · Due ${fmtDate(p.deadline)}`}
          action={
            <button type="button" className="fac-btn fac-btn-primary" onClick={() => onAssign(p.id)}>
              <LuPlus size={15} /> Assign task
            </button>
          }
        />
        <div className="fac-columns">
          <Panel title="Research scope">
            <div className="fac-panel-body">
              <p className="fac-eyebrow">Research question</p>
              <h2 style={{ margin: '7px 0 13px' }}>{p.question}</h2>
              <p className="fac-muted">{p.brief}</p>
              <Progress value={completion(d, p.id)} />
              <div className="fac-subline">
                <span>{p.phase}</span>
                <span>{completion(d, p.id)}% approved</span>
              </div>
            </div>
          </Panel>
          <Panel title="Research team" sub="Assigned contributors">
            <div className="fac-panel-body fac-timeline">
              {p.students.map((sid) => {
                const s = studentById(d, sid);
                if (!s) return null;
                return (
                  <div className="fac-person" key={sid}>
                    <FacAvatar name={s.name} />
                    <div>
                      <b>{s.name}</b>
                      <br />
                      <small>{s.role}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
        <Panel title="Project tasks" sub="Track assignment, revisions and approval">
          <div className="fac-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Student</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasksOf(d, p.id).map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.title}</b>
                    </td>
                    <td>{studentById(d, t.s)?.name}</td>
                    <td>{fmtDate(t.due)}</td>
                    <td>
                      <Badge status={t.status} />
                    </td>
                    <td>
                      {t.v ? (
                        <button type="button" className="fac-link-btn" onClick={() => go('review', t.id)}>
                          Open <LuArrowRight size={14} />
                        </button>
                      ) : (
                        <button type="button" className="fac-link-btn" onClick={() => onTaskDetails(t.id)}>
                          Details <LuArrowRight size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    );
  }
  return (
    <>
      <Head
        title="Projects"
        sub="Manage research scope, teams and tasks."
        action={
          <button type="button" className="fac-btn fac-btn-primary" onClick={() => onAssign()}>
            <LuPlus size={15} /> Assign task
          </button>
        }
      />
      <Panel title="Research portfolio" sub="All commissioned and academic studies">
        {d.projects.map((p) => (
          <ProjectRow key={p.id} d={d} p={p} onOpen={() => go('projects', p.id)} />
        ))}
      </Panel>
    </>
  );
}

function Students({ d, onRecord }: { d: FacultyState; onRecord: (studentId: string) => void }) {
  return (
    <>
      <Head title="Student researchers" sub="See individual assignments, approved work and verified contributions." />
      <Panel title="Research team" sub="All faculty-supervised students">
        <div className="fac-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Researcher</th>
                <th>Project</th>
                <th>Tasks approved</th>
                <th>Contribution role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {d.students.map((s) => {
                const ts = d.tasks.filter((t) => t.s === s.id);
                const p = d.projects.find((p) => p.students.includes(s.id));
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="fac-person">
                        <FacAvatar name={s.name} />
                        <div>
                          <b>{s.name}</b>
                          <br />
                          <small>{s.field}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p?.name}</td>
                    <td>
                      {ts.filter((t) => t.status === 'Approved').length} / {ts.length}
                    </td>
                    <td>{s.role}</td>
                    <td>
                      <button type="button" className="fac-btn fac-btn-small" onClick={() => onRecord(s.id)}>
                        View record
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Reviews({
  d,
  id,
  decide,
  simulateRevision,
  go,
}: {
  d: FacultyState;
  id?: string;
  decide: DecideFn;
  simulateRevision: SimulateFn;
  go: (s: SectionId, detailId?: string) => void;
}) {
  const task = id ? d.tasks.find((t) => t.id === id) : undefined;
  if (id) {
    if (!task) return <div className="fac-empty">Submission not found.</div>;
    return (
      <ReviewDetail
        key={task.id}
        d={d}
        task={task}
        decide={decide}
        simulateRevision={simulateRevision}
        onBack={() => go('review')}
      />
    );
  }
  const r = readyTasks(d);
  const blocked = d.tasks.filter((t) => t.status === 'AI revision required' || t.status === 'Changes requested');
  return (
    <>
      <Head title="Review queue" sub="Only submissions that clear critical AI checks reach faculty review." />
      <div className="fac-columns">
        <Panel
          title="Ready for your review"
          sub={`${r.length} submissions · Ordered by deadline`}
        >
          {r.length ? r.map((t) => <QueueRow key={t.id} t={t} d={d} onOpen={() => go('review', t.id)} />) : <div className="fac-empty">No pending reviews.</div>}
        </Panel>
        <Panel title="Held for revision" sub="Excluded from faculty queue">
          {blocked.length ? (
            blocked.map((t) => (
              <QueueRow key={t.id} t={t} d={d} icon={<LuSparkles size={18} />} onOpen={() => go('review', t.id)} />
            ))
          ) : (
            <div className="fac-empty">No revisions pending.</div>
          )}
        </Panel>
      </div>
    </>
  );
}

function ReviewDetail({
  d,
  task,
  decide,
  simulateRevision,
  onBack,
}: {
  d: FacultyState;
  task: FacultyTask;
  decide: DecideFn;
  simulateRevision: SimulateFn;
  onBack: () => void;
}) {
  const flags = task.flags || [];
  const critical = flags.filter((x) => x.level === 'Critical' && !x.resolved).length;
  const can = task.status === 'Ready for review' && !critical;
  const [tab, setTab] = useState<'current' | 'previous'>('current');
  const [comment, setComment] = useState('');
  const [minutes, setMinutes] = useState(1);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    enteredAt.current = Date.now();
    setTab('current');
    setComment('');
    setMinutes(1);
  }, [task.id]);

  const submit = (status: 'Approved' | 'Changes requested') => decide(task, status, comment, Math.max(1, minutes || Math.round((Date.now() - enteredAt.current) / 60000)));

  return (
    <>
      <div style={{ marginBottom: 13 }}>
        <button type="button" className="fac-link-btn" onClick={onBack}>
          <LuArrowLeft size={14} /> Review queue
        </button>
      </div>
      <Head
        title={task.title}
        sub={`${projectById(d, task.p)?.name} · ${studentById(d, task.s)?.name} · Version ${task.v}`}
        action={<Badge status={task.status} />}
      />
      <div className="fac-review-layout">
        <div className="fac-stack">
          <Panel title="Student submission">
            <div className="fac-panel-body">
              <div className="fac-spread">
                <span className="fac-eyebrow">Task brief</span>
                <small>Due {fmtDate(task.due)}</small>
              </div>
              <p style={{ margin: '8px 0 18px' }}>{task.desc}</p>
              <div className="fac-actions" style={{ margin: '0 0 12px' }}>
                {(['current', 'previous'] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`fac-btn fac-btn-small${tab === n ? ' fac-btn-primary' : ''}`}
                    onClick={() => setTab(n)}
                  >
                    {n === 'current' ? 'Current version' : 'Previous version'}
                  </button>
                ))}
              </div>
              <article className="fac-doc">
                <h2>{task.title}</h2>
                <div className="fac-eyebrow">
                  Version {tab === 'current' ? task.v : Math.max(1, task.v - 1)} · Illustrative excerpt
                </div>
                <p>{tab === 'current' ? task.work || 'No submission text available.' : task.previous || 'No previous version is available.'}</p>
              </article>
            </div>
          </Panel>
          <Panel title="Review history">
            <div className="fac-panel-body fac-timeline">
              <div className="fac-time-item">
                <span className="fac-time-dot" />
                <div>
                  <b>Student submitted version {task.v}</b>
                  <p>Research workspace · Demo</p>
                </div>
              </div>
              <div className="fac-time-item">
                <span className="fac-time-dot" />
                <div>
                  <b>AI first-pass screening</b>
                  <p>{critical ? 'Critical issue detected; revision required.' : 'No unresolved critical flags.'}</p>
                </div>
              </div>
              {task.decision && (
                <div className="fac-time-item">
                  <span className="fac-time-dot" />
                  <div>
                    <b>{task.status}</b>
                    <p>{task.decision}</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
        <div className="fac-stack">
          <Panel title="AI review" sub="First-pass feedback and revision flags">
            <div className="fac-panel-body">
              <span className={`fac-tag ${critical ? 'fac-tag-warn' : 'fac-tag-ok'}`}>{critical ? 'Critical issues open' : 'Critical checks cleared'}</span>
              <div className="fac-note">Simulated AI output — not a live assessment.</div>
              <p>{task.summary || 'No screening summary available.'}</p>
              {flags.map((x, i) => (
                <div key={i} className={`fac-flag${x.resolved ? ' fac-flag-resolved' : ''}`}>
                  <div className="fac-spread">
                    <span className={`fac-tag ${x.level === 'Critical' ? 'fac-tag-bad' : 'fac-tag-warn'}`}>{x.level}</span>
                    {x.resolved && <span className="fac-tag fac-tag-ok">Resolved</span>}
                  </div>
                  <h3>{x.title}</h3>
                  <p>
                    {x.where} · {x.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Faculty decision" sub="Human judgment remains final">
            <div className="fac-panel-body">
              {can ? (
                <>
                  <div className="fac-field">
                    <label htmlFor="fac-comment">Review comment (optional for approval)</label>
                    <textarea id="fac-comment" placeholder="Record your judgment or specific revision instructions" value={comment} onChange={(e) => setComment(e.target.value)} />
                  </div>
                  <div className="fac-field">
                    <label htmlFor="fac-review-min">Review time (minutes)</label>
                    <input id="fac-review-min" type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
                  </div>
                  <div className="fac-actions">
                    <button type="button" className="fac-btn fac-btn-primary" onClick={() => submit('Approved')}>
                      <LuCheck size={15} /> Approve
                    </button>
                    <button type="button" className="fac-btn" onClick={() => submit('Changes requested')}>
                      Request changes
                    </button>
                  </div>
                </>
              ) : task.status === 'AI revision required' ? (
                <>
                  <p>Faculty approval is unavailable until the student addresses critical flags.</p>
                  <div className="fac-actions">
                    <button type="button" className="fac-btn fac-btn-primary" onClick={() => simulateRevision(task)}>
                      <LuSparkles size={15} /> Simulate student revision
                    </button>
                  </div>
                </>
              ) : task.status === 'Changes requested' ? (
                <>
                  <p>Awaiting a revised submission from the student.</p>
                  <div className="fac-actions">
                    <button type="button" className="fac-btn fac-btn-primary" onClick={() => simulateRevision(task)}>
                      <LuSparkles size={15} /> Simulate resubmission
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    {task.status}
                    {task.minutes ? ' · ' + task.minutes + ' min review time' : ''}
                  </p>
                  {task.decision && <div className="fac-note">{task.decision}</div>}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function SignOff({
  d,
  onToggleCheck,
  onConfirm,
  onSign,
}: {
  d: FacultyState;
  onToggleCheck: (projectId: string, index: number, on: boolean) => void;
  onConfirm: (projectId: string, studentId: string) => void;
  onSign: (projectId: string) => void;
}) {
  return (
    <>
      <Head title="Research sign-off" sub="Approve project deliverables and validate student contributions." />
      {d.projects.map((p) => {
        const ts = tasksOf(d, p.id);
        const complete = ts.length > 0 && ts.every((t) => t.status === 'Approved');
        const signed = d.signed[p.id];
        const checks = d.checks[p.id] || [];
        const all = checks.length === CRITERIA.length;
        return (
          <section className="fac-panel fac-sign-panel" key={p.id}>
            <header className="fac-panel-head">
              <div>
                <h2>{p.name}</h2>
                <p className="fac-muted">
                  {ts.filter((t) => t.status === 'Approved').length} of {ts.length} tasks approved
                </p>
              </div>
              {signed ? <Badge status="Signed off" /> : <Badge status={complete ? 'Ready for review' : 'In progress'} />}
            </header>
            <div className="fac-panel-body">
              {signed ? (
                <>
                  <div className="fac-note">
                    <b>Demo verification ID:</b> {signed.id} · Signed by {signed.by}. This is a local prototype record, not a publicly verifiable certificate.
                  </div>
                  <h3 style={{ margin: '16px 0 7px' }}>Confirm student contributions</h3>
                  {p.students.map((sid) => {
                    const s = studentById(d, sid);
                    if (!s) return null;
                    const done = d.confirmed[p.id + ':' + sid];
                    return (
                      <div className="fac-spread fac-sign-person" key={sid}>
                        <div className="fac-person">
                          <FacAvatar name={s.name} />
                          <div>
                            <b>{s.name}</b>
                            <br />
                            <small>{s.role}</small>
                          </div>
                        </div>
                        {done ? (
                          <Badge status="Confirmed" />
                        ) : (
                          <button type="button" className="fac-btn fac-btn-small" onClick={() => onConfirm(p.id, sid)}>
                            <LuCheck size={15} /> Confirm
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {!complete && <p className="fac-muted">All project tasks must be approved before final sign-off.</p>}
                  {CRITERIA.map((c, i) => (
                    <label className="fac-check-row" key={i}>
                      <input type="checkbox" checked={checks.includes(i)} disabled={!complete} onChange={(e) => onToggleCheck(p.id, i, e.target.checked)} />
                      <span>{c}</span>
                    </label>
                  ))}
                  <div className="fac-actions">
                    <button type="button" className="fac-btn fac-btn-primary" disabled={!(complete && all)} onClick={() => onSign(p.id)}>
                      <LuShieldCheck size={15} /> Sign off report
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

function Analytics({ d, onExport }: { d: FacultyState; onExport: () => void }) {
  const total = totalMinutes(d);
  const approved = d.tasks.filter((t) => t.status === 'Approved').length;
  return (
    <>
      <Head
        title="Supervision analytics"
        sub="Understand faculty effort and review throughput."
        action={
          <button type="button" className="fac-btn" onClick={onExport}>
            <LuDownload size={15} /> Export time log
          </button>
        }
      />
      <div className="fac-metrics">
        <Metric label="Minutes recorded" value={total} note="Illustrative supervision logs" icon={LuClock} />
        <Metric label="Weekly target cap" value={d.weeklyCap + ' min'} note="Editable faculty target" icon={LuClock} />
        <Metric label="Approved tasks" value={approved} note={`Of ${d.tasks.length} assigned tasks`} icon={LuCheck} />
        <Metric label="Signed reports" value={Object.keys(d.signed).length} note="Faculty-controlled approvals" icon={LuShieldCheck} />
      </div>
      <div className="fac-columns">
        <Panel title="Supervision time by project">
          <div className="fac-panel-body">
            {d.projects.map((p) => {
              const m = d.logs.filter((x) => x.p === p.id).reduce((a, x) => a + x.minutes, 0);
              return (
                <div className="fac-barrow-project" key={p.id}>
                  <div className="fac-spread">
                    <b>{p.name}</b>
                    <span>{m} min</span>
                  </div>
                  <Progress value={(100 * m) / Math.max(total, 1)} />
                </div>
              );
            })}
            <div className="fac-note">These are sample and locally recorded review minutes, not measured pilot outcomes.</div>
          </div>
        </Panel>
        <Panel title="Weekly time budget">
          <div className="fac-panel-body">
            <div className="fac-spread">
              <h1>
                {total} <small style={{ fontSize: 16 }}>/ {d.weeklyCap} min</small>
              </h1>
              <span className={`fac-tag ${total > d.weeklyCap ? 'fac-tag-warn' : 'fac-tag-ok'}`}>{total > d.weeklyCap ? 'Over target' : 'Within target'}</span>
            </div>
            <Progress value={(100 * total) / d.weeklyCap} />
            <p className="fac-muted" style={{ marginTop: 12 }}>
              {Math.max(0, d.weeklyCap - total)} minutes remaining against the demo target.
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Review time log">
        <div className="fac-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Project</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {d.logs
                .slice()
                .reverse()
                .map((x, i) => (
                  <tr key={i}>
                    <td>{fmtDate(x.date)}</td>
                    <td>{x.task}</td>
                    <td>{projectById(d, x.p)?.name}</td>
                    <td>{x.minutes}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function SettingsView({ d, onSave, onReset }: { d: FacultyState; onSave: (name: string, cap: number) => void; onReset: () => void }) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave(String(fd.get('name') || '').trim(), Number(fd.get('cap')));
  };
  return (
    <>
      <Head title="Settings" sub="Manage demo profile and supervision preferences." />
      <div className="fac-settings-grid">
        <Panel title="Faculty profile">
          <div className="fac-panel-body">
            <form onSubmit={submit}>
              <div className="fac-field">
                <label htmlFor="fac-name">Display name</label>
                <input id="fac-name" name="name" defaultValue={d.profile} required maxLength={70} />
              </div>
              <div className="fac-field">
                <label htmlFor="fac-cap">Weekly time target (minutes)</label>
                <input id="fac-cap" name="cap" type="number" min={15} max={10080} defaultValue={d.weeklyCap} required />
              </div>
              <button className="fac-btn fac-btn-primary" type="submit">
                Save preferences
              </button>
            </form>
          </div>
        </Panel>
        <Panel title="Demo environment">
          <div className="fac-panel-body">
            <p className="fac-muted">All data is stored in this browser only. No authentication, live AI, server or actual research information is connected.</p>
            <div className="fac-actions">
              <button type="button" className="fac-btn" onClick={onReset}>
                <LuRotateCcw size={15} /> Reset demo data
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

// ---------- modals ----------

function AssignModal({ d, preset, onClose, onSave }: { d: FacultyState; preset?: string; onClose: () => void; onSave: AssignSave }) {
  const [projectId, setProjectId] = useState(preset || d.projects[0]?.id || '');
  const project = projectById(d, projectId);
  const [studentId, setStudentId] = useState(project?.students[0] || '');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('2026-11-20');
  const [brief, setBrief] = useState('');
  // Keep the assignee valid when the chosen project changes.
  const members = project?.students ?? [];
  useEffect(() => {
    if (!members.includes(studentId)) setStudentId(members[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  return (
    <Sheet open onClose={onClose} title="Assign research task">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ projectId, studentId, title, due, brief });
        }}
      >
        <div className="fac-field">
          <label htmlFor="fac-ap">Project</label>
          <select id="fac-ap" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {d.projects.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="fac-field">
          <label htmlFor="fac-as">Assign to</label>
          <select id="fac-as" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {members.map((sid) => (
              <option key={sid} value={sid}>
                {studentById(d, sid)?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="fac-field">
          <label htmlFor="fac-at">Task title</label>
          <input id="fac-at" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Analyse survey responses" maxLength={100} />
        </div>
        <div className="fac-field">
          <label htmlFor="fac-ad">Due date</label>
          <input id="fac-ad" type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
        </div>
        <div className="fac-field">
          <label htmlFor="fac-ab">Task brief</label>
          <textarea id="fac-ab" value={brief} onChange={(e) => setBrief(e.target.value)} required placeholder="Expected output, method and success criteria" />
        </div>
        <div className="fac-actions">
          <button type="button" className="fac-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="fac-btn fac-btn-primary" type="submit">
            <LuPlus size={15} /> Assign task
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function StudentModal({ d, studentId, onClose }: { d: FacultyState; studentId: string; onClose: () => void }) {
  const s = studentById(d, studentId);
  if (!s) return null;
  const ts = d.tasks.filter((t) => t.s === studentId);
  return (
    <Sheet open onClose={onClose} title={s.name}>
      <p className="fac-muted">
        {s.field} · {s.role}
      </p>
      <div className="fac-note">Contribution records can be confirmed after the project is signed off.</div>
      {ts.length ? (
        ts.map((t) => (
          <div className="fac-spread fac-student-task" key={t.id}>
            <b>{t.title}</b>
            <Badge status={t.status} />
          </div>
        ))
      ) : (
        <div className="fac-empty">No assigned tasks</div>
      )}
    </Sheet>
  );
}

function TaskModal({ d, taskId, onClose }: { d: FacultyState; taskId: string; onClose: () => void }) {
  const t = d.tasks.find((x) => x.id === taskId);
  if (!t) return null;
  return (
    <Sheet open onClose={onClose} title={t.title}>
      <p>{t.desc}</p>
      <p className="fac-muted" style={{ margin: '10px 0' }}>
        {studentById(d, t.s)?.name} · {fmtDate(t.due)}
      </p>
      <Badge status={t.status} />
      <div className="fac-note">Student submissions are managed in a separate workspace in the production application.</div>
    </Sheet>
  );
}

function SignModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Confirm research sign-off">
      <p>As the demo faculty reviewer, you confirm that the methods and conclusions have been reviewed and that the report meets the checklist.</p>
      <div className="fac-note">This creates a simulated verification record only.</div>
      <div className="fac-actions">
        <button type="button" className="fac-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="fac-btn fac-btn-primary" onClick={onConfirm}>
          <LuShieldCheck size={15} /> Confirm sign-off
        </button>
      </div>
    </Sheet>
  );
}

function ResetModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Reset demonstration?">
      <p>This restores the original sample projects, tasks and review records.</p>
      <div className="fac-actions">
        <button type="button" className="fac-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="fac-btn fac-btn-primary" onClick={onReset}>
          <LuRotateCcw size={15} /> Reset demo
        </button>
      </div>
    </Sheet>
  );
}

function WalkthroughModal({ onClose, onStart, onReset }: { onClose: () => void; onStart: () => void; onReset: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Day 1 pitch walkthrough" wide>
      <p className="fac-muted">Demonstrate the faculty bottleneck and how the review workflow addresses it. All data and AI outputs are illustrative.</p>
      <div className="fac-timeline fac-walkthrough">
        {WALKTHROUGH.map(([n, title, text]) => (
          <div className="fac-time-item" key={n}>
            <div className="fac-avatar">{n}</div>
            <div>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="fac-actions">
        <button type="button" className="fac-btn fac-btn-primary" onClick={onStart}>
          <LuArrowRight size={15} /> Start review queue
        </button>
        <button type="button" className="fac-btn" onClick={onReset}>
          <LuRotateCcw size={15} /> Reset demo
        </button>
      </div>
    </Sheet>
  );
}

type AssignSave = (draft: { projectId: string; studentId: string; title: string; due: string; brief: string }) => void;
type DecideFn = (task: FacultyTask, status: 'Approved' | 'Changes requested', comment: string, minutes: number) => void;
type SimulateFn = (task: FacultyTask) => void;
