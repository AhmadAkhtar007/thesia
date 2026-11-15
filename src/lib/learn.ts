// Gamification maths for the applied research curriculum.
//
// XP and ranks are DERIVED from public.lesson_progress (one row per lesson with the quiz score).
// Nothing extra is stored, so the live database keeps using the existing schema: a lesson earns
// its base XP once the quiz score reaches PASS_MARK, plus a bonus of up to 10 for quiz accuracy.

import { ALL_LESSONS, PASS_MARK, TOTAL_XP, TRACKS } from '../data/academy';
import { lessonKey } from './repo/types';
import type { Lesson, LessonProgress, Track } from './types';

export type ProgressMap = Record<string, LessonProgress>;

export interface Rank {
  id: string;
  title: string;
  minXp: number;
  blurb: string;
}

export const RANKS: Rank[] = [
  { id: 'novice', title: 'Novice', minXp: 0, blurb: 'Learning how applied research works.' },
  { id: 'field-analyst', title: 'Field Analyst', minXp: 200, blurb: 'Can scope a question, collect data and describe it honestly.' },
  { id: 'research-fellow', title: 'Research Fellow', minXp: 450, blurb: 'Can take a brief from question to signed-off report.' },
];

/** Base XP plus the quiz-accuracy bonus. A failed quiz earns nothing yet. */
export function lessonXp(lesson: Lesson, record?: LessonProgress): number {
  if (!record || record.score < PASS_MARK) return 0;
  return lesson.xp + Math.max(0, Math.min(10, Math.round(record.score / 10)));
}

export function rankForXp(xp: number): Rank {
  return [...RANKS].reverse().find((r) => xp >= r.minXp) ?? RANKS[0];
}

/** Consecutive days with a lesson activity, ending today or yesterday. */
export function studyStreak(records: LessonProgress[], today = new Date()): number {
  const days = new Set(records.map((r) => dayKey(new Date(r.completedAt))));
  if (!days.size) return 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export interface LearnStats {
  xp: number;
  maxXp: number;
  rank: Rank;
  nextRank: Rank | null;
  /** Progress from the current rank's floor to the next rank, 0–100. */
  rankPct: number;
  xpToNext: number;
  lessonsDone: number;
  lessonsTotal: number;
  modulesDone: number;
  modulesTotal: number;
  badges: string[];
  streak: number;
  pilotReady: boolean;
  quizAverage: number;
}

export function learnStats(progress: ProgressMap): LearnStats {
  let xp = 0;
  let lessonsDone = 0;
  let scoreSum = 0;
  for (const { track, lesson } of ALL_LESSONS) {
    const record = progress[lessonKey(track.id, lesson.id)];
    const gained = lessonXp(lesson, record);
    if (record && record.score >= PASS_MARK) {
      lessonsDone += 1;
      scoreSum += record.score;
    }
    xp += gained;
  }
  const rank = rankForXp(xp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1] ?? null;
  const span = nextRank ? nextRank.minXp - rank.minXp : 0;
  const rankPct = nextRank ? Math.max(0, Math.min(100, Math.round(((xp - rank.minXp) / span) * 100))) : 100;
  const badges = TRACKS.filter((t) => trackComplete(t, progress)).map((t) => t.id);
  return {
    xp,
    maxXp: TOTAL_XP,
    rank,
    nextRank,
    rankPct,
    xpToNext: nextRank ? Math.max(0, nextRank.minXp - xp) : 0,
    lessonsDone,
    lessonsTotal: ALL_LESSONS.length,
    modulesDone: lessonsDone,
    modulesTotal: ALL_LESSONS.length,
    badges,
    streak: studyStreak(Object.values(progress)),
    pilotReady: badges.length === TRACKS.length,
    quizAverage: lessonsDone ? Math.round(scoreSum / lessonsDone) : 0,
  };
}

export function trackComplete(track: Track, progress: ProgressMap): boolean {
  return track.lessons.every((l) => (progress[lessonKey(track.id, l.id)]?.score ?? -1) >= PASS_MARK);
}

export function trackDone(track: Track, progress: ProgressMap): number {
  return track.lessons.filter((l) => (progress[lessonKey(track.id, l.id)]?.score ?? -1) >= PASS_MARK).length;
}

export function trackXpEarned(track: Track, progress: ProgressMap): number {
  return track.lessons.reduce((n, l) => n + lessonXp(l, progress[lessonKey(track.id, l.id)]), 0);
}

export function trackXpTotal(track: Track): number {
  return track.lessons.reduce((n, l) => n + l.xp + 10, 0);
}

/** A lesson opens once every earlier lesson in its track has been passed. */
export function lessonUnlocked(track: Track, index: number, progress: ProgressMap): boolean {
  if (index <= 0) return true;
  return (progress[lessonKey(track.id, track.lessons[index - 1].id)]?.score ?? -1) >= PASS_MARK;
}

export function nextLesson(track: Track, progress: ProgressMap): { lesson: Lesson; index: number } | null {
  const index = track.lessons.findIndex((l) => (progress[lessonKey(track.id, l.id)]?.score ?? -1) < PASS_MARK);
  if (index < 0) return null;
  return { lesson: track.lessons[index], index };
}
