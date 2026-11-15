import type { Track } from '../../lib/types';

export const scoping: Track = {
  id: 'scoping',
  short: 'Scoping',
  title: 'Scoping & literature review',
  level: 'Beginner',
  audience: 'Students starting their first applied research project',
  summary:
    'Turn a company question into a study you can finish, search the evidence like a professional, read papers without drowning, and build a literature matrix your team can use.',
  outcome: 'A one-page research brief, a repeatable search log and an evidence matrix that names the gap you will study.',
  skills: ['research questions', 'literature search', 'critical reading', 'evidence synthesis'],
  lessons: [
    {
      id: 'company-question',
      title: 'Turn a company question into a research question',
      minutes: 7,
      xp: 35,
      summary: 'A manager brings a decision. Your job is to turn it into a question with a population, a comparison and a finish line.',
      skillTags: ['research questions', 'scoping', 'decision framing'],
      steps: [
        {
          kind: 'concept',
          title: 'A decision is not a question',
          body: `A company asks: “Why are customers leaving?” That is a concern, not a study. Before you collect anything, separate three things:

- **The decision.** What will someone do differently after reading your report? Keep the answer concrete: change a price, open a second branch, stop a promotion, hire another support agent.
- **The question.** What evidence would change that decision? Name the people, the place, the time and what you will measure.
- **The finish line.** What result would make the team say “we know enough to act”? Agree this before fieldwork, so the project cannot drift.

A useful applied question often follows the shape: *Among [population] in [place], is [factor] associated with [outcome] during [period]?* For a decision about whether to keep a discount, that becomes: *Among customers who used the student discount in Lahore between January and June, did those who used it twice or more renew at a higher rate than customers who used it once?*

Test the draft against **FINER**: Feasible, Interesting, Novel, Ethical, Relevant. If any letter fails, rewrite the question rather than adding more data collection.

**What a good brief contains.** One page, no jargon: the decision, the question, who is affected, what you will measure, what you will not measure, the timeline, and who signs off.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Write the decision first, in one sentence.** If you cannot name who will do what differently, the question is still too vague. A study that cannot change a decision becomes a pile of interesting facts with no owner.`,
        },
        {
          kind: 'example',
          title: 'Real example: the coffee chain',
          body: `A coffee chain says regulars have stopped coming. The first draft is “customer retention in Karachi”. Nobody can act on that.

The team rewrites it with the branch manager in the room:

> Among customers who visited the Clifton branch at least twice a month in 2025, what changed in their last three visits compared with customers who kept coming?

That question points to evidence: loyalty-card visit records, a short exit survey, and eight interviews with lapsed regulars. It also has a clear limit: it cannot tell us whether a new competitor caused the change. The report will say so instead of guessing.`,
        },
      ],
      takeaways: [
        'Name the decision, the question and the finish line before data collection.',
        'A researchable question names a population, a place, a period and what you will measure.',
        'Write the limits of the study into the brief on day one.',
      ],
      exercise: {
        title: 'Pick the question you can actually study',
        prompt: 'A manager wants to know whether a loyalty programme is worth keeping. Which question is the strongest starting point?',
        options: [
          {
            text: 'Why do customers love loyalty programmes?',
            correct: false,
            why: 'It assumes the answer and gives you no comparison. You would collect opinions and still not know whether to keep the programme.',
          },
          {
            text: 'Among customers who joined the loyalty programme in the last 12 months, is repeat purchase rate higher than among similar customers who did not join?',
            correct: true,
            why: 'It names the population, the comparison, the outcome and the period. It can also fail, which is what makes it research.',
          },
          {
            text: 'What are the latest global trends in customer loyalty?',
            correct: false,
            why: 'Useful background, but it cannot answer a decision for this company in this market. Desk research is not a substitute for a study.',
          },
          {
            text: 'Do customers like discounts or points more?',
            correct: false,
            why: 'The comparison is unclear, and “like” is not defined. You would need to say who, in what setting, and what behaviour you will measure.',
          },
        ],
      },
      quiz: [
        {
          q: 'What should you agree with the decision-maker before fieldwork starts?',
          options: ['The final recommendation', 'What evidence would be enough to act', 'The exact wording of every interview question'],
          answer: 1,
          why: 'Agreeing the finish line stops the project drifting and tells you when to stop collecting data.',
        },
        {
          q: 'Which part of FINER checks whether the study can actually be done with your time, access and skills?',
          options: ['Novel', 'Feasible', 'Interesting'],
          answer: 1,
          why: 'Feasibility covers access to people, data, time, budget and ethics approval. A beautiful question you cannot study is not yet a project.',
        },
      ],
      template: {
        title: 'One-page research brief',
        filename: 'research-brief.md',
        body: `# Research brief: [project name]

**Decision this study informs:** [who will do what differently]

**Research question:** Among [population] in [place], is [factor] associated with [outcome] during [period]?

**Why now:** [one or two sentences]

**What we will measure:** [variables and how]

**What we will not measure:** [the limits you are accepting]

**Evidence we already have:** [internal data, reports, papers]

**Method in one line:** [survey / interviews / secondary data / experiment]

**Sample and access:** [who, how many, how you will reach them]

**Ethics and consent:** [approval needed, consent route, data storage]

**Timeline:** [dates for fieldwork, analysis, draft, sign-off]

**Finish line:** [what result would be enough to act]

**Owner and reviewer:** [names]`,
      },
      tool: '/tools/question-builder',
    },
    {
      id: 'search-strategy',
      title: 'Build a search that someone else can repeat',
      minutes: 8,
      xp: 35,
      summary: 'Use keywords, synonyms, Boolean operators and snowballing, then log the search so your evidence can be checked.',
      skillTags: ['literature search', 'Boolean search', 'search log'],
      steps: [
        {
          kind: 'concept',
          title: 'Search is a method, not a lucky click',
          body: `A literature search has three jobs: find the obvious work, find the work that uses different words, and show your reader that you looked properly. One Google Scholar query does none of those reliably.

**Build a block of terms.** Split your question into two or three concepts. For each concept, list synonyms and spellings:

| Concept | Terms |
|---|---|
| Customers leaving | churn, attrition, retention, lapse, switching |
| Small businesses | SME, small firm, microenterprise, start-up |
| Loyalty schemes | loyalty programme, rewards, points, membership |

**Combine with Boolean logic.** Connect synonyms with **OR** inside brackets, and concepts with **AND**:

> (churn OR attrition OR retention) AND (SME OR “small business”) AND (loyalty OR rewards)

**Use the database’s filters.** Publication year, language, document type and subject area. Search at least two sources: Google Scholar for breadth, a subject database such as PubMed, Scopus, EconLit or your university library for quality, and the reference lists of the best three papers for work the keywords missed. That last step is called **snowballing**.

**Log everything.** Record the database, the exact string, the date, the filters and the number of results. If you cannot repeat a search, your evidence cannot be checked.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Log the search before you read the results.** A screenshot of a results page is not a method. The log is what lets a reviewer see that you did not stop at the first ten convenient papers.`,
        },
        {
          kind: 'example',
          title: 'Real example: a search that was too narrow',
          body: `A team searching “customer churn loyalty programme Pakistan” found four results and concluded that little was known. Their supervisor asked what happened when they removed the country.

The revised search found 60 studies on loyalty schemes and retention, and 12 on small businesses in South Asia. The team then used a separate search for Pakistan-specific data. Their claim changed from “no research exists” to “few Pakistan-specific studies exist; the international evidence is mostly from retail and telecoms”. That is a defensible gap statement, and it came from a better search rather than a stronger opinion.`,
        },
      ],
      takeaways: [
        'Turn each concept into a block of synonyms before you search.',
        'Use at least two sources and snowball from the best papers.',
        'A repeatable search log is part of the evidence.',
      ],
      exercise: {
        title: 'Rescue a weak search',
        prompt: 'You searched “customer churn loyalty programme Pakistan” and found four results. What is the best next move?',
        options: [
          {
            text: 'Conclude that no one has studied this and move on',
            correct: false,
            why: 'Four results usually means the string was too narrow or the database was wrong, not that the literature is empty.',
          },
          {
            text: 'Remove the country term, add synonyms with OR and search reference lists of the best papers',
            correct: true,
            why: 'This widens the concept blocks without losing the research question, then uses snowballing to catch work the keywords missed.',
          },
          {
            text: 'Search the exact same string on a different website',
            correct: false,
            why: 'A different database may help, but the string still has the same problem. Fix the terms and filters first.',
          },
          {
            text: 'Only use the four results because they are the most specific',
            correct: false,
            why: 'Specific does not mean complete. You would miss the wider evidence and make a gap claim you cannot support.',
          },
        ],
      },
      quiz: [
        {
          q: 'What does the operator OR do in a search string?',
          options: ['Requires both terms to appear', 'Finds either of the chosen terms', 'Excludes a term'],
          answer: 1,
          why: 'OR broadens a concept block: churn OR attrition finds records that use either word.',
        },
        {
          q: 'What should a search log contain?',
          options: ['Only the number of papers you read', 'Database, exact string, date, filters and result count', 'Your opinion of each paper'],
          answer: 1,
          why: 'Those details let another person repeat the search and check that your evidence base is complete enough.',
        },
      ],
      template: {
        title: 'Search log',
        filename: 'search-log.md',
        body: `# Search log: [project name]

Searched by: [name] · Last updated: [date]

| Date | Source | Exact search string | Filters | Results | Notes |
|---|---|---|---|---|---|
|  | Google Scholar | (churn OR attrition OR retention) AND (SME OR "small business") | 2015–2026, English |  |  |
|  | Scopus |  |  |  |  |
|  | Snowballing | Reference lists of: [three papers] | — |  |  |

## Included studies
| Study | Why included | What it adds |
|---|---|---|
|  |  |  |

## Excluded at title or abstract
| Study | Reason |
|---|---|
|  |  |`,
      },
    },
    {
      id: 'read-a-paper',
      title: 'Read a paper in three passes',
      minutes: 8,
      xp: 30,
      summary: 'Skim for the claim, read the methods before the results, and decide what the paper can and cannot support.',
      skillTags: ['critical reading', 'methods', 'evidence quality'],
      steps: [
        {
          kind: 'concept',
          title: 'Read for what you need, not from start to finish',
          body: `Most papers are not written to be read once, front to back. Use **three passes**:

1. **The skim (2 minutes).** Title, abstract, headings, figures and the last paragraph of the discussion. Write one sentence: what does this paper claim?
2. **The method pass (10 minutes).** Who was studied, how many, where, when, how were they selected, and what was measured? If the method cannot support the claim, the result does not matter for your decision.
3. **The close pass (20+ minutes).** Read the results and limitations, check the tables, and note the one finding you might use. Record the page number.

**IMRaD** is the usual map: Introduction (why), Methods (how), Results (what happened), and Discussion (what the authors think it means). The discussion is the authors’ interpretation, not new evidence. Keep the two separate in your notes.

**Four questions for every paper:**
- What was the comparison, and was there one at all?
- Who is missing from the sample?
- How large is the effect, not just whether it was “significant”?
- What would change the authors’ mind?

If the paper is a review, check whether it says how studies were found. A review with no search method is an opinion piece with references.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Read the methods before you trust the result.** A surprising finding from a weak sample is a hypothesis, not a fact. The methods section tells you what kind of sentence you are allowed to write.`,
        },
        {
          kind: 'example',
          title: 'Real example: the productivity headline',
          body: `A headline says “remote work boosts productivity by 20%”. The paper studied 40 software engineers at one company for eight weeks, measuring lines of code. The finding may be real for that group, in that job, on that measure.

For a company deciding whether factory supervisors can work remotely, the paper is background, not evidence. The honest note in your matrix is: “Productivity rose in a small software sample; measure does not transfer to shift-based operations.” You have still used the paper well: you know what it supports and what it does not.`,
        },
      ],
      takeaways: [
        'Skim for the claim, then read the method before the result.',
        'Separate what the authors found from what they think it means.',
        'Write what a paper cannot support as well as what it can.',
      ],
      exercise: {
        title: 'Spot the overclaim',
        prompt: 'A paper surveys 60 gym members in one city and finds they prefer morning workouts. Which sentence is fair to write in your review?',
        options: [
          {
            text: 'Morning workouts are more popular among gym members everywhere.',
            correct: false,
            why: 'The sample is 60 members in one city. You cannot generalise to every gym member.',
          },
          {
            text: 'In one city, 60 surveyed gym members preferred morning workouts; the study did not test other cities.',
            correct: true,
            why: 'It states the population, the size and the limit. That is the sentence the method can support.',
          },
          {
            text: 'The study proves that morning exercise is better.',
            correct: false,
            why: 'Preference is not proof of benefit, and this design cannot test better for whom.',
          },
          {
            text: 'Gym members are switching to mornings.',
            correct: false,
            why: '“Switching” describes change over time. A one-off survey cannot show a trend.',
          },
        ],
      },
      quiz: [
        {
          q: 'Where do you check whether a paper’s sample can support its claim?',
          options: ['The abstract', 'The methods section', 'The acknowledgements'],
          answer: 1,
          why: 'The methods section names who was studied, how many, and how they were selected.',
        },
        {
          q: 'What is the difference between results and discussion?',
          options: ['There is none', 'Results report what was found; discussion interprets it', 'Discussion reports new data'],
          answer: 1,
          why: 'Keep the finding and the authors’ interpretation separate in your notes, so you can cite the right one.',
        },
      ],
      tool: '/guide',
    },
    {
      id: 'literature-matrix',
      title: 'Synthesise sources into a literature matrix',
      minutes: 9,
      xp: 40,
      summary: 'Turn a pile of papers into themes, a defensible gap statement and a matrix your team can extend.',
      skillTags: ['evidence synthesis', 'literature matrix', 'gap statement'],
      steps: [
        {
          kind: 'concept',
          title: 'A matrix forces you to compare, not summarise',
          body: `A literature review is not a list of summaries. It is an argument about what is known, what is contested, and what is missing for your decision. A matrix is the working tool that makes that argument possible.

**One row per source.** Useful columns:

| Column | What goes in it |
|---|---|
| Study | Author, year, title |
| Setting | Country, industry, organisation type |
| Sample | Who, how many, how selected |
| Method | Survey, interviews, experiment, secondary data |
| Finding | The one result you might use |
| Limit | The main reason it might not transfer |
| Relevance | High, medium, low for your question |

**Then group by theme, not by author.** Themes might be price sensitivity, switching costs, service quality and trust. Within each theme, say where studies agree, where they conflict, and why the setting might explain the difference.

**Write the gap as a sentence about evidence, not about absence.** “No one has studied this” is almost always wrong. Better: “Most evidence comes from telecoms in high-income countries; we found two studies of small retailers in South Asia, neither measuring repeat purchase.”`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Quote the sentence you rely on, word for word, with a page number.** Paraphrasing from memory is how a claim drifts away from its source. If you cannot find the sentence again, you cannot use it.`,
        },
        {
          kind: 'example',
          title: 'Real example: twelve papers, three themes',
          body: `A student team read twelve papers on customer loyalty. Their first draft was twelve paragraphs, one per paper, and the supervisor could not tell what they had learned.

The matrix showed three clusters: price and discounts (five papers), service quality (four), and habit or convenience (three). Two papers disagreed about discounts: one found they increased short-term repeat visits, another found they reduced full-price purchases later. The team reported the disagreement and why the settings differed.

Their gap sentence became: “Evidence on loyalty schemes is concentrated in telecoms and grocery; we found no study measuring repeat purchase for independent cafés in Pakistan.” That sentence shaped the company survey and was honest about the limit of their search.`,
        },
      ],
      takeaways: [
        'Use one row per source with a limit and a relevance rating.',
        'Organise the review by theme and say where evidence conflicts.',
        'Write the gap as a statement about the evidence you found.',
      ],
      exercise: {
        title: 'Write a defensible gap',
        prompt: 'You found 30 international studies and two small Pakistani studies, neither measuring repeat purchase. Which gap statement is honest?',
        options: [
          {
            text: 'No research exists on customer loyalty in Pakistan.',
            correct: false,
            why: 'You found two Pakistani studies, so the statement is false and a reviewer will catch it.',
          },
          {
            text: 'Most evidence is international; the two Pakistani studies we found did not measure repeat purchase.',
            correct: true,
            why: 'It reports what you actually found and makes a precise, checkable claim about the gap.',
          },
          {
            text: 'International evidence proves the same thing will happen in Pakistan.',
            correct: false,
            why: 'Context can change results. Transferring evidence needs an argument, not an assumption.',
          },
          {
            text: 'There is not enough evidence to do the study.',
            correct: false,
            why: 'The gap is exactly why the study is useful. A lack of local evidence is a reason to collect it carefully.',
          },
        ],
      },
      quiz: [
        {
          q: 'How should a literature review be organised?',
          options: ['One paragraph per paper', 'By theme, with agreement and disagreement', 'By publication year only'],
          answer: 1,
          why: 'Themes let you compare evidence. A paper-by-paper list hides the synthesis the reader needs.',
        },
        {
          q: 'Why include a limitations column in the matrix?',
          options: ['To criticise authors', 'To judge whether a finding transfers to your setting', 'To make the table longer'],
          answer: 1,
          why: 'A limit is not a flaw hunt; it tells you how far a finding can travel to your population and decision.',
        },
      ],
      template: {
        title: 'Literature matrix',
        filename: 'literature-matrix.md',
        body: `# Literature matrix: [project name]

| # | Study (author, year) | Setting | Sample | Method | Finding (one sentence) | Limit | Relevance |
|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  | High |
| 2 |  |  |  |  |  |  | Medium |

## Themes
### Theme 1: [name]
- What the evidence says:
- Where it conflicts:
- What this means for our question:

### Theme 2: [name]
- What the evidence says:
- Where it conflicts:
- What this means for our question:

## Gap statement
[Most evidence comes from ...; we found ...; none measured ...]

## Search coverage
[Link to search log; databases, dates, limits]`,
      },
    },
  ],
};
