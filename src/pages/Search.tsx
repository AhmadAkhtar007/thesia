import { useEffect, useMemo, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { ConferenceRow, Highlighted, PersonCard, ProjectRow } from '../components/rows';
import { Empty, PageHead } from '../components/ui';
import { ALL_LESSONS } from '../data/academy';
import { BOOTCAMPS } from '../data/bootcamps';
import { CONFERENCES } from '../data/conferences';
import { LABS } from '../data/labs';
import { PROGRAMS, FUNDING_LABEL } from '../data/programs';
import { parseQuery, rankBootcamps, rankConferences, rankLabs, rankLessons, rankPeople, rankPrograms, rankProjects } from '../lib/match';
import { Link, useQueryState } from '../lib/router';
import { usePeople, useProjects } from '../lib/useData';

export function Search() {
  const [params, setParams] = useQueryState();
  const q = params.get('q') || '';
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  const { projects } = useProjects();
  const { people } = usePeople();

  const r = useMemo(() => {
    const query = parseQuery(q);
    return {
      terms: query.expanded,
      projects: rankProjects(projects.filter((p) => p.status === 'open'), query),
      people: rankPeople(people, query),
      labs: rankLabs(LABS, query),
      conferences: rankConferences(CONFERENCES, query),
      programs: rankPrograms(PROGRAMS, query),
      lessons: rankLessons(ALL_LESSONS, query),
      bootcamps: rankBootcamps(BOOTCAMPS, query),
    };
  }, [q, projects, people]);

  const total = r.projects.length + r.people.length + r.labs.length + r.conferences.length + r.programs.length + r.lessons.length + r.bootcamps.length;

  return (
    <div className="wrap page">
      <PageHead title={q ? <>Results for “{q}”</> : 'Search Thesia'} lede={q ? `${total} matches across projects, people, labs, conferences, programmes and lessons.` : 'Search projects, people, labs, conferences, programmes and lessons at once.'}>
        <form
          className="searchbar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: draft.trim() || null });
          }}
          style={{ maxWidth: 640 }}
        >
          <LuSearch />
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <input id="search-q" className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="A topic, method, place or question" />
        </form>
        <div className="cluster small">
          {[
            ['projects', r.projects.length],
            ['people', r.people.length],
            ['labs', r.labs.length],
            ['conferences', r.conferences.length],
            ['programmes', r.programs.length],
            ['lessons', r.lessons.length],
          ].map(([k, n]) => (
            <a key={k} href={`#${k}`} className="tag" onClick={(e) => { e.preventDefault(); document.getElementById(String(k))?.scrollIntoView({ block: 'start' }); }}>
              {n} {k}
            </a>
          ))}
        </div>
      </PageHead>

      {q && total === 0 && (
        <Empty
          title="Nothing matched yet"
          action={
            <div className="cluster">
              <Link to={`/guide?q=${encodeURIComponent(q)}`} className="btn btn-primary">
                Ask the research guide
              </Link>
              <Link to="/projects/new" className="btn btn-secondary">
                Post this as a project
              </Link>
            </div>
          }
        >
          Try broader words, a field (for example “public health”) or a method (“survey”). Or ask the guide to help shape your idea.
        </Empty>
      )}

      {r.projects.length > 0 && (
        <section id="projects" className="stack" style={{ scrollMarginTop: 90, marginBottom: 48 }}>
          <h2>Projects</h2>
          <div className="ledger">
            {r.projects.slice(0, 8).map((h) => (
              <ProjectRow key={h.item.id} p={h.item} terms={r.terms} />
            ))}
          </div>
        </section>
      )}

      {r.people.length > 0 && (
        <section id="people" className="stack" style={{ scrollMarginTop: 90, marginBottom: 48 }}>
          <h2>People</h2>
          <div className="grid" style={{ ['--min' as any]: '280px' }}>
            {r.people.slice(0, 6).map((h) => (
              <PersonCard key={h.item.id} p={h.item} />
            ))}
          </div>
        </section>
      )}

      {r.labs.length > 0 && (
        <section id="labs" className="stack" style={{ scrollMarginTop: 90, marginBottom: 48 }}>
          <h2>Labs and centres</h2>
          <div className="ledger">
            {r.labs.slice(0, 6).map(({ item: l }) => (
              <Link key={l.id} to={`/labs#${l.id}`} className="ledger-row">
                <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                  <h3>
                    <Highlighted text={l.name} terms={r.terms} />
                  </h3>
                  <p className="muted small">
                    {l.host}, {l.city}. <Highlighted text={l.focus} terms={r.terms} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {r.conferences.length > 0 && (
        <section id="conferences" className="stack" style={{ scrollMarginTop: 90, marginBottom: 48 }}>
          <h2>Conferences</h2>
          <div className="ledger">
            {r.conferences.slice(0, 6).map((h) => (
              <ConferenceRow key={h.item.id} c={h.item} terms={r.terms} />
            ))}
          </div>
        </section>
      )}

      {r.programs.length > 0 && (
        <section id="programmes" className="stack" style={{ scrollMarginTop: 90, marginBottom: 48 }}>
          <h2>Fellowships and programmes</h2>
          <div className="ledger">
            {r.programs.slice(0, 6).map(({ item: p }) => (
              <Link key={p.id} to={`/opportunities#${p.id}`} className="ledger-row">
                <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                  <h3>
                    <Highlighted text={p.name} terms={r.terms} />
                  </h3>
                  <p className="muted small">
                    {p.org}, {p.country}. {FUNDING_LABEL[p.funding]}.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(r.lessons.length > 0 || r.bootcamps.length > 0) && (
        <section id="lessons" className="stack" style={{ scrollMarginTop: 90 }}>
          <h2>Learn</h2>
          <div className="ledger">
            {r.lessons.slice(0, 6).map(({ item }) => (
              <Link key={item.lesson.id} to={`/learn/${item.track.id}/${item.lesson.id}`} className="ledger-row">
                <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                  <h3>
                    <Highlighted text={item.lesson.title} terms={r.terms} />
                  </h3>
                  <p className="muted small">
                    {item.track.title}, {item.lesson.minutes} min. {item.lesson.summary}
                  </p>
                </div>
              </Link>
            ))}
            {r.bootcamps.slice(0, 3).map(({ item: b }) => (
              <Link key={b.id} to={`/bootcamps/${b.id}`} className="ledger-row">
                <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
                  <h3>{b.title} bootcamp</h3>
                  <p className="muted small">{b.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
