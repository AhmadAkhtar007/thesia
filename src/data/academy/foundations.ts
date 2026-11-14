import type { Track } from '../../lib/types';

export const foundations: Track = {
  id: 'foundations',
  title: 'Research foundations',
  level: 'Beginner',
  audience: 'High school and early undergraduate',
  summary: 'What research is, how to ask a question worth answering, and how to find, read and use what others have already found.',
  lessons: [
    {
      id: 'what-is-research',
      title: 'What research is, and what it isn’t',
      minutes: 6,
      summary: 'Research answers a question with evidence, using a method other people can check.',
      body: `Research is a systematic way of answering a question with evidence, using a method that other people can check and repeat. The last part matters most. A school report that collects facts about smog is useful, but it is not research. Measuring air quality outside your school for 30 days and comparing it with the city’s official monitors is research, even if it is small.

## The research cycle

Most research, in any field, moves through the same steps:

1. **Ask a question** that you don’t already know the answer to.
2. **Find out what is known**, so you don’t repeat work or miss an obvious answer.
3. **Choose a method**: a survey, an experiment, interviews, an analysis of existing data.
4. **Collect evidence** carefully, and write down what you did.
5. **Analyse it** honestly, including results you didn’t expect.
6. **Share it** so others can use, check and criticise it.

## Small contributions count

Students often think research means a breakthrough. In practice most published research makes a small, careful contribution: the same question in a new place (has anyone measured this in Peshawar?), a new group of people, a better method, or a check that an earlier result holds up. A replication done well is valuable.

## Ways in

You don’t have to start with your own project. Many researchers begin by contributing to someone else’s: collecting data, cleaning a spreadsheet, coding interviews, checking analysis. Journals now describe these contributions with a standard list of 14 roles called **CRediT**, and Thesia records them on your profile. Starting as a contributor teaches you the method from the inside.`,
      takeaways: [
        'Research answers a question with evidence and a method others can check.',
        'Small, careful contributions such as replications and local data are real research.',
        'Contributing to an existing project is a good first step.',
      ],
      quiz: [
        {
          q: 'Which of these is research?',
          options: [
            'Summarising articles about smog into a school poster',
            'Measuring PM2.5 at your school for 30 days and comparing it with official monitors',
            'Writing an opinion piece on why smog is bad',
          ],
          answer: 1,
          why: 'It asks a question, collects new evidence with a stated method, and can be checked by others.',
        },
        {
          q: 'What makes a finding checkable?',
          options: ['A famous author', 'A clearly documented method', 'A large number of pages'],
          answer: 1,
          why: 'If the method is written down, someone else can repeat it and see if they get the same result.',
        },
      ],
    },
    {
      id: 'research-question',
      title: 'From curiosity to a research question',
      minutes: 8,
      summary: 'Narrow a topic into a question you can actually answer, then test it against the FINER criteria.',
      tool: '/tools/question-builder',
      body: `A topic is not a question. “Smog” is a topic. “Smog and health” is still a topic. A research question tells you exactly what to measure, in whom, where and when.

## Narrowing, step by step

- **Topic:** smog
- **Problem:** smog seems to make people sick, but we don’t know by how much in Lahore
- **Question:** Is higher daily PM2.5 associated with more outpatient asthma visits in Lahore between November and February?

Each step adds a *who* (asthma patients), a *where* (Lahore), a *when* (winter) and a *what* (PM2.5, outpatient visits).

## Three kinds of question

- **Descriptive:** What proportion of delivery riders in Karachi report heat symptoms?
- **Comparative:** Do riders who take scheduled breaks report fewer symptoms than those who don’t?
- **Explanatory:** Does a break schedule *cause* fewer symptoms? (This needs a stronger design, such as an experiment.)

Beginners do well with descriptive and comparative questions.

## Test it with FINER

Researchers in medicine use five criteria, known as FINER, from the textbook *Designing Clinical Research*. They work in any field:

- **Feasible:** can you get the data, people and time?
- **Interesting:** to you, and to someone who would use the answer?
- **Novel:** does it add something, even locally?
- **Ethical:** can it be done without harming anyone?
- **Relevant:** will the answer matter for practice, policy or further research?

If your question fails *feasible*, narrow it. If it fails *novel*, change the place, the group or the method.

## Common traps

Questions that are too broad (“What causes poverty?”), impossible to measure (“Are people happier now?”), already answered, or answerable with a quick search. Health researchers often structure questions with **PICO**: Population, Intervention or exposure, Comparison, Outcome.`,
      takeaways: [
        'A good question names who, where, when and what you will measure.',
        'Start with descriptive or comparative questions.',
        'Check your question against FINER before you plan anything else.',
      ],
      quiz: [
        {
          q: 'Which is the strongest research question?',
          options: [
            'How does social media affect students?',
            'Is daily time on short-video apps associated with sleep duration among Grade 11 students in two Lahore schools?',
            'Is social media bad?',
          ],
          answer: 1,
          why: 'It names the population, place, exposure and outcome, so you know what to measure.',
        },
        {
          q: 'In FINER, what does the F stand for?',
          options: ['Funded', 'Feasible', 'Famous'],
          answer: 1,
          why: 'Feasible: you can realistically get the data, people and time to answer it.',
        },
      ],
    },
    {
      id: 'finding-papers',
      title: 'Finding papers that matter',
      minutes: 7,
      summary: 'Where to search, how to search, and how to get papers you can’t access.',
      body: `Before collecting any data, find out what is already known. This saves months and makes your question sharper.

## Where to search

- **Google Scholar** covers almost every field. Start here.
- **PubMed** for health and medicine.
- **IEEE Xplore** and the ACM Digital Library for engineering and computing.
- **RePEc / IDEAS** and SSRN for economics.
- **ERIC** for education.
- **arXiv, medRxiv, SSRN** for preprints. Preprints are useful and recent, but have not been peer reviewed yet.

Students and staff at HEC-recognised universities in Pakistan can use the **HEC National Digital Library**, usually from the campus network. Ask your library how to log in from home.

## How to search well

- List **synonyms** for each idea: “smog”, “air pollution”, “PM2.5”, “particulate matter”.
- Use **quotes** for exact phrases and **OR** to combine synonyms.
- Add your place or group: “Pakistan”, “South Asia”, “adolescents”.
- Use **backward searching**: read the reference list of a good paper.
- Use **forward searching**: click “Cited by” to find newer papers that built on it.

## When a paper is behind a paywall

Look for a free version on Google Scholar (“All versions”), the author’s website or a university repository. The free browser extension Unpaywall finds legal open copies. You can also email the author politely and ask for a copy; most are happy to share.

## Keep a reading log

For every paper, note: full citation, question, method, main finding, limitations, and why it matters to you. A free reference manager such as **Zotero** stores citations and formats your bibliography later.`,
      takeaways: [
        'Search with synonyms, then follow references backward and citations forward.',
        'Preprints are recent but not yet peer reviewed.',
        'Keep a reading log from day one; you will need it for your literature review.',
      ],
      quiz: [
        {
          q: 'What is forward citation searching?',
          options: [
            'Reading the reference list of a paper',
            'Finding newer papers that cite a paper you found',
            'Searching only for papers from this year',
          ],
          answer: 1,
          why: '“Cited by” shows later work that built on the paper, which helps you find recent studies.',
        },
        {
          q: 'A paper is paywalled. What is a good legal option?',
          options: ['Ask the author for a copy', 'Skip all paywalled papers', 'Cite it from the abstract only'],
          answer: 0,
          why: 'Most authors are allowed to share their work and are happy to send it.',
        },
      ],
    },
    {
      id: 'reading-papers',
      title: 'Reading a paper in three passes',
      minutes: 7,
      summary: 'Read for the big picture first, then the argument, then the details, and question everything.',
      body: `Nobody reads a research paper from the first word to the last on the first try. A widely used method, described by computer scientist S. Keshav, reads a paper in three passes.

## Pass one: five to ten minutes

Read the title, abstract and introduction, glance at the section headings, read the conclusion, and skim the references. After this pass you should be able to say:

- what **kind** of paper it is (an experiment, a survey, a review, a theory paper);
- what **problem** it addresses and what it **claims** to have found;
- whether it is **relevant** enough to read further.

Most papers stop here. That’s fine.

## Pass two: about an hour

Read the whole paper but skip proofs and fine detail. Look carefully at every figure and table: are axes labelled, are uncertainties shown? Mark terms and references you don’t know. You should now be able to explain the main argument and evidence to a friend.

## Pass three: for papers central to your work

Try to rebuild the study in your head. What would you have done differently? Which assumptions could be wrong? This is how you find gaps for your own research.

## Questions to ask of any study

- Who was studied, how many, and how were they chosen?
- How were the key things measured?
- What else could explain the result?
- Do the conclusions go further than the evidence?

## Reading in a second language

If English is not your first language, reading papers takes longer. A 2023 study of 908 environmental scientists found non-native English speakers spent up to twice as long on reading and writing papers. Read the abstract and figures first, keep a glossary of field terms with Urdu or local-language notes, and give yourself the extra time. It’s normal, not a weakness.`,
      takeaways: [
        'First pass: what is this and is it relevant? Most papers stop here.',
        'Second pass: understand the argument and every figure.',
        'Always ask who was studied, how things were measured, and what else could explain the result.',
      ],
      quiz: [
        {
          q: 'What should you be able to say after the first pass?',
          options: [
            'Every statistical detail in the methods',
            'What kind of paper it is, what it claims, and whether to read further',
            'How to replicate the study exactly',
          ],
          answer: 1,
          why: 'The first pass is a quick filter for relevance and the main claim.',
        },
        {
          q: 'A study of 40 volunteers concludes a diet works for “all adults”. What is the main concern?',
          options: ['The paper is too short', 'The conclusion goes beyond the sample', 'It has too many figures'],
          answer: 1,
          why: 'A small volunteer sample can’t support a claim about all adults.',
        },
      ],
    },
    {
      id: 'literature-review',
      title: 'A literature review that isn’t a list',
      minutes: 8,
      summary: 'Organise what is known by theme, show where the evidence agrees and disagrees, and point to the gap.',
      body: `A weak literature review is a list: “Khan (2020) found… Ali (2021) found… Smith (2022) found…”. A strong one is an argument: here is what we know, here is how we know it, here is where it’s uncertain, and here is where my question fits.

## Organise by theme, not by paper

Group papers by idea, method or debate. For example, a review on smog and health might have three themes: short-term effects on hospital visits, long-term effects on lung development, and evidence specific to South Asia.

A **synthesis matrix** helps: a table with one row per paper and one column per theme, where each cell notes what that paper says on that theme. Patterns become visible quickly.

## Four moves in every paragraph

- **Summarise** what a group of studies found.
- **Compare** where they agree and disagree.
- **Critique** their methods or limits.
- **Connect** it back to your question.

Example: *“Studies in Delhi and Beijing consistently link short-term PM2.5 spikes to respiratory visits [3–6], but most used city-wide averages rather than local monitors. Evidence from Pakistani cities is limited to two small studies [7, 8], neither of which examined asthma separately.”*

## Kinds of gap

- **Population or place:** no one has studied this group or city.
- **Method:** earlier studies used weaker designs or measures.
- **Conflict:** results disagree and nobody has explained why.
- **Time:** the evidence is old and conditions have changed.

## Honesty in writing

Paraphrase in your own words and cite the source. Copying sentences and changing a few words is still plagiarism. Pakistani universities follow HEC’s plagiarism policy and check theses with similarity software, so build good habits now.`,
      takeaways: [
        'A review is an argument about what’s known, not a list of papers.',
        'Use a synthesis matrix to see themes across papers.',
        'End by showing the gap your question fills.',
      ],
      quiz: [
        {
          q: 'Which sentence is synthesis rather than listing?',
          options: [
            'Khan (2020) studied smog. Ali (2021) studied smog too.',
            'Three studies agree smog raises hospital visits, but none separated asthma from other conditions.',
            'Smog is a big problem in Lahore.',
          ],
          answer: 1,
          why: 'It combines several studies, notes agreement, and identifies what is missing.',
        },
        {
          q: 'No study has measured your question in Peshawar. What kind of gap is this?',
          options: ['Method gap', 'Population or place gap', 'Conflict gap'],
          answer: 1,
          why: 'The evidence exists elsewhere but not for this place.',
        },
      ],
    },
    {
      id: 'ethics-basics',
      title: 'Research ethics and informed consent',
      minutes: 8,
      summary: 'Protect the people in your research: consent, privacy, minimal risk, and approval before you start.',
      tool: '/tools/consent-form',
      body: `If your research involves people, their data, or animals, ethics is not paperwork at the end. It shapes your design from the start.

## Three principles

The Belmont Report, a foundation of modern research ethics, sets out three principles:

- **Respect for persons:** people choose freely whether to take part, and those less able to choose (such as children) get extra protection.
- **Beneficence:** minimise harm and maximise benefit.
- **Justice:** the burdens and benefits of research are shared fairly; don’t study only those who are easiest to reach.

## What informed consent includes

Before someone agrees to take part, tell them, in language they understand:

- what the study is about and who is running it;
- what they will be asked to do and how long it takes;
- any risks or discomfort, and any benefits;
- that taking part is **voluntary** and they can **stop at any time** without penalty;
- how their information will be kept **confidential** and stored;
- who to contact with questions or complaints.

For participants under 18, get **permission from a parent or guardian** and the young person’s own **assent**.

## Ethics committees

Most universities have an Ethical Review Committee or Institutional Review Board that must approve research with people before data collection starts. Health research may need additional approvals. If you are a student, your supervisor usually applies with you. Never start collecting data “just to test” without approval.

## Collect less, protect more

Only collect information you need. Remove names and identifiers as early as possible. Store data on a password-protected device or account, not in public folders or group chats. Never paste participants’ personal data into public AI tools.

## Take extra care with

Children, patients, people in poverty or crisis, sensitive topics (health, religion, politics, sexuality, violence), and online data that people didn’t expect to be studied.`,
      takeaways: [
        'Consent must be informed, voluntary and revocable at any time.',
        'Get ethics approval before collecting any data from people.',
        'Collect only what you need and de-identify it early.',
      ],
      quiz: [
        {
          q: 'A participant wants to stop halfway through an interview. What do you do?',
          options: [
            'Ask them to finish because their data is needed',
            'Stop, thank them, and respect their choice without penalty',
            'Offer extra payment to continue',
          ],
          answer: 1,
          why: 'Participation is voluntary, and people can withdraw at any time.',
        },
        {
          q: 'You want to survey 15-year-olds. Whose agreement do you need?',
          options: ['Only the student’s', 'A parent or guardian’s permission and the student’s assent', 'Only the school principal’s'],
          answer: 1,
          why: 'Minors need guardian permission plus their own assent; schools may also need to approve.',
        },
      ],
    },
  ],
};
