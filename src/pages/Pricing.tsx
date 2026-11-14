import { useState } from 'react';
import { LuCheck } from 'react-icons/lu';
import { CountryPicker } from '../components/CountryPicker';
import { PageHead, Seg } from '../components/ui';
import { BOOTCAMPS } from '../data/bootcamps';
import { useApp } from '../lib/app';
import { CHECKOUT_URLS } from '../lib/config';
import { PLANS, TIER_LABEL, TIER_MULTIPLIER, fairPrice, formatUsd, tierFor } from '../lib/pricing';
import { repo } from '../lib/repo';
import { Link } from '../lib/router';

export function Pricing() {
  const { country, user, profile, requireAuth, toast } = useApp();
  const [period, setPeriod] = useState<'month' | 'year'>('year');
  const tier = tierFor(country);
  const monthly = fairPrice(PLANS.pro.priceMonthlyUsd, country);
  const yearly = fairPrice(PLANS.pro.priceYearlyUsd, country);
  const checkout = CHECKOUT_URLS[period === 'year' ? 'pro-yearly' : 'pro-monthly'];

  const upgrade = async () => {
    if (!requireAuth('upgrade')) return;
    if (checkout) {
      const url = new URL(checkout);
      url.searchParams.set('checkout[email]', user!.email);
      url.searchParams.set('checkout[custom][user_id]', user!.id);
      window.location.href = url.toString();
      return;
    }
    await repo.submit({ kind: 'feedback', email: user!.email, country, payload: { type: 'pro-waitlist', period } });
    toast('You’re on the Scholar Pro list. We’ll email you when it opens, with a founding-member price.');
  };

  return (
    <div className="wrap page">
      <PageHead title="Free to start. Fair everywhere." lede="Everything a student needs to begin research is free. Pro and bootcamps are priced in US dollars and adjusted to your country’s income level.">
        <CountryPicker label="Prices for" id="pr-country" />
      </PageHead>

      <div className="cluster" style={{ marginBottom: 20 }}>
        <Seg
          label="Billing period"
          value={period}
          onChange={setPeriod}
          options={[
            { id: 'year', label: 'Yearly' },
            { id: 'month', label: 'Monthly' },
          ]}
        />
        {period === 'year' && <span className="small muted">Yearly saves about a quarter.</span>}
      </div>

      <div className="plans" style={{ marginBottom: 64 }}>
        <div className="panel plan">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>{PLANS.free.name}</h2>
          <p className="muted small">{PLANS.free.blurb}</p>
          <div className="price">
            <b>$0</b>
            <span className="small muted">forever</span>
          </div>
          <ul className="feature-list">
            {PLANS.free.features.map((f) => (
              <li key={f}>
                <LuCheck />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-secondary btn-block">
              {user ? 'You’re on Free' : 'Create a free account'}
            </Link>
          </div>
        </div>

        <div className="panel plan plan-featured">
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>{PLANS.pro.name}</h2>
            <span className="pill pill-mark">Most useful when applying</span>
          </div>
          <p className="muted small">{PLANS.pro.blurb}</p>
          <div className="price">
            <b>{formatUsd(period === 'year' ? yearly : monthly)}</b>
            <span className="small muted">per {period}</span>
            {tier !== 'A' && (
              <span className="small muted">
                <s>{formatUsd(period === 'year' ? PLANS.pro.priceYearlyUsd : PLANS.pro.priceMonthlyUsd)}</s>
              </span>
            )}
          </div>
          <p className="xsmall faint">
            {TIER_LABEL[tier]} for {country}.
          </p>
          <ul className="feature-list">
            {PLANS.pro.features.map((f) => (
              <li key={f}>
                <LuCheck />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'auto' }} className="stack">
            {profile?.plan === 'pro' ? (
              <span className="pill pill-open">You’re on Scholar Pro</span>
            ) : (
              <button className="btn btn-primary btn-block" onClick={upgrade}>
                {checkout ? `Upgrade for ${formatUsd(period === 'year' ? yearly : monthly)}` : 'Join the Pro list'}
              </button>
            )}
            {!checkout && <span className="xsmall faint">Pro opens after the beta. Join the list for a founding-member price.</span>}
          </div>
        </div>

        <div className="panel plan">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>{PLANS.institution.name}</h2>
          <p className="muted small">{PLANS.institution.blurb}</p>
          <div className="price">
            <b style={{ fontSize: 'var(--t-2xl)' }}>Custom</b>
            <span className="small muted">per year, by seats</span>
          </div>
          <ul className="feature-list">
            {PLANS.institution.features.map((f) => (
              <li key={f}>
                <LuCheck />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link to="/institutions#contact" className="btn btn-secondary btn-block">
              Talk to us
            </Link>
          </div>
        </div>
      </div>

      <section className="stack" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Bootcamp prices in {country}</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Bootcamp</th>
                <th>Length</th>
                <th>List price</th>
                <th>Your price</th>
              </tr>
            </thead>
            <tbody>
              {BOOTCAMPS.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link to={`/bootcamps/${b.id}`}>{b.title}</Link>
                    {b.b2b ? <span className="xsmall faint"> (per student, via school)</span> : null}
                  </td>
                  <td>{b.weeks} weeks</td>
                  <td>{formatUsd(b.priceUsd)}</td>
                  <td>
                    <strong>{formatUsd(fairPrice(b.priceUsd, country))}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="split" style={{ gap: 40 }}>
        <h2 style={{ fontSize: 'var(--t-xl)' }}>Questions about paying</h2>
        <div style={{ maxWidth: 720 }}>
          <details className="faq" open>
            <summary>How does fair pricing work?</summary>
            <p>
              Prices are multiplied by a factor for your country’s World Bank income group: high income {TIER_MULTIPLIER.A * 100}%, upper-middle {TIER_MULTIPLIER.B * 100}%, lower-middle {TIER_MULTIPLIER.C * 100}%,
              low income {TIER_MULTIPLIER.D * 100}%. Pakistan is lower-middle income, so students there pay 30% of the list price.
            </p>
          </details>
          <details className="faq">
            <summary>How do I pay?</summary>
            <p>
              By card, in US dollars, through a secure checkout run by our payment provider, which handles receipts and taxes. Local payment methods for Pakistan are on the roadmap.
            </p>
          </details>
          <details className="faq">
            <summary>Can I get a refund?</summary>
            <p>Bootcamps are fully refundable until the second session. Scholar Pro can be cancelled any time and stays active until the end of the period you paid for.</p>
          </details>
          <details className="faq">
            <summary>What if I can’t pay at all?</summary>
            <p>Every free feature stays free. For bootcamps, apply for a scholarship covering up to 100% of the fee.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
