import { LuShieldCheck } from 'react-icons/lu';
import { PageHead } from '../components/ui';
import { CONTACT_EMAIL } from '../lib/config';
import { Link } from '../lib/router';

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: 'Students under 18',
    points: [
      'School students join through their school’s Thesia programme, or with a parent or guardian’s permission.',
      'Their research passports are private. They aren’t listed in People or shown to the public, though their certificates can still be verified by ID.',
      'They work on safe topics. They don’t collect sensitive data, such as health, sexuality or criminal records, from other people.',
    ],
  },
  {
    title: 'Contact between adults and students',
    points: [
      'Messages on Thesia belong to an application and stay on the platform, so there is always a record both sides can see.',
      'Adults must not ask a student under 18 to move a conversation to a private channel, meet alone, or share personal photos. Doing so means the adult’s account is removed.',
      'School coordinators see learning progress, never message content.',
    ],
  },
  {
    title: 'Live sessions',
    points: [
      'Sessions in the Young Researchers Programme always have a teacher from the school present, on campus or online.',
      'There are no one-to-one sessions between an adult mentor and a student under 18.',
      'Sessions are only recorded when every participant, and a guardian for students under 18, has agreed.',
    ],
  },
  {
    title: 'Who teaches and mentors',
    points: [
      'We check every instructor’s identity, published work and references before they teach.',
      'Instructors and mentors agree to this code of conduct before their first session.',
      'Project leads who accept school students are reviewed by the Thesia team.',
    ],
  },
  {
    title: 'Research with people',
    points: [
      'Every project shows its ethics status. Projects that collect data from people need ethics approval or a clear reason why none is required.',
      'Participants give informed consent. Our consent form tool includes a guardian version for participants under 18.',
    ],
  },
];

export function Safeguarding() {
  const report = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Safeguarding concern')}`;
  return (
    <div className="wrap wrap-narrow page">
      <PageHead
        title="Keeping students safe"
        lede="Many people on Thesia are students, and some are under 18. These are the rules we run the platform and our programmes by."
      />
      <div className="callout callout-margin stack" style={{ ['--gap' as any]: '6px', marginBottom: 32 }}>
        <strong>To report a concern</strong>
        <span>
          Email <a href={report}>{CONTACT_EMAIL}</a> with “Safeguarding concern” in the subject, or use the Report a concern link in any message thread. We reply within one working day and can suspend an account straight away while we look into it. If someone is in immediate danger, contact the police first.
        </span>
      </div>
      <div className="stack" style={{ ['--gap' as any]: '32px' }}>
        {SECTIONS.map((s) => (
          <section key={s.title} className="stack" style={{ ['--gap' as any]: '10px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)' }}>{s.title}</h2>
            <ul className="feature-list" style={{ fontSize: 'var(--t-md)' }}>
              {s.points.map((p) => (
                <li key={p}>
                  <LuShieldCheck aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="stack" style={{ ['--gap' as any]: '10px' }}>
          <h2 style={{ fontSize: 'var(--t-xl)' }}>For schools</h2>
          <p className="muted">
            Before a programme starts, each school gets our full safeguarding policy, the name of the Thesia person responsible for safeguarding, and the guardian consent forms. See also our <Link to="/privacy">privacy policy</Link> and{' '}
            <Link to="/terms">terms</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
