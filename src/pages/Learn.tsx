import { useMemo, useState } from 'react';
import { LuCircleCheck } from 'react-icons/lu';
import { Markdown, PageHead } from '../components/ui';
import { BOOTCAMPS } from '../data/bootcamps';
import { PASS_MARK, TRACKS, lessonById, trackById } from '../data/academy';
import { useApp } from '../lib/app';
import { lessonKey, repo } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import type { QuizQuestion, Track } from '../lib/types';
import { NotFound } from './NotFound';

function useTrackProgress(track: Track) {
  const { progress } = useApp();
  const done = track.lessons.filter((l) => progress[lessonKey(track.id, l.id)]).length;
  return { done, total: track.lessons.length, pct: Math.round((done / track.lessons.length) * 100) };
}

function TrackCard({ track }: { track: Track }) {
  const { done, total, pct } = useTrackProgress(track);
  const minutes = track.lessons.reduce((n, l) => n + l.minutes, 0);
  return (
    <Link to={`/learn/${track.id}`} className="card card-link track-card" style={{ gap: 12 }}>
      <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
        <span className={`pill ${track.level === 'Beginner' ? 'pill-mark' : 'pill-neutral'}`}>{track.level}</span>
        <span className="small muted">
          {total} lessons, about {minutes} min
        </span>
      </div>
      <h3 style={{ fontSize: 'var(--t-xl)' }}>{track.title}</h3>
      <p className="small muted">{track.summary}</p>
      <p className="xsmall faint">For: {track.audience}</p>
      <div className="progress">
        <div className="progress-bar" aria-hidden="true">
          <b style={{ width: `${pct}%` }} />
        </div>
        <span>{done === 0 ? 'Not started' : done === total ? 'Complete' : `${done} of ${total} done`}</span>
      </div>
    </Link>
  );
}

export function Learn() {
  const { user, profile } = useApp();
  const level = profile?.level;
  const start = level === 'masters' || level === 'phd' ? 'methods' : 'foundations';
  return (
    <div className="wrap page">
      <PageHead
        title="The Thesia Academy"
        lede="Short, free lessons on how research actually works, from your first question to your first paper. Each ends with a quick check of what you learned."
      >
        <div className="cluster">
          <Link to={`/learn/${start}`} className="btn btn-primary">
            {level ? 'Start where you are' : 'Start with the basics'}
          </Link>
          {!user && <span className="small muted">Sign in to save progress and earn a verifiable certificate for each track.</span>}
        </div>
      </PageHead>
      <div className="grid" style={{ ['--min' as any]: '320px', marginBottom: 56 }}>
        {TRACKS.map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </div>
      <section className="stack" style={{ maxWidth: 820 }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Not sure where to begin?</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>If you are…</th>
                <th>Start with</th>
                <th>Then</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>In school (O/A Level, Matric, FSc)</td>
                <td>
                  <Link to="/learn/foundations">Research foundations</Link>
                </td>
                <td>Join a high-school friendly project</td>
              </tr>
              <tr>
                <td>An undergraduate, new to research</td>
                <td>
                  <Link to="/learn/foundations">Research foundations</Link>
                </td>
                <td>
                  <Link to="/learn/getting-in">Getting into research</Link>
                </td>
              </tr>
              <tr>
                <td>Writing a thesis or final-year project</td>
                <td>
                  <Link to="/learn/methods">Methods and analysis</Link>
                </td>
                <td>
                  <Link to="/learn/publishing">Publishing and presenting</Link>
                </td>
              </tr>
              <tr>
                <td>A master’s student or junior researcher</td>
                <td>
                  <Link to="/learn/publishing">Publishing and presenting</Link>
                </td>
                <td>
                  <Link to="/bootcamps/systematic-review">Systematic reviews bootcamp</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Want live teaching and feedback? The free <Link to={`/bootcamps/${BOOTCAMPS[0].id}`}>{BOOTCAMPS[0].title}</Link> bootcamp starts soon.
        </p>
      </section>
    </div>
  );
}

export function TrackPage() {
  const { track: trackId } = useParams();
  const track = trackById(trackId);
  const { progress } = useApp();
  if (!track) return <NotFound />;
  return <TrackView track={track} progress={progress} />;
}

function TrackView({ track, progress }: { track: Track; progress: Record<string, unknown> }) {
  const { done, total, pct } = useTrackProgress(track);
  const { user, toast } = useApp();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const next = track.lessons.find((l) => !progress[lessonKey(track.id, l.id)]) || track.lessons[0];
  const openCertificate = async () => {
    if (!user) return;
    setClaiming(true);
    try {
      navigate(`/certificate/${await repo.claimTrackCertificate(user.id, track.id)}`);
    } catch (e: any) {
      const m = String(e?.message || '');
      toast(/incomplete|Finish/.test(m) ? `Each lesson needs at least ${PASS_MARK}% on its quiz before the certificate is issued.` : `Couldn’t open your certificate: ${m || 'network error'}`);
    } finally {
      setClaiming(false);
    }
  };
  return (
    <div className="wrap wrap-narrow page">
      <PageHead crumbs={[{ to: '/learn', label: 'Academy' }]} title={track.title} lede={track.summary}>
        <div className="cluster">
          <Link to={`/learn/${track.id}/${next.id}`} className="btn btn-primary">
            {done === 0 ? 'Start the track' : done === total ? 'Review from the start' : 'Continue'}
          </Link>
          {user && done === total && (
            <button type="button" className="btn btn-mark" onClick={openCertificate} disabled={claiming}>
              {claiming ? 'Opening…' : 'View your certificate'}
            </button>
          )}
          <span className="small muted">
            {track.level}. For {track.audience.toLowerCase()}.
          </span>
        </div>
        <div className="progress" style={{ maxWidth: 360 }}>
          <div className="progress-bar">
            <b style={{ width: `${pct}%` }} />
          </div>
          <span>
            {done} of {total} lessons complete{done === total ? '. Badge and certificate earned.' : '. Finish them all for a verifiable certificate.'}
          </span>
        </div>
      </PageHead>
      <ol className="lesson-list">
        {track.lessons.map((l, i) => {
          const isDone = !!progress[lessonKey(track.id, l.id)];
          return (
            <li key={l.id}>
              <Link to={`/learn/${track.id}/${l.id}`}>
                <span className="lesson-num">{i + 1}</span>
                <span className="min0">
                  <strong>{l.title}</strong>
                  <span className="small muted" style={{ display: 'block' }}>
                    {l.summary}
                  </span>
                </span>
                <span className="small faint" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  {l.minutes} min
                  {isDone && (
                    <span className="done-mark" aria-label="Completed">
                      <LuCircleCheck />
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LessonPage() {
  const { track: trackId, lesson: lessonId } = useParams();
  const found = lessonById(trackId, lessonId);
  if (!found) return <NotFound />;
  return <LessonView key={`${trackId}/${lessonId}`} {...found} />;
}

function LessonView({ track, lesson, index }: { track: Track; lesson: Track['lessons'][number]; index: number }) {
  const { user, progress, completeLesson, toast, requireAuth } = useApp();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const key = lessonKey(track.id, lesson.id);
  const done = !!progress[key];
  const next = track.lessons[index + 1];
  const prev = track.lessons[index - 1];
  const allAnswered = answers.every((a) => a !== null);
  const score = useMemo(() => Math.round((answers.filter((a, i) => a === lesson.quiz[i].answer).length / lesson.quiz.length) * 100), [answers, lesson.quiz]);
  const passed = allAnswered && score >= PASS_MARK;

  const complete = async () => {
    if (!requireAuth('progress')) return;
    const certId = await completeLesson(track.id, lesson.id, score);
    if (certId) {
      toast(`Track complete: ${track.title}. Your certificate is ready.`);
      navigate(`/certificate/${certId}`);
      return;
    }
    toast('Lesson complete');
    if (next) navigate(`/learn/${track.id}/${next.id}`);
  };

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
        <Link to="/learn">Academy</Link> /<Link to={`/learn/${track.id}`}>{track.title}</Link>
      </nav>
      <div className="notebook">
        <article className="notebook-page stack" style={{ ['--gap' as any]: '28px' }}>
          <header className="stack" style={{ ['--gap' as any]: '12px', maxWidth: 'var(--measure)' }}>
            <span className="small faint">
              Lesson {index + 1} of {track.lessons.length}, {lesson.minutes} min read
            </span>
            <h1 style={{ fontSize: 'clamp(2rem, 4.2vw, 2.75rem)' }}>{lesson.title}</h1>
            <p className="lede">{lesson.summary}</p>
          </header>
          <Markdown source={lesson.body} />
          {lesson.tool && (
            <p className="callout" style={{ maxWidth: 'var(--measure)' }}>
              Try it: the matching <Link to={lesson.tool}>Thesia tool</Link> walks you through this step by step.
            </p>
          )}
          <section className="stack" aria-labelledby="quiz-h" style={{ maxWidth: 'var(--measure)' }}>
            <h2 id="quiz-h" style={{ fontSize: 'var(--t-xl)' }}>
              Check your understanding
            </h2>
            <div className="quiz">
              {lesson.quiz.map((q, i) => (
                <QuizItem key={i} q={q} n={i + 1} value={answers[i]} onAnswer={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))} />
              ))}
            </div>
            <div className="cluster" style={{ marginTop: 8 }}>
              {done ? (
                <span className="pill pill-open">
                  <LuCircleCheck /> Completed
                </span>
              ) : (
                <button className="btn btn-primary" disabled={!passed} onClick={complete} title={passed ? undefined : allAnswered ? `Get at least ${PASS_MARK}% right to complete the lesson` : 'Answer every question first'}>
                  Mark lesson complete
                </button>
              )}
              {allAnswered && passed && <span className="small muted">You got {score}% right.{score < 100 ? ' Read the explanations, then carry on.' : ''}</span>}
              {allAnswered && !passed && !done && (
                <>
                  <span className="small muted">
                    You got {score}% right. You need at least {PASS_MARK}% for the lesson to count. Read the explanations, then try again.
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnswers(lesson.quiz.map(() => null))}>
                    Try the quiz again
                  </button>
                </>
              )}
              {!user && !done && <span className="small faint">Sign in to save your progress.</span>}
            </div>
          </section>
          <nav className="cluster" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--rule)', paddingTop: 20, maxWidth: 'var(--measure)' }} aria-label="Lesson navigation">
            {prev ? (
              <Link to={`/learn/${track.id}/${prev.id}`} className="btn btn-ghost btn-wrap">
                Previous: {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/learn/${track.id}/${next.id}`} className="btn btn-secondary btn-wrap">
                Next: {next.title}
              </Link>
            ) : (
              <Link to="/learn" className="btn btn-secondary">
                Back to the Academy
              </Link>
            )}
          </nav>
        </article>
        <aside className="margin-notes" aria-label="Margin notes">
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>Key points</h3>
            <ul className="checklist">
              {lesson.takeaways.map((t) => (
                <li key={t}>
                  <span className="ok" aria-hidden="true">
                    <LuCircleCheck />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="stack" style={{ ['--gap' as any]: '6px' }}>
            <h3 style={{ fontSize: 'var(--t-sm)', fontFamily: 'var(--font-body)' }}>In this track</h3>
            <ol style={{ margin: 0, paddingLeft: '1.3em', display: 'grid', gap: 6 }} className="small">
              {track.lessons.map((l) => (
                <li key={l.id} style={{ color: l.id === lesson.id ? 'var(--ink)' : 'var(--ink-2)' }}>
                  {l.id === lesson.id ? <strong>{l.title}</strong> : <Link to={`/learn/${track.id}/${l.id}`}>{l.title}</Link>}
                  {progress[lessonKey(track.id, l.id)] ? <span className="done-mark" style={{ marginLeft: 6, verticalAlign: '-4px' }} aria-label="Completed"><LuCircleCheck /></span> : null}
                </li>
              ))}
            </ol>
          </div>
          <Link to={`/guide?q=${encodeURIComponent('I have a question about ' + lesson.title.toLowerCase())}`} className="btn btn-secondary">
            Ask the guide about this
          </Link>
        </aside>
      </div>
    </div>
  );
}

function QuizItem({ q, n, value, onAnswer }: { q: QuizQuestion; n: number; value: number | null; onAnswer: (v: number) => void }) {
  const answered = value !== null;
  return (
    <div className="quiz-q">
      <h4>
        {n}. {q.q}
      </h4>
      <div className="stack" style={{ ['--gap' as any]: '8px' }} role="group" aria-label={`Question ${n}`}>
        {q.options.map((o, i) => {
          const cls = answered ? (i === q.answer ? ' is-right' : i === value ? ' is-wrong' : '') : '';
          return (
            <button key={i} type="button" className={`quiz-option${cls}`} disabled={answered} onClick={() => onAnswer(i)} aria-pressed={value === i}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="quiz-why" role="status">
          <strong>{value === q.answer ? 'Right.' : 'Not quite.'}</strong> {q.why}
        </p>
      )}
    </div>
  );
}

