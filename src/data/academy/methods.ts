import type { Track } from '../../lib/types';

export const methods: Track = {
  id: 'methods',
  title: 'Methods and analysis',
  level: 'Intermediate',
  audience: 'Undergraduate and master’s',
  summary: 'Choose a design that fits your question, sample properly, write good instruments, and analyse data honestly and reproducibly.',
  lessons: [
    {
      id: 'choosing-a-method',
      title: 'Choosing a method that fits your question',
      minutes: 7,
      summary: 'Match the design to the question. Correlation is not causation, and design is how you tell them apart.',
      body: `Your question decides your method, not the other way round.

## Quantitative, qualitative, mixed

- **Quantitative** methods measure and count: surveys, experiments, analysis of existing data. They answer *how much*, *how many*, *how strongly related*.
- **Qualitative** methods explore meaning and experience: interviews, focus groups, observation, document analysis. They answer *how* and *why*, in people’s own terms.
- **Mixed methods** combine both, for example a survey to measure a pattern and interviews to explain it.

## Common designs

| Design | Good for | Example |
|---|---|---|
| Cross-sectional survey | Describing a population at one time | Share of riders reporting heat symptoms |
| Cohort | Following people over time | Students tracked from first to final year |
| Case-control | Rare outcomes | Asthma patients compared with similar people without asthma |
| Experiment / RCT | Testing causes | Randomly assign a study-skills workshop |
| Quasi-experiment | Causes when you can’t randomise | Compare districts before and after a policy |
| Case study / ethnography | Deep understanding of a setting | One school’s approach to inclusion |
| Content analysis | Patterns in texts or media | Gender in textbooks |
| Secondary data analysis | Large questions on a small budget | Labour Force Survey microdata |

## Correlation and causation

If students who sleep less get lower marks, sleep might affect marks, marks might affect sleep (stress), or something else might affect both (long commutes). A **confounder** is that something else. Randomised experiments remove confounding by design, because chance decides who gets the treatment. When you can’t randomise, look for natural experiments, compare before and after, and control for confounders in your analysis, and state your limits honestly.

## A practical rule

Pick the simplest design that can answer your question with the time, data and permissions you actually have.`,
      takeaways: [
        'The question chooses the method.',
        'Confounders can create correlations without causation.',
        'Choose the simplest design that can answer the question with your real resources.',
      ],
      quiz: [
        {
          q: 'You want to know whether a tutoring programme causes higher marks. Which design is strongest?',
          options: ['A one-time survey of tutored students', 'A randomised experiment', 'Interviews with tutors'],
          answer: 1,
          why: 'Random assignment balances confounders, so differences can be attributed to the programme.',
        },
        {
          q: 'Ice-cream sales and drowning both rise in summer. What explains the correlation?',
          options: ['Ice cream causes drowning', 'A confounder: hot weather', 'Drowning causes ice-cream sales'],
          answer: 1,
          why: 'Hot weather drives both, which is a classic confounder.',
        },
      ],
    },
    {
      id: 'sampling',
      title: 'Sampling and sample size',
      minutes: 8,
      summary: 'Who you ask decides what you can conclude. Work out how many you need before you start.',
      tool: '/tools/sample-size',
      body: `You can rarely study everyone, so you study a **sample** and use it to learn about a **population**.

## Key terms

- **Population:** everyone your question is about (all delivery riders in Karachi).
- **Sampling frame:** the list you actually draw from (riders registered with three companies).
- **Sample:** the people you end up studying.

Bias creeps in when the frame or sample differs from the population in ways that matter.

## Probability sampling

Everyone in the frame has a known chance of selection, so you can generalise:

- **Simple random:** pick at random from the whole list.
- **Stratified:** split into groups (by city, gender) and sample from each.
- **Cluster:** randomly pick groups (schools, markets) and study people within them. Cheaper, but needs a larger sample.

## Non-probability sampling

Common in student research, and fine for exploration, but be careful generalising:

- **Convenience:** whoever is easy to reach.
- **Snowball:** participants recruit others; useful for hard-to-reach groups.
- **Purposive:** chosen for a reason, typical in qualitative research.

## How many people for a survey?

To estimate a proportion with a chosen margin of error:

**n = z² × p(1 − p) / e²**

- *z* is 1.96 for 95% confidence.
- *p* is your best guess of the proportion. Use 0.5 if unsure; it gives the largest, safest number.
- *e* is the margin of error, such as 0.05 for ±5 percentage points.

With p = 0.5 and e = 0.05: n = 1.96² × 0.25 / 0.0025 = **384.2, so 385 people**. If your population is small, apply the finite population correction. If you sample in clusters, multiply by a design effect (often 1.5 to 2). Then add extra for people who won’t respond.

In qualitative research, sample size is guided by **saturation**: you stop when new interviews no longer add new themes, often somewhere between 12 and 30 interviews for a focused question.`,
      takeaways: [
        'Define your population and sampling frame before recruiting.',
        'Probability samples let you generalise; convenience samples mostly don’t.',
        'For a proportion at 95% confidence and ±5%, plan for about 385 completed responses before corrections.',
      ],
      quiz: [
        {
          q: 'With p = 0.5, 95% confidence and a ±5% margin, roughly how many responses do you need?',
          options: ['100', '385', '1,000'],
          answer: 1,
          why: '1.96² × 0.25 / 0.05² ≈ 384.2, rounded up to 385.',
        },
        {
          q: 'You survey only students in your own class about university-wide study habits. What is the main problem?',
          options: ['The sample is a convenience sample and may not represent the university', 'The sample is too large', 'Surveys can’t measure habits'],
          answer: 0,
          why: 'One class may differ systematically from the wider student body.',
        },
      ],
    },
    {
      id: 'survey-design',
      title: 'Writing survey questions that work',
      minutes: 8,
      summary: 'Clear, neutral, single-idea questions, tested on real people before launch.',
      body: `A survey is only as good as its questions. Small wording problems produce data you can’t trust.

## Use existing scales where you can

If you’re measuring something established, such as stress, wellbeing or financial literacy, look for a **validated scale** that has been tested for reliability. Many have been translated into Urdu and other regional languages. Cite the source and keep the original wording.

## Rules for writing questions

- **One idea per question.** “Is the course useful and interesting?” is double-barrelled; split it.
- **Neutral wording.** “Don’t you agree that fees are too high?” leads the respondent.
- **Plain language.** Avoid jargon and abbreviations.
- **Specific time frames.** “In the past 7 days” beats “usually”.
- **Complete, non-overlapping options.** Age groups 18–20 and 20–25 overlap at 20.
- **Include “Prefer not to say”** for sensitive questions.

## Response formats

Likert scales (strongly disagree to strongly agree) should be balanced, usually with five or seven points. Put sensitive questions later, after trust is built, and demographic questions at the end.

## Translation

If you translate a survey, use **forward and back translation**: one person translates into Urdu, another translates it back into English without seeing the original, and you compare. Differences reveal wording problems.

## Pilot before you launch

Test with 5 to 10 people from your target group. Ask them to think aloud as they answer. You will almost always find confusing questions. Fix them, then launch.

## Tools

Google Forms works for simple online surveys. **KoboToolbox** is free, widely used in humanitarian and development research, and works offline on phones, which helps in fieldwork with weak internet.`,
      takeaways: [
        'Prefer validated scales over writing your own measures.',
        'One idea per question, neutral wording, specific time frames.',
        'Always pilot; forward and back translate.',
      ],
      quiz: [
        {
          q: 'What is wrong with “How satisfied are you with the teaching and the facilities?”',
          options: ['It is double-barrelled', 'It is too short', 'It uses a time frame'],
          answer: 0,
          why: 'It asks about two things, so you can’t tell which one the answer refers to.',
        },
        {
          q: 'What does back translation check?',
          options: ['Typing speed', 'Whether the translated wording keeps the original meaning', 'Sample size'],
          answer: 1,
          why: 'Translating back without the original reveals meaning that was lost or changed.',
        },
      ],
    },
    {
      id: 'interviews-thematic',
      title: 'Interviews and thematic analysis',
      minutes: 8,
      summary: 'Run good semi-structured interviews and turn transcripts into well-supported themes.',
      body: `Interviews let people explain their experience in their own words. Thematic analysis is a flexible way to find patterns across those accounts.

## Semi-structured interviews

Prepare an **interview guide**: 6 to 10 open questions in a logical order, with optional prompts. Stay flexible and follow interesting answers.

- Start with easy, factual questions to build rapport.
- Ask open questions: “Can you tell me about…?” rather than “Do you…?”
- **Probe** gently: “What happened next?” “Can you give an example?”
- Avoid leading questions and resist filling silences.
- Record only with consent, and take short notes on context.

Transcribe soon after, in the original language, and translate carefully if needed, noting phrases that don’t translate well.

## Thematic analysis in six phases

Virginia Braun and Victoria Clarke’s widely used approach has six phases:

1. **Familiarise** yourself with the data: read and re-read transcripts, noting initial ideas.
2. **Generate codes:** label meaningful pieces of text (for example “borrowed for school fees”).
3. **Construct themes:** group codes into broader patterns.
4. **Review themes:** check them against the coded extracts and the whole dataset.
5. **Define and name themes:** say clearly what each theme is about.
6. **Write up:** tell the story of the data with vivid, well-chosen quotes.

Analysis moves back and forth between these phases rather than in a straight line.

## Quality

Keep a **codebook** with each code’s meaning and an example. If you work in a team, code some transcripts together and discuss disagreements. Write a short **reflexive note** on how your own background might shape what you notice. Free tools like Taguette help with coding; a spreadsheet works too.`,
      takeaways: [
        'Use an interview guide but follow interesting answers.',
        'Codes label pieces of text; themes are broader patterns built from codes.',
        'Keep a codebook and reflect on your own position.',
      ],
      quiz: [
        {
          q: 'Which is an open interview question?',
          options: ['Do you like your job?', 'Can you tell me about a typical working day?', 'Is your manager fair, yes or no?'],
          answer: 1,
          why: 'It invites a detailed account in the participant’s own words.',
        },
        {
          q: 'What is the difference between a code and a theme?',
          options: [
            'They are the same thing',
            'A code labels a piece of text; a theme is a broader pattern across codes',
            'A theme labels a single sentence',
          ],
          answer: 1,
          why: 'Themes are built from many coded extracts across the dataset.',
        },
      ],
    },
    {
      id: 'statistics-essentials',
      title: 'Statistics you will actually use',
      minutes: 10,
      summary: 'Describe data honestly, estimate with uncertainty, and know what a p-value can and can’t tell you.',
      body: `You don’t need advanced statistics for most student projects. You need a handful of tools, used honestly.

## Describe first

- For roughly symmetric numbers: **mean** and **standard deviation**.
- For skewed numbers such as income: **median** and **interquartile range**.
- For categories: **counts and percentages**.
- Always **plot** your data before testing anything. Histograms and scatter plots reveal errors and outliers.

## Estimate with uncertainty

A **95% confidence interval** gives a range of plausible values for the true effect. “Riders who took breaks reported 1.2 fewer symptoms (95% CI 0.4 to 2.0)” is far more useful than “the difference was significant”.

## Common tests

| Question | Test |
|---|---|
| Compare a numeric outcome between two groups | t-test (or Mann–Whitney if skewed) |
| Compare across three or more groups | ANOVA (or Kruskal–Wallis) |
| Two categorical variables related? | Chi-square test |
| Two numeric variables related? | Correlation, then regression |
| Predict an outcome from several factors | Linear or logistic regression |

## What a p-value is, and isn’t

A p-value is the probability of seeing data at least as extreme as yours *if there were truly no effect*. It is **not** the probability that your hypothesis is true, and it says nothing about how big or important the effect is. The American Statistical Association warned in 2016 against treating p < 0.05 as a magic line.

So report **effect sizes and confidence intervals**, not just p-values. A tiny effect can be “significant” in a huge sample, and an important effect can miss significance in a small one.

## Two traps

- **Multiple comparisons:** run 20 tests and one will likely be “significant” by chance. Plan your main analysis in advance.
- **Statistical vs practical significance:** ask whether the difference would matter in the real world.`,
      takeaways: [
        'Plot and describe your data before testing.',
        'Report effect sizes with confidence intervals.',
        'A p-value is not the probability your hypothesis is true.',
      ],
      quiz: [
        {
          q: 'Income data is very skewed. Which summary is better?',
          options: ['Mean and standard deviation', 'Median and interquartile range', 'Maximum only'],
          answer: 1,
          why: 'The median is not pulled by a few very high values.',
        },
        {
          q: 'A study reports p = 0.03. What does this mean?',
          options: [
            'There is a 3% chance the hypothesis is false',
            'If there were no true effect, data this extreme would appear about 3% of the time',
            'The effect is large',
          ],
          answer: 1,
          why: 'The p-value is computed assuming no effect; it does not measure effect size or truth.',
        },
      ],
    },
    {
      id: 'reproducible-workflow',
      title: 'A reproducible workflow',
      minutes: 6,
      summary: 'Organise files, script your analysis, and share data and code so anyone can repeat your work.',
      body: `Reproducible research means someone else, including you in six months, can take your data and code and get the same results.

## Organise from day one

\`\`\`
project/
  data/raw/        (never edited)
  data/clean/      (created by scripts)
  scripts/         (01_clean.R, 02_analysis.R …)
  outputs/         (figures, tables)
  README.md        (what this is and how to run it)
\`\`\`

- Keep **raw data read-only**. All cleaning happens in scripts.
- Use **scripts, not clicks**. A sequence of mouse clicks in Excel can’t be repeated reliably.
- Write a **codebook**: every variable, what it means, its units and codes.

## Version control

Use **Git**, with GitHub or GitLab, to track changes to your scripts. Commit small changes with clear messages. You can always go back.

## Back up properly

Follow the 3-2-1 rule: three copies, on two kinds of storage, one off-site (for example cloud). Never keep the only copy of your data on one laptop.

## Share when you publish

Deposit data (if consent allows) and code in a repository such as **OSF** or **Zenodo**, which give you a permanent DOI you can cite. Remove identifiers first. Add a licence so others know how they can reuse it.

## Plan it

Many funders now ask for a **data management plan**: what data you will collect, how you will store and protect it, and how you will share it. Writing one at the start saves pain later.`,
      takeaways: [
        'Raw data stays untouched; scripts do the cleaning.',
        'Use Git and keep three backups.',
        'Share de-identified data and code with a DOI when you publish.',
      ],
      quiz: [
        {
          q: 'Where should data cleaning happen?',
          options: ['By editing the raw file by hand', 'In scripts that read the raw file', 'In an email thread'],
          answer: 1,
          why: 'Scripts make every cleaning step visible and repeatable.',
        },
        {
          q: 'What does a repository like Zenodo give your dataset?',
          options: ['A permanent DOI you can cite', 'Automatic peer review', 'A guaranteed publication'],
          answer: 0,
          why: 'A DOI makes the dataset findable and citable over time.',
        },
      ],
    },
  ],
};
