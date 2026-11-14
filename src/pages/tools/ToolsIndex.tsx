import { PageHead } from '../../components/ui';
import { Link } from '../../lib/router';

export const TOOLS = [
  { to: '/tools/question-builder', title: 'Research question builder', text: 'Turn a topic into a focused question that names who, where, when and what you will measure, then check it against FINER.', lesson: 'Asking a question' },
  { to: '/tools/legit-check', title: 'Legit Check', text: 'Screen a journal or conference invitation for the warning signs of predatory publishing before you pay or submit.', lesson: 'Publishing' },
  { to: '/tools/outreach', title: 'Outreach email composer', text: 'Write a short, specific email to a researcher that gets read, with checks for the phrases that get ignored.', lesson: 'Getting in' },
  { to: '/tools/sample-size', title: 'Sample size calculator', text: 'Work out how many survey responses you need for a proportion or a mean, with corrections for small populations and non-response.', lesson: 'Methods' },
  { to: '/tools/citation', title: 'Citation builder', text: 'Format references for articles, books, web pages and conference papers in APA, MLA, Chicago, Harvard and IEEE.', lesson: 'Writing' },
  { to: '/tools/consent-form', title: 'Consent form builder', text: 'Draft a plain-language informed consent form, including a guardian section for participants under 18.', lesson: 'Ethics' },
];

export function ToolsIndex() {
  return (
    <div className="wrap page">
      <PageHead title="Research tools" lede="Free tools for the parts of research that trip students up. They run in your browser; nothing you type is sent anywhere." />
      <div className="grid" style={{ ['--min' as any]: '320px' }}>
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="card card-link">
            <span className="small faint">{t.lesson}</span>
            <h3 style={{ fontSize: 'var(--t-xl)' }}>{t.title}</h3>
            <p className="muted small">{t.text}</p>
          </Link>
        ))}
        <Link to="/guide" className="card card-link" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
          <span className="small" style={{ opacity: 0.75 }}>
            Guide
          </span>
          <h3 style={{ fontSize: 'var(--t-xl)', color: 'var(--paper)' }}>Ask the research guide</h3>
          <p className="small" style={{ opacity: 0.85 }}>
            Describe your idea or where you’re stuck. The guide points you to projects, lessons and tools on Thesia.
          </p>
        </Link>
      </div>
    </div>
  );
}

export function ToolHead({ title, lede }: { title: string; lede: string }) {
  return <PageHead crumbs={[{ to: '/tools', label: 'Tools' }]} title={title} lede={lede} />;
}
