import type { Lesson, Track } from '../../lib/types';
import { foundations } from './foundations';
import { methods } from './methods';
import { publishing } from './publishing';
import { career } from './career';
import { aiTrack } from './ai';

export const TRACKS: Track[] = [foundations, career, methods, publishing, aiTrack];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id);

export function lessonById(trackId: string, lessonId: string): { track: Track; lesson: Lesson; index: number } | null {
  const track = trackById(trackId);
  if (!track) return null;
  const index = track.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return null;
  return { track, lesson: track.lessons[index], index };
}

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ track: t, lesson: l })));

export const BADGE_LABEL: Record<string, string> = {
  foundations: 'Research foundations',
  'getting-in': 'Getting into research',
  methods: 'Methods and analysis',
  publishing: 'Publishing and presenting',
  ai: 'AI in research',
};

/** Share of quiz answers a learner needs right for a lesson to count (the database checks the same mark). */
export const PASS_MARK = 50;
