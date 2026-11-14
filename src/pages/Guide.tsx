import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { LuSend } from 'react-icons/lu';
import { Markdown, PageHead } from '../components/ui';
import { askGuide, guideAvailability, type ChatTurn, type GuideSource } from '../lib/guide';
import { useQueryState } from '../lib/router';
import { readJSON, writeJSON } from '../lib/storage';
import { usePeople, useProjects } from '../lib/useData';

const STARTERS = [
  'I want to research smog and health in Lahore. Where do I start?',
  'How do I write to a professor about a research assistant role?',
  'Is a journal that promises review in 3 days legit?',
  'How many people should I survey for my final-year project?',
  'I’m in A Levels. Can I do real research?',
];

const SOURCE_LABEL: Record<GuideSource, string> = {
  claude: 'Answers come from Claude, using your claude.ai account',
  server: 'Answers come from Thesia’s AI guide',
  coach: 'Answers come from Thesia’s built-in coach, which searches projects, lessons and tools',
};

type Msg = ChatTurn & { source?: GuideSource; note?: string };

export function Guide() {
  const [params] = useQueryState();
  const { projects } = useProjects();
  const { people } = usePeople();
  const [msgs, setMsgs] = useState<Msg[]>(() => readJSON<Msg[]>('guide-history', []));
  const [draft, setDraft] = useState(params.get('q') || '');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [source, setSource] = useState<GuideSource>('coach');
  const abort = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    guideAvailability().then(setSource);
  }, []);
  useEffect(() => {
    writeJSON('guide-history', msgs.slice(-20));
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, streaming]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history: Msg[] = [...msgs, { role: 'user', content }];
    setMsgs(history);
    setDraft('');
    setBusy(true);
    setStreaming('');
    abort.current = new AbortController();
    try {
      const res = await askGuide(
        history.map(({ role, content }) => ({ role, content })),
        { projects, people },
        (t) => setStreaming(t),
        abort.current.signal
      );
      setMsgs((m) => [...m, { role: 'assistant', content: res.text, source: res.source, note: res.note }]);
      setSource(res.source);
    } catch (e: any) {
      if (e?.code !== 'cancelled') setMsgs((m) => [...m, { role: 'assistant', content: `Something went wrong: ${e?.message || 'network error'}. Try again in a moment.`, source: 'coach' }]);
      else if (streaming) setMsgs((m) => [...m, { role: 'assistant', content: streaming + '\n\n*Stopped.*' }]);
    } finally {
      setBusy(false);
      setStreaming('');
      abort.current = null;
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <div className="wrap page">
      <PageHead title="Research guide" lede="Describe an idea you’re curious about or where you’re stuck. The guide helps you sharpen your question and points you to projects, people, lessons and tools on Thesia.">
        <p className="small faint">{SOURCE_LABEL[source]}. It can be wrong: check facts, and never share participants’ personal data here.</p>
      </PageHead>
      <div className="chat">
        <div className="chat-log" ref={logRef} aria-live="polite">
          {msgs.length === 0 && !busy && (
            <div className="stack" style={{ ['--gap' as any]: '12px' }}>
              <p className="muted">Start with one of these, or write your own.</p>
              <div className="chip-row">
                {STARTERS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>
              {m.role === 'assistant' ? (
                <>
                  <span className="msg-meta">{m.source === 'coach' ? 'Thesia coach' : 'Thesia guide'}</span>
                  {m.note && <span className="xsmall faint">{m.note}</span>}
                  <Markdown source={m.content} className="prose small" />
                </>
              ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
              )}
            </div>
          ))}
          {busy && (
            <div className="msg msg-assistant">
              <span className="msg-meta">Thesia guide</span>
              {streaming ? (
                <Markdown source={streaming} className="prose small" />
              ) : (
                <span className="typing" aria-label="Thinking">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
          )}
        </div>
        <form className="chat-input" onSubmit={onSubmit}>
          <label htmlFor="guide-input" className="sr-only">
            Your message
          </label>
          <textarea id="guide-input" className="textarea" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} placeholder="Ask about a research idea, a method, writing to a professor, publishing…" />
          {busy ? (
            <button type="button" className="btn btn-secondary" onClick={() => abort.current?.abort()}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()} aria-label="Send">
              <LuSend />
              <span className="hide-sm">Send</span>
            </button>
          )}
        </form>
      </div>
      {msgs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMsgs([])}>
            Clear conversation
          </button>
        </div>
      )}
    </div>
  );
}
