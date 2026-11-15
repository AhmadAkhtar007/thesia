import { useMemo, useState } from 'react';
import { LuCircle, LuCircleCheck } from 'react-icons/lu';
import { CopyButton, Field, Seg } from '../../components/ui';
import { checkQuestion } from '../../lib/guide';
import { Link } from '../../lib/router';
import { ToolHead } from './ToolsIndex';

type Kind = 'describe' | 'compare' | 'relate';

const FINER = [
  { id: 'f', label: 'Feasible', q: 'Can you reach these people or this data, in the time you have?' },
  { id: 'i', label: 'Interesting', q: 'Would someone besides you want the answer?' },
  { id: 'n', label: 'Novel', q: 'Is it new for this place, group or method, even in a small way?' },
  { id: 'e', label: 'Ethical', q: 'Can you do it without harming anyone, with consent where needed?' },
  { id: 'r', label: 'Relevant', q: 'Could the answer change a decision, practice or the next study?' },
];

export function QuestionBuilder() {
  const [topic, setTopic] = useState('air pollution and health');
  const [who, setWho] = useState('children under 12');
  const [where, setWhere] = useState('Lahore');
  const [when, setWhen] = useState('during the November–February smog season');
  const [outcome, setOutcome] = useState('hospital visits for asthma');
  const [kind, setKind] = useState<Kind>('relate');
  const [factor, setFactor] = useState('daily PM2.5 levels');
  const [groupB, setGroupB] = useState('children in Islamabad');
  const [finer, setFiner] = useState<Record<string, boolean>>({});
  const [own, setOwn] = useState('');

  const questions = useMemo(() => {
    const w = who.trim() || 'the people you study';
    const p = where.trim() ? ` in ${where.trim()}` : '';
    const t = when.trim() ? ` ${when.trim()}` : '';
    const o = outcome.trim() || 'the outcome';
    if (kind === 'describe')
      return [`What is the level of ${o} among ${w}${p}${t}?`, `How common is ${o} among ${w}${p}${t}, and how does it vary by age and gender?`];
    if (kind === 'compare')
      return [`How does ${o} among ${w}${p} compare with ${groupB.trim() || 'a comparison group'}${t}?`, `Is ${o} higher among ${w}${p} than among ${groupB.trim() || 'a comparison group'}${t}?`];
    const f = factor.trim() || 'the exposure';
    return [`Is ${f} associated with ${o} among ${w}${p}${t}?`, `How much does ${o} among ${w}${p} change for each increase in ${f}${t}?`];
  }, [who, where, when, outcome, kind, factor, groupB]);

  const checks = checkQuestion(own);
  const finerCount = Object.values(finer).filter(Boolean).length;

  return (
    <div className="wrap page">
      <ToolHead title="Research question builder" lede="Fill in the pieces and get a focused question you can actually answer. Then check it against FINER, the criteria researchers use to judge questions." />
      <div className="tool-layout">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <Field label="Your topic" htmlFor="qb-topic" hint="Just a starting point, for your own reference.">
            <input id="qb-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
          <div className="field">
            <span className="field-label">What kind of question?</span>
            <Seg
              label="Question type"
              value={kind}
              onChange={setKind}
              options={[
                { id: 'describe', label: 'Describe' },
                { id: 'compare', label: 'Compare groups' },
                { id: 'relate', label: 'Relate two things' },
              ]}
            />
            <span className="field-hint">
              {kind === 'describe' ? 'How common or how large is something?' : kind === 'compare' ? 'Is it different between two groups?' : 'Does one thing go with or change another?'}
            </span>
          </div>
          <div className="form-grid">
            <Field label="Who" htmlFor="qb-who">
              <input id="qb-who" className="input" value={who} onChange={(e) => setWho(e.target.value)} />
            </Field>
            <Field label="Where" htmlFor="qb-where">
              <input id="qb-where" className="input" value={where} onChange={(e) => setWhere(e.target.value)} />
            </Field>
          </div>
          <Field label="When" htmlFor="qb-when">
            <input id="qb-when" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
          <Field label="What you will measure (the outcome)" htmlFor="qb-out">
            <input id="qb-out" className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          </Field>
          {kind === 'relate' && (
            <Field label="The factor you think is related" htmlFor="qb-f">
              <input id="qb-f" className="input" value={factor} onChange={(e) => setFactor(e.target.value)} />
            </Field>
          )}
          {kind === 'compare' && (
            <Field label="The comparison group" htmlFor="qb-g">
              <input id="qb-g" className="input" value={groupB} onChange={(e) => setGroupB(e.target.value)} />
            </Field>
          )}
        </form>

        <div className="stack" style={{ ['--gap' as any]: '22px' }}>
          <div className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Your question</h2>
            {questions.map((q, i) => (
              <div key={i} className="panel stack" data-copy-scope style={{ ['--gap' as any]: '10px' }}>
                <p data-copy-target style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)', lineHeight: 1.35 }}>
                  {q}
                </p>
                <div className="cluster">
                  <CopyButton text={q} />
                  <Link className="btn btn-ghost btn-sm" to={`/search?q=${encodeURIComponent(q)}`}>
                    Find related projects
                  </Link>
                </div>
              </div>
            ))}
            {kind === 'relate' && <p className="small muted">An association isn’t proof of cause. To test cause you need a stronger design, such as an experiment or a natural experiment.</p>}
          </div>

          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3>Check it against FINER</h3>
            <ul className="checklist">
              {FINER.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className={finer[f.id] ? 'ok' : 'faint'}
                    onClick={() => setFiner((s) => ({ ...s, [f.id]: !s[f.id] }))}
                    aria-pressed={!!finer[f.id]}
                    aria-label={`${f.label}: ${finer[f.id] ? 'yes' : 'not yet'}`}
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'inline-flex' }}
                  >
                    {finer[f.id] ? <LuCircleCheck /> : <LuCircle />}
                  </button>
                  <span>
                    <strong>{f.label}.</strong> {f.q}
                  </span>
                </li>
              ))}
            </ul>
            <p className="small muted">
              {finerCount === 5 ? 'All five ticked. Next, search what’s already known on Google Scholar.' : `${finerCount} of 5. If it isn’t feasible, narrow the who, where or when.`}
            </p>
          </div>

          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3>Already have a question? Check it</h3>
            <label htmlFor="qb-own" className="sr-only">
              Your question
            </label>
            <textarea id="qb-own" className="textarea" style={{ minHeight: 80 }} value={own} onChange={(e) => setOwn(e.target.value)} placeholder="Paste your research question" />
            {own.trim() && (
              <ul className="checklist">
                {checks.map((c) => (
                  <li key={c.id}>
                    <span className={c.ok ? 'ok' : 'bad'}>{c.ok ? <LuCircleCheck /> : <LuCircle />}</span>
                    <span>
                      <strong>{c.label}.</strong> {c.ok ? '' : c.tip}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="small muted">
            Learn more in <Link to="/learn/scoping/company-question">Turn a company question into a research question</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
