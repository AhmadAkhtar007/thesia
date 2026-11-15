import { useMemo } from 'react';
import { LuAward, LuBadgeCheck, LuChartLine, LuCheck, LuCircleCheck } from 'react-icons/lu';
import { PASS_MARK, TRACKS } from '../../data/academy';
import { useApp } from '../../lib/app';
import { learnStats } from '../../lib/learn';
import { Link } from '../../lib/router';

export function ProgressHeader({ compact = false }: { compact?: boolean }) {
  const { progress, live, user } = useApp();
  const stats = useMemo(() => learnStats(progress), [progress]);

  return (
    <section className={`xp-board${compact ? ' is-compact' : ''}`} aria-label="Your research rank and progress">
      <div className="xp-main">
        <span className="xsmall caps faint">Researcher rank</span>
        <div className="xp-rank-line">
          <LuBadgeCheck aria-hidden="true" />
          <h2>{stats.rank.title}</h2>
          <span className="xp-chip">{stats.xp} XP</span>
        </div>
        <p className="small muted">{stats.rank.blurb}</p>
        <div className="xp-bar-wrap">
          <div
            className="xp-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.rankPct}
            aria-label={stats.nextRank ? `Progress to ${stats.nextRank.title}` : 'Highest rank reached'}
          >
            <b style={{ width: `${stats.rankPct}%` }} />
          </div>
          <span className="xsmall faint">
            {stats.nextRank ? `${stats.xpToNext} XP to ${stats.nextRank.title}` : 'Highest rank reached'} · {stats.maxXp} XP available
          </span>
        </div>
      </div>

      <dl className="xp-stats">
        <div>
          <dt>
            <LuCircleCheck aria-hidden="true" /> Modules
          </dt>
          <dd>
            {stats.modulesDone}
            <span>/{stats.modulesTotal}</span>
          </dd>
        </div>
        <div>
          <dt>
            <LuChartLine aria-hidden="true" /> Streak
          </dt>
          <dd>
            {stats.streak}
            <span> {stats.streak === 1 ? 'day' : 'days'}</span>
          </dd>
        </div>
        <div>
          <dt>
            <LuAward aria-hidden="true" /> Badges
          </dt>
          <dd>
            {stats.badges.length}
            <span>/{TRACKS.length}</span>
          </dd>
        </div>
      </dl>

      <div className="badge-shelf" aria-label="Track badges">
        {TRACKS.map((t) => {
          const earned = stats.badges.includes(t.id);
          return (
            <span
              key={t.id}
              className={`track-badge${earned ? ' is-earned' : ''}`}
              title={earned ? `${t.title} badge earned` : `Complete ${t.title} to earn this badge`}
            >
              <LuAward aria-hidden="true" />
              <span>{t.short}</span>
              {earned && <LuCheck aria-hidden="true" className="badge-check" />}
            </span>
          );
        })}
      </div>

      {stats.pilotReady ? (
        <div className="pilot-ready">
          <LuBadgeCheck aria-hidden="true" />
          <div>
            <strong>Pilot ready</strong>
            <p className="small">
              You finished all four core tracks. You can now apply for an active company research project, with a professor
              supervising the work.
            </p>
          </div>
          <Link to="/projects" className="btn btn-primary btn-sm">
            See open projects
          </Link>
        </div>
      ) : compact ? null : (
        <p className="xp-footnote xsmall faint">
          {!live && !user ? 'Demo mode: your XP and badges are saved in this browser. ' : ''}
          Pass each lesson quiz at {PASS_MARK}% or more to earn its XP. The quiz accuracy adds up to 10 bonus XP.
        </p>
      )}
    </section>
  );
}
