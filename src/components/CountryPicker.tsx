import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LuGlobe } from 'react-icons/lu';
import { COUNTRIES, LIVE_COUNTRIES, REGIONS, countryByName } from '../data/countries';
import { useApp } from '../lib/app';
import { isEmail } from '../lib/format';
import { repo } from '../lib/repo';
import { Link } from '../lib/router';
import { Field } from './ui';

export function CountryPicker({ id = 'country-pick', label = 'Listings for' }: { id?: string; label?: string }) {
  const { country, setCountry } = useApp();
  return (
    <div className="cluster" style={{ ['--gap' as any]: '8px' }}>
      <LuGlobe aria-hidden="true" style={{ color: 'var(--ink-3)' }} />
      <label htmlFor={id} className="small muted" style={{ fontWeight: 700 }}>
        {label}
      </label>
      <select id={id} className="select" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 'auto', minWidth: 200, paddingBlock: 8 }}>
        {REGIONS.map((r) => (
          <optgroup key={r} label={r}>
            {COUNTRIES.filter((c) => c.region === r).map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
                {LIVE_COUNTRIES.includes(c.name) ? ' (live)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export const isLiveCountry = (c: string) => LIVE_COUNTRIES.includes(c);

/** Shown when someone picks a country we haven't mapped yet. */
export function CountryWaitlist({ what }: { what: string }) {
  const { country, user, toast } = useApp();
  const [email, setEmail] = useState(user?.email || '');
  const [helper, setHelper] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const region = countryByName(country)?.region;
  useEffect(() => {
    if (user?.email) setEmail((v) => v || user.email);
  }, [user?.email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    setErr('');
    try {
      await repo.submit({ kind: 'country-waitlist', email: email.trim(), country, payload: { what, helper } });
      setDone(true);
      toast(`You’re on the list for ${country}`);
    } catch (e: any) {
      setErr(`Couldn’t join the list: ${e?.message || 'network error'}.`);
    }
  };

  return (
    <div className="panel stack" style={{ ['--gap' as any]: '14px', maxWidth: 720 }}>
      <h2 style={{ fontSize: 'var(--t-xl)' }}>We haven’t verified {what} for {country} yet</h2>
      <p className="muted">
        Thesia verifies every listing against an official source before it goes live, one country at a time. Pakistan is live now. Projects, people, the Academy, bootcamps and tools already work in {country}
        {region ? ` and across ${region}` : ''}.
      </p>
      {done ? (
        <p className="callout">Thanks. We’ll email you when {country} goes live{helper ? ', and about helping verify listings as a country lead' : ''}.</p>
      ) : (
        <form className="stack" onSubmit={submit} style={{ ['--gap' as any]: '12px' }}>
          <Field label={`Tell me when ${country} is live`} htmlFor="wl-email" error={err}>
            <input id="wl-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" style={{ maxWidth: 380 }} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={helper} onChange={(e) => setHelper(e.target.checked)} />I’d like to help verify listings in my country as a volunteer country lead.
          </label>
          <div className="cluster">
            <button className="btn btn-primary" type="submit">
              Join the {country} list
            </button>
            <Link to="/opportunities" className="btn btn-ghost">
              See global programmes
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
