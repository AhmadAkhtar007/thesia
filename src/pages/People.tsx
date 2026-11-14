import { useEffect, useMemo, useState } from 'react';
import { LuAward, LuBadgeCheck, LuExternalLink, LuSearch } from 'react-icons/lu';
import { PersonCard, ProjectRow } from '../components/rows';
import { Avatar, CopyButton, Empty, PageHead, SamplePill, ToggleChips } from '../components/ui';
import { BADGE_LABEL } from '../data/academy';
import { useApp } from '../lib/app';
import { SITE_URL } from '../lib/config';
import { formatDate } from '../lib/format';
import { parseQuery, rankPeople } from '../lib/match';
import { repo } from '../lib/repo';
import { Link, useParams, useQueryState } from '../lib/router';
import { CREDIT_ROLES, FIELDS, LEVELS, OPEN_TO_LABEL, creditLabel, fieldLabel, levelLabel, type Certificate, type Contribution, type FieldId, type Level, type OpenTo, type Person } from '../lib/types';
import { usePeople, useProjects } from '../lib/useData';
import { NotFound } from './NotFound';

const OPEN_OPTIONS = (Object.keys(OPEN_TO_LABEL) as OpenTo[]).map((id) => ({ id, label: OPEN_TO_LABEL[id] }));
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

export function People() {
  const { people, loading } = usePeople();
  const { user, profile } = useApp();
  const [params, setParams] = useQueryState();
  const q = params.get('q') || '';
  const fields = list(params.get('field')) as FieldId[];
  const levels = list(params.get('level')) as Level[];
  const open = list(params.get('open')) as OpenTo[];

  const rows = useMemo(() => {
    let base = people;
    if (fields.length) base = base.filter((p) => p.fields.some((f) => fields.includes(f)));
    if (levels.length) base = base.filter((p) => levels.includes(p.level));
    if (open.length) base = base.filter((p) => p.openTo.some((o) => open.includes(o)));
    const query = parseQuery(q);
    return query.tokens.length ? rankPeople(base, query).map((h) => h.item) : base;
  }, [people, q, fields, levels, open]);

  return (
    <div className="wrap page">
      <PageHead title="People in research" lede="Students, researchers and mentors, with a record of what each person has actually contributed.">
        <div className="cluster">
          {user ? (
            profile?.handle ? (
              <Link to={`/people/${profile.handle}`} className="btn btn-secondary">
                View your passport
              </Link>
            ) : (
              <Link to="/welcome" className="btn btn-primary">
                Finish your passport
              </Link>
            )
          ) : (
            <Link to="/signup" className="btn btn-primary">
              Create your passport
            </Link>
          )}
        </div>
      </PageHead>
      <div className="stack" style={{ ['--gap' as any]: '14px', marginBottom: 24 }}>
        <div className="searchbar" style={{ maxWidth: 520 }}>
          <LuSearch />
          <label htmlFor="ppl-q" className="sr-only">
            Search people
          </label>
          <input id="ppl-q" className="input" placeholder="Search by skill, topic, city or name" value={q} onChange={(e) => setParams({ q: e.target.value })} />
        </div>
        <ToggleChips label="Open to" options={OPEN_OPTIONS} value={open} onChange={(v) => setParams({ open: v.join(',') })} />
        <ToggleChips label="Level" options={LEVELS.map((l) => ({ id: l.id, label: l.short }))} value={levels} onChange={(v) => setParams({ level: v.join(',') })} />
        <details>
          <summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>
            Filter by field{fields.length ? ` (${fields.length})` : ''}
          </summary>
          <div style={{ marginTop: 10 }}>
            <ToggleChips label="Field" options={FIELDS} value={fields} onChange={(v) => setParams({ field: v.join(',') })} />
          </div>
        </details>
      </div>
      {people.some((p) => p.isSample) && (
        <p className="small faint" style={{ marginBottom: 12 }}>
          Profiles marked Sample show what a research passport looks like during the beta.
        </p>
      )}
      {loading ? (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 220 }} />
          ))}
        </div>
      ) : rows.length ? (
        <div className="grid" style={{ ['--min' as any]: '290px' }}>
          {rows.map((p) => (
            <PersonCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty title="No one matches yet" action={<button className="btn btn-secondary" onClick={() => setParams({ q: null, field: null, level: null, open: null })}>Clear filters</button>}>
          Try fewer filters, or search for a skill such as “R”, “GIS” or “interviews”.
        </Empty>
      )}
    </div>
  );
}

export function Profile() {
  const { handle } = useParams();
  const { profile } = useApp();
  const { projects } = useProjects();
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  useEffect(() => {
    setPerson(undefined);
    repo.getPerson(handle).then(setPerson).catch(() => setPerson(null));
  }, [handle, profile?.handle, profile?.headline, profile?.outputs?.length]);
  useEffect(() => {
    if (!person) return;
    const id = person.isSample ? `sample-${person.handle}` : person.id;
    repo.contributionsFor(id).then(setContribs).catch(() => setContribs([]));
    repo.certificatesFor(id).then(setCerts).catch(() => setCerts([]));
  }, [person]);

  if (person === undefined)
    return (
      <div className="wrap page" aria-busy="true">
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  if (person === null) return <NotFound />;
  const p = person;
  const isMe = profile?.handle === p.handle;
  const leads = projects.filter((x) => x.lead.handle === p.handle);
  const credits = CREDIT_ROLES.filter((r) => (p.credit[r.id] || 0) > 0);
  const max = Math.max(1, ...credits.map((r) => p.credit[r.id] || 0));
  const url = `${SITE_URL}/people/${p.handle}`;

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/people">People</Link> /<span className="faint">Research passport</span>
      </nav>
      <div className="split split-right">
        <article className="passport min0">
          <header className="passport-head">
            <Avatar name={p.name} large />
            <div className="stack min0" style={{ ['--gap' as any]: '6px' }}>
              <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
                {p.isSample && <SamplePill />}
                {p.verified && (
                  <span className="pill pill-open" title="Identity and affiliation checked by the Thesia team">
                    <LuBadgeCheck aria-hidden="true" /> Verified
                  </span>
                )}
                <span className="pill pill-neutral">{levelLabel(p.level)}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)' }}>{p.name}</h1>
              <p className="muted">{p.headline}</p>
              <p className="small faint">
                {p.affiliation}
                {p.affiliation ? '. ' : ''}
                {p.city}
                {p.city ? ', ' : ''}
                {p.country}
              </p>
            </div>
          </header>

          {p.bio && <p style={{ maxWidth: '66ch' }}>{p.bio}</p>}

          <section className="stack" style={{ ['--gap' as any]: '12px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Contribution record</h2>
            {credits.length ? (
              <div className="credit-bars" style={{ maxWidth: 560 }}>
                {credits.map((r) => (
                  <div className="credit-bar" key={r.id} title={r.hint} style={{ gridTemplateColumns: 'minmax(0,1fr) 160px 24px' }}>
                    <span>{r.label}</span>
                    <i>
                      <b style={{ width: `${((p.credit[r.id] || 0) / max) * 100}%` }} />
                    </i>
                    <span className="tabular">{p.credit[r.id]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small">
                {isMe ? 'Your CRediT roles appear here when a project lead confirms your contribution.' : 'No confirmed contributions yet.'}
              </p>
            )}
            <p className="xsmall faint">{p.isSample ? 'Counts of outputs where this person held each CRediT role.' : 'Counts of contributions confirmed by project leads on Thesia, by CRediT role.'}</p>
          </section>

          {contribs.length > 0 && (
            <section className="stack" style={{ ['--gap' as any]: '6px' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Confirmed contributions</h2>
              <ul className="output-list">
                {contribs.map((c) => (
                  <li key={c.id}>
                    <strong>{c.projectId ? <Link to={`/projects/${c.projectId}`}>{c.projectTitle}</Link> : c.projectTitle}</strong>
                    <span className="small muted">{c.roles.map(creditLabel).join(', ')}</span>
                    {c.note && <span className="small">{c.note}</span>}
                    <span className="xsmall faint">
                      <LuBadgeCheck aria-hidden="true" style={{ verticalAlign: '-2px', color: 'var(--leaf)' }} /> Confirmed by {c.confirmedByName || 'the project lead'}, {formatDate(c.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="stack" style={{ ['--gap' as any]: '6px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Outputs{!p.isSample && p.outputs.length > 0 && <span className="small faint" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}> · self-reported</span>}</h2>
            {p.outputs.length ? (
              <ul className="output-list">
                {p.outputs.map((o) => (
                  <li key={o.title}>
                    <strong>{o.url ? <a href={o.url} target="_blank" rel="noreferrer noopener">{o.title}</a> : o.title}</strong>
                    <span className="small muted">
                      {o.type[0].toUpperCase() + o.type.slice(1)}
                      {o.venue ? `, ${o.venue}` : ''}, {o.year}
                    </span>
                    <span className="xsmall faint">Roles: {o.roles.map((r) => CREDIT_ROLES.find((c) => c.id === r)?.label).join(', ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">{isMe ? 'Add papers, posters, datasets or code from your dashboard.' : 'No outputs listed yet.'}</p>
            )}
          </section>

          {leads.length > 0 && (
            <section className="stack">
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Projects they lead</h2>
              <div className="ledger">
                {leads.map((x) => (
                  <ProjectRow key={x.id} p={x} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="stack" style={{ alignContent: 'start' }}>
          <div className="panel stack" style={{ ['--gap' as any]: '14px' }}>
            {isMe && (
              <Link to="/welcome" className="btn btn-primary btn-block">
                Edit your passport
              </Link>
            )}
            {p.openTo.length > 0 && (
              <div className="stack" style={{ ['--gap' as any]: '6px' }}>
                <span className="small faint">Open to</span>
                <div className="tag-row">
                  {p.openTo.map((o) => (
                    <span key={o} className="tag">
                      {OPEN_TO_LABEL[o]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="stack" style={{ ['--gap' as any]: '6px' }}>
              <span className="small faint">Fields</span>
              <div className="tag-row">
                {p.fields.map((f) => (
                  <span key={f} className="tag">
                    {fieldLabel(f)}
                  </span>
                ))}
              </div>
            </div>
            {p.skills.length > 0 && (
              <div className="stack" style={{ ['--gap' as any]: '6px' }}>
                <span className="small faint">Skills</span>
                <div className="tag-row">
                  {p.skills.map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {p.badges.length > 0 && (
              <div className="stack" style={{ ['--gap' as any]: '6px' }}>
                <span className="small faint">Academy tracks completed</span>
                <div className="tag-row">
                  {p.badges.map((b) => (
                    <span key={b} className="pill pill-mark">
                      {BADGE_LABEL[b] || b}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {certs.length > 0 && (
              <div className="stack" style={{ ['--gap' as any]: '6px' }}>
                <span className="small faint">Certificates</span>
                {certs.map((c) => (
                  <Link key={c.id} to={`/certificate/${c.id}`} className="small">
                    <LuAward aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {c.title} <span className="mono xsmall faint">{c.id}</span>
                  </Link>
                ))}
              </div>
            )}
            {p.languages.length > 0 && <p className="small">Works in {p.languages.join(', ')}</p>}
            {(p.links.orcid || p.links.scholar || p.links.website || p.links.linkedin) && (
              <div className="stack" style={{ ['--gap' as any]: '4px' }}>
                {Object.entries(p.links)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <a key={k} href={String(v)} target="_blank" rel="noreferrer noopener" className="small">
                      {k === 'orcid' ? 'ORCID' : k === 'scholar' ? 'Google Scholar' : k === 'linkedin' ? 'LinkedIn' : 'Website'} <LuExternalLink style={{ verticalAlign: '-2px' }} />
                    </a>
                  ))}
              </div>
            )}
            <div data-copy-scope className="stack" style={{ ['--gap' as any]: '6px' }}>
              <CopyButton text={url} label="Copy passport link" />
              <span className="xsmall faint" data-copy-target style={{ overflowWrap: 'anywhere' }}>
                {url}
              </span>
            </div>
            <p className="xsmall faint">On Thesia since {formatDate(p.joined)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
