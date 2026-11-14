import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CopyButton, Field, Seg } from '../../components/ui';
import { ToolHead } from './ToolsIndex';

type SourceType = 'article' | 'book' | 'web' | 'conference';
type Style = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';
type Seg_ = { t: string; i?: boolean };
type Author = { last: string; first: string };

export interface Source {
  type: SourceType;
  authors: Author[];
  year: string;
  title: string;
  container: string; // journal, proceedings, website or (for books) blank
  volume: string;
  issue: string;
  pages: string;
  publisher: string;
  doi: string;
  url: string;
  accessed: string; // ISO date for web pages
  published: string; // ISO date for web pages (optional)
}

export function parseAuthors(text: string): Author[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (l.includes(',')) {
        const [last, first] = l.split(',').map((s) => s.trim());
        return { last, first: first || '' };
      }
      const parts = l.split(/\s+/);
      return { last: parts.pop() || '', first: parts.join(' ') };
    });
}

const initials = (first: string, spaced = true) =>
  first
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((n) => n[0].toUpperCase() + '.')
    .join(spaced ? ' ' : '');

function joinList(items: string[], and: string, oxford = true) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} ${and} ${items[1]}`;
  return items.slice(0, -1).join(', ') + (oxford ? ',' : '') + ` ${and} ` + items[items.length - 1];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
function d(iso: string) {
  const [y, m, day] = iso.split('-').map(Number);
  return { y, m: m - 1, day };
}
const doiUrl = (doi: string) => (doi ? (doi.startsWith('http') ? doi : `https://doi.org/${doi.replace(/^doi:\s*/i, '')}`) : '');
const end = (s: string) => (/[.?!]$/.test(s.trim()) ? s.trim() : s.trim() + '.');

export function formatCitation(s: Source, style: Style): Seg_[] {
  const A = s.authors.filter((a) => a.last);
  const link = doiUrl(s.doi) || s.url;
  const pages = s.pages.replace(/-/g, '–');
  const out: Seg_[] = [];
  const t = (x: string) => out.push({ t: x });
  const i = (x: string) => out.push({ t: x, i: true });

  if (style === 'apa') {
    const names = A.map((a) => `${a.last}, ${initials(a.first)}`.trim().replace(/,\s*$/, ''));
    const authorStr = names.length ? (names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1]) : s.container;
    const date = s.type === 'web' && s.published ? `${d(s.published).y}, ${MONTHS[d(s.published).m]} ${d(s.published).day}` : s.year || 'n.d.';
    t(`${end(authorStr)} (${date}). `);
    if (s.type === 'article') {
      t(`${end(s.title)} `);
      i(s.container);
      if (s.volume) {
        t(', ');
        i(s.volume);
      }
      if (s.issue) t(`(${s.issue})`);
      if (pages) t(`, ${pages}`);
      t('.');
    } else if (s.type === 'book') {
      i(end(s.title));
      if (s.publisher) t(` ${end(s.publisher)}`);
    } else if (s.type === 'conference') {
      t(`${end(s.title)} In `);
      i(s.container);
      if (pages) t(` (pp. ${pages})`);
      t('.');
      if (s.publisher) t(` ${end(s.publisher)}`);
    } else {
      i(end(s.title));
      if (s.container && s.container !== authorStr) t(` ${end(s.container)}`);
    }
    if (link) t(` ${link}`);
    return out;
  }

  if (style === 'mla') {
    const first = A[0] ? `${A[0].last}, ${A[0].first}` : '';
    const authorStr = A.length >= 3 ? `${first}, et al` : A.length === 2 ? `${first}, and ${A[1].first} ${A[1].last}` : first;
    if (authorStr) t(`${end(authorStr)} `);
    if (s.type === 'book') {
      i(end(s.title));
      t(` ${[s.publisher, s.year].filter(Boolean).join(', ')}.`);
    } else {
      t(`“${end(s.title)}” `);
      i(s.container);
      const bits: string[] = [];
      if (s.type === 'article') {
        if (s.volume) bits.push(`vol. ${s.volume}`);
        if (s.issue) bits.push(`no. ${s.issue}`);
      }
      if (s.type === 'conference' && s.publisher) bits.push(s.publisher);
      if (s.type === 'web' && s.published) {
        const p = d(s.published);
        bits.push(`${p.day} ${MON[p.m]} ${p.y}`);
      } else if (s.year) bits.push(s.year);
      if (pages) bits.push(`pp. ${pages}`);
      if (bits.length) t(`, ${bits.join(', ')}`);
      t(link ? `, ${link.replace(/^https?:\/\//, '')}.` : '.');
    }
    if (s.type === 'web' && s.accessed) {
      const a = d(s.accessed);
      t(` Accessed ${a.day} ${MON[a.m]} ${a.y}.`);
    }
    return out;
  }

  if (style === 'chicago') {
    const names = A.map((a, idx) => (idx === 0 ? `${a.last}, ${a.first}` : `${a.first} ${a.last}`));
    const authorStr = names.length > 10 ? `${names.slice(0, 7).join(', ')}, et al` : joinList(names, 'and');
    if (authorStr) t(`${end(authorStr)} `);
    t(`${s.year || 'n.d.'}. `);
    if (s.type === 'book') {
      i(end(s.title));
      if (s.publisher) t(` ${end(s.publisher)}`);
    } else if (s.type === 'article') {
      t(`“${end(s.title)}” `);
      i(s.container);
      if (s.volume) t(` ${s.volume}`);
      if (s.issue) t(` (${s.issue})`);
      if (pages) t(`: ${pages}`);
      t('.');
    } else if (s.type === 'conference') {
      t(`“${end(s.title)}” In `);
      i(s.container);
      if (pages) t(`, ${pages}`);
      t('.');
      if (s.publisher) t(` ${end(s.publisher)}`);
    } else {
      t(`“${end(s.title)}” `);
      if (s.container) t(`${end(s.container)} `);
      if (s.published) {
        const p = d(s.published);
        t(`${MONTHS[p.m]} ${p.day}, ${p.y}. `);
      }
    }
    if (link) t(` ${link}.`);
    return out.map((x) => ({ ...x, t: x.t.replace(/\s{2,}/g, ' ') }));
  }

  if (style === 'harvard') {
    const names = A.map((a) => `${a.last}, ${initials(a.first, false)}`);
    const authorStr = names.length > 3 ? `${names[0]} et al.` : joinList(names, 'and', false);
    t(`${authorStr || s.container} (${s.year || 'no date'}) `);
    if (s.type === 'book') {
      i(end(s.title));
      if (s.publisher) t(` ${end(s.publisher)}`);
    } else if (s.type === 'article') {
      t(`‘${s.title.trim()}’, `);
      i(s.container);
      if (s.volume) t(`, ${s.volume}`);
      if (s.issue) t(`(${s.issue})`);
      if (pages) t(`, pp. ${pages}`);
      t('.');
      if (s.doi) t(` doi:${s.doi.replace(/^https?:\/\/doi\.org\//, '')}.`);
    } else if (s.type === 'conference') {
      t(`‘${s.title.trim()}’, in `);
      i(s.container);
      if (s.publisher) t(`. ${s.publisher}`);
      if (pages) t(`, pp. ${pages}`);
      t('.');
    } else {
      i(end(s.title));
      if (s.url) t(` Available at: ${s.url}`);
      if (s.accessed) {
        const a = d(s.accessed);
        t(` (Accessed: ${a.day} ${MONTHS[a.m]} ${a.y})`);
      }
      t('.');
    }
    return out;
  }

  // IEEE
  const names = A.map((a) => `${initials(a.first)} ${a.last}`.trim());
  const authorStr = names.length > 6 ? `${names[0]} et al.` : joinList(names, 'and');
  if (s.type === 'book') {
    t(`${authorStr}, `);
    i(s.title.trim());
    t(`. ${[s.publisher, s.year].filter(Boolean).join(', ')}.`);
    return out;
  }
  t(`${authorStr ? authorStr + ', ' : ''}“${s.title.trim()},” `);
  if (s.type === 'conference') {
    t('in ');
    i(s.container);
    t(`, ${s.year}`);
    if (pages) t(`, pp. ${pages}`);
  } else if (s.type === 'article') {
    i(s.container);
    if (s.volume) t(`, vol. ${s.volume}`);
    if (s.issue) t(`, no. ${s.issue}`);
    if (pages) t(`, pp. ${pages}`);
    t(`, ${s.year}`);
  } else {
    i(s.container || 'Online');
    if (s.accessed) {
      const a = d(s.accessed);
      t(`. Accessed: ${MON[a.m]} ${a.day}, ${a.y}. [Online]. Available: ${s.url}`);
      return out;
    }
  }
  if (s.doi) t(`, doi: ${s.doi.replace(/^https?:\/\/doi\.org\//, '')}.`);
  else t('.');
  return out;
}

const EXAMPLE: Record<SourceType, Partial<Source> & { authorText: string }> = {
  article: {
    authorText: 'Rehman, Ayesha\nKhalid, Hamza Ali',
    year: '2025',
    title: 'Winter smog and outpatient asthma visits in an example city',
    container: 'Journal of Example Studies',
    volume: '12',
    issue: '3',
    pages: '45-67',
    doi: '10.0000/example.2025.123',
  },
  book: { authorText: 'Mirza, Sana', year: '2024', title: 'An example book title', publisher: 'Example University Press', container: '' },
  web: { authorText: '', year: '2026', title: 'Think. Check. Submit. checklist', container: 'Think. Check. Submit.', url: 'https://thinkchecksubmit.org', accessed: new Date().toISOString().slice(0, 10) },
  conference: { authorText: 'Khan, Ayesha\nRaza, Ali', year: '2026', title: 'Your paper title here', container: 'Proceedings of the International Conference on Example Research', pages: '1-6', publisher: '' },
};

export function Citation() {
  const [type, setType] = useState<SourceType>('article');
  const [style, setStyle] = useState<Style>('apa');
  const [authorText, setAuthorText] = useState(EXAMPLE.article.authorText);
  const [f, setF] = useState<Omit<Source, 'type' | 'authors'>>({
    year: EXAMPLE.article.year!,
    title: EXAMPLE.article.title!,
    container: EXAMPLE.article.container!,
    volume: EXAMPLE.article.volume!,
    issue: EXAMPLE.article.issue!,
    pages: EXAMPLE.article.pages!,
    publisher: '',
    doi: EXAMPLE.article.doi!,
    url: '',
    accessed: new Date().toISOString().slice(0, 10),
    published: '',
  });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const segs = useMemo(() => formatCitation({ ...f, type, authors: parseAuthors(authorText) }, style), [f, type, style, authorText]);
  const plain = segs.map((s) => s.t).join('').replace(/\s+/g, ' ').trim();

  const loadExample = (t: SourceType) => {
    setType(t);
    const ex = EXAMPLE[t];
    setAuthorText(ex.authorText);
    setF((x) => ({ ...x, year: '', title: '', container: '', volume: '', issue: '', pages: '', publisher: '', doi: '', url: '', published: '', ...ex }));
  };

  return (
    <div className="wrap page">
      <ToolHead title="Citation builder" lede="Fill in the details once and get the reference in five common styles. Always check the result against your department’s style guide." />
      <div className="tool-layout">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <span className="field-label">Source type</span>
            <Seg
              label="Source type"
              value={type}
              onChange={loadExample}
              options={[
                { id: 'article', label: 'Journal article' },
                { id: 'book', label: 'Book' },
                { id: 'conference', label: 'Conference paper' },
                { id: 'web', label: 'Web page' },
              ]}
            />
            <span className="field-hint">Switching type loads a made-up example you can overwrite.</span>
          </div>
          <Field label="Authors, one per line" htmlFor="c-a" hint="Write “Surname, Given names”. For an organisation, leave this empty.">
            <textarea id="c-a" className="textarea" style={{ minHeight: 90 }} value={authorText} onChange={(e) => setAuthorText(e.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="Year" htmlFor="c-y">
              <input id="c-y" className="input" value={f.year} onChange={set('year')} />
            </Field>
            {type === 'web' && (
              <Field label="Published on (optional)" htmlFor="c-pub">
                <input id="c-pub" className="input" type="date" value={f.published} onChange={set('published')} />
              </Field>
            )}
          </div>
          <Field label="Title" htmlFor="c-t" hint={style === 'apa' ? 'APA uses sentence case for titles: capitalise only the first word and proper nouns.' : undefined}>
            <input id="c-t" className="input" value={f.title} onChange={set('title')} />
          </Field>
          {type !== 'book' && (
            <Field label={type === 'article' ? 'Journal' : type === 'conference' ? 'Proceedings title' : 'Website name'} htmlFor="c-c">
              <input id="c-c" className="input" value={f.container} onChange={set('container')} />
            </Field>
          )}
          {type === 'article' && (
            <div className="form-grid">
              <Field label="Volume" htmlFor="c-v">
                <input id="c-v" className="input" value={f.volume} onChange={set('volume')} />
              </Field>
              <Field label="Issue" htmlFor="c-i">
                <input id="c-i" className="input" value={f.issue} onChange={set('issue')} />
              </Field>
            </div>
          )}
          {(type === 'article' || type === 'conference') && (
            <Field label="Pages or article number" htmlFor="c-p">
              <input id="c-p" className="input" value={f.pages} onChange={set('pages')} />
            </Field>
          )}
          {(type === 'book' || type === 'conference') && (
            <Field label="Publisher" htmlFor="c-pb">
              <input id="c-pb" className="input" value={f.publisher} onChange={set('publisher')} />
            </Field>
          )}
          {type !== 'web' ? (
            <Field label="DOI" htmlFor="c-d" hint="Find it on the article page. It starts with 10.">
              <input id="c-d" className="input" value={f.doi} onChange={set('doi')} />
            </Field>
          ) : (
            <div className="form-grid">
              <Field label="URL" htmlFor="c-u">
                <input id="c-u" className="input" value={f.url} onChange={set('url')} />
              </Field>
              <Field label="Accessed on" htmlFor="c-acc">
                <input id="c-acc" className="input" type="date" value={f.accessed} onChange={set('accessed')} />
              </Field>
            </div>
          )}
        </form>

        <div className="stack" style={{ ['--gap' as any]: '16px' }}>
          <Seg
            label="Style"
            value={style}
            onChange={setStyle}
            options={[
              { id: 'apa', label: 'APA 7' },
              { id: 'mla', label: 'MLA 9' },
              { id: 'chicago', label: 'Chicago' },
              { id: 'harvard', label: 'Harvard' },
              { id: 'ieee', label: 'IEEE' },
            ]}
          />
          <div className="panel stack" data-copy-scope>
            <p data-copy-target style={{ paddingLeft: '2em', textIndent: '-2em', lineHeight: 1.7, overflowWrap: 'anywhere' }}>
              {segs.map((s, idx) => (s.i ? <i key={idx}>{s.t}</i> : <span key={idx}>{s.t}</span>))}
            </p>
            <div className="cluster">
              <CopyButton text={plain} label="Copy reference" className="btn btn-primary btn-sm" />
              <span className="xsmall faint">Copies as plain text. Re-apply italics in your document.</span>
            </div>
          </div>
          <p className="small muted">
            Keep references in a free manager such as Zotero, which formats whole bibliographies. Never cite a source you haven’t opened; AI tools can invent references that look real.
          </p>
        </div>
      </div>
    </div>
  );
}
