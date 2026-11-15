import type { Track } from '../../lib/types';

export const fieldwork: Track = {
  id: 'fieldwork',
  short: 'Fieldwork',
  title: 'Survey & field methodology',
  level: 'Beginner',
  audience: 'Students who will collect data from real people',
  summary:
    'Choose a design that can answer the question, sample people you can describe, write questions that survive contact with reality, and run fieldwork ethically.',
  outcome: 'A field-ready survey pack: design note, sampling plan, reviewed questionnaire and consent route.',
  skills: ['survey design', 'sampling', 'questionnaire writing', 'research ethics'],
  lessons: [
    {
      id: 'design-fit',
      title: 'Choose a design that fits the question',
      minutes: 7,
      xp: 35,
      summary: 'Surveys, interviews, observation or existing data: pick the design that could prove your team wrong.',
      skillTags: ['research design', 'surveys', 'interviews', 'secondary data'],
      steps: [
        {
          kind: 'concept',
          title: 'The design is the argument',
          body: `A method is not a preference. It is the structure that lets evidence support a claim. Match the design to the kind of answer the decision needs.

| If the decision needs… | Consider | What it gives you |
|---|---|---|
| How many, how often, how strongly related | Survey or analysis of existing records | Numbers you can compare across groups |
| Why people behave as they do | Interviews or focus groups | Reasons, language and unexpected explanations |
| Whether a change caused an outcome | Experiment, pilot or natural comparison | A comparison that can separate cause from coincidence |
| What already happens at scale | Secondary data (sales, service, government) | Large coverage, but only for what was recorded |
| How a process actually works | Observation or document review | What people do, not only what they say |

**Triangulate when the decision is expensive.** A survey can show that lapsed customers are less satisfied; interviews can explain which part of the experience changed. Two weak sources that point the same way are often better than one strong source used beyond its limits.

**Write the design note before the instrument.** One page: question, design, population, comparison, measures, analysis plan. If the analysis plan is “we will see what the data says”, the design is not finished.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Choose the design that could prove you wrong.** If every possible result confirms what the manager already believes, you are collecting reassurance, not evidence.`,
        },
        {
          kind: 'example',
          title: 'Real example: what would customers pay?',
          body: `A studio wants to know what customers would pay for a new evening class. Asking “Would you pay PKR 5,000?” invites a polite yes that never becomes a booking.

A better design is a small choice experiment in the booking flow: show two price points to similar groups and measure actual bookings, not stated willingness. If the team cannot run an experiment, the next best option is a survey that asks about the last class they paid for, the amount, and what they gave up to afford it. Both designs have limits; the report states them.

Interviews are still useful here, but for a different job: finding the price range and the words customers use, before the team tests a number.`,
        },
      ],
      takeaways: [
        'Match the design to the decision, not to the method you know best.',
        'Use two sources when the decision is expensive.',
        'Write the analysis plan before the questionnaire.',
      ],
      exercise: {
        title: 'Pick the right design',
        prompt: 'A supermarket wants to know whether a new aisle layout increased sales. Which design gives the strongest evidence?',
        options: [
          {
            text: 'Ask shoppers whether they liked the new layout',
            correct: false,
            why: 'Liking is not the same as buying. You would learn about preference, not sales.',
          },
          {
            text: 'Compare sales in matched stores before and after the change, with stores that did not change as a comparison',
            correct: true,
            why: 'A before-and-after comparison with a control group can separate the layout from seasonal or market-wide changes.',
          },
          {
            text: 'Interview the store manager',
            correct: false,
            why: 'One person’s impression is a useful lead, but it cannot measure the size or cause of a sales change.',
          },
          {
            text: 'Count how many shoppers walked down the new aisle',
            correct: false,
            why: 'Footfall is not sales. More people can walk past and buy less.',
          },
        ],
      },
      quiz: [
        {
          q: 'What is the main weakness of a single before-and-after comparison with no control group?',
          options: ['It is always unethical', 'Something else may have changed at the same time', 'It can never use numbers'],
          answer: 1,
          why: 'A market-wide trend, a holiday or a price change can explain the difference. A comparison group helps rule that out.',
        },
        {
          q: 'When are interviews the better choice?',
          options: ['When you need a precise population estimate', 'When you need to understand reasons and language', 'When you need to prove causation'],
          answer: 1,
          why: 'Interviews are strong for meaning, process and unexpected explanations. They are not a substitute for a representative survey or an experiment.',
        },
      ],
      template: {
        title: 'Design note',
        filename: 'design-note.md',
        body: `# Design note: [project]

**Decision:** [who will do what differently]

**Question:** [population, comparison, outcome, period]

**Design:** [survey / interviews / experiment / secondary data / mixed]

**Why this design:** [what it can show, what it cannot]

**Comparison group:** [who and why; or "none"]

**Measures:** [variables and definitions]

**Analysis plan:** [descriptives, test or themes you expect]

**Access and permissions:** [who you need to ask]

**Main threat to validity:** [the one alternative explanation you worry about]`,
      },
    },
    {
      id: 'sampling',
      title: 'Sampling and sample size without guesswork',
      minutes: 9,
      xp: 40,
      summary: 'Define the population, find a sampling frame, avoid the easiest-people bias, and calculate how many responses you need.',
      skillTags: ['sampling', 'sample size', 'survey bias'],
      steps: [
        {
          kind: 'concept',
          title: 'Who is in your study, and who is missing?',
          body: `A sample is only useful if you can describe who was eligible and how they were chosen.

**Start with the population.** “Customers” is too broad. Say: “customers who made at least one purchase in the last 90 days at the three Karachi branches”.

**Find a sampling frame.** The frame is the list you actually draw from: loyalty-card records, invoices, a staff roster, a phone directory. If the frame is incomplete, say so. An Instagram poll samples people who follow the account and see the story, not all customers.

**Probability sampling** gives everyone in the frame a known chance of selection: simple random, systematic, stratified (split by city or customer type) or cluster (pick branches, then customers). **Convenience sampling** is not automatically wrong, but you cannot call it representative. Name it as convenience and limit your claims.

**Sample size.** For a rough proportion, the common formula uses an expected proportion, a margin of error and a confidence level. Use the [sample size calculator](/tools/sample-size) and report the assumptions. Then inflate for non-response: if you expect a 20% response rate, invite five times the number you need.

**Always report:** eligible population, frame, selection method, invitations sent, responses received, refusals and missing answers.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**A sample you cannot describe is not a sample.** Before you have any data, write the sentence “We invited X people from Y, selected by Z, and N responded.” If you cannot fill it in, fix the plan.`,
        },
        {
          kind: 'example',
          title: 'Real example: the campus survey',
          body: `A team posts a survey in a university WhatsApp group and gets 180 responses. They plan to report “students think…”.

Their supervisor asks who is in the group. It is one department’s first-year group, plus friends who were forwarded the link. The team relabels the study as a convenience sample of first-year students in one department. They report the number of invitations they can verify and avoid percentages for the whole university.

They also add a short random sample from the student registry for the main estimate, and keep the WhatsApp responses as a pilot. The pilot is useful: it shows which questions confuse people and how long the survey takes.`,
        },
      ],
      takeaways: [
        'Define the eligible population and the list you draw from.',
        'Name convenience samples honestly and limit claims accordingly.',
        'Report invitations, responses, refusals and non-response.',
      ],
      exercise: {
        title: 'Choose the sampling approach',
        prompt: 'You need an estimate for all 4,000 students at a university. The registry can send email to a random selection. What is the best approach?',
        options: [
          {
            text: 'Post the survey in your department WhatsApp group',
            correct: false,
            why: 'That is a convenience sample of one department. It cannot estimate the whole university.',
          },
          {
            text: 'Draw a random sample from the registry, invite more than you need, and report the response rate',
            correct: true,
            why: 'A random draw from a complete frame supports a population estimate, provided you report who responded.',
          },
          {
            text: 'Ask the first 100 students who walk into the library',
            correct: false,
            why: 'Library users at one time of day are not a random sample of all students.',
          },
          {
            text: 'Survey every student in one faculty and call it representative',
            correct: false,
            why: 'One faculty may differ systematically from the others. You could report it as a faculty study, not a university estimate.',
          },
        ],
      },
      quiz: [
        {
          q: 'What is a sampling frame?',
          options: ['The number of people you want', 'The list you draw participants from', 'The questionnaire'],
          answer: 1,
          why: 'The frame is the practical list of eligible people: registry, customer records, staff roster.',
        },
        {
          q: 'Why invite more people than your target number of responses?',
          options: ['To make the survey look popular', 'Because some people will not respond', 'Because random sampling requires it'],
          answer: 1,
          why: 'Non-response reduces your final sample. Inviting extra protects the number of completed responses you need.',
        },
      ],
      template: {
        title: 'Sampling plan',
        filename: 'sampling-plan.md',
        body: `# Sampling plan: [project]

**Eligible population:** [exact definition]

**Sampling frame:** [list, owner, how complete it is]

**Selection method:** [random / stratified / cluster / convenience]

**Target sample:** [n] · **Expected response rate:** [%] · **Invitations needed:** [n]

**Sample size assumptions:** [proportion, margin of error, confidence level]

**Recruitment route:** [email, phone, in person, partner organisation]

**Non-response plan:** [reminders, replacement, reporting]

**Known bias:** [who is likely to be missing and why]

**Data protection:** [where the frame is stored, who can see it]`,
      },
      tool: '/tools/sample-size',
    },
    {
      id: 'writing-questions',
      title: 'Write survey questions people can answer',
      minutes: 9,
      xp: 35,
      summary: 'Remove double-barrelled, leading and vague items, choose sensible scales, and pilot before you pay for fieldwork.',
      skillTags: ['questionnaire design', 'survey questions', 'piloting'],
      steps: [
        {
          kind: 'concept',
          title: 'A question is a measuring instrument',
          body: `Every item should measure one thing, in words the respondent uses, with answer options that cover the real possibilities.

**Common faults:**

- **Double-barrelled:** “How satisfied are you with our price and service?” Two ideas, one answer. Split it.
- **Leading:** “How much did you enjoy our excellent new menu?” Presumes enjoyment. Ask neutrally.
- **Loaded:** “Would you support the wasteful fee?” The adjective does the work.
- **Vague frequency:** “How often do you visit?” means different things to different people. Offer ranges: never, less than once a month, one to three times a month, weekly or more.
- **Recall overload:** “How much did you spend in the last year?” Most people cannot answer accurately. Ask about the last visit, or use records.
- **Missing options:** “Yes / No” for “Do you use our app?” leaves out people who do not own a smartphone. Add “I do not have the app” and “Prefer not to say” where needed.
- **Why questions in a survey:** “Why did you leave?” produces short guesses. Use interviews for reasons, or offer a fixed list of reasons plus “other”.

**Scales.** Use the same number of points across a section, label them, and keep direction consistent. A five-point agreement scale needs a clear midpoint: neither agree nor disagree is not the same as “don’t know”; offer both when it matters.

**Pilot with five people outside your team.** Time it, watch where they hesitate, ask what they thought each item meant, then cut.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Pilot every question with five people who are not your friends.** Friends infer what you meant. Strangers reveal what you wrote.`,
        },
        {
          kind: 'example',
          title: 'Real example: fixing one item',
          body: `Original: “How satisfied are you with our affordable prices and friendly staff?”

Problems: two constructs, a leading adjective, and no time frame. A respondent who likes staff but finds prices high has no way to answer.

Revised into two items:

> How satisfied or dissatisfied are you with the price you paid on your last visit? (Very dissatisfied … Very satisfied)
>
> How satisfied or dissatisfied are you with the staff you spoke to on your last visit? (Very dissatisfied … Very satisfied)

The team also adds “I did not speak to staff” as a separate option before the scale. In the pilot, two people had ordered online and never met staff; without that option they would have guessed.`,
        },
      ],
      takeaways: [
        'Ask one thing per question, in neutral words.',
        'Give answer options that cover the real situations, including “not applicable”.',
        'Pilot with strangers, then cut and rewrite.',
      ],
      exercise: {
        title: 'Spot the flawed survey question',
        prompt: 'Which item is the weakest survey question?',
        options: [
          {
            text: 'How many times did you visit this branch in the last month? (0, 1–2, 3–5, 6 or more)',
            correct: false,
            why: 'This is answerable and offers clear ranges. It has a defined time frame.',
          },
          {
            text: 'How satisfied are you with our affordable prices and friendly staff?',
            correct: true,
            why: 'It is double-barrelled and leading. Two ideas share one answer, and “affordable” and “friendly” tell the respondent what to think.',
          },
          {
            text: 'Did you use the mobile app during your last visit? (Yes / No / I do not have the app)',
            correct: false,
            why: 'It asks one thing, names the time frame, and covers people without the app.',
          },
          {
            text: 'How satisfied or dissatisfied were you with the wait time on your last visit?',
            correct: false,
            why: 'It is neutral and specific. A labelled satisfaction scale would make it complete.',
          },
        ],
      },
      quiz: [
        {
          q: 'What is wrong with “How often do you visit?” without answer ranges?',
          options: ['Nothing', 'People interpret “often” differently', 'It is too short'],
          answer: 1,
          why: 'Vague frequency words have no shared meaning. Ranges turn the answer into something you can compare.',
        },
        {
          q: 'Why add a “not applicable” option?',
          options: ['To make the data messy', 'Because some respondents genuinely have no experience of the item', 'To shorten the survey'],
          answer: 1,
          why: 'Without it, people with no experience are forced into a satisfaction answer that does not describe them.',
        },
      ],
      template: {
        title: 'Questionnaire review checklist',
        filename: 'questionnaire-checklist.md',
        body: `# Questionnaire review checklist

For each item, tick or fix:

- [ ] Measures one idea only
- [ ] Neutral wording, no adjectives that lead
- [ ] Time frame stated (last visit, last month, last 12 months)
- [ ] Answer options cover the real possibilities
- [ ] "Not applicable" / "prefer not to say" where needed
- [ ] Scale points labelled and consistent
- [ ] No recall task longer than the last month, unless records exist
- [ ] No "why" question where a fixed list would be clearer
- [ ] Sensitive questions placed late, with a skip route
- [ ] Piloted with five people outside the team
- [ ] Completion time recorded
- [ ] Every item maps to a variable in the analysis plan`,
      },
    },
    {
      id: 'fieldwork-ethics',
      title: 'Run fieldwork ethically and safely',
      minutes: 8,
      xp: 35,
      summary: 'Consent, privacy, minors, incentives and data storage: the rules that protect participants and your project.',
      skillTags: ['research ethics', 'informed consent', 'data protection', 'safeguarding'],
      steps: [
        {
          kind: 'concept',
          title: 'Ethics is fieldwork design',
          body: `Ethics is not a form you attach at the end. It changes who you ask, what you record and where the data lives.

**Informed consent** means the person knows: who is running the study, why, what participation involves, how long it takes, that they can stop or skip questions, and how their data will be used and stored. Consent is voluntary and can be withdrawn. For anyone under 18, follow your institution’s rules; usually that means guardian consent plus the young person’s assent. When in doubt, ask your supervisor before collecting.

**Minimise data.** Collect only what the analysis needs. Do not ask for a national ID number because it is convenient. Store identifiers separately from responses. Use a participant code, not a name, in the analysis file.

**Protect confidentiality.** A small sample can make people identifiable even without names: “the only female supervisor at Branch B” is not anonymous. Report groups, not individuals, and change identifying details in quotes.

**Incentives and pressure.** Payment should not be so large that people feel they cannot refuse. A manager asking staff to complete a survey during work hours is not the same as a voluntary survey; say who is asking and make it easy to decline.

**Safety in the field.** Tell someone your route, avoid collecting alone in unsafe settings, and have a plan for a participant who becomes distressed. Safeguarding is part of the method, not an afterthought.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Consent comes before the first question, not after.** If you would be uncomfortable explaining the study to a participant’s face, the design is not ready.`,
        },
        {
          kind: 'example',
          title: 'Real example: a school survey',
          body: `A team wants to survey 14-year-olds about study habits. The school offers to hand out the link in class. The team’s plan has three gaps: no guardian consent route, no way for a student to skip without the teacher seeing, and a question asking for the student’s full name “for matching”.

They revise: an information sheet for guardians, a consent form with a clear opt-out, anonymous participant codes, and a closing date after which the class teacher does not see individual responses. They remove the name field and match responses with a code the student keeps.

The survey is smaller and slower to run. It is also the version the school can defend if a parent asks what happened.`,
        },
      ],
      takeaways: [
        'Consent must be informed, voluntary and revocable.',
        'Collect the minimum data and separate identifiers from responses.',
        'Small samples can identify people even when names are removed.',
      ],
      exercise: {
        title: 'Choose the ethical next step',
        prompt: 'A manager offers to send your staff wellbeing survey to all employees with a message that attendance is being tracked. What should you do?',
        options: [
          {
            text: 'Accept; more responses are better',
            correct: false,
            why: 'The message turns a voluntary survey into a coerced one. Staff may fear consequences for skipping it.',
          },
          {
            text: 'Ask the manager to send a neutral message that makes participation voluntary and anonymous, and confirm how responses are separated from attendance',
            correct: true,
            why: 'This protects voluntariness and confidentiality. If tracking cannot be separated, the study design must change.',
          },
          {
            text: 'Remove the consent form to save time',
            correct: false,
            why: 'Consent is the protection, not the obstacle. Removing it makes the coercion worse.',
          },
          {
            text: 'Collect the data first and ask for approval later',
            correct: false,
            why: 'Retrospective approval does not undo a breach of trust or of your institution’s rules.',
          },
        ],
      },
      quiz: [
        {
          q: 'Which is required for informed consent?',
          options: ['A signature from everyone', 'Knowing the purpose, what participation involves, and that they can stop', 'Payment'],
          answer: 1,
          why: 'Consent is about understanding and choice. A signature alone does not make it informed.',
        },
        {
          q: 'Why remove names from an analysis file?',
          options: ['To make the file smaller', 'To reduce the risk that participants can be identified', 'Because names are never useful'],
          answer: 1,
          why: 'Participant codes separate identity from responses, so analysis and sharing carry less risk.',
        },
      ],
      template: {
        title: 'Fieldwork safety and ethics checklist',
        filename: 'fieldwork-checklist.md',
        body: `# Fieldwork ethics and safety checklist

- [ ] Study purpose explained in plain language
- [ ] Consent form written and approved where required
- [ ] Under-18 route checked: guardian consent and young person assent
- [ ] Voluntary participation stated; skip and stop routes clear
- [ ] Sensitive questions placed with a skip route
- [ ] Data minimisation: every field justified
- [ ] Identifiers stored separately from responses
- [ ] Quotes will be de-identified
- [ ] Incentive reviewed for undue pressure
- [ ] Fieldworker route and check-in plan agreed
- [ ] Distress or safeguarding escalation route known
- [ ] Retention period and deletion owner named`,
      },
      tool: '/tools/consent-form',
    },
  ],
};
