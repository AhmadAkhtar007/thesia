// Search and matching. Everything runs in the browser over the curated listings and the
// project/people data, so search works offline and in demo mode. When the catalogue grows,
// move this to Postgres full-text search (see supabase/migrations) and keep the same API.

import type { Bootcamp, Conference, Lab, Lesson, Person, Profile, Program, Project, Track } from './types';
import { fieldLabel, levelLabel } from './types';

const STOP = new Set(
  'a an and are as at be by can do does for from has have how i in into is it its of on or our so that the their them this to was we what when where which who why will with you your about between among during my me want like would could should study research effect effects impact'.split(
    ' '
  )
);

// Ideas students search for, mapped to the words researchers use.
const SYNONYMS: Record<string, string[]> = {
  smog: ['air pollution', 'pm2.5', 'air quality', 'particulate'],
  pollution: ['air quality', 'pm2.5', 'smog', 'water quality'],
  ai: ['machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision'],
  ml: ['machine learning', 'deep learning'],
  nlp: ['language', 'speech', 'text', 'corpus'],
  language: ['nlp', 'linguistics', 'speech'],
  urdu: ['nlp', 'speech', 'language', 'saraiki', 'punjabi'],
  climate: ['heat', 'flood', 'glacier', 'environment', 'glof', 'water'],
  flood: ['floods', 'glof', 'climate', 'disaster'],
  heat: ['heatwave', 'temperature', 'climate'],
  health: ['medicine', 'medical', 'clinical', 'public health', 'hospital'],
  medical: ['medicine', 'clinical', 'health', 'imaging'],
  mental: ['psychology', 'wellbeing', 'counselling', 'help-seeking'],
  psychology: ['mental health', 'wellbeing'],
  economics: ['finance', 'microfinance', 'fintech', 'development'],
  money: ['finance', 'fintech', 'mobile money', 'microfinance'],
  finance: ['microfinance', 'fintech', 'economics'],
  women: ['gender', 'female'],
  gender: ['women', 'female'],
  water: ['water quality', 'hydrology', 'lake'],
  energy: ['solar', 'electricity', 'power'],
  solar: ['energy', 'net metering', 'renewable'],
  school: ['education', 'students', 'textbooks'],
  education: ['school', 'schooling', 'teaching', 'textbooks'],
  data: ['statistics', 'analysis', 'dataset'],
  statistics: ['data', 'analysis', 'regression', 'hypothesis testing'],
  cricket: ['sports', 'psl', 'statistics'],
  antibiotic: ['amr', 'resistance', 'microbiology'],
  biology: ['microbiology', 'biotechnology', 'genetics'],
  gis: ['remote sensing', 'mapping', 'satellite'],
  satellite: ['remote sensing', 'gis', 'earth engine'],
  survey: ['questionnaire', 'fieldwork'],
  interview: ['qualitative', 'interviews', 'thematic analysis'],
  qualitative: ['interviews', 'focus groups', 'thematic analysis'],
};

function stem(w: string) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es') && !w.endsWith('ses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/pm\s?2\.5/g, 'pm25')
    .split(/[^a-z0-9؀-ۿ]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);
}

export interface QueryTerms {
  raw: string;
  tokens: string[]; // what the person typed
  expanded: string[]; // plus synonyms
}

export function parseQuery(q: string): QueryTerms {
  const tokens = Array.from(new Set(tokenize(q)));
  const expanded = new Set(tokens);
  const lower = q.toLowerCase();
  for (const [key, list] of Object.entries(SYNONYMS)) {
    if (tokens.includes(stem(key)) || lower.includes(key)) list.forEach((s) => tokenize(s).forEach((t) => expanded.add(t)));
  }
  return { raw: q, tokens, expanded: Array.from(expanded) };
}

type Weighted = [string | undefined, number][];

function scoreFields(q: QueryTerms, fields: Weighted): { score: number; hits: string[] } {
  if (!q.tokens.length) return { score: 0, hits: [] };
  let score = 0;
  const hits = new Set<string>();
  for (const [text, weight] of fields) {
    if (!text) continue;
    const toks = new Set(tokenize(text));
    for (const t of q.expanded) {
      if (toks.has(t)) {
        const direct = q.tokens.includes(t);
        score += weight * (direct ? 1 : 0.5);
        hits.add(t);
      }
    }
  }
  // Reward documents that cover more of what was typed.
  const coverage = q.tokens.filter((t) => hits.has(t)).length / q.tokens.length;
  return { score: score * (0.5 + coverage), hits: Array.from(hits) };
}

export interface Hit<T> {
  item: T;
  score: number;
  hits: string[];
}

function rank<T>(items: T[], q: QueryTerms, fields: (x: T) => Weighted): Hit<T>[] {
  return items
    .map((item) => ({ item, ...scoreFields(q, fields(item)) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

export const rankProjects = (items: Project[], q: QueryTerms) =>
  rank(items, q, (p) => [
    [p.title, 4],
    [p.tags.join(' '), 3],
    [p.summary, 2],
    [p.fields.map(fieldLabel).join(' '), 2],
    [p.city + ' ' + p.country, 2],
    [p.roles.map((r) => r.title + ' ' + r.skills.join(' ')).join(' '), 1.5],
    [p.description, 1],
  ]);

export const rankPeople = (items: Person[], q: QueryTerms) =>
  rank(items, q, (p) => [
    [p.headline, 4],
    [p.skills.join(' '), 3],
    [p.fields.map(fieldLabel).join(' '), 2],
    [p.name + ' ' + p.affiliation, 2],
    [p.city + ' ' + p.country, 1.5],
    [p.bio, 1],
    [p.outputs.map((o) => o.title).join(' '), 1.5],
  ]);

export const rankConferences = (items: Conference[], q: QueryTerms) =>
  rank(items, q, (c) => [
    [c.name + ' ' + c.short, 4],
    [c.topics.join(' '), 3],
    [c.fields.map(fieldLabel).join(' '), 2],
    [c.host + ' ' + c.city, 2],
    [c.note, 1],
  ]);

export const rankLabs = (items: Lab[], q: QueryTerms) =>
  rank(items, q, (l) => [
    [l.name + ' ' + (l.short || ''), 4],
    [l.themes.join(' '), 3],
    [l.fields.map(fieldLabel).join(' '), 2],
    [l.focus, 2],
    [l.host + ' ' + l.city, 1.5],
  ]);

export const rankPrograms = (items: Program[], q: QueryTerms) =>
  rank(items, q, (p) => [
    [p.name, 4],
    [p.summary, 2],
    [p.fields === 'all' ? 'all fields' : p.fields.map(fieldLabel).join(' '), 2],
    [p.levels.map(levelLabel).join(' ') + ' ' + p.country, 1.5],
    [p.eligibility, 1],
  ]);

export const rankLessons = (items: { track: Track; lesson: Lesson }[], q: QueryTerms) =>
  rank(items, q, (x) => [
    [x.lesson.title, 4],
    [x.lesson.summary, 2],
    [x.lesson.takeaways.join(' '), 2],
    [x.lesson.skillTags.join(' '), 1.5],
    [x.lesson.steps.map((s) => s.title + ' ' + s.body).join(' '), 0.6],
  ]);

export const rankBootcamps = (items: Bootcamp[], q: QueryTerms) =>
  rank(items, q, (b) => [
    [b.title, 4],
    [b.tagline, 2],
    [b.syllabus.map((w) => w.title + ' ' + w.outcome).join(' '), 1.5],
    [b.forWhom, 1],
  ]);

/** How well a project fits a person, with the reasons shown to them. */
export function projectFit(p: Project, profile: Pick<Profile, 'fields' | 'level' | 'city' | 'country' | 'skills'> | null) {
  if (!profile || (!profile.fields.length && !profile.level)) return null;
  let score = 0;
  const reasons: string[] = [];
  const fieldOverlap = p.fields.filter((f) => profile.fields.includes(f));
  if (fieldOverlap.length) {
    score += 40;
    reasons.push(fieldLabel(fieldOverlap[0]));
  }
  if (profile.level && p.levels.includes(profile.level as any)) {
    score += 25;
    reasons.push(`open to ${levelLabel(profile.level).toLowerCase()} students`);
  } else if (profile.level) {
    score += 5;
  }
  if (p.mode === 'remote') {
    score += 15;
    reasons.push('remote');
  } else if (profile.city && p.city.toLowerCase() === profile.city.toLowerCase()) {
    score += 15;
    reasons.push(`in ${p.city}`);
  } else if (profile.country && p.country === profile.country && p.mode === 'hybrid') {
    score += 7;
  }
  const skillText = p.roles.flatMap((r) => r.skills).join(' ').toLowerCase();
  const skillHits = (profile.skills || []).filter((s) => s && skillText.includes(s.toLowerCase()));
  if (skillHits.length) {
    score += Math.min(20, skillHits.length * 8);
    reasons.push(`uses ${skillHits.slice(0, 2).join(' and ')}`);
  }
  return { score: Math.min(99, score), reasons };
}

/** Wraps matched words in <mark> for display. Input is plain text. */
export function highlightParts(text: string, terms: string[]): { text: string; hit: boolean }[] {
  if (!terms.length) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  const re = /[A-Za-z0-9؀-ۿ.]+|[^A-Za-z0-9؀-ۿ.]+/g;
  let m: RegExpExecArray | null;
  const set = new Set(terms);
  while ((m = re.exec(text))) {
    const word = m[0];
    const isWord = /[A-Za-z0-9؀-ۿ]/.test(word);
    const hit = isWord && set.has(stem(word.toLowerCase().replace(/pm\s?2\.5/, 'pm25').replace(/\.$/, '')));
    const last = parts[parts.length - 1];
    if (last && last.hit === hit) last.text += word;
    else parts.push({ text: word, hit });
  }
  return parts;
}
