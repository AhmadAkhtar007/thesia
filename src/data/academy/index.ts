import type { Lesson, Track } from '../../lib/types';
import { scoping } from './scoping';
import { fieldwork } from './fieldwork';
import { analysis } from './analysis';
import { reporting } from './reporting';

/** The applied research curriculum, in the order a student should take it. */
export const TRACKS: Track[] = [scoping, fieldwork, analysis, reporting];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id);

export function lessonById(trackId: string, lessonId: string): { track: Track; lesson: Lesson; index: number } | null {
  const track = trackById(trackId);
  if (!track) return null;
  const index = track.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return null;
  return { track, lesson: track.lessons[index], index };
}

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ track: t, lesson: l })));

export const BADGE_LABEL: Record<string, string> = Object.fromEntries(TRACKS.map((t) => [t.id, t.title]));

/** Share of quiz answers a learner needs right for a lesson to count (the database checks the same mark). */
export const PASS_MARK = 50;

/** Total XP available if every lesson is passed with a perfect quiz. */
export const TOTAL_XP = ALL_LESSONS.reduce((n, x) => n + x.lesson.xp + 10, 0);
