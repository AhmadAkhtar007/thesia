import { useMemo, useState } from 'react';
import { LuExternalLink } from 'react-icons/lu';
import { PageHead, SaveButton, ToggleChips } from '../components/ui';
import { FUNDING_LABEL, PROGRAMS } from '../data/programs';
import { LISTINGS_VERIFIED_ON } from '../lib/config';
import { formatDate } from '../lib/format';
import { fieldLabel, LEVELS, levelLabel, type Level } from '../lib/types';
import { ProjectTabs } from './Projects';

export function Opportunities() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [where, setWhere] = useState<'all' | 'pakistan' | 'abroad' | 'online'>('all');
  const rows = useMemo(
    () =>
      PROGRAMS.filter((p) => !levels.length || p.levels.some((l) => levels.includes(l))).filter((p) =>
        where === 'all' ? true : where === 'pakistan' ? p.country === 'Pakistan' : where === 'online' ? p.country === 'Online' : !['Pakistan', 'Online'].includes(p.country)
      ),
    [levels, where]
  );
  return (
    <div className="wrap page">
      <PageHead
        title="Fellowships and programmes"
        lede="Established research programmes, competitions and scholarships open to students from Pakistan and many other countries. Each links to the official page, where you’ll find this year’s dates."
      />
      <ProjectTabs active="programs" />
      <div className="stack" style={{ ['--gap' as any]: '14px', marginBottom: 20 }}>
        <ToggleChips label="Level" options={LEVELS.slice(0, 5).map((l) => ({ id: l.id, label: l.short }))} value={levels} onChange={setLevels} />
        <div className="chip-row" role="group" aria-label="Where">
          {(
            [
              ['all', 'Anywhere'],
              ['pakistan', 'In Pakistan'],
              ['abroad', 'Abroad'],
              ['online', 'Online'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={where === id} onClick={() => setWhere(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="small faint" style={{ marginBottom: 8 }}>
        {rows.length} programmes. Links checked {formatDate(LISTINGS_VERIFIED_ON)}. Eligibility changes each cycle; always read the official call.
      </p>
      <div className="ledger">
        {rows.map((p) => (
          <div key={p.id} id={p.id} className="ledger-row" style={{ scrollMarginTop: 90 }}>
            <div className="stack min0" style={{ ['--gap' as any]: '8px' }}>
              <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
                <span className={`pill ${p.funding === 'fully-funded' ? 'pill-open' : 'pill-neutral'}`}>{FUNDING_LABEL[p.funding]}</span>
                <span className="pill pill-neutral">{p.country}</span>
              </div>
              <h3>{p.name}</h3>
              <p className="small faint">{p.org}</p>
              <p className="muted">{p.summary}</p>
              <div className="ledger-meta">
                <span>{p.format}</span>
                <span>{p.levels.map(levelLabel).join(', ')}</span>
                <span>{p.fields === 'all' ? 'All fields' : p.fields.slice(0, 3).map(fieldLabel).join(', ')}</span>
              </div>
              <p className="small">
                <strong>Who can apply:</strong> {p.eligibility}
              </p>
            </div>
            <div className="ledger-side">
              <div className="cluster" style={{ ['--gap' as any]: '4px' }}>
                <a className="btn btn-secondary btn-sm" href={p.url} target="_blank" rel="noreferrer noopener">
                  Official page <LuExternalLink />
                </a>
                <SaveButton kind="program" id={p.id} label={p.name} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
