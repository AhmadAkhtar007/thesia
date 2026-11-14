import { useMemo, useState } from 'react';
import { LuListFilter, LuPlus, LuSearch } from 'react-icons/lu';
import { ProjectRow } from '../components/rows';
import { Empty, PageHead, Seg, ToggleChips } from '../components/ui';
import { useApp } from '../lib/app';
import { parseQuery, projectFit, rankProjects } from '../lib/match';
import { Link, useQueryState } from '../lib/router';
import { FIELDS, LEVELS, type FieldId, type Level } from '../lib/types';
import { useProjects } from '../lib/useData';

const MODES = [
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'On site' },
] as const;
const COMP = [
  { id: 'paid', label: 'Paid' },
  { id: 'stipend', label: 'Stipend' },
  { id: 'unpaid', label: 'Volunteer' },
  { id: 'course-credit', label: 'Course credit' },
] as const;

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

export function ProjectTabs({ active }: { active: 'projects' | 'programs' }) {
  return (
    <div className="tabs" role="tablist">
      <Link to="/projects" className="tab" role="tab" aria-selected={active === 'projects'}>
        Projects to join
      </Link>
      <Link to="/opportunities" className="tab" role="tab" aria-selected={active === 'programs'}>
        Fellowships and programmes
      </Link>
    </div>
  );
}

export function Projects() {
  const { projects, loading, error, reload } = useProjects();
  const { profile } = useApp();
  const [params, setParams] = useQueryState();
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') || '';
  const fields = list(params.get('field')) as FieldId[];
  const levels = list(params.get('level')) as Level[];
  const modes = list(params.get('mode'));
  const comp = list(params.get('pay'));
  const country = params.get('country') || '';
  const sort = (params.get('sort') as 'fit' | 'new' | 'deadline') || (profile?.onboarded ? 'fit' : 'new');
  const showClosed = params.get('closed') === '1';

  const countries = useMemo(() => Array.from(new Set(projects.map((p) => p.country))).sort(), [projects]);

  const { rows, terms } = useMemo(() => {
    const query = parseQuery(q);
    let base = projects.filter((p) => showClosed || p.status === 'open');
    if (fields.length) base = base.filter((p) => p.fields.some((f) => fields.includes(f)));
    if (levels.length) base = base.filter((p) => p.levels.some((l) => levels.includes(l)));
    if (modes.length) base = base.filter((p) => modes.includes(p.mode));
    if (comp.length) base = base.filter((p) => comp.includes(p.compensation));
    if (country) base = base.filter((p) => p.country === country || p.mode === 'remote');
    let ranked = query.tokens.length ? rankProjects(base, query).map((h) => h.item) : base;
    if (!query.tokens.length) {
      if (sort === 'fit') ranked = [...ranked].sort((a, b) => (projectFit(b, profile)?.score || 0) - (projectFit(a, profile)?.score || 0));
      else if (sort === 'deadline') ranked = [...ranked].sort((a, b) => a.applyBy.localeCompare(b.applyBy));
      else ranked = [...ranked].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return { rows: ranked, terms: query.expanded };
  }, [projects, q, fields, levels, modes, comp, country, sort, showClosed, profile]);

  const activeCount = fields.length + levels.length + modes.length + comp.length + (country ? 1 : 0);

  return (
    <div className="wrap page">
      <PageHead title="Research projects" lede="Join a project as a defined contributor. Every role says what you’ll do, how many hours, and how you’ll be credited." />
      <ProjectTabs active="projects" />
      <div className="split">
        <aside className={`filters${showFilters ? ' is-open' : ''}`} aria-label="Filters">
          <div className="searchbar">
            <LuSearch />
            <label htmlFor="proj-q" className="sr-only">
              Search projects
            </label>
            <input id="proj-q" className="input" placeholder="Search projects" value={q} onChange={(e) => setParams({ q: e.target.value })} />
          </div>
          <div className="filter-group">
            <h4>Level</h4>
            <ToggleChips label="Level" options={LEVELS.slice(0, 4).map((l) => ({ id: l.id, label: l.short }))} value={levels} onChange={(v) => setParams({ level: v.join(',') })} />
          </div>
          <div className="filter-group">
            <h4>Field</h4>
            <ToggleChips label="Field" options={FIELDS} value={fields} onChange={(v) => setParams({ field: v.join(',') })} />
          </div>
          <div className="filter-group">
            <h4>Where</h4>
            <ToggleChips label="Work mode" options={MODES} value={modes as any} onChange={(v) => setParams({ mode: v.join(',') })} />
            <label className="sr-only" htmlFor="proj-country">
              Country
            </label>
            <select id="proj-country" className="select" value={country} onChange={(e) => setParams({ country: e.target.value })}>
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <h4>Pay and credit</h4>
            <ToggleChips label="Compensation" options={COMP} value={comp as any} onChange={(v) => setParams({ pay: v.join(',') })} />
          </div>
          <label className="check">
            <input type="checkbox" checked={showClosed} onChange={(e) => setParams({ closed: e.target.checked ? '1' : null })} />
            Include closed projects
          </label>
          {activeCount > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({ field: null, level: null, mode: null, pay: null, country: null })}>
              Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
            </button>
          )}
        </aside>

        <section className="min0">
          <div className="result-bar">
            <span>
              <strong className="tabular">{rows.length}</strong> {rows.length === 1 ? 'project' : 'projects'}
              {q ? ` matching “${q}”` : ''}
            </span>
            <div className="cluster">
              <button type="button" className="btn btn-secondary btn-sm filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
                <LuListFilter /> Filters{activeCount ? ` (${activeCount})` : ''}
              </button>
              {!q && (
                <Seg
                  label="Sort"
                  value={sort}
                  onChange={(v) => setParams({ sort: v })}
                  options={[
                    ...(profile?.onboarded ? [{ id: 'fit' as const, label: 'Best fit' }] : []),
                    { id: 'new', label: 'Newest' },
                    { id: 'deadline', label: 'Deadline' },
                  ]}
                />
              )}
              <Link to="/projects/new" className="btn btn-primary btn-sm">
                <LuPlus /> Post a project
              </Link>
            </div>
          </div>
          {!profile?.onboarded && (
            <p className="callout" style={{ margin: '8px 0 16px' }}>
              <Link to={profile ? '/welcome' : '/signup'}>{profile ? 'Finish your profile' : 'Create a free profile'}</Link> to see how well each project fits your fields, level and skills.
            </p>
          )}
          {error && (
            <Empty title="Projects didn’t load" action={<button className="btn btn-secondary" onClick={() => reload()}>Try again</button>}>
              {error}
            </Empty>
          )}
          {loading ? (
            <div className="stack" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 96 }} />
              ))}
            </div>
          ) : rows.length ? (
            <div className="ledger">
              {rows.map((p) => (
                <ProjectRow key={p.id} p={p} terms={terms} />
              ))}
            </div>
          ) : (
            !error && (
              <Empty
                title="No projects match these filters"
                action={
                  <div className="cluster">
                    <button className="btn btn-secondary" onClick={() => setParams({ q: null, field: null, level: null, mode: null, pay: null, country: null })}>
                      Clear filters
                    </button>
                    <Link to="/projects/new" className="btn btn-primary">
                      Start your own project
                    </Link>
                  </div>
                }
              >
                Remove a filter, or start a project and invite others to join it.
              </Empty>
            )
          )}
        </section>
      </div>
    </div>
  );
}
