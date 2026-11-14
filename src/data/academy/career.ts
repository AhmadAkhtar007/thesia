import type { Track } from '../../lib/types';

export const career: Track = {
  id: 'getting-in',
  title: 'Getting into research',
  level: 'Beginner',
  audience: 'Anyone looking for a first research role',
  summary: 'Write to researchers well, build visible proof of your work, find research assistant roles and plan for graduate study.',
  lessons: [
    {
      id: 'emailing-researchers',
      title: 'Writing to a researcher, and getting a reply',
      minutes: 7,
      summary: 'Short, specific, respectful emails get answered. Mass templates don’t.',
      tool: '/tools/outreach',
      body: `Researchers are busy and receive many emails from students. The ones that get replies are short, specific and show genuine interest in *their* work.

## Before you write

- Read the researcher’s profile and **one or two recent papers**.
- Check their lab page for openings or instructions for students.
- Decide on one **concrete ask**: a 15-minute call, a research assistant role, a specific project, or advice on a question.

## The email

**Subject:** specific and short. “BS Economics student: question about your microfinance study” beats “Request”.

**Body, about 150 to 200 words:**

1. Who you are, in one sentence.
2. What you read of theirs, and one specific thing you found interesting or a question it raised.
3. What you can offer: skills, time per week, relevant coursework or experience.
4. Your ask, made easy to say yes to.
5. Thanks, and your CV or Thesia profile link.

## Example

*Dear Dr. Mirza,*
*I’m a third-year environmental science student at a university in Rawalpindi. I read your 2025 paper on glacial lake growth and was struck by how fast lakes in the Hunza basin expanded after 2018. I’ve completed a GIS course and have used QGIS for a class project mapping flood extents. I can give about six hours a week this semester. Would you be open to a 15-minute call about whether I could help with lake mapping in your group? My profile is attached. Thank you for your time.*

## After you send

If there’s no reply, send **one** polite follow-up after 7 to 10 days. If the answer is no, thank them; they may remember you later. Never send the same generic email to dozens of people with only the name changed. Researchers notice.`,
      takeaways: [
        'Read their work first and mention something specific.',
        'Offer concrete skills and time, and make one easy ask.',
        'Follow up once after 7–10 days, then move on politely.',
      ],
      quiz: [
        {
          q: 'Which opening line is strongest?',
          options: [
            'I am very passionate about research and want to work with you.',
            'I read your 2025 paper on glacial lakes and had a question about the Hunza results.',
            'Please find my CV attached.',
          ],
          answer: 1,
          why: 'It shows you engaged with their specific work.',
        },
        {
          q: 'No reply after a week. What next?',
          options: ['Send one polite follow-up', 'Email every day until they answer', 'Message them on every platform'],
          answer: 0,
          why: 'One follow-up is reasonable; more becomes pressure.',
        },
      ],
    },
    {
      id: 'research-passport',
      title: 'Building your research passport',
      minutes: 5,
      summary: 'Show what you have done, not what you attended. Proof of work beats certificates.',
      body: `A certificate says you attended something. A research passport shows what you did: the data you cleaned, the interviews you coded, the analysis you ran, the poster you presented.

## What to include

- **Outputs:** papers, preprints, posters, datasets, code, reports, talks. Link to each one.
- **Your role in each:** use CRediT roles such as data curation or formal analysis, so readers know exactly what you contributed.
- **Skills, with evidence:** “R (used for the smog dataset cleaning)” beats a bare list.
- **Methods you have practised:** surveys, interviews, lab techniques, GIS.
- **Languages:** fieldwork in Urdu, Pashto, Sindhi or Saraiki is a real skill.

## Identifiers worth having

- **ORCID iD:** a free, permanent researcher ID that links all your work, even if your name is spelled differently across papers. Get one at orcid.org.
- **Google Scholar profile:** once you have a publication or preprint.
- **GitHub or OSF:** for code and data.

## On Thesia

Your Thesia profile is your research passport. Contributions on Thesia projects are added with their CRediT roles, Academy tracks you complete appear as badges, and you can share one link in applications, emails and on LinkedIn.`,
      takeaways: [
        'List outputs with links and your specific role in each.',
        'Get a free ORCID iD early.',
        'Skills are more convincing with evidence attached.',
      ],
      quiz: [
        {
          q: 'Which line is most convincing on a profile?',
          options: ['Skilled in data analysis', 'Formal analysis: ran distributed-lag models in R for a smog and asthma study (preprint linked)'],
          answer: 1,
          why: 'It shows a specific contribution with evidence.',
        },
        {
          q: 'What is an ORCID iD?',
          options: ['A paid journal membership', 'A free, permanent identifier for researchers', 'A plagiarism checker'],
          answer: 1,
          why: 'It links your work to you across names, institutions and years.',
        },
      ],
    },
    {
      id: 'ra-and-summer',
      title: 'Research assistant roles and summer programmes',
      minutes: 6,
      summary: 'Where to find first roles, what research assistants actually do, and how to work towards funded programmes abroad.',
      body: `## What research assistants do

Research assistants (RAs) help with literature searches, data collection, data entry and cleaning, transcription, coding interviews, running analyses, and preparing figures. It’s often unglamorous, and it’s how most researchers learned the craft.

## Where to look

- Faculty and lab pages at your own university, and your university’s **ORIC** (Office of Research, Innovation and Commercialization).
- Research organisations that hire field and research associates.
- Projects posted on Thesia, filtered by your level and field.
- Your professors: ask after class or in office hours whether they need help.

## How to stand out

- Show you’re **reliable**: meet small deadlines early.
- Show **care with data**: document what you do.
- Learn one tool well (Excel, R, Python, Stata, QGIS, NVivo).
- Ask for feedback and act on it.

## Building towards international programmes

Funded summer research programmes abroad, such as research internships in Canada, Japan, Saudi Arabia or Switzerland, usually look for students who already have some research experience, strong grades and a supportive letter from a supervisor. A semester or two as an RA gives you all three.

Many international summer programmes open applications months in advance, often in the autumn or winter before the summer. Check each programme’s official page early and set reminders. Thesia’s programme list links to the official pages.`,
      takeaways: [
        'RA work is how most researchers learn the craft.',
        'Reliability and careful documentation matter more than credentials.',
        'Local RA experience makes you competitive for funded programmes abroad.',
      ],
      quiz: [
        {
          q: 'Which is usually the best first step towards a funded summer programme abroad?',
          options: ['Collecting online certificates', 'Gaining real research experience and a supervisor’s letter', 'Applying without any experience to many programmes'],
          answer: 1,
          why: 'Selectors look for evidence you can do research and a referee who can vouch for you.',
        },
      ],
    },
    {
      id: 'graduate-study',
      title: 'Planning for a research master’s or PhD',
      minutes: 8,
      summary: 'How research degrees differ by country, what applications need, and how funding works.',
      body: `## Degree types

- **MS / MPhil:** often one to two years with a research thesis. In Pakistan, an MS or MPhil is common before a PhD.
- **Research master’s abroad:** some countries, such as the Netherlands and Germany, offer two-year research-focused master’s programmes.
- **PhD:** three to six years of original research. In the UK, Europe and Australia you usually apply to a specific project or supervisor. In the US you usually apply to a department, take courses first, then choose a supervisor.

## What applications usually need

- **Statement of purpose:** why this field, what you have done, what you want to research, and why this programme.
- **Research proposal:** often required in the UK and Europe; one to three pages with a question, background and methods.
- **Letters of recommendation:** from people who have supervised your research.
- **Transcripts** and sometimes tests: an English test (IELTS or TOEFL) is commonly required; the GRE is now optional at many programmes. Check each one.

## Contacting supervisors

Where admission is supervisor-led, email potential supervisors before applying, using the same approach as any research email: specific, short and showing you’ve read their work.

## Funding

Many PhDs abroad are **fully funded** through university studentships. For master’s study, look at scholarship schemes such as Fulbright (through USEFP in Pakistan), Chevening, Commonwealth Scholarships, Erasmus Mundus and DAAD, and HEC scholarships. Each has its own eligibility and timeline; Thesia’s programme list links to the official pages.

## Start early

A strong application needs 9 to 12 months: time to build research experience, ask for letters, and draft and redraft your statement.`,
      takeaways: [
        'UK, Europe and Australia: usually supervisor or project first. US: usually department first.',
        'Letters from research supervisors carry the most weight.',
        'Start 9–12 months before deadlines.',
      ],
      quiz: [
        {
          q: 'Applying for a UK PhD, what should you usually do early?',
          options: ['Contact a potential supervisor', 'Take the GRE twice', 'Wait for the department to contact you'],
          answer: 0,
          why: 'UK PhDs are typically supervisor- or project-led.',
        },
      ],
    },
  ],
};
