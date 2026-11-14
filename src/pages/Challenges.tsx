import { LuCheck, LuClock, LuMapPin, LuUsers } from 'react-icons/lu';
import { PageHead, SamplePill } from '../components/ui';
import { SAMPLE_CHALLENGES } from '../data/samples';
import { COUNTRIES } from '../data/countries';
import { fieldLabel } from '../lib/types';
import { SubmitForm } from './Institutions';

const STEPS = [
  ['You bring a real question', 'Something your business needs answered, such as why customers leave, where costs leak or how a product might land. We help you scope it in one call.'],
  ['We build a supervised squad', 'Three or four students chosen from Thesia applicants, with a faculty supervisor who checks methods and ethics.'],
  ['Eight to ten weeks of research', 'Interviews, surveys, data analysis or field visits, with a check-in every two weeks and your data handled under a signed agreement.'],
  ['You get a report and a briefing', 'A written report with the evidence, plus a live presentation to your team. You keep the findings; students keep the credit on their passports.'],
];

export function Challenges() {
  return (
    <div className="wrap page">
      <PageHead
        title="Industry research challenges"
        lede="Companies post a real question. A supervised student squad answers it in eight to ten weeks. Firms get evidence they can act on, and students get paid, credited research experience."
      />

      <section className="section" style={{ paddingTop: 0 }}>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="step">
              <span className="step-num">{i + 1}</span>
              <div className="stack" style={{ ['--gap' as any]: '4px' }}>
                <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>{t}</h3>
                <p className="small muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section stack" style={{ ['--gap' as any]: '14px' }}>
        <div className="cluster" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--t-2xl)' }}>What challenges look like</h2>
          <span className="small faint">Examples for the beta. Real challenges are listed here once a company signs.</span>
        </div>
        <div className="ledger">
          {SAMPLE_CHALLENGES.map((c) => (
            <article key={c.id} className="ledger-row">
              <div className="stack min0" style={{ ['--gap' as any]: '8px' }}>
                <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
                  <SamplePill />
                  <span className={`pill ${c.status === 'open' ? 'pill-open' : 'pill-neutral'}`}>{c.status === 'open' ? 'Recruiting squad' : 'Being scoped'}</span>
                  <span className="small faint">{c.sponsor}</span>
                </div>
                <h3>{c.title}</h3>
                <p className="muted">{c.question}</p>
                <p className="small">
                  <strong>Deliverable:</strong> {c.deliverable}
                </p>
                <div className="ledger-meta small muted">
                  <span>
                    <LuMapPin aria-hidden="true" /> {c.city}
                  </span>
                  <span>
                    <LuClock aria-hidden="true" /> {c.weeks} weeks
                  </span>
                  <span>
                    <LuUsers aria-hidden="true" /> {c.squad}
                  </span>
                </div>
                <div className="tag-row">
                  {c.fields.map((f) => (
                    <span key={f} className="tag">
                      {fieldLabel(f)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ledger-side">
                <span className="small" style={{ maxWidth: 220 }}>
                  {c.reward}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="post" className="section" style={{ scrollMarginTop: 80 }}>
        <div className="split" style={{ gap: 40 }}>
          <div className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-2xl)' }}>Post a challenge</h2>
            <ul className="feature-list">
              {['Scoping call within three working days', 'Data-sharing and confidentiality agreement before work starts', 'You fund a prize pool, stipends or scholarship seats'].map((t) => (
                <li key={t}>
                  <LuCheck aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ maxWidth: 760 }}>
            <SubmitForm
              kind="challenge"
              cta="Send your challenge"
              done="Thanks. We’ll set up a scoping call within three working days."
              fields={[
                { id: 'name', label: 'Your name', required: true },
                { id: 'email', label: 'Work email', type: 'email', required: true },
                { id: 'company', label: 'Company', required: true },
                { id: 'city', label: 'City' },
                { id: 'country', label: 'Country', type: 'select', options: COUNTRIES.map((c) => c.name) },
                { id: 'budget', label: 'Budget you have in mind', type: 'select', options: ['Under PKR 100,000', 'PKR 100,000–300,000', 'PKR 300,000–1,000,000', 'Over PKR 1,000,000', 'Not sure yet'] },
                { id: 'question', label: 'The question you need answered', type: 'textarea', required: true },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="join" className="section" style={{ scrollMarginTop: 80 }}>
        <div className="split" style={{ gap: 40 }}>
          <div className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-2xl)' }}>Join a squad</h2>
            <p className="muted small">Undergraduate and master’s students. We pick squads for skills and commitment, and favour people with a finished research passport.</p>
          </div>
          <div style={{ maxWidth: 760 }}>
            <SubmitForm
              kind="challenge-interest"
              cta="Tell me when squads open"
              done="You’re on the list. We’ll email you when a challenge in your field is recruiting."
              fields={[
                { id: 'name', label: 'Your name', required: true },
                { id: 'email', label: 'Email', type: 'email', required: true },
                { id: 'university', label: 'University', required: true },
                { id: 'skills', label: 'Skills you’d bring', hint: 'For example: interviews, Excel, Python, Urdu transcription.' },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
