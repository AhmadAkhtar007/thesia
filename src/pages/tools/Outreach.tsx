import { useMemo, useState } from 'react';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { CopyButton, Field, Seg } from '../../components/ui';
import { useApp } from '../../lib/app';
import { SITE_URL } from '../../lib/config';
import { Link } from '../../lib/router';
import { ToolHead } from './ToolsIndex';

type Ask = 'call' | 'ra' | 'project' | 'advice';

const ASKS: { id: Ask; label: string; line: (h: number) => string }[] = [
  { id: 'call', label: 'A short call', line: () => 'Would you be open to a 15-minute call in the next few weeks, at a time that suits you?' },
  { id: 'ra', label: 'An RA role', line: (h) => `Do you have room for a research assistant this semester? I can give about ${h} hours a week.` },
  { id: 'project', label: 'Join a project', line: (h) => `Could I help on this work? I can give about ${h} hours a week and I’m happy to start with a small task.` },
  { id: 'advice', label: 'One question', line: () => 'If you have a moment, I’d be grateful for your view on one question:' },
];

const WEAK = [
  { re: /passionate|passion/i, tip: '“Passionate” is in most student emails. Show interest through a specific detail instead.' },
  { re: /dream|always wanted/i, tip: 'Skip life stories; keep to what you’ve done and can do.' },
  { re: /esteemed|respected sir|respected madam|dear sir|dear madam/i, tip: 'Use their name and title: “Dear Dr. Mirza”.' },
  { re: /any (opportunity|position|role)|anything/i, tip: 'Ask for one specific thing. Open-ended requests are harder to say yes to.' },
  { re: /kindly/i, tip: '“Please” or “Would you” reads more naturally than “kindly”.' },
];

export function Outreach() {
  const { profile } = useApp();
  const [me, setMe] = useState(profile?.name || '');
  const [whoAmI, setWhoAmI] = useState(profile?.affiliation ? `${profile.affiliation} student` : 'third-year BS Environmental Science student at a university in Rawalpindi');
  const [title, setTitle] = useState('Dr.');
  const [name, setName] = useState('Mirza');
  const [work, setWork] = useState('your 2025 paper on glacial lake growth in the Hindu Kush–Karakoram');
  const [detail, setDetail] = useState('I was struck by how quickly lakes in the Hunza basin expanded after 2018, and wondered whether the same pattern shows up in Chitral.');
  const [offer, setOffer] = useState('I’ve completed a GIS course and used QGIS to map flood extents for a class project.');
  const [hours, setHours] = useState(6);
  const [ask, setAsk] = useState<Ask>('call');
  const [question, setQuestion] = useState('');
  const [link, setLink] = useState(profile?.handle ? `${SITE_URL}/people/${profile.handle}` : '');

  const { subject, body, words } = useMemo(() => {
    const a = ASKS.find((x) => x.id === ask)!;
    const subj =
      ask === 'ra'
        ? `Research assistant interest: ${work.replace(/^your /, '').slice(0, 60)}`
        : ask === 'advice'
          ? `Question about ${work.replace(/^your /, '').slice(0, 60)}`
          : `${whoAmI.split(' at ')[0].replace(/^\w/, (c) => c.toUpperCase())}: your work on ${work.replace(/^your (\d{4} )?(paper|work|study) on /, '').slice(0, 50)}`;
    const lines = [
      `Dear ${title.trim()} ${name.trim()},`,
      '',
      `I’m ${me.trim() ? me.trim() + ', a ' : 'a '}${whoAmI.trim()}. I read ${work.trim()}. ${detail.trim()}`,
      '',
      `${offer.trim()}`,
      '',
      `${a.line(hours)}${ask === 'advice' && question.trim() ? ' ' + question.trim() : ''}`,
      '',
      link.trim() ? `My research profile: ${link.trim()}` : 'My CV is attached.',
      '',
      'Thank you for your time.',
      '',
      me.trim() || '[Your name]',
    ];
    const text = lines.join('\n').replace(/\n{3,}/g, '\n\n');
    return { subject: subj, body: text, words: text.split(/\s+/).filter(Boolean).length };
  }, [me, whoAmI, title, name, work, detail, offer, hours, ask, question, link]);

  const all = `${subject}\n${body}`;
  const issues = WEAK.filter((w) => w.re.test(all));
  const checks = [
    { ok: detail.trim().length > 40, text: 'Mentions something specific from their work' },
    { ok: offer.trim().length > 30, text: 'Says what you can offer' },
    { ok: words <= 220, text: `Under 220 words (now ${words})` },
    { ok: !!link.trim(), text: 'Links to your profile or CV' },
  ];

  return (
    <div className="wrap page">
      <ToolHead title="Outreach email composer" lede="Researchers answer short emails that show you read their work and make one clear ask. Fill in the details; the draft updates as you type." />
      <div className="tool-layout">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            <Field label="Your name" htmlFor="o-me">
              <input id="o-me" className="input" value={me} onChange={(e) => setMe(e.target.value)} />
            </Field>
            <Field label="Their title and surname" htmlFor="o-name">
              <div className="cluster" style={{ ['--gap' as any]: '6px', flexWrap: 'nowrap' }}>
                <select className="select" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" style={{ width: 96 }}>
                  {['Dr.', 'Prof.', 'Mr.', 'Ms.'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input id="o-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </Field>
          </div>
          <Field label="Who you are, in one line" htmlFor="o-who">
            <input id="o-who" className="input" value={whoAmI} onChange={(e) => setWhoAmI(e.target.value)} />
          </Field>
          <Field label="What of theirs you read" htmlFor="o-work">
            <input id="o-work" className="input" value={work} onChange={(e) => setWork(e.target.value)} />
          </Field>
          <Field label="One specific thing it made you think" htmlFor="o-detail" hint="This sentence is what gets a reply. Be concrete.">
            <textarea id="o-detail" className="textarea" style={{ minHeight: 80 }} value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
          <Field label="What you can offer" htmlFor="o-offer" hint="Skills, tools, languages, relevant coursework.">
            <textarea id="o-offer" className="textarea" style={{ minHeight: 70 }} value={offer} onChange={(e) => setOffer(e.target.value)} />
          </Field>
          <div className="field">
            <span className="field-label">Your ask</span>
            <Seg label="Ask" value={ask} onChange={setAsk} options={ASKS.map((a) => ({ id: a.id, label: a.label }))} />
          </div>
          {ask === 'advice' ? (
            <Field label="Your question" htmlFor="o-q">
              <input id="o-q" className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </Field>
          ) : (
            ask !== 'call' && (
              <Field label="Hours a week you can give" htmlFor="o-h">
                <input id="o-h" className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} style={{ maxWidth: 120 }} />
              </Field>
            )
          )}
          <Field label="Link to your profile or CV" htmlFor="o-link" hint={profile?.handle ? undefined : <>Your Thesia passport works well here. <Link to="/welcome">Create it</Link>.</>}>
            <input id="o-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </Field>
        </form>

        <div className="stack" style={{ ['--gap' as any]: '18px' }}>
          <div className="stack" data-copy-scope style={{ ['--gap' as any]: '10px' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Your email</h2>
              <div className="cluster" style={{ ['--gap' as any]: '6px' }}>
                <CopyButton text={subject} label="Copy subject" />
                <CopyButton text={body} label="Copy email" className="btn btn-primary btn-sm" />
              </div>
            </div>
            <p className="small">
              <span className="faint">Subject:</span> <strong>{subject}</strong>
            </p>
            <div className="output-sheet" data-copy-target>
              {body}
            </div>
          </div>
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <ul className="checklist">
              {checks.map((c) => (
                <li key={c.text}>
                  <span className={c.ok ? 'ok' : 'bad'}>{c.ok ? <LuCircleCheck /> : <LuCircleAlert />}</span>
                  <span>{c.text}</span>
                </li>
              ))}
              {issues.map((i) => (
                <li key={i.tip}>
                  <span className="bad">
                    <LuCircleAlert />
                  </span>
                  <span>{i.tip}</span>
                </li>
              ))}
            </ul>
            <p className="small muted">Send one polite follow-up after 7 to 10 days if there’s no reply. Never send the same email to many people with only the name changed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
