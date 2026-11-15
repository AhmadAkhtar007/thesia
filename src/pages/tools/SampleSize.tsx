import { useMemo, useState } from 'react';
import { Field, Seg } from '../../components/ui';
import { Link } from '../../lib/router';
import { ToolHead } from './ToolsIndex';

const Z: Record<string, number> = { '90': 1.645, '95': 1.96, '99': 2.576 };

/** Required sample for estimating a proportion, before corrections. */
export function nProportion(z: number, p: number, e: number) {
  return (z * z * p * (1 - p)) / (e * e);
}
export function nMean(z: number, sd: number, e: number) {
  return Math.pow((z * sd) / e, 2);
}
export function finiteCorrection(n0: number, N: number) {
  return N > 0 ? n0 / (1 + (n0 - 1) / N) : n0;
}

export function SampleSize() {
  const [mode, setMode] = useState<'prop' | 'mean'>('prop');
  const [conf, setConf] = useState<'90' | '95' | '99'>('95');
  const [margin, setMargin] = useState(5);
  const [p, setP] = useState(50);
  const [sd, setSd] = useState(10);
  const [meanMargin, setMeanMargin] = useState(2);
  const [N, setN] = useState<number | ''>('');
  const [deff, setDeff] = useState(1);
  const [rr, setRr] = useState(70);

  const z = Z[conf];
  const r = useMemo(() => {
    const valid = mode === 'prop' ? margin > 0 && p > 0 && p < 100 : sd > 0 && meanMargin > 0;
    if (!valid) return null;
    const n0 = mode === 'prop' ? nProportion(z, p / 100, margin / 100) : nMean(z, sd, meanMargin);
    const n1 = finiteCorrection(n0, Number(N) || 0);
    const n2 = n1 * Math.max(1, deff);
    const complete = Math.ceil(n2);
    const invite = Math.ceil(complete / Math.max(0.05, rr / 100));
    return { n0, n1, n2, complete, invite };
  }, [mode, z, margin, p, sd, meanMargin, N, deff, rr]);

  const table = [3, 5, 7, 10].map((m) => ({ m, n: Math.ceil(finiteCorrection(nProportion(z, p / 100, m / 100), Number(N) || 0) * Math.max(1, deff)) }));

  return (
    <div className="wrap page">
      <ToolHead title="Sample size calculator" lede="How many completed responses do you need? Choose what you’re estimating, set your confidence and margin of error, and adjust for your population and response rate." />
      <div className="tool-layout">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <span className="field-label">What are you estimating?</span>
            <Seg
              label="Estimate"
              value={mode}
              onChange={setMode}
              options={[
                { id: 'prop', label: 'A percentage' },
                { id: 'mean', label: 'An average' },
              ]}
            />
            <span className="field-hint">{mode === 'prop' ? 'For example, the share of riders who report heat symptoms.' : 'For example, average weekly study hours.'}</span>
          </div>
          <div className="field">
            <span className="field-label">Confidence level</span>
            <Seg
              label="Confidence"
              value={conf}
              onChange={setConf}
              options={[
                { id: '90', label: '90%' },
                { id: '95', label: '95%' },
                { id: '99', label: '99%' },
              ]}
            />
          </div>
          {mode === 'prop' ? (
            <div className="form-grid">
              <Field label="Margin of error (± percentage points)" htmlFor="ss-m">
                <input id="ss-m" className="input" type="number" min={0.5} max={30} step={0.5} value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
              </Field>
              <Field label="Expected percentage" htmlFor="ss-p" hint="Use 50 if you don’t know; it gives the safest number.">
                <input id="ss-p" className="input" type="number" min={1} max={99} value={p} onChange={(e) => setP(Number(e.target.value))} />
              </Field>
            </div>
          ) : (
            <div className="form-grid">
              <Field label="Expected standard deviation" htmlFor="ss-sd" hint="From a pilot or a similar study.">
                <input id="ss-sd" className="input" type="number" min={0.01} step="any" value={sd} onChange={(e) => setSd(Number(e.target.value))} />
              </Field>
              <Field label="Margin of error (same units)" htmlFor="ss-mm">
                <input id="ss-mm" className="input" type="number" min={0.01} step="any" value={meanMargin} onChange={(e) => setMeanMargin(Number(e.target.value))} />
              </Field>
            </div>
          )}
          <div className="form-grid">
            <Field label="Population size (optional)" htmlFor="ss-N" hint="Only matters if it’s small, say under 20,000.">
              <input id="ss-N" className="input" type="number" min={0} value={N} onChange={(e) => setN(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 1200 students" />
            </Field>
            <Field label="Design effect" htmlFor="ss-d" hint="1 for simple random sampling. 1.5 to 2 if you sample in clusters, such as schools.">
              <input id="ss-d" className="input" type="number" min={1} max={5} step={0.1} value={deff} onChange={(e) => setDeff(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Expected response rate (%)" htmlFor="ss-rr" hint="Online surveys often get 20–40%; face-to-face often 70% or more.">
            <input id="ss-rr" className="input" type="number" min={5} max={100} value={rr} onChange={(e) => setRr(Number(e.target.value))} />
          </Field>
        </form>

        <div className="stack" style={{ ['--gap' as any]: '20px' }} aria-live="polite">
          {r ? (
            <div className="panel stack">
              <div className="form-grid" style={{ gap: 20 }}>
                <div className="stack" style={{ ['--gap' as any]: '4px' }}>
                  <span className="small faint">Completed responses needed</span>
                  <span className="big-number tabular">{r.complete.toLocaleString()}</span>
                </div>
                <div className="stack" style={{ ['--gap' as any]: '4px' }}>
                  <span className="small faint">People to invite at {rr}% response</span>
                  <span className="big-number tabular" style={{ color: 'var(--ink-2)' }}>
                    {r.invite.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="output-sheet mono" style={{ minHeight: 0 }}>
                {mode === 'prop'
                  ? `n₀ = z² × p(1 − p) / e²\n   = ${z}² × ${(p / 100).toFixed(2)} × ${(1 - p / 100).toFixed(2)} / ${(margin / 100).toFixed(3)}²\n   = ${r.n0.toFixed(1)}`
                  : `n₀ = (z × σ / E)²\n   = (${z} × ${sd} / ${meanMargin})²\n   = ${r.n0.toFixed(1)}`}
                {N ? `\nFinite population (N = ${N}): ${r.n1.toFixed(1)}` : ''}
                {deff > 1 ? `\nDesign effect × ${deff}: ${r.n2.toFixed(1)}` : ''}
                {`\nRounded up: ${r.complete}`}
              </div>
            </div>
          ) : (
            <p className="callout callout-margin">Check the numbers: the margin must be above zero and the expected percentage between 1 and 99.</p>
          )}
          {mode === 'prop' && (
            <div className="stack" style={{ ['--gap' as any]: '8px' }}>
              <h3>Trade-off: precision against effort</h3>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Margin of error</th>
                      <th>Completed responses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((t) => (
                      <tr key={t.m} style={t.m === margin ? { background: 'var(--highlight-soft)' } : undefined}>
                        <td>±{t.m} points</td>
                        <td className="tabular">{t.n.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="small muted">
            Comparing groups or testing a hypothesis needs a power calculation instead. For interviews, plan for saturation, often 12 to 30 for a focused question. See{' '}
            <Link to="/learn/fieldwork/sampling">Sampling and sample size without guesswork</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
