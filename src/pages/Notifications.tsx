import { useEffect, useState } from 'react';
import { LuAward, LuBadgeCheck, LuBell, LuGraduationCap, LuMessageSquare, LuSchool, LuSend, LuUserCheck } from 'react-icons/lu';
import type { ReactNode } from 'react';
import { Empty, PageHead } from '../components/ui';
import { useApp } from '../lib/app';
import { relativeTime } from '../lib/format';
import { repo } from '../lib/repo';
import { useNavigate } from '../lib/router';
import type { Notice } from '../lib/types';

const ICON: Record<string, ReactNode> = {
  application: <LuSend />,
  'application-status': <LuUserCheck />,
  message: <LuMessageSquare />,
  certificate: <LuAward />,
  contribution: <LuBadgeCheck />,
  verified: <LuBadgeCheck />,
  enrollment: <LuGraduationCap />,
  feedback: <LuGraduationCap />,
  org: <LuSchool />,
};

export function Notifications() {
  const { user, ready, refreshUnread } = useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (ready && !user) navigate('/signin?next=/notifications', { replace: true });
  }, [ready, user]);

  useEffect(() => {
    if (!user) return;
    repo
      .listNotifications(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user]);

  if (!user) return null;
  const unread = (items || []).filter((n) => !n.readAt);

  const open = async (n: Notice) => {
    if (!n.readAt) {
      await repo.markNotificationsRead(user.id, [n.id]).catch(() => {});
      refreshUnread();
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    await repo.markNotificationsRead(user.id);
    setItems((xs) => (xs || []).map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    refreshUnread();
  };

  return (
    <div className="wrap wrap-narrow page">
      <PageHead title="Notifications" lede="Applications, messages, certificates and cohort updates, newest first.">
        {unread.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={readAll}>
            Mark all {unread.length} as read
          </button>
        )}
      </PageHead>
      {!items ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : items.length === 0 ? (
        <Empty title="Nothing yet">You’ll hear here when a lead replies, your application moves, or a certificate is issued.</Empty>
      ) : (
        <ul className="notice-list">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className={`notice${n.readAt ? '' : ' is-unread'}`} onClick={() => open(n)}>
                <span className="notice-icon" aria-hidden="true">
                  {ICON[n.kind] || <LuBell />}
                </span>
                <span className="min0 stack" style={{ ['--gap' as any]: '2px' }}>
                  <strong>{n.title}</strong>
                  {n.body && <span className="small muted">{n.body}</span>}
                  <span className="xsmall faint">{relativeTime(n.createdAt)}</span>
                </span>
                {!n.readAt && <span className="sr-only">Unread</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
