// The hero concept map: research topics people are working on right now, connected to the
// question in the centre. Typing a question highlights the topics it touches, the same way a
// researcher marks a literature map with a highlighter.

import { useEffect, useMemo, useRef, useState } from 'react';
import { CONFERENCES } from '../data/conferences';
import { LABS } from '../data/labs';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';
import { parseQuery, rankConferences, rankLabs, rankProjects, tokenize } from '../lib/match';
import { plural } from '../lib/format';

export interface Topic {
  id: string;
  label: string;
  short: string;
  question: string;
  keywords: string;
}

export const TOPICS: Topic[] = [
  { id: 'smog', label: 'Smog and asthma', short: 'Smog & asthma', question: 'Does winter smog increase asthma visits in Lahore?', keywords: 'smog air pollution pm2.5 asthma' },
  { id: 'speech', label: 'Saraiki speech AI', short: 'Speech AI', question: 'Can speech recognition work for Saraiki speakers?', keywords: 'speech recognition saraiki nlp language' },
  { id: 'glacier', label: 'Glacial lake floods', short: 'Glacial floods', question: 'Which glacial lakes in Gilgit-Baltistan are growing fastest?', keywords: 'glof glacier remote sensing gilgit' },
  { id: 'microfinance', label: 'Women and microfinance', short: 'Microfinance', question: 'How do women in South Punjab use microfinance loans?', keywords: 'microfinance women gender' },
  { id: 'heat', label: 'Heat and gig work', short: 'Heat stress', question: 'How does extreme heat affect delivery riders in Karachi?', keywords: 'heat heatwave riders occupational' },
  { id: 'amr', label: 'Antibiotic resistance', short: 'Antibiotics', question: 'Are poultry farms spreading antibiotic resistance?', keywords: 'antibiotic resistance amr microbiology' },
  { id: 'textbooks', label: 'Gender in textbooks', short: 'Textbooks', question: 'How are girls and women shown in school textbooks?', keywords: 'textbooks gender education' },
  { id: 'water', label: 'Water quality', short: 'Water quality', question: 'Is the water feeding Rawal Lake getting dirtier?', keywords: 'water quality lake citizen science' },
  { id: 'fintech', label: 'Mobile money', short: 'Mobile money', question: 'Why do small shops in Peshawar avoid digital payments?', keywords: 'mobile money fintech digital payments' },
  { id: 'eyes', label: 'AI eye screening', short: 'AI screening', question: 'Do medical imaging models work on images from local clinics?', keywords: 'retinopathy medical imaging explainable' },
  { id: 'mind', label: 'Student mental health', short: 'Mental health', question: 'Why don’t university students use campus counselling?', keywords: 'mental help-seeking counselling psychology' },
  { id: 'solar', label: 'Rooftop solar', short: 'Solar', question: 'Does rooftop solar still pay off after net-metering changes?', keywords: 'solar net metering energy' },
];

const COMPACT_IDS = ['smog', 'speech', 'glacier', 'heat', 'microfinance', 'water', 'eyes', 'mind'];

function counts(t: Topic) {
  // Count with the topic's own words only (no synonym expansion) so numbers stay honest.
  const base = parseQuery(t.keywords);
  const q = { ...base, expanded: base.tokens };
  const projects = rankProjects(SAMPLE_PROJECTS, q).filter((h) => h.score > 3).length;
  const labs = rankLabs(LABS, q).filter((h) => h.score > 3).length;
  const confs = rankConferences(CONFERENCES, q).filter((h) => h.score > 3).length;
  const parts = [projects && plural(projects, 'project'), labs && plural(labs, 'lab'), confs && plural(confs, 'conference')].filter(Boolean);
  return parts.slice(0, 2).join(', ') || 'Open to new projects';
}

const COUNTS: Record<string, string> = Object.fromEntries(TOPICS.map((t) => [t.id, counts(t)]));

export function topicHits(query: string): Set<string> {
  const q = parseQuery(query);
  if (!q.tokens.length) return new Set();
  const terms = new Set(q.expanded);
  return new Set(TOPICS.filter((t) => tokenize(t.keywords + ' ' + t.label).some((w) => terms.has(w))).map((t) => t.id));
}

export function Atlas({ query, onPick }: { query: string; onPick: (t: Topic) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [drawing, setDrawing] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 520));
    ro.observe(el);
    const t = setTimeout(() => setDrawing(false), 3200);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const hits = useMemo(() => topicHits(query), [query]);
  const layout = useMemo(() => {
    const W = compact ? 380 : 600;
    const H = compact ? 460 : 500;
    const cx = W / 2;
    const cy = H / 2 + 8;
    const list = compact ? TOPICS.filter((t) => COMPACT_IDS.includes(t.id)) : TOPICS;
    const rx = compact ? 128 : 205;
    const ry = compact ? 168 : 178;
    const n = list.length;
    const nodes = list.map((t, i) => {
      const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
      const r = i % 2 ? 0.84 : 1;
      const x = cx + rx * r * Math.cos(a);
      const y = cy + ry * r * Math.sin(a);
      const mx = (cx + x) / 2;
      const my = (cy + y) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const bend = (i % 2 ? 1 : -1) * 0.14;
      const path = `M${cx},${cy} Q${mx - dy * bend},${my + dx * bend} ${x},${y}`;
      const below = y > cy + 4;
      return { t, x, y, path, below, i };
    });
    return { W, H, cx, cy, nodes };
  }, [compact]);

  const centerLabel = query.trim() ? (query.trim().length > 26 ? query.trim().slice(0, 24) + '…' : query.trim()) : 'Your question';
  const centerW = Math.max(130, Math.min(230, centerLabel.length * 7.4 + 34));
  const fs = compact ? 14 : 15;

  return (
    <figure className={`atlas${drawing ? ' is-drawing' : ''}`} ref={ref} style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${layout.W} ${layout.H}`} role="group" aria-label="Research topics people are working on. Select one to try it as a question.">
        {layout.nodes.map(({ t, path, i }) => (
          <path key={'e' + t.id} d={path} className={`atlas-edge${hits.has(t.id) ? ' is-hit' : ''}`} style={{ ['--i' as any]: i }} />
        ))}
        {layout.nodes.map(({ t, x, y, below, i }) => {
          const label = compact ? t.short : t.label;
          const w = label.length * (fs * 0.53) + 14;
          const ly = below ? y + 22 : y - 26;
          return (
            <g
              key={t.id}
              className={`atlas-node${hits.has(t.id) ? ' is-hit' : ''}`}
              style={{ ['--i' as any]: i }}
              tabIndex={0}
              role="button"
              aria-label={`${t.label}. ${COUNTS[t.id]}. Try the question: ${t.question}`}
              onClick={() => onPick(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick(t);
                }
              }}
            >
              <circle className="atlas-dot" cx={x} cy={y} r={4} />
              <rect className="mark" x={x - w / 2} y={ly - fs + 1} width={w} height={fs + 7} rx={3} />
              <text x={x} y={ly} textAnchor="middle" style={{ fontSize: fs }}>
                {label}
              </text>
              <text className="kind" x={x} y={below ? ly + 16 : ly - 20} textAnchor="middle">
                {COUNTS[t.id]}
              </text>
            </g>
          );
        })}
        <g className="atlas-center" aria-hidden="true">
          <rect x={layout.cx - centerW / 2} y={layout.cy - 18} width={centerW} height={36} rx={18} fill="var(--ink)" />
          <text x={layout.cx} y={layout.cy + 4.5} textAnchor="middle">
            {centerLabel}
          </text>
        </g>
      </svg>
      <figcaption className="atlas-caption">
        <span>Topics with open sample projects in the beta. Select one to try it.</span>
        <span>{hits.size ? `${hits.size} highlighted` : 'Type a question to highlight matches'}</span>
      </figcaption>
    </figure>
  );
}
