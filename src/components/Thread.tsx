import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../lib/app';
import { CONTACT_EMAIL } from '../lib/config';
import { relativeTime } from '../lib/format';
import { repo } from '../lib/repo';
import { Link } from '../lib/router';
import type { Application, Message, Project } from '../lib/types';
import { Sheet } from './ui';

/** Messages between an applicant and a project lead, kept on Thesia and tied to one application. */
export function ThreadSheet({ app, project, open, onClose }: { app: Application; project: Project | undefined; open: boolean; onClose: () => void }) {
  const { user, toast } = useApp();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const isApplicant = user?.id === app.userId;
  const canMessage = !!project?.ownerId && !project.isSample;
  const other = isApplicant ? project?.lead.name || 'the project lead' : app.applicantName;

  useEffect(() => {
    if (!open) return;
    setMsgs(null);
    repo
      .listMessages(app.id)
      .then(setMsgs)
      .catch(() => setMsgs([]));
  }, [open, app.id]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !user) return;
    setBusy(true);
    try {
      const m = await repo.sendMessage(app.id, user.id, text);
      setMsgs((xs) => [...(xs || []), m]);
      setBody('');
    } catch (err: any) {
      toast(`Couldn’t send: ${err?.message || 'network error'}`);
    } finally {
      setBusy(false);
    }
  };

  const report = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Safeguarding concern: application ' + app.id)}&body=${encodeURIComponent(
    'Tell us what happened. We read every report within one working day.\n\n'
  )}`;

  return (
    <Sheet open={open} onClose={onClose} title={`Messages with ${other}`} wide>
      <div className="stack" style={{ ['--gap' as any]: '14px' }}>
        <p className="xsmall faint">
          About: {project?.title || 'this project'}. Messages stay on Thesia so both of you have a record. Never share passwords or payment details here.
        </p>
        <div className="thread-log" ref={logRef} aria-live="polite">
          {!msgs ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : msgs.length === 0 ? (
            <p className="small muted">
              {canMessage
                ? isApplicant
                  ? 'No messages yet. A short, specific question about the role gets the best reply.'
                  : 'No messages yet. Ask about availability or share next steps.'
                : 'This is a sample project, so no one will reply. On real projects the lead sees your message here and gets a notification.'}
            </p>
          ) : (
            msgs.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={`msg ${mine ? 'msg-user' : 'msg-assistant'}`}>
                  <span className="msg-meta">
                    {mine ? 'You' : m.senderId === app.userId ? app.applicantName : project?.lead.name || 'Project lead'}, {relativeTime(m.createdAt)}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.body}</span>
                </div>
              );
            })
          )}
        </div>
        {canMessage && (
          <form className="stack" style={{ ['--gap' as any]: '8px' }} onSubmit={send}>
            <label htmlFor={`msg-${app.id}`} className="sr-only">
              Your message
            </label>
            <textarea
              id={`msg-${app.id}`}
              className="textarea"
              style={{ minHeight: 90 }}
              value={body}
              maxLength={2000}
              placeholder={`Write to ${other}`}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e as unknown as FormEvent);
              }}
            />
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <span className="xsmall faint">
                Something wrong? <a href={report}>Report a concern</a>. Read our <Link to="/safeguarding">safeguarding commitments</Link>.
              </span>
              <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !body.trim()}>
                {busy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}
