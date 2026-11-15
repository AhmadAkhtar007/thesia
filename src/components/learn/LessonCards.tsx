import { LuCheck, LuCircleAlert, LuDownload, LuEye, LuFileText, LuShieldCheck } from 'react-icons/lu';
import { downloadText } from '../../lib/format';
import { useApp } from '../../lib/app';
import type { Exercise, LessonStep, LessonTemplate, QuizQuestion } from '../../lib/types';
import { CopyButton, Markdown } from '../ui';

const STEP_META = {
  concept: { label: 'Concept', icon: LuFileText },
  rule: { label: 'Field rule', icon: LuShieldCheck },
  example: { label: 'Real example', icon: LuEye },
} as const;

export function StepCard({ step, index }: { step: LessonStep; index: number }) {
  const meta = STEP_META[step.kind];
  const Icon = meta.icon;
  return (
    <article className={`lesson-card is-${step.kind}`}>
      <header className="lesson-card-head">
        <span className="step-kind">
          <Icon aria-hidden="true" /> {meta.label}
        </span>
        <span className="xsmall faint">Step {index + 1} of 3</span>
      </header>
      <h2>{step.title}</h2>
      <Markdown source={step.body} className="prose step-prose" />
    </article>
  );
}

export function ExerciseCard({
  exercise,
  value,
  onChange,
}: {
  exercise: Exercise;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const chosen = value === null ? null : exercise.options[value];
  return (
    <section className="exercise" aria-labelledby="exercise-h">
      <div className="exercise-head">
        <span className="step-kind">
          <LuCircleAlert aria-hidden="true" /> Mini-exercise
        </span>
        <h2 id="exercise-h">{exercise.title}</h2>
        <p className="muted small">{exercise.prompt}</p>
      </div>
      <div className="exercise-options" role="group" aria-label={exercise.title}>
        {exercise.options.map((o, i) => {
          const answered = value !== null;
          const cls = answered ? (o.correct ? ' is-right' : i === value ? ' is-wrong' : '') : '';
          return (
            <button
              key={o.text}
              type="button"
              className={`exercise-option${cls}`}
              disabled={answered}
              aria-pressed={value === i}
              onClick={() => onChange(i)}
            >
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span>{o.text}</span>
              {answered && o.correct && <LuCheck className="exercise-tick" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className={`exercise-feedback${chosen.correct ? ' is-right' : ' is-wrong'}`} role="status">
          <strong>{chosen.correct ? 'Exactly right.' : 'Not this one.'}</strong> {chosen.why}
          {!chosen.correct && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(null)}>
              Try again
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function TemplateCard({ template }: { template: LessonTemplate }) {
  const { toast } = useApp();
  const extension = template.filename.split('.').pop() || 'md';
  return (
    <section className="template-card" aria-labelledby="template-h">
      <div className="template-head">
        <div>
          <span className="xsmall caps faint">Use it on a real project</span>
          <h3 id="template-h">{template.title}</h3>
        </div>
        <div className="cluster">
          <CopyButton text={template.body} label="Copy template" />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const ok = downloadText(
                template.filename,
                template.body,
                extension === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'
              );
              if (!ok) toast('Download is blocked here. Use Copy template instead.');
            }}
          >
            <LuDownload aria-hidden="true" /> Download
          </button>
        </div>
      </div>
      <pre className="template-body" data-copy-scope>
        <code data-copy-target>{template.body}</code>
      </pre>
    </section>
  );
}

export function QuizItem({
  q,
  n,
  value,
  onAnswer,
}: {
  q: QuizQuestion;
  n: number;
  value: number | null;
  onAnswer: (v: number) => void;
}) {
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
            <button
              key={i}
              type="button"
              className={`quiz-option${cls}`}
              disabled={answered}
              onClick={() => onAnswer(i)}
              aria-pressed={value === i}
            >
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
