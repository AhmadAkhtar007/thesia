import type { Track } from '../../lib/types';

export const analysis: Track = {
  id: 'analysis',
  short: 'Analysis',
  title: 'Data analysis & synthesis',
  level: 'Intermediate',
  audience: 'Students with survey or interview data to make sense of',
  summary:
    'Clean a dataset without losing the raw file, describe what you collected, choose a test that matches the question, and turn interviews into themes you can defend.',
  outcome: 'A cleaned dataset with a codebook, honest descriptive tables, one justified test, and a coded qualitative synthesis.',
  skills: ['data cleaning', 'descriptive statistics', 'statistical tests', 'qualitative coding'],
  lessons: [
    {
      id: 'prepare-data',
      title: 'Clean data before you analyse it',
      minutes: 8,
      xp: 35,
      summary: 'Keep the raw file untouched, build a codebook, record every decision, and handle missing answers openly.',
      skillTags: ['data cleaning', 'codebook', 'missing data'],
      steps: [
        {
          kind: 'concept',
          title: 'Tidy data, one decision at a time',
          body: `Most analysis errors happen before the test. A clean dataset is **tidy**: one row per person or visit, one column per variable, one value per cell.

**Start with a frozen raw file.** Copy the export, call the copy “raw”, and never edit it. All cleaning happens on a working copy, and every change is written down: what you changed, why, and how many rows it affected.

**Build a codebook.** For each column: the exact question, the allowed values, the type (number, text, date, category), and what a missing value means. “Blank” can mean skipped, not applicable, refused or a data-entry error; those are different.

**Handle missing data visibly.** Report how many values are missing for each variable you analyse. Do not silently replace blanks with zero. If you drop incomplete rows, say how many and whether the dropped people differ from the rest.

**Common fixes:**

- Standardise categories: “Karachi”, “karachi”, “KHI” become one value.
- Split select-all-that-apply answers into separate yes/no columns.
- Convert numbers stored as text, and check the range (age 200 is an error).
- Remove duplicate submissions only with a documented rule.
- Do not overwrite outliers; flag them and explain your decision.

**Keep a version trail.** Name files with dates and stages: raw, working, analysis. If a result changes, you can trace why.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Never edit the raw file. Clean a copy and keep the recipe.** If you cannot explain how a row changed, you cannot defend the number it produced.`,
        },
        {
          kind: 'example',
          title: 'Real example: the impossible age',
          body: `A survey export has 240 rows. The age column contains 23, 24, 3, 230 and two blanks. One respondent typed the year instead of their age; another missed the question.

The team does not delete the rows. They check the original form for the two blanks, flag age 3 and 230 as suspected entry errors, and report: “Age was missing or invalid for 4 of 240 respondents; these rows were excluded from age analyses only.” Every other variable from those rows stays in the dataset.

They save a short cleaning log with the file. When the professor asks why the sample for one chart is 236 instead of 240, the answer takes ten seconds.`,
        },
      ],
      takeaways: [
        'Freeze the raw file and clean a copy.',
        'A codebook defines every column and what missing means.',
        'Report exclusions and their effect on the sample.',
      ],
      exercise: {
        title: 'Choose the best cleaning decision',
        prompt: 'Your dataset has 12 blank satisfaction scores out of 300 responses. What is the best next step?',
        options: [
          {
            text: 'Replace the blanks with the average score so every row is complete',
            correct: false,
            why: 'That invents data. It also shrinks the variation and hides that some people did not answer.',
          },
          {
            text: 'Report 288 valid responses for that question and note why 12 were blank',
            correct: true,
            why: 'You keep the real responses, state the denominator and let the reader judge the gap.',
          },
          {
            text: 'Delete the 12 rows from the whole dataset',
            correct: false,
            why: 'That throws away valid answers to other questions and changes the demographic profile.',
          },
          {
            text: 'Ignore the blanks and use 300 as the denominator',
            correct: false,
            why: 'That inflates the denominator and understates the percentage. Every number needs its real n.',
          },
        ],
      },
      quiz: [
        {
          q: 'What does a codebook record?',
          options: ['Only column names', 'Each variable’s question, allowed values, type and missing meaning', 'The final results'],
          answer: 1,
          why: 'It makes the dataset understandable to someone who did not collect it, including you in three months.',
        },
        {
          q: 'Why keep the raw file untouched?',
          options: ['To save space', 'To be able to trace and reverse every cleaning decision', 'Because raw files are always correct'],
          answer: 1,
          why: 'The raw file is the record of what was collected. The working copy is where you make documented changes.',
        },
      ],
      template: {
        title: 'Data codebook',
        filename: 'codebook.md',
        body: `# Codebook: [project]

Raw file: [name] · Working file: [name] · Last updated: [date] · Owner: [name]

| Column | Question / definition | Type | Allowed values | Missing means | Notes |
|---|---|---|---|---|---|
| respondent_id | Participant code | text |  |  | Never a name |
| age | Age at last birthday | number | 18–99 | Not answered | 4 invalid values flagged |
| city | City of last visit | category | Karachi / Lahore / Islamabad / Other | Not answered | Standardised spellings |
| satisfaction | "How satisfied…" 1–5 | ordinal | 1–5 | Not applicable vs skipped | 12 blanks; reported separately |

## Cleaning log
| Date | Change | Rows affected | Reason |
|---|---|---|---|
|  |  |  |  |

## Exclusions
| Rule | Rows excluded | Effect on sample |
|---|---|---|
|  |  |  |`,
      },
    },
    {
      id: 'describe-data',
      title: 'Describe what you collected, with the n',
      minutes: 7,
      xp: 30,
      summary: 'Choose the right summary for the data, show distributions before averages, and never report a percentage without its denominator.',
      skillTags: ['descriptive statistics', 'data visualisation', 'denominators'],
      steps: [
        {
          kind: 'concept',
          title: 'Describe before you infer',
          body: `Descriptive analysis answers: who is in the sample, what did they report, and how much variation is there? Do this before any test. It catches coding errors and stops you making claims the data cannot carry.

**Categorical data:** report counts and percentages with the denominator. “Half of respondents” is meaningless if 18 people answered and 6 skipped.

**Numeric data:** report the count, missing values, mean, median, minimum and maximum. If the distribution is skewed (income, wait times, spending), the median and interquartile range describe it better than the mean. A mean pulled up by two very large values is not wrong, but it is misleading on its own.

**Show the distribution.** A histogram or dot plot reveals outliers, clusters and a long tail that a single average hides. For small samples, show every point.

**Comparing groups:** report each group’s n and summary. Do not compare a group of 8 with a group of 120 and describe the difference as if both estimates were equally precise.

**Charts:** start at zero for bars, label the axes, state the n, and avoid 3D or decorative effects. A chart should make one comparison easy to see. If it needs a paragraph to explain, simplify it.

**Percentages that mislead:** a change from 2 to 4 responses is “double” but tiny. Report the raw counts alongside the percentage so the reader can judge.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Every number needs its n and its unit.** If you cannot say how many people or records are behind a number, it is not a finding yet.`,
        },
        {
          kind: 'example',
          title: 'Real example: 50% of whom?',
          body: `A draft report says: “50% of customers were dissatisfied.” The chart denominator is 18 completed responses out of 300 invited.

The revised sentence: “Of the 18 customers who completed the exit survey (6% of those invited), 9 rated their last visit as dissatisfied.” That is less punchy and far more honest. It also tells the manager that the survey itself has a response problem.

The team adds the invitation and response counts to every chart, then conducts a short round of phone interviews with customers who did not respond. The small survey becomes a useful signal with a stated limit, not a false estimate.`,
        },
      ],
      takeaways: [
        'Report counts and percentages with the real denominator.',
        'Use median and range for skewed data; show the distribution.',
        'Compare groups only when you can state each group’s n.',
      ],
      exercise: {
        title: 'Choose the honest summary',
        prompt: 'You have 20 responses: 18 rate the service 5/5, one rates 2/5 and one rates 1/5. Which summary is most honest?',
        options: [
          {
            text: 'Average satisfaction is 4.6 out of 5, so service is excellent',
            correct: false,
            why: 'The average hides the two very unhappy responses and the small sample. It is technically true but not a fair summary.',
          },
          {
            text: '18 of 20 respondents rated 5/5; two rated 1 or 2 out of 5. The sample is small and should be read with that in mind',
            correct: true,
            why: 'It reports the distribution and the n, so the reader sees both the strong positive pattern and the exceptions.',
          },
          {
            text: '90% of all customers are satisfied',
            correct: false,
            why: 'You cannot infer all customers from 20 responses, especially when the selection method is not representative.',
          },
          {
            text: 'Satisfaction is 4.6 out of 5 and no customers are unhappy',
            correct: false,
            why: 'The two low ratings directly contradict the second claim.',
          },
        ],
      },
      quiz: [
        {
          q: 'When is the median a better summary than the mean?',
          options: ['For every dataset', 'When the data are skewed or have extreme values', 'When there are no numbers'],
          answer: 1,
          why: 'The median resists being pulled by a few very large or very small values.',
        },
        {
          q: 'What must accompany a percentage?',
          options: ['Its denominator', 'A pie chart', 'A p-value'],
          answer: 0,
          why: 'A percentage without n hides how many people were behind it and is easy to overread.',
        },
      ],
      template: {
        title: 'Descriptive summary table',
        filename: 'descriptive-summary.md',
        body: `# Descriptive summary: [project]

Invited: [n] · Responded: [n] · Valid for analysis: [n]

| Variable | n | Missing | Summary | Notes |
|---|---|---|---|---|
| Age |  |  | median [IQR], range |  |
| City |  |  | counts and % of valid n |  |
| Satisfaction (1–5) |  |  | median [IQR]; distribution |  |
| Would recommend? |  |  | % yes of valid n |  |

## Group comparison
| Group | n | Median / % | Range or IQR |
|---|---|---|---|
|  |  |  |  |

## What the data cannot tell us
[Selection bias, missing groups, questions not asked]`,
      },
    },
    {
      id: 'choose-test',
      title: 'Choose a statistical test that matches the question',
      minutes: 9,
      xp: 40,
      summary: 'Start with the variables and the comparison, then pick a test. Plot first, check assumptions, and report the size of the difference.',
      skillTags: ['statistical tests', 'hypothesis testing', 'assumptions'],
      steps: [
        {
          kind: 'concept',
          title: 'The test follows from the variables',
          body: `There is no “best” test in the abstract. The question and the data decide.

First classify each variable:

- **Categorical:** city, yes/no, loyalty-tier.
- **Ordinal:** a 1–5 satisfaction scale. Treat it as ordinal unless you have a reason and enough categories to treat it as numeric.
- **Numeric:** age, spend, wait time.

Then ask how the groups are related: **independent** (different people in each group) or **paired** (the same people measured twice).

| Question | Typical test |
|---|---|
| One categorical variable: is the split different from expected? | Chi-square goodness of fit |
| Two categorical variables: are they associated? | Chi-square test of independence |
| Two independent groups, numeric outcome | Independent-samples t-test (or Mann–Whitney if assumptions fail) |
| Three or more independent groups, numeric outcome | One-way ANOVA (or Kruskal–Wallis) |
| Same people measured twice | Paired t-test (or Wilcoxon signed-rank) |
| Two numeric variables | Correlation; regression if you control for other factors |

**Check before you test:** independence of observations, roughly symmetric distributions or large enough groups for the t-test, and similar spread. A quick plot answers more than a rule-of-thumb checklist. If the data are heavily skewed or ordinal, use the rank-based alternative.

**Report the right things:** the group summaries, the size of the difference, a confidence interval and the exact test. A p-value alone does not tell the manager whether the difference matters.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Plot the data before you test it.** If the plot surprises you, stop and understand why. A test run on data you have not looked at is a way of not noticing a mistake.`,
        },
        {
          kind: 'example',
          title: 'Real example: two cities, one satisfaction score',
          body: `A team compares satisfaction in Karachi and Lahore. Different customers were surveyed in each city, and the outcome is a 1–5 rating.

That points to an independent-groups comparison. Because the scale is short and the distributions are skewed, the team reports medians and uses a Mann–Whitney test rather than a t-test. They show both city distributions side by side first.

The report says: “Median satisfaction was 4 in Karachi (n = 96) and 4 in Lahore (n = 104); the distributions did not differ enough to rule out chance.” The manager’s decision does not change. That is a useful result: it stops the team spending a budget on a city-specific fix that the evidence does not support.`,
        },
      ],
      takeaways: [
        'Classify variables and the comparison before choosing a test.',
        'Plot and check assumptions; use rank-based tests when needed.',
        'Report effect size and uncertainty, not only a p-value.',
      ],
      exercise: {
        title: 'Choose the test',
        prompt: 'You compare wait-time (minutes) between two independent groups: walk-in and appointment customers. The distributions are skewed. Which test fits?',
        options: [
          {
            text: 'Paired t-test',
            correct: false,
            why: 'Different customers are in each group, so the observations are not paired.',
          },
          {
            text: 'Mann–Whitney U test',
            correct: true,
            why: 'It compares two independent groups on a numeric outcome without assuming a normal distribution.',
          },
          {
            text: 'Chi-square test of independence',
            correct: false,
            why: 'Chi-square compares categorical variables. Wait time is numeric.',
          },
          {
            text: 'Correlation',
            correct: false,
            why: 'Correlation describes the relationship between two numeric variables, not a difference between groups.',
          },
        ],
      },
      quiz: [
        {
          q: 'What distinguishes a paired test from an independent-groups test?',
          options: ['The number of variables', 'Whether the same people are measured twice', 'Whether the outcome is numeric'],
          answer: 1,
          why: 'Paired tests use the link between two measurements of the same person; independent tests compare separate groups.',
        },
        {
          q: 'Why report an effect size as well as a p-value?',
          options: ['To make the report longer', 'Because a p-value does not show how large or useful the difference is', 'Because effect sizes are always significant'],
          answer: 1,
          why: 'A tiny difference can be statistically detectable in a large sample. The manager needs the size, not only the probability.',
        },
      ],
      tool: '/tools/sample-size',
    },
    {
      id: 'qualitative-synthesis',
      title: 'Turn interviews into themes you can defend',
      minutes: 9,
      xp: 40,
      summary: 'Code systematically, keep negative cases, check your interpretation with a second person, and quote without exposing anyone.',
      skillTags: ['qualitative analysis', 'thematic coding', 'intercoder reliability'],
      steps: [
        {
          kind: 'concept',
          title: 'Coding is a documented process',
          body: `Qualitative analysis is not “reading the transcripts and writing what stood out”. It is a trail from raw words to an interpretation that another person can follow.

**1. Prepare.** Transcribe or clean notes, give each participant a code, and remove names from the analysis file. Keep a separate key.

**2. Code.** Read a few transcripts and write short labels for meaningful chunks: “price shock”, “staff remembered my order”, “app crashed at payment”. Codes describe the content; they are not yet themes.

**3. Build a codebook.** Define each code, when to apply it, and one example. Merge duplicates, split codes that hide different ideas.

**4. Group into themes.** A theme is a pattern that answers the research question, not a topic label. “Trust” is a topic. “Customers forgive one failure when staff explain it quickly” is a theme with a claim.

**5. Look for negative cases.** Who does not fit the pattern, and why? Reporting only confirming quotes is cherry-picking. A good section says where the theme held and where it broke.

**6. Check with a second coder.** Independently code a sample of transcripts, compare, and discuss disagreements. You do not need perfect agreement; you need a record that the interpretation is not one person’s private impression.

**7. Report.** For each theme: the claim, how many participants contributed, a short quote, and the limit. Use counts carefully: “9 of 12 participants mentioned price” is a fact; “most customers care only about price” is an overclaim.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Count themes, not adjectives.** “Many”, “most” and “significant” are not findings. Say how many of how many, and show the quote.`,
        },
        {
          kind: 'example',
          title: 'Real example: twelve interviews, three themes',
          body: `A team interviews 12 lapsed gym members. Their first draft has a theme called “bad experience” with one long quote.

The coded transcripts show three separate patterns: (1) the class timetable changed without notice, mentioned by 8 of 12; (2) equipment was out of order, mentioned by 5; (3) a billing error left a bad feeling, mentioned by 3. One participant left for a cheaper gym and did not mention any of these, a negative case worth reporting.

The revised findings are specific and actionable: fix timetable communication first, then equipment maintenance, and review billing. The report does not claim that all lapsed members feel the same way. It shows the pattern, its size and its exceptions.`,
        },
      ],
      takeaways: [
        'Build a codebook and code transcript by transcript.',
        'A theme makes a claim; a topic is only a label.',
        'Report negative cases and the number of participants behind a theme.',
      ],
      exercise: {
        title: 'Pick the defensible theme statement',
        prompt: 'In 12 interviews, 9 mention price and 3 mention location. Which theme statement is best supported?',
        options: [
          {
            text: 'Customers only care about price.',
            correct: false,
            why: '“Only” ignores the three location comments and overstates what 12 interviews can support.',
          },
          {
            text: 'Price came up in 9 of 12 interviews, usually as the main reason for leaving; location was mentioned by 3.',
            correct: true,
            why: 'It gives the pattern, the count and the exceptions without claiming to speak for all customers.',
          },
          {
            text: 'Price is a significant factor for most customers.',
            correct: false,
            why: '“Significant” and “most customers” imply a population estimate the design cannot provide.',
          },
          {
            text: 'Everyone we spoke to mentioned price.',
            correct: false,
            why: 'The data say 9 of 12, not everyone. Precision matters even in a short report.',
          },
        ],
      },
      quiz: [
        {
          q: 'What is a negative case in qualitative analysis?',
          options: ['A participant who was rude', 'A case that does not fit the emerging pattern', 'A failed interview'],
          answer: 1,
          why: 'Negative cases test your interpretation and stop you reporting only confirming evidence.',
        },
        {
          q: 'Why keep a codebook with definitions and examples?',
          options: ['To make coding slower', 'So another coder can apply the same codes consistently', 'Because quotes are not enough'],
          answer: 1,
          why: 'A shared codebook makes the analysis reproducible and the disagreements discussable.',
        },
      ],
      template: {
        title: 'Qualitative codebook and theme sheet',
        filename: 'qualitative-codebook.md',
        body: `# Qualitative codebook: [project]

Research question: [question]
Participants: [n] · Data: [interviews / focus groups / notes] · Analyst: [name]

| Code | Definition | When to apply | Example quote | Participants |
|---|---|---|---|---|
| price-shock | Cost mentioned as a reason to leave | Any explicit cost comparison |  |  |

## Themes
### Theme 1: [claim, not a topic]
- Definition:
- Participants: [n of total]
- Evidence: [quote with participant code]
- Negative cases:
- Implication:

## Second-coder check
| Transcript | Codes agreed | Disagreements | Resolution |
|---|---|---|---|
|  |  |  |  |

## Limits
[Who was not interviewed; what the design cannot show]`,
      },
    },
  ],
};
