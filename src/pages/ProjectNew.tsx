import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Field, PageHead, Seg, ToggleChips } from '../components/ui';
import { COUNTRIES } from '../data/countries';
import { useApp } from '../lib/app';
import { repo } from '../lib/repo';
import { Link, useNavigate } from '../lib/router';
import { uid } from '../lib/storage';
import { CREDIT_ROLES, FIELDS, LEVELS, type CreditRole, type FieldId, type Level, type Project, type ProjectRole } from '../lib/types';
import { invalidateProjects } from '../lib/useData';

const TEMPLATE = `Describe the problem in two or three sentences, and why it matters here.

**What we will do**
- Step one
- Step two
- What you will share at the end (paper, dataset, report, map)

**What you will learn:** the skills and methods a contributor will practise.`;

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const blankRole = (): ProjectRole => ({ id: uid('r'), credit: 'investigation', title: '', description: '', spots: 2, skills: [] });

export function ProjectNew() {
  const { user, profile, requireAuth, toast } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState(TEMPLATE);
  const [fields, setFields] = useState<FieldId[]>([]);
  const [levels, setLevels] = useState<Level[]>(['undergrad']);
  const [tags, setTags] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  const [country, setCountry] = useState(profile?.country || 'Pakistan');
  const [mode, setMode] = useState<Project['mode']>('remote');
  const [hours, setHours] = useState(5);
  const [weeks, setWeeks] = useState(10);
  const [comp, setComp] = useState<Project['compensation']>('unpaid');
  const [stipend, setStipend] = useState('');
  const [roles, setRoles] = useState<ProjectRole[]>([blankRole()]);
  const [leadName, setLeadName] = useState(profile?.name || '');
  const [leadAff, setLeadAff] = useState(profile?.affiliation || '');
  const [ethics, setEthics] = useState<Project['ethics']>('not-required');
  const [credit, setCredit] = useState('Authorship follows contribution: contributors who meet journal criteria are co-authors, and everyone is listed with their CRediT role.');
  const [applyBy, setApplyBy] = useState(addDays(21));
  const [startDate, setStartDate] = useState(addDays(30));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setLeadName((n) => n || profile.name);
      setLeadAff((a) => a || profile.affiliation);
      setCity((c) => c || profile.city);
    }
  }, [profile]);

  const updateRole = (id: string, patch: Partial<ProjectRole>) => setRoles((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireAuth('post')) return;
    const errs: string[] = [];
    if (title.trim().length < 10) errs.push('Give the project a specific title (at least 10 characters).');
    if (summary.trim().length < 20) errs.push('Write a one-sentence summary (at least 20 characters).');
    if (!fields.length) errs.push('Choose at least one field.');
    if (!levels.length) errs.push('Choose who can apply.');
    if (mode !== 'remote' && !city.trim()) errs.push('Add a city for on-site or hybrid projects.');
    if (roles.some((r) => !r.title.trim() || !r.description.trim())) errs.push('Every role needs a title and a description.');
    if (!leadName.trim()) errs.push('Add the project lead’s name.');
    if (applyBy > startDate) errs.push('The application deadline should be before the start date.');
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true);
    try {
      const p = await repo.createProject(
        {
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          fields,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          levels,
          city: mode === 'remote' ? 'Remote' : city.trim(),
          country,
          mode,
          hoursPerWeek: hours,
          durationWeeks: weeks,
          compensation: comp,
          stipend: comp === 'paid' || comp === 'stipend' ? stipend.trim() || undefined : undefined,
          roles: roles.map((r) => ({ ...r, title: r.title.trim(), description: r.description.trim() })),
          lead: { name: leadName.trim(), handle: profile?.handle || undefined, affiliation: leadAff.trim() },
          ethics,
          credit: credit.trim(),
          applyBy,
          startDate,
        },
        user!.id
      );
      invalidateProjects();
      toast('Project published');
      navigate(`/projects/${p.id}`);
    } catch (e: any) {
      setErrors([`Couldn’t publish: ${e?.message || 'network error'}.`]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap wrap-narrow page">
      <PageHead
        crumbs={[{ to: '/projects', label: 'Projects' }]}
        title="Post a research project"
        lede="Describe the work, split it into roles, and say how people will be credited. Students apply for a specific role, so be concrete."
      />
      {!user && (
        <p className="callout" style={{ marginBottom: 24 }}>
          You can draft here now. <Link to="/signin?next=/projects/new">Sign in</Link> before publishing so applications reach you.
        </p>
      )}
      {errors.length > 0 && (
        <div className="callout callout-margin" role="alert" style={{ marginBottom: 24 }}>
          <strong>Fix these before publishing:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: '1.2em' }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <form className="stack" style={{ ['--gap' as any]: '32px' }} onSubmit={submit} noValidate>
        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>The project</h2>
          <Field label="Title" htmlFor="t" hint="Say what you will study, where. “Heat stress among Karachi’s delivery riders” beats “Health research”.">
            <input id="t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </Field>
          <Field label="One-sentence summary" htmlFor="s">
            <input id="s" className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} />
          </Field>
          <Field label="Description" htmlFor="d" hint="Markdown works: **bold**, lists with “-”.">
            <textarea id="d" className="textarea" rows={10} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={8000} />
          </Field>
          <div className="field">
            <span className="field-label">Fields</span>
            <ToggleChips label="Fields" options={FIELDS} value={fields} onChange={setFields} />
          </div>
          <Field label="Keywords" htmlFor="tags" hint="Comma separated. Helps students find you in search.">
            <input id="tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="air pollution, time series, Lahore" />
          </Field>
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>Who, where and how much</h2>
          <div className="field">
            <span className="field-label">Who can apply</span>
            <ToggleChips label="Levels" options={LEVELS.slice(0, 5).map((l) => ({ id: l.id, label: l.short }))} value={levels} onChange={setLevels} />
          </div>
          <div className="field">
            <span className="field-label">Work mode</span>
            <Seg
              label="Work mode"
              value={mode}
              onChange={setMode}
              options={[
                { id: 'remote', label: 'Remote' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'onsite', label: 'On site' },
              ]}
            />
          </div>
          <div className="form-grid">
            <Field label="City" htmlFor="city">
              <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={mode === 'remote'} placeholder={mode === 'remote' ? 'Not needed for remote' : 'Lahore'} />
            </Field>
            <Field label="Country" htmlFor="country">
              <select id="country" className="select" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Hours per week" htmlFor="hours">
              <input id="hours" className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} />
            </Field>
            <Field label="Length in weeks" htmlFor="weeks">
              <input id="weeks" className="input" type="number" min={1} max={104} value={weeks} onChange={(e) => setWeeks(Number(e.target.value) || 1)} />
            </Field>
          </div>
          <div className="field">
            <span className="field-label">Pay and credit</span>
            <Seg
              label="Compensation"
              value={comp}
              onChange={setComp}
              options={[
                { id: 'unpaid', label: 'Volunteer' },
                { id: 'stipend', label: 'Stipend' },
                { id: 'paid', label: 'Paid' },
                { id: 'course-credit', label: 'Course credit' },
              ]}
            />
          </div>
          {(comp === 'paid' || comp === 'stipend') && (
            <Field label="Amount" htmlFor="stipend" hint="For example “PKR 15,000 per month” or “PKR 300 per completed survey”.">
              <input id="stipend" className="input" value={stipend} onChange={(e) => setStipend(e.target.value)} />
            </Field>
          )}
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>Roles</h2>
          <p className="muted small">Each role uses a CRediT contributor role, so contributors get specific, recognised credit.</p>
          {roles.map((r, i) => (
            <div key={r.id} className="panel stack">
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <strong>Role {i + 1}</strong>
                {roles.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRoles((rs) => rs.filter((x) => x.id !== r.id))}>
                    <LuTrash2 /> Remove
                  </button>
                )}
              </div>
              <div className="form-grid">
                <Field label="Role title" htmlFor={`rt-${r.id}`}>
                  <input id={`rt-${r.id}`} className="input" value={r.title} onChange={(e) => updateRole(r.id, { title: e.target.value })} placeholder="Survey enumerator" />
                </Field>
                <Field label="CRediT role" htmlFor={`rc-${r.id}`} hint={CREDIT_ROLES.find((c) => c.id === r.credit)?.hint}>
                  <select id={`rc-${r.id}`} className="select" value={r.credit} onChange={(e) => updateRole(r.id, { credit: e.target.value as CreditRole })}>
                    {CREDIT_ROLES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Spots" htmlFor={`rs-${r.id}`}>
                  <input id={`rs-${r.id}`} className="input" type="number" min={1} max={50} value={r.spots} onChange={(e) => updateRole(r.id, { spots: Number(e.target.value) || 1 })} />
                </Field>
              </div>
              <Field label="What this person will do" htmlFor={`rd-${r.id}`}>
                <input id={`rd-${r.id}`} className="input" value={r.description} onChange={(e) => updateRole(r.id, { description: e.target.value })} />
              </Field>
              <Field label="Skills that help" htmlFor={`rk-${r.id}`} hint="Comma separated.">
                <input
                  id={`rk-${r.id}`}
                  className="input"
                  value={r.skills.join(', ')}
                  onChange={(e) => updateRole(r.id, { skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                />
              </Field>
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-secondary" onClick={() => setRoles((rs) => [...rs, blankRole()])}>
              <LuPlus /> Add a role
            </button>
          </div>
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>Lead, ethics and dates</h2>
          <div className="form-grid">
            <Field label="Project lead" htmlFor="ln">
              <input id="ln" className="input" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
            </Field>
            <Field label="Lead’s role or affiliation" htmlFor="la">
              <input id="la" className="input" value={leadAff} onChange={(e) => setLeadAff(e.target.value)} placeholder="Lecturer, Economics" />
            </Field>
          </div>
          <fieldset className="option-grid" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label" style={{ marginBottom: 8 }}>
              Ethics
            </legend>
            {(
              [
                ['not-required', 'No human participants', 'No data is collected from or about people.'],
                ['approved', 'Approved', 'An ethics committee has approved the study.'],
                ['in-review', 'In review', 'Approval is pending; no data collection until approved.'],
              ] as const
            ).map(([id, label, hint]) => (
              <label key={id} className="option">
                <input type="radio" name="ethics" checked={ethics === id} onChange={() => setEthics(id)} />
                <span>
                  <strong>{label}</strong>
                  <span className="faint">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Field label="How contributors are credited" htmlFor="cr">
            <textarea id="cr" className="textarea" rows={3} value={credit} onChange={(e) => setCredit(e.target.value)} style={{ minHeight: 80 }} />
          </Field>
          <div className="form-grid">
            <Field label="Applications close" htmlFor="ab">
              <input id="ab" className="input" type="date" value={applyBy} onChange={(e) => setApplyBy(e.target.value)} />
            </Field>
            <Field label="Project starts" htmlFor="sd">
              <input id="sd" className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
          </div>
        </section>

        <div className="cluster">
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish project'}
          </button>
          <Link to="/projects" className="btn btn-ghost btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
