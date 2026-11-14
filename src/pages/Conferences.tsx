import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LuSearch } from 'react-icons/lu';
import { CountryPicker, CountryWaitlist, isLiveCountry } from '../components/CountryPicker';
import { ConferenceRow } from '../components/rows';
import { Empty, Field, PageHead, ToggleChips } from '../components/ui';
import { AGGREGATOR_NOISE, CONFERENCES, conferenceStatus, type ConferenceStatus } from '../data/conferences';
import { useApp } from '../lib/app';
import { LISTINGS_VERIFIED_ON } from '../lib/config';
import { formatDate, isEmail, monthKey, monthLabel } from '../lib/format';
import { parseQuery, rankConferences } from '../lib/match';
import { repo } from '../lib/repo';
import { Link, useQueryState } from '../lib/router';
import { FIELDS, type FieldId } from '../lib/types';

const STATUS_FILTERS: { id: 'papers' | 'upcoming' | 'past'; label: string; match: ConferenceStatus[] }[] = [
  { id: 'papers', label: 'Accepting papers', match: ['open', 'closing'] },
  { id: 'upcoming', label: 'Coming up', match: ['open', 'closing', 'upcoming', 'closed'] },
  { id: 'past', label: 'Already happened', match: ['past'] },
];

export function Conferences() {
  const { country } = useApp();
  const [params, setParams] = useQueryState();
  const q = params.get('q') || '';
  const statusF = (params.get('status') || '').split(',').filter(Boolean) as ('papers' | 'upcoming' | 'past')[];
  const fields = (params.get('field') || '').split(',').filter(Boolean) as FieldId[];
  const students = params.get('students') === '1';

  const { groups, pastGroups, terms, count } = useMemo(() => {
    const query = parseQuery(q);
    let base = CONFERENCES.filter((c) => c.country === country);
    if (statusF.length) {
      const allowed = new Set(STATUS_FILTERS.filter((s) => statusF.includes(s.id)).flatMap((s) => s.match));
      base = base.filter((c) => allowed.has(conferenceStatus(c)));
    }
    if (fields.length) base = base.filter((c) => c.fields.some((f) => fields.includes(f)));
    if (students) base = base.filter((c) => c.studentFriendly);
    if (query.tokens.length) {
      const ids = new Set(rankConferences(base, query).map((h) => h.item.id));
      base = base.filter((c) => ids.has(c.id));
    }
    base = [...base].sort((a, b) => a.start.localeCompare(b.start));
    const group = (list: typeof base) => {
      const map = new Map<string, typeof base>();
      list.forEach((c) => map.set(monthKey(c.start), [...(map.get(monthKey(c.start)) || []), c]));
      return Array.from(map.entries());
    };
    // Upcoming first; events that already happened go to the end, newest first.
    const upcoming = base.filter((c) => conferenceStatus(c) !== 'past');
    const past = base.filter((c) => conferenceStatus(c) === 'past').reverse();
    return { groups: group(upcoming), pastGroups: group(past), terms: query.expanded, count: base.length };
  }, [q, statusF.join(), fields.join(), students, country]);

  const live = isLiveCountry(country);
  const usedFields = FIELDS.filter((f) => CONFERENCES.some((c) => c.fields.includes(f.id)));

  return (
    <div className="wrap page">
      <PageHead
        title={`Research conferences in ${live ? country : 'your country'}`}
        lede="Real conferences, checked against their official sites, with paper deadlines and whether students can take part."
      >
        <CountryPicker />
      </PageHead>

      {!live ? (
        <CountryWaitlist what="conferences" />
      ) : (
        <>
          <div className="callout callout-ink" style={{ marginBottom: 28, maxWidth: 820 }}>
            <strong>Why this list is short.</strong> Aggregator sites list around {AGGREGATOR_NOISE.count} “international conferences” in {AGGREGATOR_NOISE.city} on {AGGREGATOR_NOISE.date} alone, a pattern typical of
            conference mills. We only list events hosted by a university, society or institute, verified on their own site. Last checked {formatDate(LISTINGS_VERIFIED_ON)}. Got an invitation you’re unsure
            about? Run it through <Link to="/tools/legit-check">Legit Check</Link>.
          </div>

          <div className="stack" style={{ ['--gap' as any]: '14px', marginBottom: 28 }}>
            <div className="searchbar" style={{ maxWidth: 520 }}>
              <LuSearch />
              <label htmlFor="conf-q" className="sr-only">
                Search conferences
              </label>
              <input id="conf-q" className="input" placeholder="Search by topic, host or city" value={q} onChange={(e) => setParams({ q: e.target.value })} />
            </div>
            <div className="cluster">
              <ToggleChips label="Status" options={STATUS_FILTERS} value={statusF} onChange={(v) => setParams({ status: v.join(',') })} />
              <button type="button" className="chip" aria-pressed={students} onClick={() => setParams({ students: students ? null : '1' })}>
                Student friendly
              </button>
            </div>
            <ToggleChips label="Field" options={usedFields} value={fields} onChange={(v) => setParams({ field: v.join(',') })} />
          </div>

          <p className="small faint" style={{ marginBottom: 8 }}>
            {count} {count === 1 ? 'conference' : 'conferences'}. Dates can change; confirm on the official site before you submit or travel.
          </p>

          {groups.length || pastGroups.length ? (
            <div className="timeline">
              {[...groups, ...(pastGroups.length ? [['past-heading', []] as [string, typeof CONFERENCES]] : []), ...pastGroups].map(([key, items]) => {
                if (key === 'past-heading')
                  return (
                    <h2 key={key} style={{ fontSize: 'var(--t-xl)', paddingTop: 12, borderTop: '2px solid var(--ink)' }}>
                      Already happened this year
                    </h2>
                  );
                const m = monthLabel(key);
                return (
                  <section className="month" key={key} aria-label={`${m.month} ${m.year}`}>
                    <div className="month-label">
                      {m.month}
                      <small>{m.year}</small>
                    </div>
                    <div className="ledger min0">
                      {items.map((c) => (
                        <ConferenceRow key={c.id} c={c} terms={terms} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <Empty title="No conferences match" action={<button className="btn btn-secondary" onClick={() => setParams({ q: null, status: null, field: null, students: null })}>Clear filters</button>}>
              Try removing a filter. If you know a conference we’re missing, suggest it below.
            </Empty>
          )}
        </>
      )}

      <SuggestForm kind="conference" />
    </div>
  );
}

export function SuggestForm({ kind }: { kind: 'conference' | 'lab' }) {
  const { user, country, toast } = useApp();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (user?.email) setEmail((v) => v || user.email);
  }, [user?.email]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setErr(`Add the ${kind}’s name.`);
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) return setErr('Add a link to the official page, starting with https://');
    if (!isEmail(email)) return setErr('Add your email so we can follow up.');
    setErr('');
    try {
      await repo.submit({ kind, email: email.trim(), country, payload: { name: name.trim(), url: url.trim(), note: note.trim() } });
      setDone(true);
      toast('Thanks. We’ll verify it and add it if it checks out.');
    } catch (e: any) {
      setErr(`Couldn’t send: ${e?.message || 'network error'}.`);
    }
  };
  return (
    <section id="suggest" className="section" style={{ scrollMarginTop: 80 }}>
      <div className="panel panel-sunk stack" style={{ maxWidth: 760 }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Suggest a {kind}</h2>
        <p className="muted small">We check every suggestion against its official page before listing it, usually within a week.</p>
        {done ? (
          <p className="callout">Received. Suggest another any time.</p>
        ) : (
          <form className="stack" onSubmit={submit} style={{ ['--gap' as any]: '14px' }}>
            <div className="form-grid">
              <Field label={kind === 'conference' ? 'Conference name' : 'Lab or centre name'} htmlFor={`sg-n-${kind}`}>
                <input id={`sg-n-${kind}`} className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Official page" htmlFor={`sg-u-${kind}`}>
                <input id={`sg-u-${kind}`} className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              </Field>
            </div>
            <Field label="Anything we should know" htmlFor={`sg-x-${kind}`} hint={kind === 'conference' ? 'Dates, deadline, host, whether students can present.' : 'Research themes, how students usually join.'}>
              <input id={`sg-x-${kind}`} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field label="Your email" htmlFor={`sg-e-${kind}`} error={err}>
              <input id={`sg-e-${kind}`} className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ maxWidth: 380 }} />
            </Field>
            <div>
              <button className="btn btn-primary" type="submit">
                Send suggestion
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
