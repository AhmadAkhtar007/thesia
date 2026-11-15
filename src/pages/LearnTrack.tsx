import { useState } from 'react';
import { LuArrowRight, LuAward, LuBadgeCheck, LuClock, LuShieldCheck, LuUsers } from 'react-icons/lu';
import { SkillTrail } from '../components/learn/SkillTrail';
import { PageHead } from '../components/ui';
import { PASS_MARK, TRACKS, trackById } from '../data/academy';
import { useApp } from '../lib/app';
import { nextLesson, trackComplete, trackDone, trackXpEarned, trackXpTotal } from '../lib/learn';
import { repo } from '../lib/repo';
import { Link, useNavigate, useParams } from '../lib/router';
import { NotFound } from './NotFound';

export function TrackPage() {
  const { track: trackId } = useParams();
  const track = trackById(trackId);
  const { progress, user, toast, requireAuth } = useApp();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  if (!track) return <NotFound />;

  const done = trackDone(track, progress);
  const complete = trackComplete(track, progress);
  const next = nextLesson(track, progress);
  const pct = Math.round((done / track.lessons.length) * 100);
  const minutes = track.lessons.reduce((n, l) => n + l.minutes, 0);
  const nextTrack = TRACKS[TRACKS.findIndex((t) => t.id === track.id) + 1];

  const openCertificate = async () => {
    if (!user) {
      requireAuth('certificate');
      return;
    }
    setClaiming(true);
    try {
      navigate(`/certificate/${await repo.claimTrackCertificate(user.id, track.id)}`);
    } catch (e: any) {
      const m = String(e?.message || '');
      toast(
        /incomplete|Finish/.test(m)
          ? `Each lesson needs at least ${PASS_MARK}% on its quiz before the certificate is issued.`
          : `Couldn’t open your certificate: ${m || 'network error'}`
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="wrap page">
      <PageHead crumbs={[{ to: '/learn', label: 'Learn' }]} title={track.title} lede={track.summary}>
        <div className="cluster">
          <Link to={`/learn/${track.id}/${next?.lesson.id ?? track.lessons[0].id}`} className="btn btn-primary">
            {done === 0 ? 'Start the track' : complete ? 'Review from the start' : 'Continue'}
          </Link>
          {complete && (
            <button type="button" className="btn btn-mark" onClick={openCertificate} disabled={claiming}>
              <LuShieldCheck aria-hidden="true" /> {claiming ? 'Opening…' : 'View certificate'}
            </button>
          )}
          {complete && !user && <span className="small faint">Sign in to claim a verifiable certificate.</span>}
        </div>
        <div className="track-meta-row">
          <span className={`pill ${track.level === 'Beginner' ? 'pill-mark' : 'pill-neutral'}`}>{track.level}</span>
          <span className="small muted">
            <LuUsers aria-hidden="true" /> {track.audience}
          </span>
          <span className="small muted">
            <LuClock aria-hidden="true" /> {minutes} min
          </span>
          <span className="small muted">
            <LuAward aria-hidden="true" /> {trackXpEarned(track, progress)} of {trackXpTotal(track)} XP
          </span>
        </div>
        <div className="progress" style={{ maxWidth: 420 }}>
          <div className="progress-bar" aria-hidden="true">
            <b style={{ width: `${pct}%` }} />
          </div>
          <span>
            {done} of {track.lessons.length} steps complete
            {complete ? '. Badge earned.' : `. Pass each quiz at ${PASS_MARK}% or more to earn the badge.`}
          </span>
        </div>
      </PageHead>

      {complete && (
        <div className="track-badge-banner">
          <LuAward aria-hidden="true" />
          <div>
            <strong>{track.short} badge earned</strong>
            <p className="small">This track now appears on your research passport as proof of the method, not just a completed video.</p>
          </div>
        </div>
      )}

      <div className="track-layout">
        <div className="stack" style={{ ['--gap' as any]: '28px' }}>
          <div className="track-banner">
            <LuBadgeCheck aria-hidden="true" />
            <p>
              Finishing this track counts towards selection for paid company projects. It is one of {TRACKS.length} core tracks
              in the applied research curriculum.
            </p>
            <Link to="/projects" className="small">
              See projects
            </Link>
          </div>
          <SkillTrail track={track} />
          <nav className="cluster" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--rule)', paddingTop: 20 }} aria-label="Track navigation">
            <Link to="/learn" className="btn btn-ghost">
              All tracks
            </Link>
            {nextTrack ? (
              <Link to={`/learn/${nextTrack.id}`} className="btn btn-secondary">
                Next track: {nextTrack.title} <LuArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <Link to="/projects" className="btn btn-secondary">
                Apply for a project <LuArrowRight aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>

        <aside className="track-aside">
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <span className="xsmall caps faint">What you can do at the end</span>
            <p className="small">{track.outcome}</p>
          </div>
          <div className="panel stack" style={{ ['--gap' as any]: '10px' }}>
            <span className="xsmall caps faint">Skills this track covers</span>
            <div className="track-skills">
              {track.skills.map((s) => (
                <span key={s} className="trail-skill">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="panel stack" style={{ ['--gap' as any]: '8px' }}>
            <span className="xsmall caps faint">How the XP works</span>
            <p className="small muted">
              Each lesson has base XP. Pass the quiz at {PASS_MARK}% or more to earn it; a stronger quiz adds up to 10 bonus XP.
              XP and badges are built from your lesson record, so a retake never lowers your best score.
            </p>
          </div>
          <Link to="/guide" className="btn btn-secondary">
            Ask the guide about this track
          </Link>
        </aside>
      </div>
    </div>
  );
}
