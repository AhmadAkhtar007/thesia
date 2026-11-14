import { useMemo, useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuExternalLink } from 'react-icons/lu';
import { Seg } from '../../components/ui';
import { AGGREGATOR_NOISE } from '../../data/conferences';
import { Link } from '../../lib/router';
import { ToolHead } from './ToolsIndex';

type Kind = 'journal' | 'conference';
type Flag = { id: string; text: string; weight: number; kinds: Kind[] };

const FLAGS: Flag[] = [
  { id: 'unsolicited', text: 'The invitation arrived unsolicited, flattering you or addressing you generically (“Dear esteemed researcher”).', weight: 2, kinds: ['journal', 'conference'] },
  { id: 'fast', text: 'It promises acceptance, peer review or publication within days or two weeks.', weight: 3, kinds: ['journal', 'conference'] },
  { id: 'scope', text: 'The scope is extremely broad (“all fields”, “science, engineering, management and humanities”).', weight: 2, kinds: ['journal', 'conference'] },
  { id: 'fees', text: 'Fees are unclear, hidden, or only mentioned after acceptance.', weight: 3, kinds: ['journal', 'conference'] },
  { id: 'metrics', text: 'It advertises an “impact factor” that isn’t from Clarivate, or invented metrics (“Global Impact Factor”, “Universal IF”).', weight: 3, kinds: ['journal', 'conference'] },
  { id: 'board', text: 'Editorial board or committee members don’t mention it on their own university pages, or can’t be found.', weight: 3, kinds: ['journal', 'conference'] },
  { id: 'contact', text: 'Contact is only a free email address (Gmail, Yahoo) or a form, with no physical institution.', weight: 2, kinds: ['journal', 'conference'] },
  { id: 'mimic', text: 'The name closely copies a well-known journal or conference.', weight: 3, kinds: ['journal', 'conference'] },
  { id: 'index', text: 'It isn’t listed where it claims (Scopus, Web of Science, DOAJ for open-access, or HJRS in Pakistan).', weight: 3, kinds: ['journal'] },
  { id: 'issn', text: 'No ISSN, or the ISSN belongs to a different journal.', weight: 2, kinds: ['journal'] },
  { id: 'many', text: 'The organiser runs many unrelated conferences at the same hotel on the same dates.', weight: 3, kinds: ['conference'] },
  { id: 'nohost', text: 'There is no university, learned society or professional body hosting it.', weight: 3, kinds: ['conference'] },
  { id: 'noproceedings', text: 'You can’t find proceedings or programmes from previous editions.', weight: 2, kinds: ['conference'] },
  { id: 'sponsor', text: 'It claims IEEE, Springer or Scopus backing that you can’t confirm on their own sites.', weight: 3, kinds: ['conference'] },
];

const GOOD: { id: string; text: string; kinds: Kind[] }[] = [
  { id: 'peers', text: 'Researchers you trust have published or presented there.', kinds: ['journal', 'conference'] },
  { id: 'recent', text: 'You read recent papers or talks from it and they look solid.', kinds: ['journal', 'conference'] },
  { id: 'listed', text: 'You confirmed the listing on the indexing site itself, not just its homepage.', kinds: ['journal', 'conference'] },
];

const PHRASES: [RegExp, string][] = [
  [/esteemed|eminent|respected (author|researcher|professor)|dear (author|researcher|scholar)/i, 'Flattering or generic greeting'],
  [/(publish|publication|review|acceptance)[^.]{0,40}(24|48|72) ?h|within (\d|one|two|three|seven|a) (day|days|week|weeks)|fast[- ]?track|rapid publication/i, 'Promise of very fast review or publication'],
  [/impact factor|global impact|universal impact|index copernicus|citefactor/i, 'Advertised impact metric (check where it comes from)'],
  [/all (fields|disciplines|areas)|multidisciplinary|engineering,? (science|management)/i, 'Very broad scope'],
  [/@(gmail|yahoo|hotmail|outlook)\./i, 'Free email address as contact'],
  [/kindly|honou?rable|we are pleased to invite you|call for papers.*(volume|issue)/i, 'Common phrasing in mass invitations'],
  [/(apc|article processing|publication fee|registration fee)[^.]{0,30}(\$|usd|pkr)\s?\d/i, 'Fee mentioned in the invitation'],
  [/(scopus|web of science|ieee|springer)[^.]{0,20}(indexed|index|proceedings)/i, 'Indexing claim (verify it on the indexer’s own site)'],
];

export function LegitCheck() {
  const [kind, setKind] = useState<Kind>('journal');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [good, setGood] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');

  const flags = FLAGS.filter((f) => f.kinds.includes(kind));
  const goods = GOOD.filter((g) => g.kinds.includes(kind));
  const detected = useMemo(() => PHRASES.filter(([re]) => re.test(text)).map(([, label]) => label), [text]);

  const { score, level } = useMemo(() => {
    const maxScore = flags.reduce((n, f) => n + f.weight, 0);
    let s = flags.reduce((n, f) => n + (checked[f.id] ? f.weight : 0), 0);
    s += detected.length * 1.5;
    s -= goods.filter((g) => good[g.id]).length * 2;
    const pct = Math.max(0, Math.min(100, Math.round((s / (maxScore * 0.45)) * 100)));
    return { score: pct, level: pct >= 45 ? 'High' : pct >= 18 ? 'Medium' : 'Low' };
  }, [flags, goods, checked, good, detected]);

  const color = level === 'High' ? 'var(--margin)' : level === 'Medium' ? 'var(--ink-2)' : 'var(--leaf)';
  const circ = 2 * Math.PI * 40;

  return (
    <div className="wrap page">
      <ToolHead
        title="Legit Check"
        lede="Predatory journals and conferences take fees without real peer review. Answer a few questions, or paste the invitation, and get a risk reading with the checks to run next."
      />
      <div className="tool-layout">
        <div className="stack" style={{ ['--gap' as any]: '22px' }}>
          <Seg
            label="What are you checking?"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setChecked({});
            }}
            options={[
              { id: 'journal', label: 'A journal' },
              { id: 'conference', label: 'A conference' },
            ]}
          />
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, ['--gap' as any]: '10px' }}>
            <legend className="field-label" style={{ marginBottom: 6 }}>
              Warning signs you noticed
            </legend>
            {flags.map((f) => (
              <label key={f.id} className="check">
                <input type="checkbox" checked={!!checked[f.id]} onChange={(e) => setChecked((s) => ({ ...s, [f.id]: e.target.checked }))} />
                {f.text}
              </label>
            ))}
          </fieldset>
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, ['--gap' as any]: '10px' }}>
            <legend className="field-label" style={{ marginBottom: 6 }}>
              Reassuring signs
            </legend>
            {goods.map((g) => (
              <label key={g.id} className="check">
                <input type="checkbox" checked={!!good[g.id]} onChange={(e) => setGood((s) => ({ ...s, [g.id]: e.target.checked }))} />
                {g.text}
              </label>
            ))}
          </fieldset>
          <div className="field">
            <label className="field-label" htmlFor="lc-text">
              Paste the invitation (optional)
            </label>
            <textarea id="lc-text" className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the email or call for papers. It stays in your browser." />
            {text.trim() && (
              <span className="field-hint">{detected.length ? `Found ${detected.length} pattern${detected.length > 1 ? 's' : ''} common in predatory invitations.` : 'No common warning phrases found. That alone doesn’t make it safe.'}</span>
            )}
          </div>
        </div>

        <div className="stack" style={{ ['--gap' as any]: '20px' }}>
          <div className="panel stack" aria-live="polite">
            <div className="score-dial">
              <svg viewBox="0 0 100 100" role="img" aria-label={`Risk ${level}, ${score} out of 100`}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--sunk)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${(score / 100) * circ} ${circ}`} transform="rotate(-90 50 50)" strokeLinecap="round" />
                <text x="50" y="56" textAnchor="middle" style={{ font: '700 20px var(--font-body)', fill: 'var(--ink)' }}>
                  {score}
                </text>
              </svg>
              <div className="stack" style={{ ['--gap' as any]: '4px' }}>
                <span className="small faint">Risk reading</span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-xl)', color }}>{level} risk</strong>
                <span className="small muted">
                  {level === 'High' ? 'Don’t pay or submit until you’ve verified it independently.' : level === 'Medium' ? 'Some warning signs. Run the checks below before deciding.' : 'Few warning signs so far. Still run the checks below.'}
                </span>
              </div>
            </div>
            {detected.length > 0 && (
              <ul className="checklist">
                {detected.map((d) => (
                  <li key={d}>
                    <span className="bad">
                      <LuCircleAlert />
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel stack" style={{ ['--gap' as any]: '12px' }}>
            <h3>Checks to run next</h3>
            <ul className="checklist">
              {(kind === 'journal'
                ? [
                    ['Search the exact title in DOAJ (for open-access journals).', 'https://doaj.org/search/journals'],
                    ['Look it up in the Scopus source list.', 'https://www.scopus.com/sources'],
                    ['In Pakistan, check its category in HEC’s Journal Recognition System (HJRS).', 'https://hjrs.hec.gov.pk'],
                    ['Work through the Think. Check. Submit. checklist.', 'https://thinkchecksubmit.org'],
                  ]
                : [
                    ['Confirm the host university or society lists the conference on its own site.', ''],
                    ['If it claims IEEE sponsorship, find it in IEEE’s conference search.', 'https://conferences.ieee.org/conferences_events/conferences/search'],
                    ['Look for programmes or proceedings from previous years.', 'https://scholar.google.com'],
                    ['Check the Thesia conference list, which only includes verified events.', '/conferences'],
                  ]
              ).map(([t, href]) => (
                <li key={t}>
                  <span className="ok">
                    <LuCircleCheck />
                  </span>
                  <span>
                    {t}{' '}
                    {href &&
                      (href.startsWith('/') ? (
                        <Link to={href}>Open</Link>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer noopener">
                          Open <LuExternalLink style={{ verticalAlign: '-2px' }} />
                        </a>
                      ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {kind === 'conference' && (
            <p className="small muted">
              For scale: one aggregator lists about {AGGREGATOR_NOISE.count} “international conferences” in {AGGREGATOR_NOISE.city} on {AGGREGATOR_NOISE.date}. Real conferences don’t cluster like that.
            </p>
          )}
          <p className="xsmall faint">This is a screening aid, not a verdict. Legitimate outlets can show one or two of these signs, and new predatory tactics appear all the time.</p>
        </div>
      </div>
    </div>
  );
}
