import { useMemo } from 'react';
import { LuExternalLink, LuMapPin, LuSearch } from 'react-icons/lu';
import { CountryPicker, CountryWaitlist, isLiveCountry } from '../components/CountryPicker';
import { Highlighted } from '../components/rows';
import { Empty, PageHead, SaveButton, ToggleChips } from '../components/ui';
import { LABS } from '../data/labs';
import { useApp } from '../lib/app';
import { LISTINGS_VERIFIED_ON } from '../lib/config';
import { formatDate } from '../lib/format';
import { parseQuery, rankLabs } from '../lib/match';
import { Link, useQueryState } from '../lib/router';
import { FIELDS, fieldLabel, type FieldId } from '../lib/types';
import { SuggestForm } from './Conferences';

export function Labs() {
  const { country } = useApp();
  const [params, setParams] = useQueryState();
  const q = params.get('q') || '';
  const fields = (params.get('field') || '').split(',').filter(Boolean) as FieldId[];
  const city = params.get('city') || '';
  const cities = useMemo(() => Array.from(new Set(LABS.filter((l) => l.country === country).map((l) => l.city))).sort(), [country]);

  const { rows, terms } = useMemo(() => {
    const query = parseQuery(q);
    let base = LABS.filter((l) => l.country === country);
    if (fields.length) base = base.filter((l) => l.fields.some((f) => fields.includes(f)));
    if (city) base = base.filter((l) => l.city === city);
    return { rows: query.tokens.length ? rankLabs(base, query).map((h) => h.item) : base, terms: query.expanded };
  }, [q, fields.join(), city, country]);

  const live = isLiveCountry(country);
  const usedFields = FIELDS.filter((f) => LABS.some((l) => l.fields.includes(f.id)));

  return (
    <div className="wrap page">
      <PageHead title="Research labs and centres" lede="Where research happens, what each lab works on, and how students usually get involved.">
        <CountryPicker />
      </PageHead>
      {!live ? (
        <CountryWaitlist what="labs" />
      ) : (
        <>
          <div className="stack" style={{ ['--gap' as any]: '14px', marginBottom: 24 }}>
            <div className="searchbar" style={{ maxWidth: 520 }}>
              <LuSearch />
              <label htmlFor="lab-q" className="sr-only">
                Search labs
              </label>
              <input id="lab-q" className="input" placeholder="Search by theme, institution or city" value={q} onChange={(e) => setParams({ q: e.target.value })} />
            </div>
            <ToggleChips label="Field" options={usedFields} value={fields} onChange={(v) => setParams({ field: v.join(',') })} />
            <div className="chip-row" role="group" aria-label="City">
              <button type="button" className="chip" aria-pressed={!city} onClick={() => setParams({ city: null })}>
                All cities
              </button>
              {cities.map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={city === c} onClick={() => setParams({ city: city === c ? null : c })}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <p className="small faint" style={{ marginBottom: 8 }}>
            {rows.length} labs and centres. Links checked {formatDate(LISTINGS_VERIFIED_ON)}. To write to a researcher, find them on the lab’s people page and use the{' '}
            <Link to="/tools/outreach">outreach composer</Link>.
          </p>
          {rows.length ? (
            <div className="ledger">
              {rows.map((l) => (
                <div key={l.id} id={l.id} className="ledger-row" style={{ scrollMarginTop: 90 }}>
                  <div className="stack min0" style={{ ['--gap' as any]: '8px' }}>
                    <h3>
                      <Highlighted text={l.name} terms={terms} />
                      {l.short && l.short !== l.name && (
                        <span className="faint" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-sm)', fontWeight: 400 }}>
                          {' '}
                          {l.short}
                        </span>
                      )}
                    </h3>
                    <div className="ledger-meta">
                      <span>
                        <LuMapPin /> {l.city}
                      </span>
                      <span>{l.host}</span>
                      <span>{l.fields.map(fieldLabel).join(', ')}</span>
                    </div>
                    <p className="muted">
                      <Highlighted text={l.focus} terms={terms} />
                    </p>
                    <div className="tag-row">
                      {l.themes.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="small">
                      <strong>How students get involved:</strong> {l.approach}
                    </p>
                  </div>
                  <div className="ledger-side">
                    <div className="cluster" style={{ ['--gap' as any]: '4px' }}>
                      <a className="btn btn-secondary btn-sm" href={l.url} target="_blank" rel="noreferrer noopener">
                        Official site <LuExternalLink />
                      </a>
                      <SaveButton kind="lab" id={l.id} label={l.name} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No labs match" action={<button className="btn btn-secondary" onClick={() => setParams({ q: null, field: null, city: null })}>Clear filters</button>}>
              Try a broader theme, or suggest a lab we’re missing.
            </Empty>
          )}
        </>
      )}
      <SuggestForm kind="lab" />
    </div>
  );
}
