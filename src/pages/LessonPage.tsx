import { useMemo, useState } from 'react';
import { LuArrowRight, LuBadgeCheck, LuCircleCheck, LuClock, LuEye } from 'react-icons/lu';
import { ExerciseCard, QuizItem, StepCard, TemplateCard } from '../components/learn/LessonCards';
import { PageHead } from '../components/ui';
import { PASS_MARK, lessonById, TRACKS } from '../data/academy';
import { sourcesFor } from '../data/academy/sources';
import { useApp } from '../lib/app';
import { lessonUnlocked, lessonXp } from '../lib/learn';
import { lessonKey } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import type { Lesson, Track } from '../lib/types';
import { NotFound } from './NotFound';

const STEP_LABELS = ['Concept', 'Field rule', 'Real example', 'Check'];

export function LessonPage() {
  const { track: trackId, lesson: lessonId } = useParams();
  const found = lessonById(trackId, lessonId);
  if (!found) return <NotFound />;
  return <LessonView key={`${trackId}/${lessonId}`} {...found} />;
}

function LessonView({ track, lesson, index }: { track: Track; lesson: Lesson; index: number }) {
  const { user, progress, progressReady, live, completeLesson, toast, requireAuth } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [exercisePick, setExercisePick] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const key = lessonKey(track.id, lesson.id);
  const record = progress[key];
  const done = (record?.score ?? -1) >= PASS_MARK;
  const unlocked = lessonUnlocked(track, index, progress);
  const preview = !unlocked && !live;
  const next = track.lessons[index + 1];
  const prev = track.lessons[index - 1];
  const trackIndex = TRACKS.findIndex((t) => t.id === track.id);
  const allAnswered = answers.every((a) => a !== null);
  const score = useMemo(
    () => Math.round((answers.filter((a, i) => a === lesson.quiz[i].answer).length / lesson.quiz.length) * 100),
    [answers, lesson.quiz]
  );
  const passed = allAnswered && score >= PASS_MARK;
  const picked = exercisePick === null ? null : lesson.exercise.options[exercisePick];
  const exerciseCorrect = !!picked?.correct;
  const canComplete = allAnswered && passed && exerciseCorrect;
  const gained = lessonXp(lesson, { completedAt: '', score });
  const earned = lessonXp(lesson, record);
  const sources = sourcesFor(track.id, lesson.id);

  const complete = async () => {
    if (!user && live) {
      requireAuth('progress');
      return;
    }
    setSaving(true);
    try {
      const certId = await completeLesson(track.id, lesson.id, score);
      toast(`${lesson.title}: +${gained} XP`);
      if (certId) {
        toast(`Track complete: ${track.title}. Your certificate is ready.`);
        navigate(`/certificate/${certId}`);
        return;
      }
      if (next) navigate(`/learn/${track.id}/${next.id}`);
      else navigate(`/learn/${track.id}`);
    } catch (e: any) {
      toast(`Couldn’t save your progress: ${e?.message || 'network error'}.`);
    } finally {
      setSaving(false);
    }
  };

  if (!progressReady) {
    return (
      <div className="wrap page" aria-busy="true">
        <p className="muted small">Loading your progress…</p>
      </div>
    );
  }

  if (!unlocked && live) {
    const previous = track.lessons[index - 1];
    return (
      <div className="wrap wrap-narrow page">
        <PageHead
          crumbs={[
            { to: '/learn', label: 'Learn' },
            { to: `/learn/${track.id}`, label: track.title },
          ]}
          title="This step is still locked"
          lede={`The track opens one step at a time. Complete “${previous?.title ?? 'the previous step'}” with at least ${PASS_MARK}% on its quiz to unlock this lesson.`}
        >
          <div className="cluster">
            <Link to={`/learn/${track.id}/${previous?.id ?? ''}`} className="btn btn-primary">
              Go to the previous step
            </Link>
            <Link to={`/learn/${track.id}`} className="btn btn-secondary">
              Back to the track
            </Link>
          </div>
        </PageHead>
      </div>
    );
  }

  const completePanel = done ? (
    <div className="completion-panel is-done">
      <LuCircleCheck aria-hidden="true" />
      <div>
        <strong>Completed · best quiz score {record?.score}%</strong>
        <p className="small">
          You earned {earned} XP for this lesson. A higher quiz score can add up to {lesson.xp + 10 - earned} more XP.
        </p>
      </div>
      <div className="cluster">
        {canComplete && score > (record?.score ?? 0) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={complete} disabled={saving}>
            {saving ? 'Saving…' : `Save better score · ${score}%`}
          </button>
        )}
        {next ? (
          <Link to={`/learn/${track.id}/${next.id}`} className="btn btn-primary btn-sm">
            Next step <LuArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link to={`/learn/${track.id}`} className="btn btn-primary btn-sm">
            Finish the track
          </Link>
        )}
      </div>
    </div>
  ) : (
    <div className={`completion-panel${canComplete ? ' is-ready' : ''}`}>
      <LuBadgeCheck aria-hidden="true" />
      <div>
        <strong>{canComplete ? `Ready to complete · +${gained} XP` : 'Finish the check to earn XP'}</strong>
        <p className="small">
          {!allAnswered
            ? 'Answer every quiz question.'
            : !passed
              ? `You need at least ${PASS_MARK}% on the quiz; you scored ${score}%. Read the explanations, then try again.`
              : !exerciseCorrect
                ? 'The mini-exercise is not solved yet. Use the feedback and try once more.'
                : 'Your score will be saved to your lesson record.'}
        </p>
      </div>
      <div className="cluster">
        {allAnswered && !passed && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setAnswers(lesson.quiz.map(() => null));
              setStep(3);
            }}
          >
            Try the quiz again
          </button>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={!canComplete || saving} onClick={complete}>
          {saving ? 'Saving…' : `Complete lesson · +${gained} XP`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
        <Link to="/learn">Learn</Link> /<Link to={`/learn/${track.id}`}>{track.title}</Link>
      </nav>

      <header className="lesson-head">
        <span className="small faint">
          Track {trackIndex + 1} of {TRACKS.length} · Step {index + 1} of {track.lessons.length} · {lesson.minutes} min
        </span>
        <h1>{lesson.title}</h1>
        <p className="lede">{lesson.summary}</p>
        <div className="cluster">
          <span className="pill pill-mark">+{lesson.xp} XP base</span>
          <span className="pill pill-neutral">
            <LuClock aria-hidden="true" /> {lesson.minutes} min
          </span>
          {done && (
            <span className="pill pill-open">
              <LuCircleCheck aria-hidden="true" /> Completed · {record?.score}%
            </span>
          )}
          {lesson.skillTags.map((s) => (
            <span key={s} className="trail-skill">
              {s}
            </span>
          ))}
        </div>
      </header>

      {preview && (
        <div className="lesson-preview-note">
          <LuEye aria-hidden="true" />
          <p>
            Preview mode. You can browse every lesson without signing in, but this step only earns XP after you pass step {index}.
          </p>
        </div>
      )}

      <div className="notebook lesson-player">
        <div className="stack" style={{ ['--gap' as any]: '24px', minWidth: 0 }}>
          <ol className="lesson-stepper" aria-label="Lesson steps">
            {STEP_LABELS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  className={`lesson-step-btn${step === i ? ' is-current' : ''}${i < step ? ' is-visited' : ''}`}
                  aria-current={step === i ? 'step' : undefined}
                  onClick={() => setStep(i)}
                >
                  <span className="step-dot">{i < step ? <LuCircleCheck aria-hidden="true" /> : i + 1}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ol>

          {step < 3 ? (
            <StepCard step={lesson.steps[step]} index={step} />
          ) : (
            <div className="stack" style={{ ['--gap' as any]: '28px' }}>
              <section className="lesson-check-head">
                <span className="step-kind">
                  <LuBadgeCheck aria-hidden="true" /> Check
                </span>
                <h2>Use it before you read about it</h2>
                <p className="muted small">
                  Fix a flawed example, then answer the knowledge check. Every option explains itself, right or wrong.
                </p>
              </section>

              <ExerciseCard exercise={lesson.exercise} value={exercisePick} onChange={setExercisePick} />

              {lesson.template && <TemplateCard template={lesson.template} />}

              <section className="quiz-section" aria-labelledby="quiz-h">
                <h2 id="quiz-h">Knowledge check</h2>
                <p className="small muted">
                  {lesson.quiz.length} questions. You need {PASS_MARK}% or more for the lesson to earn XP.
                </p>
                <div className="quiz">
                  {lesson.quiz.map((q, i) => (
                    <QuizItem
                      key={i}
                      q={q}
                      n={i + 1}
                      value={answers[i]}
                      onAnswer={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                    />
                  ))}
                </div>
              </section>

              {completePanel}
            </div>
          )}

          <nav className="lesson-player-nav" aria-label="Lesson step navigation">
            {step > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : (
              <Link to={`/learn/${track.id}`} className="btn btn-ghost">
                Back to the track
              </Link>
            )}
            {step < 3 && (
              <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                Continue: {STEP_LABELS[step + 1]} <LuArrowRight aria-hidden="true" />
              </button>
            )}
          </nav>
        </div>

        <aside className="margin-notes" aria-label="Lesson notes">
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
          {sources.length > 0 && (
            <section className="panel stack source-panel" style={{ ['--gap' as any]: '10px' }} aria-labelledby="sources-h">
              <h3 id="sources-h" style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>
                Sources &amp; further reading
              </h3>
              <ul className="source-list">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      {s.title}
                    </a>
                    <p className="xsmall muted">{s.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="stack" style={{ ['--gap' as any]: '6px' }}>
            <h3 style={{ fontSize: 'var(--t-sm)', fontFamily: 'var(--font-body)' }}>In this track</h3>
            <ol style={{ margin: 0, paddingLeft: '1.3em', display: 'grid', gap: 6 }} className="small">
              {track.lessons.map((l, i) => {
                const r = progress[lessonKey(track.id, l.id)];
                return (
                  <li key={l.id} style={{ color: l.id === lesson.id ? 'var(--ink)' : 'var(--ink-2)' }}>
                    {l.id === lesson.id ? <strong>{l.title}</strong> : <Link to={`/learn/${track.id}/${l.id}`}>{l.title}</Link>}
                    {(r?.score ?? -1) >= PASS_MARK ? (
                      <span className="done-mark" style={{ marginLeft: 6, verticalAlign: '-4px' }} aria-label="Completed">
                        <LuCircleCheck />
                      </span>
                    ) : null}
                    {i < index && (r?.score ?? -1) < PASS_MARK ? <span className="xsmall faint"> · not passed yet</span> : null}
                  </li>
                );
              })}
            </ol>
          </div>
          {lesson.tool && (
            <Link to={lesson.tool} className="btn btn-secondary">
              Open the matching tool
            </Link>
          )}
          <Link to={`/guide?q=${encodeURIComponent('I have a question about ' + lesson.title.toLowerCase())}`} className="btn btn-ghost">
            Ask the guide about this
          </Link>
          {prev && (
            <Link to={`/learn/${track.id}/${prev.id}`} className="small">
              ← Previous: {prev.title}
            </Link>
          )}
          {next && (
            <Link to={`/learn/${track.id}/${next.id}`} className="small">
              Next: {next.title} →
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
