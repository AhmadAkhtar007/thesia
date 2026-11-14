import { useEffect, useState } from 'react';
import { PageHead } from '../components/ui';
import { ALL_LESSONS } from '../data/academy';
import { AGGREGATOR_NOISE, CONFERENCES } from '../data/conferences';
import { COUNTRIES } from '../data/countries';
import { LABS } from '../data/labs';
import { PROGRAMS } from '../data/programs';
import { useApp } from '../lib/app';
import { FOUNDER, LIVE } from '../lib/config';
import { db } from '../lib/supabase';
import { Link } from '../lib/router';

export const SOURCES = [
  { id: 's1', text: 'Gallup Pakistan analysis of Pakistan Economic Survey 2025 enrolment data, reported by ProPakistani, 24 June 2026.', url: 'https://propakistani.pk/2026/06/24/university-enrolment-in-pakistan-drops-nearly-12/' },
  { id: 's2', text: 'Understanding challenges to medical and dental student research practices: a cross-sectional study of the public sector in Pakistan. PLOS ONE, 2023 (197 students, Khyber Pakhtunkhwa).', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10721035/' },
  { id: 's3', text: 'From Resource to Knowledge: Evaluating Pakistan’s Research and Innovation Ecosystem. ISSRA Insight, 2026.', url: 'https://www.issra.pk/insight/2026/from-resource-to-knowledge-evaluating-pakistans-research-and-innovation-ecosystem/insight.php' },
  { id: 's4', text: 'Survey of about 5,700 African scholars in The Next Generation of Scientists in Africa, reported by Times Higher Education, 2018.', url: 'https://www.timeshighereducation.com/news/half-academics-africa-receive-no-research-funding' },
  { id: 's5', text: 'Amano et al. (2023), The manifold costs of being a non-native English speaker in science, PLOS Biology. Survey of 908 environmental scientists.', url: 'https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3002184' },
  { id: 's6', text: 'Polygence complete guide 2026, Immerse Education.', url: 'https://www.immerse.education/knowledge-base/polygence-complete-guide-2026' },
  { id: 's7', text: `Conference listings for Pakistan on ${AGGREGATOR_NOISE.site}, checked ${AGGREGATOR_NOISE.checked}.`, url: 'https://conferenceindex.org/conferences/pakistan' },
];

const BARRIERS = [
  { label: 'Inadequate institutional support', pct: 53 },
  { label: 'Mentorship and training issues', pct: 51 },
  { label: 'Lack of research knowledge and skills', pct: 47 },
  { label: 'Time restrictions', pct: 40 },
  { label: 'Difficulty finding opportunities', pct: 38 },
  { label: 'Language issues in writing', pct: 14 },
];

const ANSWERS = [
  ['No one to learn from', 'Free Academy tracks with quizzes, live bootcamps, and projects led by researchers who mentor contributors.'],
  ['Can’t find opportunities', 'Searchable projects with defined roles, verified conferences, labs and fellowships in one place.'],
  ['No credit for the work', 'Every role uses the CRediT taxonomy, so contributions show on a public research passport.'],
  ['Predatory outlets', 'Only verified conferences are listed, and Legit Check screens invitations before students pay.'],
  ['Cost and geography', 'Free core features, fair pricing by country, scholarships, and remote projects across borders.'],
  ['Writing in a second language', 'Plain-language lessons, a type system chosen for legibility, and a guide that answers in the language you write in.'],
];

function Cite({ n }: { n: number }) {
  return (
    <sup>
      <a className="cite" href={`#s${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`s${n}`)?.scrollIntoView({ block: 'center' }); }}>
        [{n}]
      </a>
    </sup>
  );
}

export function Impact() {
  const { country } = useApp();
  const [stats, setStats] = useState<null | Record<string, number>>(null);
  useEffect(() => {
    if (LIVE) db.rpc('platform_stats', {}).then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="wrap page">
      <PageHead
        title="Why Thesia exists"
        lede="Talent for research is everywhere. Ways into research are not. Thesia gives any student a path from curiosity to a credited contribution, starting in Pakistan and built for every country."
      />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="facts">
          <div className="fact">
            <span className="fact-num">1.96M</span>
            <p>
              university students in Pakistan in 2024–25, down from 2.23 million in 2020–21.
              <Cite n={1} />
            </p>
          </div>
          <div className="fact">
            <span className="fact-num">0.16%</span>
            <p>
              of GDP spent on R&amp;D, with under 20% of university research used by industry and 93% of firms reporting no R&amp;D.
              <Cite n={3} />
            </p>
          </div>
          <div className="fact">
            <span className="fact-num">~{AGGREGATOR_NOISE.count}</span>
            <p>
              “international conferences” listed in {AGGREGATOR_NOISE.city} on a single day by one aggregator: the noise students wade through.
              <Cite n={7} />
            </p>
          </div>
          <div className="fact">
            <span className="fact-num">$2,895</span>
            <p>
              starting price of one-to-one research mentorship at a leading US programme, out of reach for most students worldwide.
              <Cite n={6} />
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <div className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2>What students say stops them</h2>
            <p className="muted small">
              Share of 197 medical and dental students in Khyber Pakhtunkhwa naming each barrier as major.
              <Cite n={2} />
            </p>
          </div>
          <figure className="stack" style={{ margin: 0, ['--gap' as any]: '10px', maxWidth: 720 }} aria-label="Bar chart of barriers to student research">
            {BARRIERS.map((b) => (
              <div key={b.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 15rem) minmax(0, 1fr) 3rem', gap: 12, alignItems: 'center' }}>
                <span className="small">{b.label}</span>
                <span style={{ height: 14, background: 'var(--sunk)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', inset: 0, width: `${b.pct}%`, background: b.pct >= 50 ? 'var(--ink)' : 'var(--ink-3)', borderRadius: 3 }} />
                </span>
                <span className="small tabular" style={{ fontWeight: 700, textAlign: 'right' }}>
                  {b.pct}%
                </span>
              </div>
            ))}
            <figcaption className="xsmall faint">A small regional sample; it matches what students across Pakistan describe, and it is why mentorship and opportunity-finding are the core of Thesia.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <h2 style={{ marginBottom: 24 }}>Around the world</h2>
        <div className="grid" style={{ ['--min' as any]: '260px' }}>
          <div className="card region-card">
            <span className="small faint">South Asia</span>
            <span className="stat">51%</span>
            <h3>Mentorship is the missing piece</h3>
            <p className="small muted">
              Students name mentorship and institutional support as top barriers.
              <Cite n={2} /> Thesia pairs every project role with a lead, and the Academy teaches the basics first.
            </p>
          </div>
          <div className="card region-card">
            <span className="small faint">Sub-Saharan Africa</span>
            <span className="stat">45%</span>
            <h3>of scholars had no research funding in three years</h3>
            <p className="small muted">
              Funding and mobility gaps hold careers back.
              <Cite n={4} /> Remote, cross-border projects and a grant-writing clinic let researchers collaborate without travel.
            </p>
          </div>
          <div className="card region-card">
            <span className="small faint">Non-native English speakers, everywhere</span>
            <span className="stat">2.5×</span>
            <h3>more rejections over the writing</h3>
            <p className="small muted">
              They are also asked 12.5 times as often to fix their English.
              <Cite n={5} /> Thesia uses plain language throughout and its guide answers in the language you write.
            </p>
          </div>
          <div className="card region-card">
            <span className="small faint">High-income countries</span>
            <span className="stat">$495+</span>
            <h3>for group mentorship, more for one-to-one</h3>
            <p className="small muted">
              Structured research experience is sold as a premium product.
              <Cite n={6} /> Thesia’s fair pricing charges the same share of income everywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <h2>How Thesia answers each barrier</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Barrier</th>
                  <th>What Thesia does</th>
                </tr>
              </thead>
              <tbody>
                {ANSWERS.map(([a, b]) => (
                  <tr key={a}>
                    <td style={{ fontWeight: 700 }}>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <h2>How Thesia sustains itself</h2>
          <div className="stack" style={{ maxWidth: 760 }}>
            <p className="muted">The core stays free for students. Revenue comes from people and organisations who get extra value:</p>
            <div className="grid" style={{ ['--min' as any]: '210px' }}>
              {[
                ['Scholar Pro', 'Unlimited applications, project leadership tools and unlimited guide use, from $8 a month before fair pricing.'],
                ['Live bootcamps', 'Paid cohorts from $79 to $249 list price, with country pricing and scholarships.'],
                ['Institutions', 'Annual licences for schools and universities, and the Young Researchers Programme.'],
                ['Industry challenges', 'Companies fund research questions answered by supervised student squads.'],
              ].map(([t, d]) => (
                <div key={t} className="card">
                  <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>{t}</h3>
                  <p className="small muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <div className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2>What we measure</h2>
            <p className="muted small">The beta succeeds if students get from sign-up to a real contribution.</p>
          </div>
          <div className="stack" style={{ maxWidth: 760 }}>
            {stats ? (
              <div className="answer-strip">
                {[
                  ['researchers', stats.researchers],
                  ['projects posted', stats.projects],
                  ['applications', stats.applications],
                  ['lessons completed', stats.lessons_completed],
                  ['countries', stats.countries],
                ].map(([l, n]) => (
                  <a key={String(l)} href="#" onClick={(e) => e.preventDefault()}>
                    <b className="tabular">{n}</b>
                    <span>{l}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="answer-strip">
                {[
                  [CONFERENCES.length, 'verified conferences'],
                  [LABS.length, 'labs listed'],
                  [PROGRAMS.length, 'programmes'],
                  [ALL_LESSONS.length, 'lessons'],
                  [COUNTRIES.length, 'countries supported'],
                ].map(([n, l]) => (
                  <a key={String(l)} href="#" onClick={(e) => e.preventDefault()}>
                    <b className="tabular">{n}</b>
                    <span>{l}</span>
                  </a>
                ))}
              </div>
            )}
            <ul className="feature-list">
              {[
                'Activation: share of new students who complete a lesson or apply to a project in their first week',
                'Placement: share of open roles filled within 30 days',
                'Proof: students with a confirmed contribution on their passport within 90 days',
                'Reach: universities, cities and countries represented, and the share of women participants',
                'Revenue: paid bootcamp seats, Pro subscribers and institutional licences',
              ].map((t) => (
                <li key={t}>
                  <span aria-hidden="true">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <h2>Contribution to the Sustainable Development Goals</h2>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>SDG 4, Quality education</td>
                  <td>Free, practical research skills for students from school to master’s level.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>SDG 5, Gender equality</td>
                  <td>Remote roles open research to women who can’t travel or relocate; we track participation by gender.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>SDG 9, Industry, innovation and infrastructure</td>
                  <td>More students contributing to research, and industry challenges that link universities to firms.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>SDG 10, Reduced inequalities</td>
                  <td>Fair pricing by country and scholarships, so cost doesn’t decide who gets research experience.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <h2>Roadmap</h2>
          <ol className="next-steps" style={{ maxWidth: 760 }}>
            {[
              ['Now', 'Pakistan beta: verified listings, Academy, tools, guide and sample projects.', true],
              ['Early 2027', 'First paid bootcamp cohorts, ten institutional partners, and Scholar Pro.', false],
              ['Mid 2027', 'Country leads verify listings for Bangladesh, Nigeria and Kenya.', false],
              ['2028', 'Open country onboarding worldwide, with partner universities on every continent.', false],
            ].map(([when, what, done]) => (
              <li key={String(when)} className={done ? 'is-done' : ''}>
                <span className="small" style={{ fontWeight: 700, gridColumn: 'span 1' }}>
                  {when}
                </span>
                <span>{what}</span>
                <span />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="split" style={{ gap: 40 }}>
          <h2>Who builds it</h2>
          <div className="stack" style={{ maxWidth: 760 }}>
            <p>
              Thesia is founded by <strong>{FOUNDER}</strong>, an Economics and Mathematics student at LUMS and a developer who has built student communities and tools, including The A* Club, and leads research work at student organisations in Lahore.
            </p>
            <p className="muted">
              We’re looking for country leads, bootcamp faculty and campus ambassadors. <Link to="/institutions#ambassadors">Join us</Link>. Viewing from {country}? <Link to="/conferences">Tell us what to list next</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 style={{ fontSize: 'var(--t-xl)', marginBottom: 16 }}>Sources</h2>
        <ol className="source-list">
          {SOURCES.map((s) => (
            <li key={s.id} id={s.id} style={{ scrollMarginTop: 120 }}>
              {s.text}{' '}
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.url.replace(/^https?:\/\//, '').slice(0, 70)}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
