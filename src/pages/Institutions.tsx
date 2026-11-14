import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import { Field, PageHead } from '../components/ui';
import { COUNTRIES } from '../data/countries';
import { useApp } from '../lib/app';
import { isEmail } from '../lib/format';
import { fairPrice, formatUsd } from '../lib/pricing';
import { repo, type SubmissionKind } from '../lib/repo';
import { Link } from '../lib/router';
import { bootcampById } from '../data/bootcamps';

type FieldDef = { id: string; label: string; type?: 'text' | 'email' | 'textarea' | 'select'; options?: string[]; required?: boolean; hint?: string };

export function SubmitForm({ kind, fields, cta, done }: { kind: SubmissionKind; fields: FieldDef[]; cta: string; done: string }) {
  const { user, country, toast } = useApp();
  const [values, setValues] = useState<Record<string, string>>(() => ({ email: user?.email || '', country }));
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (user?.email) setValues((v) => (v.email ? v : { ...v, email: user.email }));
  }, [user?.email]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && !values[f.id]?.trim());
    if (missing.length) return setErr(`Please fill in: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.`);
    if (!isEmail(values.email || '')) return setErr('Enter a valid email address.');
    setErr('');
    try {
      const { email, name, country: c, ...rest } = values;
      await repo.submit({ kind, email: email.trim(), name: name?.trim(), country: c, payload: rest });
      setSent(true);
      toast('Sent. We reply within three working days.');
    } catch (e: any) {
      setErr(`Couldn’t send: ${e?.message || 'network error'}.`);
    }
  };
  if (sent) return <p className="callout">{done}</p>;
  return (
    <form className="stack" onSubmit={submit} style={{ ['--gap' as any]: '14px' }}>
      <div className="form-grid">
        {fields
          .filter((f) => f.type !== 'textarea')
          .map((f) => (
            <Field key={f.id} label={f.label} htmlFor={`${kind}-${f.id}`} hint={f.hint}>
              {f.type === 'select' ? (
                <select id={`${kind}-${f.id}`} className="select" value={values[f.id] || ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}>
                  <option value="">Choose…</option>
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input id={`${kind}-${f.id}`} className="input" type={f.type || 'text'} value={values[f.id] || ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
              )}
            </Field>
          ))}
      </div>
      {fields
        .filter((f) => f.type === 'textarea')
        .map((f) => (
          <Field key={f.id} label={f.label} htmlFor={`${kind}-${f.id}`} hint={f.hint}>
            <textarea id={`${kind}-${f.id}`} className="textarea" value={values[f.id] || ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
          </Field>
        ))}
      {err && (
        <p className="field-error" role="alert">
          {err}
        </p>
      )}
      <div>
        <button className="btn btn-primary" type="submit">
          {cta}
        </button>
      </div>
    </form>
  );
}

function Block({ id, title, children, aside }: { id: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="section" style={{ scrollMarginTop: 80 }}>
      <div className="split" style={{ gap: 40 }}>
        <div className="stack" style={{ ['--gap' as any]: '10px' }}>
          <h2 style={{ fontSize: 'var(--t-2xl)' }}>{title}</h2>
          {aside}
        </div>
        <div className="stack" style={{ ['--gap' as any]: '18px', maxWidth: 760 }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export function Institutions() {
  const { country } = useApp();
  const yrp = bootcampById('young-researchers')!;
  return (
    <div className="wrap page">
      <PageHead title="Bring research to your institution" lede="Schools, universities, labs and companies use Thesia to give students real research experience, find research assistants, and get useful answers to real questions." />

      <Block id="schools" title="Schools" aside={<p className="muted small">O and A Level, Matric and FSc</p>}>
        <p className="lede" style={{ fontSize: 'var(--t-md)' }}>
          The <Link to={`/bootcamps/${yrp.id}`}>{yrp.title}</Link> runs over {yrp.weeks} weeks with your students in squads of four. Each squad presents a poster at a showcase, and every student leaves with a
          research passport listing what they did.
        </p>
        <ul className="feature-list">
          <li>
            <LuCheck />
            <span>Delivered by Thesia mentors alongside one of your teachers, on campus or online.</span>
          </li>
          <li>
            <LuCheck />
            <span>Safe research topics, consent forms and guardian permissions handled for you.</span>
          </li>
          <li>
            <LuCheck />
            <span>
              {formatUsd(fairPrice(yrp.priceUsd, country))} per student in {country}, with scholarship seats for students who can’t pay.
            </span>
          </li>
          <li>
            <LuCheck />
            <span>Students join with your school’s invite link. Your coordinator gets a live dashboard of progress and a CSV export for reports.</span>
          </li>
        </ul>
        <div className="cluster">
          <Link to="/org/sample" className="btn btn-secondary">
            See a sample school dashboard
          </Link>
          <Link to="/safeguarding" className="small">
            How we keep students safe
          </Link>
        </div>
      </Block>

      <Block id="universities" title="Universities and research offices">
        <p className="muted">Give every student a structured way into research, and give your faculty a pipeline of prepared assistants.</p>
        <div className="grid" style={{ ['--min' as any]: '220px' }}>
          {[
            ['Licensed seats', 'Academy assessments and Scholar Pro for a whole cohort, with a dashboard for your ORIC or department.'],
            ['Lab showcase', 'Your labs listed with themes, open roles and how students join.'],
            ['Research assistant pipeline', 'Post RA roles and see applicants’ verified contribution records.'],
            ['Evidence for accreditation', 'Reports on student research participation for QA, ORIC and funders.'],
          ].map(([t, d]) => (
            <div key={t} className="card">
              <h3 style={{ fontSize: 'var(--t-md)', fontFamily: 'var(--font-body)' }}>{t}</h3>
              <p className="small muted">{d}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block id="companies" title="Companies: industry research challenges">
        <p className="muted">
          Most Pakistani firms report no R&amp;D, and little university research reaches industry. Post a real question your business faces, such as why customers churn, where a supply chain leaks or how
          a new product might land. A supervised student squad delivers a research report in eight weeks.
        </p>
        <ul className="feature-list">
          <li>
            <LuCheck />
            <span>You fund a prize pool or scholarship seats; Thesia handles recruitment, supervision and ethics.</span>
          </li>
          <li>
            <LuCheck />
            <span>You meet motivated students through their work, before you hire.</span>
          </li>
        </ul>
        <div>
          <Link to="/challenges" className="btn btn-secondary">
            How research challenges work
          </Link>
        </div>
      </Block>

      <Block id="funders" title="Incubators, funders and NGOs">
        <p className="muted">
          Partner on country launches, sponsor scholarship seats, or co-run a research challenge on a public problem such as air quality, heat or water. We share anonymised participation and outcome data
          with partners.
        </p>
      </Block>

      <Block id="contact" title="Talk to us" aside={<p className="muted small">We reply within three working days.</p>}>
        <SubmitForm
          kind="institution"
          cta="Send enquiry"
          done="Thanks. We’ll be in touch within three working days."
          fields={[
            { id: 'name', label: 'Your name', required: true },
            { id: 'email', label: 'Work email', type: 'email', required: true },
            { id: 'organisation', label: 'Organisation', required: true },
            { id: 'type', label: 'Type', type: 'select', options: ['School', 'University or research office', 'Company', 'Incubator or funder', 'NGO or government', 'Other'], required: true },
            { id: 'country', label: 'Country', type: 'select', options: COUNTRIES.map((c) => c.name) },
            { id: 'message', label: 'What would you like to do?', type: 'textarea' },
          ]}
        />
      </Block>

      <Block id="teach" title="Teach a bootcamp" aside={<p className="muted small">Paid per cohort</p>}>
        <p className="muted">We’re looking for researchers with peer-reviewed publications who enjoy teaching. Bootcamps are live, small and practical.</p>
        <SubmitForm
          kind="teach"
          cta="Apply to teach"
          done="Thanks for applying. We’ll review your work and reply within a week."
          fields={[
            { id: 'name', label: 'Your name', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'field', label: 'Your field', required: true },
            { id: 'profile', label: 'Google Scholar, ORCID or website', hint: 'So we can read your work.' },
            { id: 'topic', label: 'What would you teach?', type: 'textarea' },
          ]}
        />
      </Block>

      <Block id="ambassadors" title="Campus ambassadors" aside={<p className="muted small">One or two per university</p>}>
        <p className="muted">
          Ambassadors run Thesia reading groups and research launch sessions on their campus, and get free Scholar Pro, bootcamp seats and a letter of recommendation after a full semester.
        </p>
        <SubmitForm
          kind="ambassador"
          cta="Apply to be an ambassador"
          done="Thanks. We’ll invite shortlisted applicants to a short call."
          fields={[
            { id: 'name', label: 'Your name', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'university', label: 'University or school', required: true },
            { id: 'city', label: 'City', required: true },
            { id: 'why', label: 'What would you run on your campus?', type: 'textarea' },
          ]}
        />
      </Block>
    </div>
  );
}
