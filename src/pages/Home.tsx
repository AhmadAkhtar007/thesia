import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Atlas, TOPICS } from '../components/Atlas';
import { BootcampCard, ConferenceRow, ProjectRow } from '../components/rows';
import { ALL_LESSONS } from '../data/academy';
import { BOOTCAMPS } from '../data/bootcamps';
import { CONFERENCES, conferenceStatus } from '../data/conferences';
import { LABS } from '../data/labs';
import { PROGRAMS } from '../data/programs';
import { useApp } from '../lib/app';
import { parseQuery, projectFit, rankConferences, rankLabs, rankLessons, rankPeople, rankProjects } from '../lib/match';
import { Link, useNavigate } from '../lib/router';
import { usePeople, useProjects } from '../lib/useData';

export function Home() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { people } = usePeople();
  const { profile, user } = useApp();
  const open = projects.filter((p) => p.status === 'open');

  const counts = useMemo(() => {
    const query = parseQuery(q);
    if (!query.tokens.length) {
      return [
        { n: open.length, label: 'open projects', to: '/projects' },
        { n: people.length, label: 'researchers', to: '/people' },
        { n: LABS.length, label: 'labs in Pakistan', to: '/labs' },
        { n: CONFERENCES.length, label: 'verified conferences', to: '/conferences' },
        { n: ALL_LESSONS.length, label: 'free lessons', to: '/learn' },
      ];
    }
    const s = `/search?q=${encodeURIComponent(q)}`;
    return [
      { n: rankProjects(open, query).length, label: 'projects', to: s + '#projects' },
      { n: rankPeople(people, query).length, label: 'people', to: s + '#people' },
      { n: rankLabs(LABS, query).length, label: 'labs', to: s + '#labs' },
      { n: rankConferences(CONFERENCES, query).length, label: 'conferences', to: s + '#conferences' },
      { n: rankLessons(ALL_LESSONS, query).length, label: 'lessons', to: s + '#lessons' },
    ];
  }, [q, open, people]);

  const featured = useMemo(() => {
    if (profile?.onboarded) {
      return [...open]
        .map((p) => ({ p, fit: projectFit(p, profile)?.score || 0 }))
        .sort((a, b) => b.fit - a.fit)
        .slice(0, 5)
        .map((x) => x.p);
    }
    return open.slice(0, 5);
  }, [open, profile]);

  const deadlines = useMemo(
    () =>
      CONFERENCES.filter((c) => ['open', 'closing', 'upcoming'].includes(conferenceStatus(c)))
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 4),
    []
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>Find the people working on your question.</h1>
            <p className="lede">
              Thesia connects students with real research projects, mentors, labs and conferences, and teaches the methods as you go. Free to start, from high school to master’s, in any country.
            </p>
            <form className="ask" onSubmit={submit} role="search">
              <label htmlFor="hero-q" className="sr-only">
                What do you want to research?
              </label>
              <div className="ask-box">
                <input
                  id="hero-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="What do you want to research?"
                  autoComplete="off"
                />
                <button className="btn btn-primary" type="submit" aria-label="Search Thesia">
                  <LuSearch /> <span className="hide-sm">Search</span>
                </button>
              </div>
              <div className="suggestions">
                <span>Try</span>
                {TOPICS.slice(0, 3).map((t) => (
                  <button type="button" key={t.id} aria-pressed={q === t.question} onClick={() => setQ(t.question)}>
                    {t.question}
                  </button>
                ))}
              </div>
            </form>
            <nav className="answer-strip" aria-label={q ? 'Matches for your question' : 'What’s on Thesia'}>
              {counts.map((c) => (
                <Link key={c.label} to={c.to}>
                  <b className="tabular">{c.n}</b>
                  <span>{c.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <Atlas query={q} onPick={(t) => setQ(t.question)} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>From curious to credited</h2>
              <p>Three steps most students take on Thesia. You can start at any of them.</p>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Learn the method</h3>
              <p>Free Academy lessons on asking a research question, reading papers, sampling, ethics and statistics, each with a short quiz.</p>
              <Link to="/learn" className="small">
                Open the Academy
              </Link>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>Join a real project</h3>
              <p>Apply for a defined role on a project led by a researcher, lab or student. Every role uses the CRediT roles journals use.</p>
              <Link to="/projects" className="small">
                Browse open projects
              </Link>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Show your proof</h3>
              <p>Your research passport records what you contributed, with links to the data, code, poster or paper. One link for every application.</p>
              <Link to={user ? '/dashboard' : '/signup'} className="small">
                {user ? 'Go to your passport' : 'Create your passport'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{profile?.onboarded ? 'Projects that fit you' : 'Open projects'}</h2>
              <p>
                {profile?.onboarded
                  ? 'Ranked by your fields, level, city and skills.'
                  : 'Posted by researchers, labs and student leads. Remote roles are open to students anywhere.'}
              </p>
            </div>
            <Link to="/projects" className="btn btn-secondary">
              All projects
            </Link>
          </div>
          <div className="ledger">
            {featured.map((p) => (
              <ProjectRow key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Coming up in Pakistan</h2>
              <p>Every conference is checked against its official site. No conference-mill listings.</p>
            </div>
            <Link to="/conferences" className="btn btn-secondary">
              All conferences
            </Link>
          </div>
          <div className="ledger">
            {deadlines.map((c) => (
              <ConferenceRow key={c.id} c={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Live bootcamps</h2>
              <p>Small cohorts, real deliverables. Prices adjust to your country, and scholarships cover students who can’t pay.</p>
            </div>
            <Link to="/bootcamps" className="btn btn-secondary">
              All bootcamps
            </Link>
          </div>
          <div className="grid" style={{ ['--min' as any]: '300px' }}>
            {BOOTCAMPS.slice(0, 3).map((b) => (
              <BootcampCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Why this matters</h2>
              <p>Talent is everywhere. The ways into research are not.</p>
            </div>
            <Link to="/impact" className="btn btn-secondary">
              Read the case
            </Link>
          </div>
          <div className="facts">
            <div className="fact">
              <span className="fact-num">51%</span>
              <p>
                of medical and dental students surveyed in Khyber Pakhtunkhwa named mentorship and training as a major barrier to doing research.
                <sup>
                  <Link to="/impact#s2">2</Link>
                </sup>
              </p>
            </div>
            <div className="fact">
              <span className="fact-num">0.16%</span>
              <p>
                of Pakistan’s GDP goes to research and development, and less than a fifth of university research is used by industry.
                <sup>
                  <Link to="/impact#s3">3</Link>
                </sup>
              </p>
            </div>
            <div className="fact">
              <span className="fact-num">2.5×</span>
              <p>
                as often, papers by non-native English speakers are rejected because of the writing, in a study of 908 scientists.
                <sup>
                  <Link to="/impact#s5">5</Link>
                </sup>
              </p>
            </div>
            <div className="fact">
              <span className="fact-num">$2,895</span>
              <p>
                is the starting price of one-to-one research mentorship at a leading US programme. Thesia’s Academy is free.
                <sup>
                  <Link to="/impact#s6">6</Link>
                </sup>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="audience">
            <div className="stack">
              <h3>For students</h3>
              <p className="muted">Learn methods for free, join projects that match your level, and build a passport that shows what you did.</p>
              <div>
                <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary">
                  {user ? 'Open your dashboard' : 'Join free'}
                </Link>
              </div>
            </div>
            <div className="stack">
              <h3>For researchers and labs</h3>
              <p className="muted">Post a project with defined roles and find motivated students from any university, in any city.</p>
              <div>
                <Link to="/projects/new" className="btn btn-secondary">
                  Post a project
                </Link>
              </div>
            </div>
            <div className="stack">
              <h3>For schools, universities and companies</h3>
              <p className="muted">Run research programmes for your students, recruit research assistants, or fund an industry challenge.</p>
              <div>
                <Link to="/institutions" className="btn btn-secondary">
                  Work with us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="quote-band">
            <h2>Your first research contribution is closer than you think.</h2>
            <p>
              {PROGRAMS.length} fellowships and programmes, {LABS.length} labs, {ALL_LESSONS.length} lessons and a research guide that answers in plain language. All free to start.
            </p>
            <div className="cluster">
              <Link to={user ? '/dashboard' : '/signup'} className="btn btn-mark btn-lg">
                {user ? 'Continue where you left off' : 'Create your free account'}
              </Link>
              <Link to="/guide" className="btn btn-secondary btn-lg">
                Ask the research guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
