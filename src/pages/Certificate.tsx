import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LuBadgeCheck, LuCircleAlert, LuLinkedin, LuPrinter } from 'react-icons/lu';
import { BrandMark, CopyButton, SamplePill } from '../components/ui';
import { BADGE_LABEL } from '../data/academy';
import { bootcampById } from '../data/bootcamps';
import { SITE_URL } from '../lib/config';
import { formatDate } from '../lib/format';
import { repo } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import type { Certificate as Cert } from '../lib/types';

function linkedInUrl(c: Cert, url: string) {
  const d = new Date(c.issuedAt);
  const p = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.kind === 'track' ? `${c.title} (Thesia Academy)` : `${c.title} (Thesia Bootcamp)`,
    organizationName: 'Thesia',
    issueYear: String(d.getUTCFullYear()),
    issueMonth: String(d.getUTCMonth() + 1),
    certUrl: url,
    certId: c.id,
  });
  return `https://www.linkedin.com/profile/add?${p.toString()}`;
}

export function VerifyForm({ initial = '' }: { initial?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initial);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) navigate(`/certificate/${encodeURIComponent(c)}`);
  };
  return (
    <form className="cluster no-print" onSubmit={submit} style={{ ['--gap' as any]: '8px' }}>
      <label htmlFor="verify-code" className="sr-only">
        Certificate ID
      </label>
      <input id="verify-code" className="input mono" style={{ maxWidth: 220 }} placeholder="TH-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn btn-secondary" type="submit">
        Verify
      </button>
    </form>
  );
}

export function CertificatePage() {
  const { id } = useParams();
  const [cert, setCert] = useState<Cert | null | undefined>(undefined);
  useEffect(() => {
    setCert(undefined);
    repo
      .getCertificate(id)
      .then(setCert)
      .catch(() => setCert(null));
  }, [id]);

  if (cert === undefined)
    return (
      <div className="wrap page" aria-busy="true">
        <div className="skeleton" style={{ height: 420, maxWidth: 860, margin: '0 auto' }} />
      </div>
    );

  if (cert === null)
    return (
      <div className="wrap wrap-narrow page stack">
        <h1>We couldn’t find that certificate</h1>
        <p className="muted">
          Check the ID, which looks like <span className="mono">TH-7K2Q-91XD</span>. Certificates issued by Thesia always open at a thesia address, never as an attachment.
        </p>
        <VerifyForm initial={id} />
      </div>
    );

  const url = `${SITE_URL}/certificate/${cert.id}`;
  const program = cert.kind === 'track' ? 'Thesia Academy track' : 'Thesia live bootcamp';
  const bootcamp = cert.kind === 'bootcamp' ? bootcampById(cert.refId) : null;

  return (
    <div className="wrap page stack" style={{ ['--gap' as any]: '24px' }}>
      <div className="cluster no-print" style={{ justifyContent: 'space-between', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <p className={`callout ${cert.revoked ? 'callout-margin' : ''}`} style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          {cert.revoked ? <LuCircleAlert aria-hidden="true" /> : <LuBadgeCheck aria-hidden="true" />}
          {cert.revoked ? (
            <span>
              <strong>This certificate was withdrawn.</strong> It is no longer valid.
            </span>
          ) : cert.isSample ? (
            <span>
              <strong>Sample certificate.</strong> This shows what a Thesia certificate looks like.
            </span>
          ) : (
            <span>
              <strong>Valid.</strong> Issued by Thesia to {cert.recipientName} on {formatDate(cert.issuedAt)}.
            </span>
          )}
        </p>
        {cert.isSample && <SamplePill />}
      </div>

      <article className="certificate" aria-label={`Certificate: ${cert.title}`}>
        <div className="certificate-inner">
          <header className="cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="brand" style={{ fontSize: '1.25rem' }}>
              <BrandMark size={30} />
              Thesia
            </span>
            <span className="mono xsmall" style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--margin)', fontWeight: 700 }}>
              Certificate of completion
            </span>
          </header>
          <div className="stack" style={{ ['--gap' as any]: '10px', margin: 'clamp(28px, 6vw, 64px) 0' }}>
            <p className="muted">This certifies that</p>
            <p className="certificate-name">{cert.recipientName}</p>
            <p className="muted">completed the {program}</p>
            <p className="certificate-title">
              <span className="hl">{cert.title}</span>
            </p>
            <p className="small muted">{cert.detail}</p>
            {bootcamp && <p className="small muted" style={{ maxWidth: '60ch' }}>Finished with: {bootcamp.deliverable}.</p>}
            {cert.kind === 'track' && BADGE_LABEL[cert.refId] && <p className="small muted">Every lesson ends with a quiz, and a lesson only counts once at least half the answers are right.</p>}
          </div>
          <footer className="certificate-foot">
            <div>
              <span className="xsmall faint">Issued</span>
              <strong>{formatDate(cert.issuedAt)}</strong>
            </div>
            <div>
              <span className="xsmall faint">Certificate ID</span>
              <strong className="mono">{cert.id}</strong>
            </div>
            <div>
              <span className="xsmall faint">Verify at</span>
              <strong className="small" style={{ overflowWrap: 'anywhere' }}>{url.replace(/^https?:\/\//, '')}</strong>
            </div>
          </footer>
        </div>
      </article>

      {!cert.revoked && (
        <div className="cluster no-print" style={{ justifyContent: 'center' }}>
          <a className="btn btn-primary" href={linkedInUrl(cert, url)} target="_blank" rel="noreferrer noopener">
            <LuLinkedin aria-hidden="true" /> Add to LinkedIn
          </a>
          <CopyButton text={url} label="Copy verification link" />
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <LuPrinter aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
      )}
      <div className="stack no-print" style={{ ['--gap' as any]: '8px', alignItems: 'center', textAlign: 'center' }}>
        <p className="small muted">Checking someone else’s certificate? Enter its ID.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <VerifyForm />
        </div>
        <p className="xsmall faint">
          <Link to={cert.kind === 'track' ? `/learn/${cert.refId}` : `/bootcamps/${cert.refId}`}>See what this {cert.kind === 'track' ? 'track' : 'bootcamp'} covers</Link>
        </p>
      </div>
    </div>
  );
}

export function CertificateVerify() {
  return (
    <div className="wrap wrap-narrow page stack">
      <h1>Verify a Thesia certificate</h1>
      <p className="muted">Every certificate has an ID like TH-7K2Q-91XD and its own page. Enter the ID to see who it was issued to, for what and when.</p>
      <VerifyForm />
    </div>
  );
}
