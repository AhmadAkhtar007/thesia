import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Field, PageHead, ToggleChips } from '../components/ui';
import { COUNTRIES } from '../data/countries';
import { useApp } from '../lib/app';
import { isEmail, slugify } from '../lib/format';
import { repo } from '../lib/repo';
import { Link, useNavigate, useQueryState } from '../lib/router';
import { FIELDS, LEVELS, OPEN_TO_LABEL, type FieldId, type Level, type OpenTo } from '../lib/types';
import { invalidatePeople } from '../lib/useData';

const WHY: Record<string, string> = {
  apply: 'Sign in to apply to projects.',
  save: 'Sign in to save projects, conferences and labs to your dashboard.',
  progress: 'Sign in to save your Academy progress.',
  enroll: 'Sign in to reserve a bootcamp seat.',
  scholarship: 'Sign in to apply for a scholarship.',
  post: 'Sign in to publish your project.',
  upgrade: 'Sign in to upgrade.',
};

function AuthShell({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <div className="wrap page" style={{ maxWidth: 520 }}>
      <PageHead title={title} lede={lede} />
      {children}
    </div>
  );
}

export function SignIn() {
  const { signIn, sendMagicLink, googleUrl, live, user } = useApp();
  const navigate = useNavigate();
  const [params] = useQueryState();
  const next = params.get('next') || '/dashboard';
  const why = params.get('why');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setErr('Enter the email you signed up with.');
    setErr('');
    setBusy(true);
    try {
      if (mode === 'link') {
        await sendMagicLink(email.trim());
        if (live) setSent(true);
      } else {
        if (live && password.length < 8) throw new Error('Passwords are at least 8 characters.');
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      setErr(/invalid/i.test(e?.message || '') ? 'That email and password don’t match. Try again or use a sign-in link.' : e?.message || 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" lede={why ? WHY[why] : 'Sign in to your Thesia account.'}>
      {!live && <p className="callout small" style={{ marginBottom: 20 }}>Beta preview: any email works, and your account stays in this browser.</p>}
      {sent ? (
        <div className="callout">
          <strong>Check your inbox.</strong> We sent a sign-in link to {email}. It works once and expires in an hour.
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <Field label="Email" htmlFor="si-email">
            <input id="si-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {mode === 'password' && (
            <Field label="Password" htmlFor="si-pw">
              <input id="si-pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          )}
          {err && (
            <p className="field-error" role="alert">
              {err}
            </p>
          )}
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}
          </button>
          <button type="button" className="link-btn small" onClick={() => setMode(mode === 'link' ? 'password' : 'link')} style={{ justifySelf: 'start' }}>
            {mode === 'link' ? 'Use a password instead' : 'Forgot your password? Email me a sign-in link'}
          </button>
          {googleUrl && (
            <>
              <div className="divider-label">or</div>
              <a className="btn btn-secondary btn-lg" href={googleUrl}>
                Continue with Google
              </a>
            </>
          )}
          <p className="small muted">
            New to Thesia? <Link to={`/signup${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create a free account</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function SignUp() {
  const { signUp, googleUrl, live, user } = useApp();
  const navigate = useNavigate();
  const [params] = useQueryState();
  const next = params.get('next') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (user && !confirm) navigate(`/welcome${next ? `?next=${encodeURIComponent(next)}` : ''}`, { replace: true });
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr('Add your name.');
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    if (live && password.length < 8) return setErr('Use at least 8 characters for your password.');
    if (!agree) return setErr('Please agree to the terms and privacy policy.');
    setErr('');
    setBusy(true);
    try {
      const r = await signUp(email.trim(), password, name.trim());
      if (r.needsConfirmation) setConfirm(true);
    } catch (e: any) {
      setErr(/registered|exists/i.test(e?.message || '') ? 'That email already has an account. Sign in instead.' : e?.message || 'Sign-up failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (confirm)
    return (
      <AuthShell title="Confirm your email">
        <p className="callout">
          We sent a confirmation link to <strong>{email}</strong>. Open it on this device to finish creating your account.
        </p>
      </AuthShell>
    );

  return (
    <AuthShell title="Join Thesia" lede="Free for students. Takes a minute, then we’ll tailor projects and lessons to you.">
      {!live && <p className="callout small" style={{ marginBottom: 20 }}>Beta preview: your account stays in this browser.</p>}
      <form className="stack" onSubmit={submit}>
        <Field label="Your name" htmlFor="su-name">
          <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="su-email" hint="Your university email helps labs trust your profile, but any email works.">
          <input id="su-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="su-pw" hint="At least 8 characters.">
          <input id="su-pw" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I agree to the <Link to="/terms">terms</Link> and <Link to="/privacy">privacy policy</Link>. If I’m under 18, a parent or guardian knows I’m joining.
          </span>
        </label>
        {err && (
          <p className="field-error" role="alert">
            {err}
          </p>
        )}
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
        {googleUrl && (
          <>
            <div className="divider-label">or</div>
            <a className="btn btn-secondary btn-lg" href={googleUrl}>
              Continue with Google
            </a>
          </>
        )}
        <p className="small muted">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

const GOALS = [
  'Join my first research project',
  'Learn research methods',
  'Find a mentor',
  'Publish or present my work',
  'Get a research assistant role',
  'Prepare for a master’s or PhD',
];
const OPEN_OPTIONS = (Object.keys(OPEN_TO_LABEL) as OpenTo[]).map((id) => ({ id, label: OPEN_TO_LABEL[id] }));

export function Welcome() {
  const { user, profile, saveProfile, toast, ready } = useApp();
  const navigate = useNavigate();
  const [params] = useQueryState();
  const next = params.get('next') || '';
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [level, setLevel] = useState<Level | ''>('');
  const [affiliation, setAffiliation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [fields, setFields] = useState<FieldId[]>([]);
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [openTo, setOpenTo] = useState<OpenTo[]>([]);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [orcid, setOrcid] = useState('');
  const [scholar, setScholar] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate('/signup', { replace: true });
  }, [ready, user]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setHandle(profile.handle);
    setHandleTouched(!!profile.handle);
    setLevel(profile.level);
    setAffiliation(profile.affiliation);
    setCity(profile.city);
    setCountry(profile.country || 'Pakistan');
    setFields(profile.fields);
    setSkills(profile.skills.join(', '));
    setGoals(profile.goals);
    setOpenTo(profile.openTo);
    setHeadline(profile.headline);
    setBio(profile.bio);
    setOrcid(profile.links.orcid || '');
    setScholar(profile.links.scholar || '');
    setLinkedin(profile.links.linkedin || '');
    setWebsite(profile.links.website || '');
  }, [profile?.id]);

  useEffect(() => {
    if (!handleTouched) setHandle(slugify(name));
  }, [name, handleTouched]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (name.trim().length < 2) errs.push('Add your name.');
    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(handle)) errs.push('Your profile link can use lowercase letters, numbers and hyphens, 3 to 40 characters.');
    if (!level) errs.push('Choose your current level.');
    if (!fields.length) errs.push('Choose at least one field you’re interested in.');
    const urlOk = (u: string) => !u || /^https?:\/\/\S+\.\S+/.test(u);
    if (![scholar, linkedin, website].every(urlOk)) errs.push('Links should start with https://');
    if (orcid && !/^(https:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid.trim())) errs.push('An ORCID iD looks like 0000-0002-1825-0097.');
    if (!errs.length && user && !(await repo.handleAvailable(handle, user.id))) errs.push('That profile link is taken. Try adding your city or a number.');
    setErrors(errs);
    if (errs.length) return window.scrollTo({ top: 0, behavior: 'smooth' });
    setBusy(true);
    try {
      await saveProfile({
        name: name.trim(),
        handle,
        level,
        affiliation: affiliation.trim(),
        city: city.trim(),
        country,
        fields,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        goals,
        openTo,
        headline: headline.trim(),
        bio: bio.trim(),
        links: {
          orcid: orcid.trim() ? (orcid.startsWith('http') ? orcid.trim() : `https://orcid.org/${orcid.trim()}`) : undefined,
          scholar: scholar.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          website: website.trim() || undefined,
        },
        onboarded: true,
      });
      invalidatePeople();
      toast('Profile saved');
      navigate(next || '/dashboard');
    } catch (e: any) {
      setErrors([`Couldn’t save: ${e?.message || 'network error'}.`]);
    } finally {
      setBusy(false);
    }
  };

  if (!profile)
    return (
      <div className="wrap wrap-narrow page stack" aria-busy="true">
        <div className="skeleton" style={{ height: 44, maxWidth: 480 }} />
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );

  return (
    <div className="wrap wrap-narrow page">
      <PageHead
        title={profile?.onboarded ? 'Edit your research passport' : 'Set up your research passport'}
        lede="This tailors projects and lessons to you, and becomes the public profile labs see when you apply."
      />
      {errors.length > 0 && (
        <div className="callout callout-margin" role="alert" style={{ marginBottom: 24 }}>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <form className="stack" style={{ ['--gap' as any]: '32px' }} onSubmit={submit} noValidate>
        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>About you</h2>
          <div className="form-grid">
            <Field label="Name" htmlFor="w-name">
              <input id="w-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Profile link" htmlFor="w-handle" hint={`thesia…/people/${handle || 'your-name'}`}>
              <input
                id="w-handle"
                className="input"
                value={handle}
                onChange={(e) => {
                  setHandleTouched(true);
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                }}
              />
            </Field>
          </div>
          <div className="field">
            <span className="field-label">Where you are now</span>
            <ToggleChips label="Level" options={LEVELS.map((l) => ({ id: l.id, label: l.label }))} value={level ? [level] : []} onChange={(v) => setLevel((v[v.length - 1] as Level) || '')} />
            {level === 'high-school' && (
              <span className="field-hint">
                While you’re at school your passport stays private: it isn’t listed in People or shown to the public. Your certificates can still be verified. <Link to="/safeguarding">How we keep students safe</Link>.
              </span>
            )}
          </div>
          <Field label="School, university or organisation" htmlFor="w-aff" hint="For example “BS Economics, LUMS” or “A Levels, Karachi Grammar School”.">
            <input id="w-aff" className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="City" htmlFor="w-city">
              <input id="w-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Country" htmlFor="w-country">
              <select id="w-country" className="select" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>What you’re into</h2>
          <div className="field">
            <span className="field-label">Fields</span>
            <ToggleChips label="Fields" options={FIELDS} value={fields} onChange={setFields} />
          </div>
          <Field label="Skills" htmlFor="w-skills" hint="Comma separated: tools, methods, languages. “Excel, survey design, Urdu, Python”.">
            <input id="w-skills" className="input" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </Field>
          <fieldset className="option-grid" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label" style={{ marginBottom: 8 }}>
              What you want from Thesia
            </legend>
            {GOALS.map((g) => (
              <label key={g} className="option">
                <input type="checkbox" checked={goals.includes(g)} onChange={(e) => setGoals((x) => (e.target.checked ? [...x, g] : x.filter((y) => y !== g)))} />
                <span>{g}</span>
              </label>
            ))}
          </fieldset>
          <div className="field">
            <span className="field-label">Open to</span>
            <ToggleChips label="Open to" options={OPEN_OPTIONS} value={openTo} onChange={setOpenTo} />
          </div>
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>Your public passport</h2>
          <Field label="Headline" htmlFor="w-head" hint="One line on what you work on or want to.">
            <input id="w-head" className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={160} placeholder="Economics student interested in microfinance and household finance" />
          </Field>
          <Field label="About" htmlFor="w-bio">
            <textarea id="w-bio" className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1200} />
          </Field>
          <div className="form-grid">
            <Field label="ORCID iD" htmlFor="w-orcid" hint={<a href="https://orcid.org/register" target="_blank" rel="noreferrer noopener">Get a free ORCID iD</a>}>
              <input id="w-orcid" className="input" value={orcid} onChange={(e) => setOrcid(e.target.value)} placeholder="0000-0000-0000-0000" />
            </Field>
            <Field label="Google Scholar" htmlFor="w-sch">
              <input id="w-sch" className="input" value={scholar} onChange={(e) => setScholar(e.target.value)} placeholder="https://" />
            </Field>
            <Field label="LinkedIn" htmlFor="w-li">
              <input id="w-li" className="input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Website or GitHub" htmlFor="w-web">
              <input id="w-web" className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </Field>
          </div>
        </section>
        <div className="cluster">
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save passport'}
          </button>
          {!profile?.onboarded && (
            <Link to={next || '/dashboard'} className="btn btn-ghost btn-lg">
              Skip for now
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
