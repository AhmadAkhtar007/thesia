import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LuCalendar, LuClock, LuUsers } from 'react-icons/lu';
import { CountryPicker } from '../components/CountryPicker';
import { BootcampCard } from '../components/rows';
import { Field, PageHead, Sheet } from '../components/ui';
import { BOOTCAMPS, bootcampById } from '../data/bootcamps';
import { useApp } from '../lib/app';
import { CHECKOUT_URLS } from '../lib/config';
import { formatDate, relativeDays } from '../lib/format';
import { TIER_LABEL, fairPrice, formatUsd, tierFor } from '../lib/pricing';
import { repo } from '../lib/repo';
import { Link, useParams } from '../lib/router';
import { fieldLabel, levelLabel, type Enrollment } from '../lib/types';
import { hasCohortAccess } from './Cohort';
import { NotFound } from './NotFound';

export function Bootcamps() {
  return (
    <div className="wrap page">
      <PageHead
        title="Live research bootcamps"
        lede="Small cohorts that finish with something real: a proposal, a dataset, a paper or a poster. Taught live by people who do research for a living."
      >
        <CountryPicker label="Prices for" id="bc-country" />
      </PageHead>
      <div className="grid" style={{ ['--min' as any]: '310px', marginBottom: 56 }}>
        {BOOTCAMPS.map((b) => (
          <BootcampCard key={b.id} b={b} />
        ))}
      </div>
      <section className="split" style={{ gap: 40 }}>
        <div className="stack">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>How pricing works</h2>
        </div>
        <div className="stack" style={{ maxWidth: 720 }}>
          <details className="faq" open>
            <summary>Why do prices change by country?</summary>
            <p>
              We charge in US dollars, adjusted to the income level of your country, so a bootcamp costs a similar share of local income wherever you live. Students in Pakistan pay 70% less than the list
              price. The adjustment uses the World Bank’s country income groups.
            </p>
          </details>
          <details className="faq">
            <summary>What if I can’t afford it?</summary>
            <p>Apply for a scholarship on any paid bootcamp. Scholarships cover 25%, 50%, 75% or 100% of the fee, and we read every application.</p>
          </details>
          <details className="faq">
            <summary>Who teaches?</summary>
            <p>
              Researchers with peer-reviewed publications and experience supervising students. Each cohort’s faculty is announced once the cohort confirms. Want to teach? <Link to="/institutions#teach">Apply to teach</Link>.
            </p>
          </details>
          <details className="faq">
            <summary>Do I get a certificate?</summary>
            <p>
              Yes. When you finish, you get a certificate with its own verification page that you can add to LinkedIn in one click. More useful still is the output you made, which goes on your research passport with
              your CRediT roles.
            </p>
          </details>
          <details className="faq">
            <summary>Can my school or university run one?</summary>
            <p>
              Yes. Schools and universities can buy seats for a whole cohort or run the Young Researchers Programme on campus. <Link to="/institutions">See options for institutions</Link>.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}

export function BootcampDetail() {
  const { id } = useParams();
  const b = bootcampById(id);
  const { user, country, requireAuth, toast } = useApp();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [scholarship, setScholarship] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !b) return setEnrollment(null);
    repo.myEnrollments(user.id).then((es) => setEnrollment(es.find((e) => e.bootcampId === b.id) || null));
  }, [user, b]);

  if (!b) return <NotFound />;
  const price = fairPrice(b.priceUsd, country);
  const tier = tierFor(country);
  const checkout = CHECKOUT_URLS[b.id];

  const reserve = async () => {
    if (!requireAuth('enroll')) return;
    setBusy(true);
    try {
      const e = await repo.enroll({ bootcampId: b.id, userId: user!.id, status: 'reserved', priceUsd: price });
      setEnrollment(e);
      if (price > 0 && checkout) {
        const url = new URL(checkout);
        url.searchParams.set('checkout[email]', user!.email);
        url.searchParams.set('checkout[custom][user_id]', user!.id);
        url.searchParams.set('checkout[custom][bootcamp_id]', b.id);
        window.location.href = url.toString();
        return;
      }
      toast(price === 0 ? 'Seat reserved. We’ll email joining details before the first session.' : 'Seat reserved. We’ll email your payment link when the cohort confirms.');
    } catch (e: any) {
      toast(`Couldn’t reserve: ${e?.message || 'network error'}`);
    } finally {
      setBusy(false);
    }
  };

  const statusText: Record<Enrollment['status'], string> = {
    reserved: price === 0 ? 'Your seat is reserved' : 'Seat reserved, payment pending',
    paid: 'You’re enrolled',
    confirmed: 'Your seat is confirmed',
    completed: 'You finished this bootcamp',
    'scholarship-applied': 'Scholarship application received',
    waitlist: 'You’re on the waitlist',
  };
  const access = hasCohortAccess(enrollment, b);

  return (
    <div className="wrap page">
      <div className="split split-right">
        <article className="stack min0" style={{ ['--gap' as any]: '32px' }}>
          <PageHead crumbs={[{ to: '/bootcamps', label: 'Bootcamps' }]} title={b.title} lede={b.tagline}>
            <div className="ledger-meta" style={{ fontSize: 'var(--t-md)' }}>
              <span>
                <LuCalendar /> Starts {formatDate(b.start)} ({relativeDays(b.start)})
              </span>
              <span>
                <LuClock /> {b.weeks} weeks, {b.hoursPerWeek} hours a week
              </span>
              <span>
                <LuUsers /> {b.seats} seats{b.b2b ? ' per school' : ''}
              </span>
            </div>
          </PageHead>

          <section className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>What you’ll finish with</h2>
            <p className="lede" style={{ fontSize: 'var(--t-md)' }}>
              {b.deliverable}.
            </p>
          </section>

          <section className="stack">
            <h2 style={{ fontSize: 'var(--t-xl)' }}>Week by week</h2>
            <ol className="lesson-list">
              {b.syllabus.map((w, i) => (
                <li key={w.title}>
                  <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 12, padding: '14px 4px', borderBottom: '1px solid var(--rule)' }}>
                    <span className="lesson-num">{i + 1}</span>
                    <span>
                      <strong>{w.title}</strong>
                      <span className="small muted" style={{ display: 'block' }}>
                        {w.outcome}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="form-grid" style={{ gap: 28 }}>
            <div className="stack" style={{ ['--gap' as any]: '8px' }}>
              <h3>Who it’s for</h3>
              <p className="muted">{b.forWhom}</p>
              <p className="small faint">
                Levels: {b.levels.map(levelLabel).join(', ')}. Fields: {b.fields === 'all' ? 'all' : b.fields.map(fieldLabel).join(', ')}.
              </p>
            </div>
            <div className="stack" style={{ ['--gap' as any]: '8px' }}>
              <h3>Format</h3>
              <p className="muted">{b.format}.</p>
            </div>
            <div className="stack" style={{ ['--gap' as any]: '8px' }}>
              <h3>Teaching</h3>
              <p className="muted">{b.instructorBrief}</p>
            </div>
          </section>
        </article>

        <aside className="stack" style={{ alignContent: 'start' }}>
          <div className="panel stack plan-featured" style={{ ['--gap' as any]: '14px' }}>
            <div className="price">
              <b>{formatUsd(price)}</b>
              {price !== b.priceUsd && b.priceUsd > 0 && (
                <span className="small muted">
                  <s>{formatUsd(b.priceUsd)}</s>
                </span>
              )}
            </div>
            {b.priceUsd > 0 && (
              <p className="small muted">
                {TIER_LABEL[tier]} for {country}. Paid in US dollars{b.b2b ? ', per student, usually through your school' : ''}.
              </p>
            )}
            <CountryPicker label="Country" id="bc-detail-country" />
            {enrollment ? (
              <>
                <p className="callout">
                  <strong>{statusText[enrollment.status]}.</strong> {access ? 'Joining links, weekly work and feedback are in your cohort space.' : `We’ll email ${user?.email} before the cohort starts.`}
                </p>
                {access && (
                  <Link to={`/bootcamps/${b.id}/cohort`} className="btn btn-primary btn-block">
                    Open your cohort space
                  </Link>
                )}
              </>
            ) : b.b2b ? (
              <>
                <Link to="/institutions#schools" className="btn btn-primary btn-block">
                  Bring this to your school
                </Link>
                <button className="btn btn-secondary btn-block" onClick={reserve} disabled={busy}>
                  Register interest as a student
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-block btn-lg" onClick={reserve} disabled={busy}>
                {busy ? 'Reserving…' : price === 0 ? 'Reserve a free seat' : checkout ? `Pay ${formatUsd(price)} and enrol` : 'Reserve a seat'}
              </button>
            )}
            {b.scholarship && !enrollment && b.priceUsd > 0 && (
              <button className="btn btn-ghost btn-block" onClick={() => requireAuth('scholarship') && setScholarship(true)}>
                Apply for a scholarship
              </button>
            )}
            {price > 0 && !checkout && !enrollment && <p className="xsmall faint">No payment now. We’ll send a secure payment link when the cohort confirms.</p>}
          </div>
        </aside>
      </div>
      <ScholarshipSheet open={scholarship} onClose={() => setScholarship(false)} bootcampId={b.id} price={price} onDone={(e) => setEnrollment(e)} />
    </div>
  );
}

function ScholarshipSheet({ open, onClose, bootcampId, price, onDone }: { open: boolean; onClose: () => void; bootcampId: string; price: number; onDone: (e: Enrollment) => void }) {
  const { user, country, toast } = useApp();
  const [share, setShare] = useState(50);
  const [why, setWhy] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (why.trim().length < 60) return setErr('Tell us a little more (at least 60 characters).');
    if (!user) return;
    try {
      await repo.submit({ kind: 'scholarship', email: user.email, name: user.name, country, payload: { bootcampId, share, why: why.trim(), price } });
      const en = await repo.enroll({ bootcampId, userId: user.id, status: 'scholarship-applied', priceUsd: Math.round(price * (1 - share / 100)) });
      onDone(en);
      onClose();
      toast('Scholarship application sent');
    } catch (e: any) {
      setErr(`Couldn’t send: ${e?.message || 'network error'}.`);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Apply for a scholarship">
      <form className="stack" onSubmit={submit}>
        <fieldset className="option-grid" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label" style={{ marginBottom: 8 }}>
            How much of the fee should it cover?
          </legend>
          {[25, 50, 75, 100].map((s) => (
            <label key={s} className="option">
              <input type="radio" name="share" checked={share === s} onChange={() => setShare(s)} />
              <span>
                <strong>{s}%</strong>
                <span className="faint">You’d pay {formatUsd(Math.round(price * (1 - s / 100)))}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Field label="Why this bootcamp, and what makes paying hard right now" htmlFor="sch-why" error={err} hint="Kept private. We don’t ask for documents at this stage.">
          <textarea id="sch-why" className="textarea" value={why} onChange={(e) => setWhy(e.target.value)} maxLength={1500} />
        </Field>
        <div className="cluster">
          <button className="btn btn-primary" type="submit">
            Send application
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
}
