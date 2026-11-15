import { LuArrowRight, LuCheck, LuClock, LuEye } from 'react-icons/lu';
import { PASS_MARK } from '../../data/academy';
import { useApp } from '../../lib/app';
import { lessonUnlocked } from '../../lib/learn';
import { lessonKey } from '../../lib/repo';
import { Link } from '../../lib/router';
import type { Track } from '../../lib/types';

/** The stepped track path: done, next, and (in live mode) locked until the previous step is passed. */
export function SkillTrail({ track }: { track: Track }) {
  const { progress, live } = useApp();
  return (
    <ol className="skill-trail">
      {track.lessons.map((lesson, i) => {
        const record = progress[lessonKey(track.id, lesson.id)];
        const done = (record?.score ?? -1) >= PASS_MARK;
        const unlocked = lessonUnlocked(track, i, progress);
        const current = !done && unlocked;
        const canOpen = unlocked || !live;
        const status = done ? 'done' : current ? 'current' : unlocked ? 'open' : 'locked';
        const body = (
          <>
            <div className="trail-card-top">
              <span className="trail-step-label">Step {i + 1}</span>
              {done ? (
                <span className="pill pill-open">
                  <LuCheck aria-hidden="true" /> Done · {record?.score}%
                </span>
              ) : current ? (
                <span className="pill pill-mark">Next up</span>
              ) : canOpen ? (
                <span className="pill pill-neutral">
                  <LuEye aria-hidden="true" /> Preview
                </span>
              ) : (
                <span className="pill pill-neutral">Locked</span>
              )}
            </div>
            <h3>{lesson.title}</h3>
            <p className="small muted">{lesson.summary}</p>
            <div className="trail-meta">
              <span>
                <LuClock aria-hidden="true" /> {lesson.minutes} min
              </span>
              <span className="trail-xp">+{lesson.xp} XP</span>
              {lesson.skillTags.slice(0, 2).map((s) => (
                <span key={s} className="trail-skill">
                  {s}
                </span>
              ))}
            </div>
            {!unlocked && (
              <p className="xsmall faint trail-lock-note">
                {canOpen
                  ? `Preview only. Pass step ${i} to earn XP for this lesson.`
                  : `Complete step ${i}, “${track.lessons[i - 1].title}”, to unlock this lesson.`}
              </p>
            )}
          </>
        );
        return (
          <li key={lesson.id} className={`trail-step is-${status}`}>
            <span className="trail-node" aria-hidden="true">
              {done ? <LuCheck /> : i + 1}
            </span>
            {canOpen ? (
              <Link to={`/learn/${track.id}/${lesson.id}`} className="trail-card">
                {body}
                <LuArrowRight className="trail-arrow" aria-hidden="true" />
              </Link>
            ) : (
              <div className="trail-card is-locked">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Small dot path for the hub cards. */
export function TrackMiniTrail({ track }: { track: Track }) {
  const { progress, live } = useApp();
  return (
    <ol className="mini-trail" aria-label={`${track.title} steps`}>
      {track.lessons.map((lesson, i) => {
        const record = progress[lessonKey(track.id, lesson.id)];
        const done = (record?.score ?? -1) >= PASS_MARK;
        const unlocked = lessonUnlocked(track, i, progress);
        const state = done ? 'done' : unlocked ? 'current' : live ? 'locked' : 'preview';
        const label = done ? 'done' : unlocked ? 'open next' : live ? 'locked' : 'preview';
        return <li key={lesson.id} className={`mini-dot is-${state}`} title={`Step ${i + 1}: ${lesson.title} (${label})`} />;
      })}
    </ol>
  );
}
