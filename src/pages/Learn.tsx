import { useMemo } from 'react';
import { LuArrowRight, LuAward, LuBadgeCheck, LuBookOpen, LuChartLine, LuClipboardList, LuFileText, LuGraduationCap, LuSearch, LuSparkles, LuUsers } from 'react-icons/lu';
import { BootcampCard } from '../components/rows';
import { ProgressHeader } from '../components/learn/ProgressHeader';
import { TrackMiniTrail } from '../components/learn/SkillTrail';
import { PASS_MARK, TRACKS } from '../data/academy';
import { BOOTCAMPS } from '../data/bootcamps';
import { useApp } from '../lib/app';
import { learnStats, nextLesson, trackComplete, trackDone, trackXpTotal } from '../lib/learn';
import { Link, useQueryState } from '../lib/router';
import type { Track } from '../lib/types';

const TABS = [
  { id: 'courses', label: 'Free courses' },
  { id: 'bootcamps', label: 'Live bootcamps' },
  { id: 'tools', label: 'Guide & tools' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TOOL_LINKS = [
  { to: '/tools/question-builder', title: 'Research question builder', text: 'Turn a topic into a question with a population, a comparison and a finish line.' },
  { to: '/tools/sample-size', title: 'Sample size calculator', text: 'Work out how many responses you need, with non-response built in.' },
  { to: '/tools/consent-form', title: 'Consent form builder', text: 'Draft a plain-language consent form, including a guardian section.' },
  { to: '/tools/citation', title: 'Citation builder', text: 'Format references in APA, MLA, Chicago, Harvard and IEEE.' },
  { to: '/tools/legit-check', title: 'Legit Check', text: 'Screen a journal or conference invitation for predatory-publishing signs.' },
  { to: '/tools/outreach', title: 'Outreach email composer', text: 'Write a short, specific email to a researcher that gets read.' },
];

function TrackCard({ track, index }: { track: Track; index: number }) {
  const { progress } = useApp();
  const done = trackDone(track, progress);
  const complete = trackComplete(track, progress);
  const pct = Math.round((done / track.lessons.length) * 100);
  const minutes = track.lessons.reduce((n, l) => n + l.minutes, 0);
  return (
    <Link to={`/learn/${track.id}`} className={`card card-link track-card${complete ? ' is-complete' : ''}`}>
      <div className="track-card-top">
        <span className="track-number">Track {index + 1}</span>
        <span className={`pill ${track.level === 'Beginner' ? 'pill-mark' : 'pill-neutral'}`}>{track.level}</span>
        {complete && (
          <span className="pill pill-open">
            <LuAward aria-hidden="true" /> Badge earned
          </span>
        )}
      </div>
      <h3>{track.title}</h3>
      <p className="small muted">{track.summary}</p>
      <TrackMiniTrail track={track} />
      <div className="track-skills">
        {track.skills.map((s) => (
          <span key={s} className="trail-skill">
            {s}
          </span>
        ))}
      </div>
      <div className="progress">
        <div className="progress-bar" aria-hidden="true">
          <b style={{ width: `${pct}%` }} />
        </div>
        <span>
          {done === 0 ? `${track.lessons.length} steps · ${minutes} min · ${trackXpTotal(track)} XP` : `${done} of ${track.lessons.length} steps · ${minutes} min`}
        </span>
      </div>
    </Link>
  );
}

function CoursesTab() {
  return (
    <div className="hub-panel stack" style={{ ['--gap' as any]: '40px' }}>
      <div className="track-banner">
        <LuBadgeCheck aria-hidden="true" />
        <p>
          Finishing a track counts towards selection for paid company projects. Complete all four core tracks to reach{' '}
          <strong>Pilot Ready</strong>.
        </p>
        <Link to="/projects" className="small">
          See open projects
        </Link>
      </div>
      <div className="grid" style={{ ['--min' as any]: '320px' }}>
        {TRACKS.map((t, i) => (
          <TrackCard key={t.id} track={t} index={i} />
        ))}
      </div>
      <section className="stack" style={{ ['--gap' as any]: '18px' }}>
        <div className="section-head">
          <div>
            <span className="xsmall caps faint">How a lesson works</span>
            <h2>Four steps, one small win at a time</h2>
          </div>
        </div>
        <div className="steps lesson-method">
          <div className="step">
            <span className="step-num">
              <LuFileText aria-hidden="true" />
            </span>
            <h3>Concept</h3>
            <p>The idea in plain English, with the decision it helps you make.</p>
          </div>
          <div className="step">
            <span className="step-num">
              <LuBadgeCheck aria-hidden="true" />
            </span>
            <h3>Professor's field rule</h3>
            <p>One rule researchers actually use to catch mistakes before they cost time.</p>
          </div>
          <div className="step">
            <span className="step-num">
              <LuSearch aria-hidden="true" />
            </span>
            <h3>Real example</h3>
            <p>A concrete project situation, what went wrong and the fix.</p>
          </div>
          <div className="step">
            <span className="step-num">
              <LuClipboardList aria-hidden="true" />
            </span>
            <h3>Check</h3>
            <p>A hands-on exercise, a short quiz and instant explanations. Pass 50% to earn XP.</p>
          </div>
        </div>
      </section>
      <section className="learn-note-panel">
        <div className="cluster" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack" style={{ ['--gap' as any]: '6px' }}>
            <h3>New to applied research?</h3>
            <p className="small muted">
              Start with Scoping. It gives you the one-page brief and the literature matrix that every later track builds on.
            </p>
          </div>
          <Link to={`/learn/${TRACKS[0].id}/${TRACKS[0].lessons[0].id}`} className="btn btn-secondary">
            Open the first lesson
          </Link>
        </div>
      </section>
    </div>
  );
}

function BootcampsTab() {
  return (
    <div className="hub-panel stack" style={{ ['--gap' as any]: '24px' }}>
      <div className="section-head">
        <div>
          <span className="xsmall caps faint">Live cohorts</span>
          <h2>Learn with a mentor and a deadline</h2>
          <p className="muted small">
            Free courses are self-paced. Bootcamps add live sessions, feedback on your work and a finished deliverable. Prices are adjusted for your country.
          </p>
        </div>
        <Link to="/bootcamps" className="btn btn-secondary">
          Compare all bootcamps
        </Link>
      </div>
      <div className="grid" style={{ ['--min' as any]: '320px' }}>
        {BOOTCAMPS.map((b) => (
          <BootcampCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
}

function ToolsTab() {
  return (
    <div className="hub-panel stack" style={{ ['--gap' as any]: '28px' }}>
      <div className="guide-feature">
        <div className="guide-feature-icon">
          <LuSparkles aria-hidden="true" />
        </div>
        <div className="stack" style={{ ['--gap' as any]: '8px' }}>
          <span className="xsmall caps faint">AI research guide</span>
          <h2>Ask a methods question in plain English</h2>
          <p className="small muted">
            Get a short answer with the next step and the lesson or tool that goes deeper. Useful when you are stuck at 11pm and your supervisor is asleep.
          </p>
        </div>
        <Link to="/guide" className="btn btn-primary">
          Ask the guide <LuArrowRight aria-hidden="true" />
        </Link>
      </div>
      <div className="stack" style={{ ['--gap' as any]: '14px' }}>
        <div className="section-head">
          <div>
            <span className="xsmall caps faint">Six tools</span>
            <h2>Do the task, not just read about it</h2>
          </div>
          <Link to="/tools" className="small">
            All tools
          </Link>
        </div>
        <div className="grid" style={{ ['--min' as any]: '280px' }}>
          {TOOL_LINKS.map((t) => (
            <Link key={t.to} to={t.to} className="card card-link tool-link">
              <h3>{t.title}</h3>
              <p className="small muted">{t.text}</p>
              <span className="small tool-link-arrow">
                Open <LuArrowRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Learn() {
  const { progress } = useApp();
  const [params, setParams] = useQueryState();
  const requested = params.get('tab');
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'courses';
  const stats = useMemo(() => learnStats(progress), [progress]);
  const activeTrack = TRACKS.find((t) => !trackComplete(t, progress)) ?? TRACKS[0];
  const next = nextLesson(activeTrack, progress);
  const startPath = `/learn/${activeTrack.id}/${next?.lesson.id ?? activeTrack.lessons[0].id}`;
  const cta = stats.lessonsDone === 0 ? 'Start the curriculum' : stats.pilotReady ? 'Review a track' : 'Continue where you left off';

  return (
    <div className="wrap page learn-hub">
      <header className="learn-hero">
        <div className="learn-hero-copy">
          <span className="eyebrow">
            <LuGraduationCap aria-hidden="true" /> Thesia Learn · free and gamified
          </span>
          <h1>Learn applied research by doing it</h1>
          <p className="lede">
            Four tracks take you from a company question to a signed-off report: scope the evidence, collect data properly,
            analyse it honestly and write something a manager can act on.
          </p>
          <div className="cluster learn-hero-actions">
            <Link to={startPath} className="btn btn-primary">
              {cta}
            </Link>
            <Link to="/projects" className="btn btn-secondary">
              See paid projects
            </Link>
          </div>
          <p className="xsmall faint">
            No account needed to start. A quiz at the end of every lesson, XP for passing, and a badge for every track.
          </p>
        </div>
        <ProgressHeader />
      </header>

      <div className="hub-tabs" role="tablist" aria-label="Learn hub sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`hub-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setParams({ tab: t.id === 'courses' ? null : t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {tab === 'courses' && <CoursesTab />}
        {tab === 'bootcamps' && <BootcampsTab />}
        {tab === 'tools' && <ToolsTab />}
      </div>

      <section className="learn-proof">
        <div className="learn-proof-item">
          <LuBookOpen aria-hidden="true" />
          <div>
            <strong>{stats.lessonsTotal} lessons, {TRACKS.length} tracks</strong>
            <p className="xsmall muted">Written as a pre-project curriculum, not a reading list.</p>
          </div>
        </div>
        <div className="learn-proof-item">
          <LuChartLine aria-hidden="true" />
          <div>
            <strong>XP from evidence of learning</strong>
            <p className="xsmall muted">Pass the quiz at {PASS_MARK}% or more; accuracy adds bonus XP.</p>
          </div>
        </div>
        <div className="learn-proof-item">
          <LuUsers aria-hidden="true" />
          <div>
            <strong>Built for company projects</strong>
            <p className="xsmall muted">Templates you can take straight into a supervised student team.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
