// The research guide. Three ways to answer, tried in order:
//  1. Inside the claude.ai artifact: the viewer's own Claude, through the `sample` capability.
//  2. On the live site: the ask-thesia Edge Function (Anthropic API key stays server-side).
//  3. Always available: a built-in coach that checks research questions and searches Thesia.

import { CONFERENCES } from '../data/conferences';
import { LABS } from '../data/labs';
import { PROGRAMS } from '../data/programs';
import { ALL_LESSONS } from '../data/academy';
import { BOOTCAMPS } from '../data/bootcamps';
import { LIVE, TARGET } from './config';
import { parseQuery, rankConferences, rankLabs, rankLessons, rankPrograms, rankProjects, rankPeople } from './match';
import { invokeFunction, ApiError } from './supabase';
import type { Person, Project } from './types';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type GuideSource = 'claude' | 'server' | 'coach';

export const GUIDE_INSTRUCTIONS = `You are Thesia Guide, a research mentor inside Thesia, a platform where students (high school to master's) find research projects, collaborators, labs and conferences, and learn research methods. Most users are in Pakistan; many read English as a second language.

How to answer:
- Be practical and specific. Short paragraphs or a short list. Under 220 words unless asked for more.
- Plain English. If the person writes in Urdu or Roman Urdu, answer in the same style.
- When someone shares a research idea, help them sharpen it into a question that names who, where, when and what is measured, and check it against FINER (feasible, interesting, novel, ethical, relevant).
- Point to Thesia pages from the CONTEXT when they genuinely fit, as markdown links using the given paths, e.g. [Winter smog and asthma visits in Lahore](/projects/smog-asthma-lahore).
- Never invent papers, authors, DOIs, statistics, deadlines or people. If you mention a kind of source, say how to find it (Google Scholar, PubMed). Tell people to verify dates on official sites.
- Raise ethics where people are involved (consent, minors, sensitive data). Do not write someone's thesis or fabricate data for them; coach them to do the work.`;

type Ctx = { projects: Project[]; people: Person[] };

/** Builds the small, grounded context the guide sees: the best Thesia matches for this question. */
export function buildContext(question: string, ctx: Ctx) {
  const q = parseQuery(question);
  const top = <T,>(arr: { item: T }[], n: number) => arr.slice(0, n).map((h) => h.item);
  return {
    projects: top(rankProjects(ctx.projects.filter((p) => p.status === 'open'), q), 4).map((p) => ({
      path: `/projects/${p.id}`,
      title: p.title,
      summary: p.summary,
      levels: p.levels,
      city: p.city,
      mode: p.mode,
      sample: p.isSample,
    })),
    people: top(rankPeople(ctx.people, q), 3).map((p) => ({ path: `/people/${p.handle}`, name: p.name, headline: p.headline, sample: p.isSample })),
    labs: top(rankLabs(LABS, q), 3).map((l) => ({ path: `/labs#${l.id}`, name: l.name, host: l.host, city: l.city })),
    conferences: top(rankConferences(CONFERENCES, q), 3).map((c) => ({ path: `/conferences#${c.id}`, name: c.short, city: c.city, start: c.start, deadline: c.deadline })),
    programs: top(rankPrograms(PROGRAMS, q), 3).map((p) => ({ path: `/opportunities#${p.id}`, name: p.name, country: p.country })),
    lessons: top(rankLessons(ALL_LESSONS, q), 3).map((x) => ({ path: `/learn/${x.track.id}/${x.lesson.id}`, title: x.lesson.title })),
    bootcamps: BOOTCAMPS.map((b) => ({ path: `/bootcamps/${b.id}`, title: b.title, start: b.start })),
    tools: [
      { path: '/tools/question-builder', title: 'Research question builder' },
      { path: '/tools/legit-check', title: 'Legit Check for journals and conferences' },
      { path: '/tools/outreach', title: 'Outreach email composer' },
      { path: '/tools/sample-size', title: 'Sample size calculator' },
      { path: '/tools/citation', title: 'Citation builder' },
      { path: '/tools/consent-form', title: 'Consent form builder' },
    ],
  };
}

type SampleFn = ((input: unknown, opts?: any) => Promise<{ text: string }>) & { limits?: () => Promise<any> };

let samplePromise: Promise<SampleFn | null> | null = null;
function getSample(): Promise<SampleFn | null> {
  if (TARGET !== 'artifact') return Promise.resolve(null);
  const c = (window as any).claude;
  if (!c?.use) return Promise.resolve(null);
  if (!samplePromise) samplePromise = c.use('sample').catch(() => null);
  return samplePromise!;
}

export async function guideAvailability(): Promise<GuideSource> {
  if (await getSample()) return 'claude';
  if (LIVE) return 'server';
  return 'coach';
}

export async function askGuide(
  history: ChatTurn[],
  ctx: Ctx,
  onText?: (text: string) => void,
  signal?: AbortSignal
): Promise<{ text: string; source: GuideSource; note?: string }> {
  const last = history[history.length - 1]?.content || '';
  const context = buildContext(last, ctx);

  const sample = await getSample();
  if (sample) {
    try {
      const turns = history.map((t, i) =>
        i === history.length - 1 && t.role === 'user'
          ? { role: 'user', content: `${GUIDE_INSTRUCTIONS}\n\nCONTEXT (Thesia pages you may link to):\n${JSON.stringify(context)}\n\nQUESTION:\n${t.content}` }
          : t
      );
      const res = await sample(turns, { onText: onText ? ({ text }: { text: string }) => onText(text) : undefined, signal, cache: false });
      return { text: res.text, source: 'claude' };
    } catch (e: any) {
      if (e?.code === 'cancelled') throw e;
      const coach = coachAnswer(last, ctx);
      return { text: coach, source: 'coach', note: e?.code === 'rate_limited' ? 'The AI guide is busy, so here is the built-in coach.' : undefined };
    }
  }

  if (LIVE) {
    try {
      const res = await invokeFunction<{ text: string }>('ask-thesia', { messages: history.slice(-8), context });
      return { text: res.text, source: 'server' };
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const note =
        status === 429
          ? 'You have used today’s free guide questions. The built-in coach is still here; Scholar Pro has no daily limit.'
          : status === 401
            ? 'Sign in to ask the AI guide. Meanwhile, here is the built-in coach.'
            : undefined;
      return { text: coachAnswer(last, ctx), source: 'coach', note };
    }
  }

  return { text: coachAnswer(last, ctx), source: 'coach' };
}

// ---------------------------------------------------------------------------
// Built-in coach
// ---------------------------------------------------------------------------

const PLACE_WORDS = /\b(pakistan|lahore|karachi|islamabad|peshawar|quetta|multan|faisalabad|rawalpindi|hyderabad|sialkot|gilgit|bahawalpur|sukkur|punjab|sindh|balochistan|kpk|khyber|city|district|province|village|school|university|campus|country|region|nigeria|bangladesh|india|kenya)\b/i;
const WHO_WORDS = /\b(students?|children|adolescents?|teens?|women|men|girls|boys|workers?|riders?|farmers?|patients?|teachers?|households?|shopkeepers?|adults|residents|people|users?|mothers|elderly|employees|smes?|firms?)\b/i;
const WHEN_WORDS = /\b(19|20)\d{2}\b|\b(winter|summer|monsoon|season|month|year|weeks?|during|since|before|after|ramadan)\b/i;
const MEASURE_WORDS = /\b(rate|level|score|number|proportion|percentage|prevalence|association|associated|relationship|effect|impact|difference|compare|correlat\w*|predict\w*|increase|decrease|visits|attendance|marks|grades|income|adoption|accuracy|symptoms)\b/i;

export function checkQuestion(text: string) {
  const t = text.trim();
  return [
    { id: 'who', label: 'Names who you will study', ok: WHO_WORDS.test(t), tip: 'Add the group: Grade 11 students, delivery riders, women entrepreneurs…' },
    { id: 'where', label: 'Names where', ok: PLACE_WORDS.test(t), tip: 'Add a place: a city, district, school or online community.' },
    { id: 'when', label: 'Names when', ok: WHEN_WORDS.test(t), tip: 'Add a time frame: this winter, 2023–2026, during exams.' },
    { id: 'what', label: 'Says what you will measure or compare', ok: MEASURE_WORDS.test(t), tip: 'Name the outcome: visits, marks, symptoms, adoption, and whether you compare or relate things.' },
    { id: 'size', label: 'Focused enough for one project', ok: t.split(/\s+/).length >= 8 && t.split(/\s+/).length <= 45, tip: t.split(/\s+/).length < 8 ? 'Too short to be specific. Add detail.' : 'Very long. Split it into a main question and sub-questions.' },
  ];
}

function linkList<T>(items: T[], fmt: (x: T) => string) {
  return items.map((x) => `- ${fmt(x)}`).join('\n');
}

export function coachAnswer(question: string, ctx: Ctx): string {
  const q = question.toLowerCase();
  const query = parseQuery(question);
  const parts: string[] = [];

  const intents: [RegExp, string][] = [
    [/predatory|fake (journal|conference)|legit|scam|hijack/, 'Run any journal or conference invitation through [Legit Check](/tools/legit-check) before you pay or submit. It screens for the warning signs of predatory publishing.'],
    [/email|professor|supervisor|reach out|contact|cold/, 'For writing to a researcher, use the [Outreach email composer](/tools/outreach). Mention one specific paper of theirs and make one small ask.'],
    [/sample size|how many (people|respondents|participants)/, 'The [Sample size calculator](/tools/sample-size) works out how many responses you need. At 95% confidence and ±5%, a proportion needs about 385 completed responses before corrections.'],
    [/consent|ethic|irb|erc|minor|under 18/, 'Before collecting any data from people, get ethics approval and informed consent. The [Consent form builder](/tools/consent-form) drafts one, and [Run fieldwork ethically and safely](/learn/fieldwork/fieldwork-ethics) explains the rules.'],
    [/cite|citation|reference|apa|mla|harvard/, 'The [Citation builder](/tools/citation) formats references in APA, MLA, Chicago and IEEE. Check every reference against the original source.'],
    [/publish|journal|paper|submit/, 'For writing up, start with [Structure a report a manager can act on](/learn/reporting/report-structure) and consider the [From Project to Paper](/bootcamps/project-to-paper) bootcamp.'],
    [/phd|master|ms |mphil|scholarship|fellowship|abroad|fulbright|chevening/, 'Browse [fellowships and programmes](/opportunities) for graduate study and funding, and check each official page for eligibility.'],
    [/conference|present|poster/, 'See verified [conferences in Pakistan](/conferences) with deadlines and student-friendly formats.'],
    [/start|beginner|first time|no experience|how do i (begin|get started)|new to research/, 'If you are new, the free [Research Launchpad](/bootcamps/research-launchpad) bootcamp takes you from idea to one-page proposal in three weeks, and the free [applied research curriculum](/learn) is open any time.'],
  ];
  for (const [re, text] of intents) if (re.test(q)) parts.push(text);
  const matchedIntent = parts.length > 0;

  // Treat it as a research idea only when it reads like one, not like a how-to question.
  const howTo = /^(how (do|can|should|would) i|how to|what is|what are|where (do|can|should)|can i|should i|do i|which|when)\b/.test(q.trim());
  const ideaPhrases = /i want to (study|research|find out|look at|investigate)|my (topic|idea|research question)|research (on|about|into)|(effect|impact|influence) of|relationship between|associated with|\bdoes .+ (affect|increase|reduce|cause|change|predict)|\bis there a (link|relationship|difference)/;
  const looksLikeIdea = !matchedIntent && (ideaPhrases.test(q) || (q.includes('?') && !howTo));
  if (looksLikeIdea && query.tokens.length >= 2) {
    const checks = checkQuestion(question);
    const missing = checks.filter((c) => !c.ok);
    if (missing.length === 0) {
      parts.unshift('Your question is specific: it names who, where, when and what you will measure. Next, check it is feasible (can you reach those people and that data?) and find what is already known with a quick Google Scholar search.');
    } else {
      parts.unshift(
        `Here is how to sharpen your question. It is missing:\n${linkList(missing, (m) => `**${m.label.replace('Names ', '').replace('Says ', '')}**: ${m.tip}`)}\n\nTry the [Research question builder](/tools/question-builder) to rewrite it step by step.`
      );
    }
  }

  if (query.tokens.length) {
    // Only suggest things that match the topic, not just the city.
    const topical = <T extends { hits: string[] }>(hits: T[]) => hits.filter((h) => h.hits.some((t) => !PLACE_WORDS.test(t)));
    const projects = topical(rankProjects(ctx.projects.filter((p) => p.status === 'open'), query)).slice(0, 3);
    const labs = topical(rankLabs(LABS, query)).slice(0, 2);
    const confs = topical(rankConferences(CONFERENCES, query)).slice(0, 2);
    const lessons = rankLessons(ALL_LESSONS, query).slice(0, 2);
    if (projects.length) parts.push(`**Projects you could join**\n${linkList(projects, (h) => `[${h.item.title}](/projects/${h.item.id}), ${h.item.mode === 'remote' ? 'remote' : h.item.city}`)}`);
    if (labs.length) parts.push(`**Labs working nearby**\n${linkList(labs, (h) => `[${h.item.name}](/labs#${h.item.id}), ${h.item.city}`)}`);
    if (confs.length) parts.push(`**Conferences**\n${linkList(confs, (h) => `[${h.item.short}](/conferences#${h.item.id}), ${h.item.city}`)}`);
    if (lessons.length && !parts.some((p) => p.includes('/learn/'))) parts.push(`**Read next**\n${linkList(lessons, (h) => `[${h.item.lesson.title}](/learn/${h.item.track.id}/${h.item.lesson.id})`)}`);
  }

  if (!parts.length) {
    parts.push(
      'Tell me about a topic you care about, a question you are curious about, or what you are stuck on: finding a project, writing to a professor, choosing a method, ethics, or publishing. I will point you to the right projects, lessons and tools on Thesia.'
    );
  }
  return parts.join('\n\n');
}
