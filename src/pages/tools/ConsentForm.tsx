import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CopyButton, Field } from '../../components/ui';
import { Link } from '../../lib/router';
import { ToolHead } from './ToolsIndex';

type Form = {
  title: string;
  researchers: string;
  institution: string;
  contact: string;
  purpose: string;
  tasks: string;
  duration: string;
  risks: string;
  benefits: string;
  compensation: string;
  storage: string;
  recording: boolean;
  minors: boolean;
  committee: string;
  reference: string;
};

const START: Form = {
  title: 'Heat stress among delivery riders in Karachi',
  researchers: 'Omar Farooq and team, supervised by Dr. [Supervisor name]',
  institution: '[University name], Karachi',
  contact: '[email address] or [phone number]',
  purpose: 'to understand how hot weather affects the health of delivery riders, and what helps them stay safe',
  tasks: 'answer a short questionnaire about your work hours, breaks, water intake and any symptoms you have felt in hot weather',
  duration: 'about 15 minutes',
  risks: 'Some questions ask about your health. You can skip any question you don’t want to answer. There are no other known risks.',
  benefits: 'There is no direct benefit to you. The results may help delivery companies and the city protect riders during heatwaves.',
  compensation: 'You will receive PKR 300 mobile credit for completing the questionnaire.',
  storage: 'Your answers will be stored without your name on a password-protected computer, seen only by the research team, and deleted five years after the study ends. Results will be reported only as group totals, so no one can be identified.',
  recording: false,
  minors: false,
  committee: '[Name of ethics committee]',
  reference: '[Approval reference number]',
};

export function buildConsent(f: Form) {
  const lines = [
    `CONSENT TO TAKE PART IN RESEARCH`,
    ``,
    `Study: ${f.title}`,
    `Researchers: ${f.researchers}, ${f.institution}`,
    ``,
    `You are invited to take part in a research study. Please read this form, or have it read to you, and ask any questions before you decide.`,
    ``,
    `What is the study about?`,
    `The study aims ${f.purpose}.`,
    ``,
    `What will I be asked to do?`,
    `You will be asked to ${f.tasks}. This will take ${f.duration}.${f.recording ? ' With your permission, the conversation will be audio-recorded so we can write it down accurately.' : ''}`,
    ``,
    `Are there any risks?`,
    f.risks,
    ``,
    `Are there any benefits?`,
    f.benefits,
    ...(f.compensation.trim() ? [``, `Will I be paid?`, f.compensation] : []),
    ``,
    `Do I have to take part?`,
    `No. Taking part is completely voluntary. You can stop at any time, or skip any question, without giving a reason and without any penalty. If you stop, you can ask us to remove your answers until the data is analysed.`,
    ``,
    `What happens to my information?`,
    f.storage,
    ``,
    `Who has approved this study?`,
    `This study has been reviewed and approved by ${f.committee} (reference: ${f.reference}).`,
    ``,
    `Who can I contact?`,
    `If you have questions about the study, contact ${f.researchers.split(',')[0]} at ${f.contact}. If you have concerns about how the study is being run, you can contact ${f.committee}.`,
    ``,
    `CONSENT`,
    `Please tick each box:`,
    `[ ] I have read this information, or had it read to me, and my questions have been answered.`,
    `[ ] I understand that taking part is voluntary and that I can stop at any time without giving a reason.`,
    `[ ] I understand how my information will be stored and used.`,
    ...(f.recording ? [`[ ] I agree to the interview being audio-recorded.`] : []),
    `[ ] I agree to take part in this study.`,
    ``,
    `Participant name: ____________________   Signature or thumbprint: ____________   Date: ________`,
    `Researcher name: _____________________   Signature: __________________________   Date: ________`,
  ];
  if (f.minors) {
    lines.push(
      ``,
      `PARENT OR GUARDIAN PERMISSION (for participants under 18)`,
      `[ ] I am the parent or guardian of the young person named above. I have read this information and I give permission for them to take part.`,
      `Parent or guardian name: ______________   Signature: ____________   Date: ________`,
      ``,
      `YOUNG PERSON’S AGREEMENT (assent)`,
      `This study is about ${f.title.toLowerCase()}. If you say yes, you will ${f.tasks}. You don’t have to say yes, even if your parent or guardian has agreed. You can stop at any time and no one will be upset.`,
      `[ ] I understand and I want to take part.`,
      `Name: ______________   Date: ________`
    );
  }
  return lines.join('\n');
}

export function ConsentForm() {
  const [f, setF] = useState<Form>(START);
  const text = useMemo(() => buildConsent(f), [f]);
  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const placeholders = (text.match(/\[[^\]]+\]/g) || []).filter((p) => p !== '[ ]').length;

  return (
    <div className="wrap page">
      <ToolHead
        title="Consent form builder"
        lede="Draft a plain-language informed consent form with every element ethics committees expect. Your committee may have its own template; use theirs if so."
      />
      <div className="tool-layout">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <Field label="Study title" htmlFor="cf-t">
            <input id="cf-t" className="input" value={f.title} onChange={set('title')} />
          </Field>
          <div className="form-grid">
            <Field label="Researchers" htmlFor="cf-r">
              <input id="cf-r" className="input" value={f.researchers} onChange={set('researchers')} />
            </Field>
            <Field label="Institution" htmlFor="cf-i">
              <input id="cf-i" className="input" value={f.institution} onChange={set('institution')} />
            </Field>
          </div>
          <Field label="Contact for questions" htmlFor="cf-c">
            <input id="cf-c" className="input" value={f.contact} onChange={set('contact')} />
          </Field>
          <Field label="The study aims…" htmlFor="cf-p" hint="Finish the sentence in plain words.">
            <textarea id="cf-p" className="textarea" style={{ minHeight: 70 }} value={f.purpose} onChange={set('purpose')} />
          </Field>
          <Field label="You will be asked to…" htmlFor="cf-tk">
            <textarea id="cf-tk" className="textarea" style={{ minHeight: 70 }} value={f.tasks} onChange={set('tasks')} />
          </Field>
          <Field label="How long it takes" htmlFor="cf-d">
            <input id="cf-d" className="input" value={f.duration} onChange={set('duration')} />
          </Field>
          <Field label="Risks or discomfort" htmlFor="cf-rk">
            <textarea id="cf-rk" className="textarea" style={{ minHeight: 70 }} value={f.risks} onChange={set('risks')} />
          </Field>
          <Field label="Benefits" htmlFor="cf-b">
            <textarea id="cf-b" className="textarea" style={{ minHeight: 70 }} value={f.benefits} onChange={set('benefits')} />
          </Field>
          <Field label="Payment or thanks (optional)" htmlFor="cf-cm" hint="Keep it modest so it doesn’t pressure people to take part.">
            <input id="cf-cm" className="input" value={f.compensation} onChange={set('compensation')} />
          </Field>
          <Field label="How data is stored and protected" htmlFor="cf-s">
            <textarea id="cf-s" className="textarea" style={{ minHeight: 90 }} value={f.storage} onChange={set('storage')} />
          </Field>
          <div className="form-grid">
            <Field label="Ethics committee" htmlFor="cf-ec">
              <input id="cf-ec" className="input" value={f.committee} onChange={set('committee')} />
            </Field>
            <Field label="Approval reference" htmlFor="cf-ref">
              <input id="cf-ref" className="input" value={f.reference} onChange={set('reference')} />
            </Field>
          </div>
          <label className="check">
            <input type="checkbox" checked={f.recording} onChange={(e) => setF((x) => ({ ...x, recording: e.target.checked }))} />
            Interviews will be audio-recorded
          </label>
          <label className="check">
            <input type="checkbox" checked={f.minors} onChange={(e) => setF((x) => ({ ...x, minors: e.target.checked }))} />
            Some participants are under 18 (adds guardian permission and young person’s assent)
          </label>
        </form>

        <div className="stack" style={{ ['--gap' as any]: '14px' }}>
          <div className="stack" data-copy-scope style={{ ['--gap' as any]: '10px' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Your consent form</h2>
              <CopyButton text={text} label="Copy form" className="btn btn-primary btn-sm" />
            </div>
            {placeholders > 0 && <p className="callout callout-margin small">{placeholders} placeholders in [square brackets] still need filling in.</p>}
            <div className="output-sheet" data-copy-target style={{ maxHeight: '70vh', overflow: 'auto' }}>
              {text}
            </div>
          </div>
          <p className="small muted">
            Translate it into the language participants speak best, using forward and back translation, and read it aloud for anyone who can’t read it. See{' '}
            <Link to="/learn/fieldwork/fieldwork-ethics">Run fieldwork ethically and safely</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
