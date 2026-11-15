import type { Track } from '../../lib/types';

export const reporting: Track = {
  id: 'reporting',
  short: 'Reports',
  title: 'Executive reports & citations',
  level: 'Intermediate',
  audience: 'Students writing the client-facing final report',
  summary:
    'Write the answer first, keep findings separate from interpretation, cite every claim, and hand over a report a professor can sign off without rewriting.',
  outcome: 'A short executive report with an evidence trail, correct references and a completed QA checklist.',
  skills: ['report writing', 'data storytelling', 'citations', 'quality assurance'],
  lessons: [
    {
      id: 'report-structure',
      title: 'Structure a report a manager can act on',
      minutes: 8,
      xp: 35,
      summary: 'Lead with the answer, keep the body short, and push the method detail into an appendix without hiding it.',
      skillTags: ['report writing', 'executive summary', 'structure'],
      steps: [
        {
          kind: 'concept',
          title: 'Answer first, evidence second',
          body: `A busy manager reads the first page and maybe one chart. That is not laziness; it is the job. Write for that reader.

**The shape of an applied report:**

1. **Title and one-line question.** What decision does this study inform?
2. **Executive summary (half a page).** The answer, three key findings, the recommendation, and the main limit. No new information later that changes this page.
3. **What we did (one page).** Design, who was studied, when, how many, and the analysis. Enough for a professor to judge the method.
4. **Findings.** One finding per subsection, each with its n, its chart or table, and a sentence saying what it means.
5. **What this means for the decision.** Recommendations tied to the findings, with the condition under which each applies.
6. **Limits and what we would do next.** Sample limits, missing groups, questions not asked. A short, honest list.
7. **Appendix.** Questionnaire, consent form, full tables, search log, codebook. Everything a reviewer might ask for, kept out of the main argument.

**Use BLUF: bottom line up front.** The first sentence of the summary is the recommendation, not “This report examines…”. The second sentence is the strongest evidence for it. The third is the main reason it might be wrong.

**Length is a design choice.** A 30-page report with no summary is usually a sign that the team has not decided what the answer is. Aim for 6–10 pages plus appendix for a small applied study.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**Write the answer on page one. The reader may never reach page two.** If the summary would still work with the rest of the report deleted, it is doing its job.`,
        },
        {
          kind: 'example',
          title: 'Real example: cutting twelve pages to six',
          body: `A team sends a 12-page draft. The first page explains the company background, the second describes the survey platform, and the recommendation appears on page 11.

The supervisor asks for one sentence: what should the manager do? The team writes: “Keep the student discount, but limit it to the first three months, because repeat visits did not differ after that point.” That sentence becomes the opening of the summary.

The background drops to two paragraphs, the platform details move to the appendix, and the full tables become links. The report is six pages plus appendix. Nothing important is lost; the important part is now visible.`,
        },
      ],
      takeaways: [
        'Lead with the answer, then the evidence, then the limits.',
        'Keep method detail in the body short and the full material in the appendix.',
        'Every recommendation should point to a finding.',
      ],
      exercise: {
        title: 'Order the report',
        prompt: 'Which opening belongs at the top of an executive report?',
        options: [
          {
            text: 'This report examines customer satisfaction using a survey conducted over four weeks.',
            correct: false,
            why: 'It describes the activity, not the answer. The reader still does not know what to do.',
          },
          {
            text: 'Keep the loyalty programme, but cap the discount at three months; repeat visits did not differ after that point.',
            correct: true,
            why: 'It states the recommendation, the action and the key evidence in one sentence.',
          },
          {
            text: 'The survey platform had a 20% response rate and the data were cleaned in Python.',
            correct: false,
            why: 'Method detail matters, but it belongs after the answer, in the method section.',
          },
          {
            text: 'Customer satisfaction is important for every business.',
            correct: false,
            why: 'It is a general statement that could appear in any report. It does not use this study’s evidence.',
          },
        ],
      },
      quiz: [
        {
          q: 'What belongs in the executive summary?',
          options: ['Every table', 'The answer, key findings, recommendation and main limit', 'Only the method'],
          answer: 1,
          why: 'The summary is the whole argument in miniature, not a table of contents.',
        },
        {
          q: 'Why use an appendix?',
          options: ['To hide inconvenient results', 'To keep full instruments and tables available without interrupting the argument', 'To make the report longer'],
          answer: 1,
          why: 'Appendices support checking and replication. They should not contain findings the summary hides.',
        },
      ],
      template: {
        title: 'Executive report outline',
        filename: 'report-outline.md',
        body: `# [Project title]

**Question:** [one sentence] · **Prepared for:** [decision-maker] · **Date:** [date]

## Bottom line
[Recommendation in one sentence.]
[Strongest evidence in one sentence.]
[Main reason this might be wrong in one sentence.]

## Three key findings
1. [Finding, n, chart reference]
2. [Finding, n, chart reference]
3. [Finding, n, chart reference]

## What we did
[Design, population, sample, dates, analysis.]

## Findings
### Finding 1: [claim]
[What we measured, n, result, chart/table.]
[What it means, and what it does not mean.]

## What this means for the decision
[Recommendation, condition, owner, next step.]

## Limits
- [Sample or selection limit]
- [Measurement limit]
- [What we would do with more time]

## Appendix
A. Questionnaire · B. Consent form · C. Full tables · D. Search log · E. Codebook`,
      },
    },
    {
      id: 'write-findings',
      title: 'Write findings without overclaiming',
      minutes: 8,
      xp: 35,
      summary: 'Separate what you observed from what you think it means, use magnitudes, and earn every causal verb.',
      skillTags: ['report writing', 'interpretation', 'causal language'],
      steps: [
        {
          kind: 'concept',
          title: 'Three different sentences',
          body: `A finding, an interpretation and a recommendation are three different sentences. Mixing them is how reports overclaim.

- **Finding:** what the data show. “9 of 18 respondents who completed the exit survey rated their last visit as dissatisfied.”
- **Interpretation:** what you think it means. “The rating pattern suggests the problem may be concentrated in weekend visits.”
- **Recommendation:** what someone should do. “Review weekend staffing before the next promotion.”

Each sentence needs different evidence. The finding needs the data. The interpretation needs a reason and a stated uncertainty. The recommendation needs a decision-maker, a condition and a cost.

**Use magnitudes.** “Satisfaction was lower” is weaker than “median satisfaction was 3 in the new layout and 4 in the old layout”. A difference the manager cannot size is hard to act on.

**Causal verbs are expensive.** “Caused”, “led to”, “increased” and “prevented” claim a mechanism. A cross-sectional survey cannot support them. Use “was associated with”, “respondents who… reported…”, or “the change coincided with”. Only an experiment or a strong quasi-experiment earns the causal verb, and even then state the scope.

**Write the limit next to the finding.** A limit buried in an appendix is easy to miss. One sentence after the finding is enough: “This survey cannot tell us whether the layout caused the change; a store-level trial would.”

**Quotes in reports.** Use a short quote to show the language, not to prove prevalence. “One customer said…” is an illustration; “8 of 12 mentioned…” is a finding.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**No causal verb without a design that can support it.** “Associated with” is not a weaker word; it is the accurate word for what a survey can show.`,
        },
        {
          kind: 'example',
          title: 'Real example: rewrite one paragraph',
          body: `Draft: “The new layout caused a 30% increase in sales, proving that customers prefer the new design.”

What the team actually has: sales in one store rose 30% after the change; no comparison store; a holiday week; 40 customer comments.

Revised: “Sales in the changed store were 30% higher in the four weeks after the layout change than in the four weeks before. The period included a holiday week and there was no comparison store, so the increase cannot be attributed to the layout. Customers who commented (n = 40) most often mentioned easier navigation.”

The revised version is longer and less exciting. It is also the version the team can defend when the manager asks how they know.`,
        },
      ],
      takeaways: [
        'Keep findings, interpretation and recommendations in separate sentences.',
        'Give the size of every difference, not only its direction.',
        'Match causal language to the design.',
      ],
      exercise: {
        title: 'Rewrite the overclaim',
        prompt: 'A cross-sectional survey finds that customers who use the app report higher satisfaction. Which sentence is fair?',
        options: [
          {
            text: 'The app makes customers more satisfied.',
            correct: false,
            why: 'A cross-sectional survey cannot establish that the app caused the difference. Happier customers may be more likely to download it.',
          },
          {
            text: 'App users reported higher satisfaction than non-users; the survey cannot tell us which came first.',
            correct: true,
            why: 'It reports the association and states the direction problem. No causal verb is claimed.',
          },
          {
            text: 'Customers who do not use the app are dissatisfied.',
            correct: false,
            why: '“Higher satisfaction” is a comparison, not evidence that non-users are dissatisfied.',
          },
          {
            text: 'The app is the most important driver of satisfaction.',
            correct: false,
            why: 'The study did not compare drivers or measure their relative importance.',
          },
        ],
      },
      quiz: [
        {
          q: 'Which verb is safe for a cross-sectional association?',
          options: ['Caused', 'Prevented', 'Was associated with'],
          answer: 2,
          why: 'Association language matches the design. Cause needs a design that can rule out alternatives.',
        },
        {
          q: 'What should follow a finding that might be misread?',
          options: ['A longer appendix', 'A one-sentence limit next to the finding', 'A stronger adjective'],
          answer: 1,
          why: 'A nearby limit keeps the reader from taking the finding further than the data allow.',
        },
      ],
      template: {
        title: 'Finding paragraph template',
        filename: 'finding-paragraph.md',
        body: `### Finding: [claim in plain words]

**What we measured:** [variable, population, n]
**What we found:** [number, comparison, chart reference]
**What it means:** [interpretation, stated as interpretation]
**What it does not mean:** [the causal or generalisation claim you are not making]
**Limit:** [one sentence]
**Recommendation:** [action, owner, condition]`,
      },
    },
    {
      id: 'citations',
      title: 'Cite every claim, correctly',
      minutes: 7,
      xp: 30,
      summary: 'Use APA 7 in-text citations and a matched reference list, cite data and tools too, and never let a citation stand in for reading.',
      skillTags: ['citations', 'APA 7', 'reference management'],
      steps: [
        {
          kind: 'concept',
          title: 'A citation is a route back to the evidence',
          body: `A citation does two jobs: it gives credit and it lets a reader check you. If either fails, the report is weaker.

**In-text, APA 7 style:**

- One author: (Khan, 2024) or Khan (2024) found…
- Two authors: (Khan & Ali, 2024)
- Three or more: (Khan et al., 2024)
- Direct quote: (Khan, 2024, p. 17). Keep quotes short and exact.
- Multiple sources: (Ali, 2022; Khan, 2024), alphabetical order.

**Reference list:** alphabetical by author, hanging indent, one entry per source. A typical journal article:

> Khan, S. (2024). Loyalty programmes and repeat purchase in small retail. *Journal of Retailing Practice, 12*(3), 45–61. https://doi.org/10.0000/example

A web page:

> Pew Research Center. (2023, May 4). *Methods 101: Random sampling*. https://www.pewresearch.org/methods/

**Cite more than papers.** Datasets, survey instruments, software and company records need a source too. “Company sales data, 2025” with the owner and extract date is better than no citation.

**Never cite what you have not read.** Citing a paper because another paper cited it is a secondary citation; write “as cited in” and, better, go and read the original.

**Match every in-text citation to the list and every list entry to a citation.** Orphans in either direction are the most common reference error. A reference manager such as Zotero or the [citation builder](/tools/citation) saves time, but check the output; automated styles still import bad metadata.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**If a sentence contains a number or someone else’s idea, it ends with a citation.** Your own analysis gets a methods note, not a citation.`,
        },
        {
          kind: 'example',
          title: 'Real example: the missing source',
          body: `Draft: “Around 70% of small businesses fail in their first five years.”

The number has no source. The team searches, finds several different figures with different definitions and countries, and cannot match the original claim. They remove the sentence. If the point matters, they write: “Small-business survival varies by country and definition; we did not find a Pakistan-specific figure that matched our sample.” That is honest and still useful.

The report keeps citations only for claims the team actually checked. The reference list shrinks by four entries. The argument gets stronger.`,
        },
      ],
      takeaways: [
        'Use APA 7 in-text citations and a matching alphabetical reference list.',
        'Cite data, instruments and software, not only papers.',
        'Remove any claim you cannot trace to a source you read.',
      ],
      exercise: {
        title: 'Spot the citation error',
        prompt: 'Which sentence has the correct APA 7 in-text citation?',
        options: [
          {
            text: 'Khan and Ali (2024) found that repeat visits fell after the discount ended.',
            correct: true,
            why: 'Two authors are named in the narrative citation with “and”, exactly as APA 7 requires.',
          },
          {
            text: 'Khan & Ali (2024) found that repeat visits fell after the discount ended.',
            correct: false,
            why: 'Use “and” in narrative citations. The ampersand belongs inside parentheses.',
          },
          {
            text: 'Khan et al. (2024) found… (for a two-author paper)',
            correct: false,
            why: '“et al.” is for three or more authors. For two, name both.',
          },
          {
            text: 'According to a study, repeat visits fell after the discount ended.',
            correct: false,
            why: '“A study” gives the reader no route to the source. Name the author and year.',
          },
        ],
      },
      quiz: [
        {
          q: 'How do you cite a direct quote in APA 7?',
          options: ['Author and year only', 'Author, year and page number', 'Title and publisher'],
          answer: 1,
          why: 'A direct quote needs the page (or paragraph for web pages) so the reader can find the exact words.',
        },
        {
          q: 'What should every reference list entry have?',
          options: ['A matching in-text citation', 'A hyperlink only', 'A page number'],
          answer: 0,
          why: 'The list and the citations must match one-to-one. Orphan entries are a sign of careless referencing.',
        },
      ],
      template: {
        title: 'APA 7 reference starters',
        filename: 'references-apa7.md',
        body: `# References

## Journal article
Author, A. A., & Author, B. B. (Year). Title of article. *Title of Journal, volume*(issue), pages. https://doi.org/xxxx

## Book
Author, A. A. (Year). *Title of work* (edition). Publisher.

## Chapter in an edited book
Author, A. A. (Year). Title of chapter. In E. Editor (Ed.), *Title of book* (pp. xx–xx). Publisher.

## Web page
Author or organisation. (Year, Month Day). *Title of page*. Site name. https://url

## Dataset
Author or organisation. (Year). *Title of dataset* [Data set]. Publisher. https://doi.org/xxxx

## Report
Organisation. (Year). *Title of report*. https://url

## In-text reminders
- One author: (Khan, 2024)
- Two authors: (Khan & Ali, 2024)
- Three or more: (Khan et al., 2024)
- Direct quote: (Khan, 2024, p. 17)
- Multiple sources: (Ali, 2022; Khan, 2024)`,
      },
      tool: '/tools/citation',
    },
    {
      id: 'review-and-signoff',
      title: 'Review, verify and hand over',
      minutes: 9,
      xp: 40,
      summary: 'Run a QA pass, make the analysis reproducible, and leave a handover a professor can sign without rewriting.',
      skillTags: ['quality assurance', 'reproducibility', 'handover'],
      steps: [
        {
          kind: 'concept',
          title: 'A report is a product, not a draft',
          body: `Before a professor signs off, the report must survive three checks: the numbers, the argument and the files.

**1. Numbers.** Recompute every number in the summary and the findings from the analysis file. Check that totals add up, percentages use the stated denominator, and chart labels match the table. Two people should do this independently; the author is the worst person to catch their own arithmetic.

**2. Argument.** Read only the summary and the findings. Does each recommendation point to a finding? Does each finding have an n and a limit? Are there causal verbs without a design? Is any claim missing a citation? Does the appendix contain what the body references?

**3. Files.** Hand over: the raw data, the cleaned data, the code or analysis workbook, the codebook, the questionnaire, the consent form and the search log. Name one owner and a retention date. A second person should be able to rerun the main table from these files without asking you a question. If they cannot, the handover is incomplete.

**Version control for non-coders.** Use dated file names and a short change log: report_v1, report_v2, and what changed. Avoid “final_final”. If you use Git, tag the version you sent.

**Sign-off is a real step.** The professor reviews the method, the claims and the limits, not the formatting. Record who signed, the date, the version and any conditions. That record protects the student, the professor and the company.`,
        },
        {
          kind: 'rule',
          title: 'Professor’s field rule',
          body: `**A second person should be able to rerun your main analysis from the files you hand over.** If they need to ask you where something is, the project is not finished.`,
        },
        {
          kind: 'example',
          title: 'Real example: the handover that failed',
          body: `A team submits a polished report. A month later, the manager asks why one chart shows 240 responses and another shows 236. The team has the final PDF, a cleaned spreadsheet with no codebook, and a screenshot of the analysis.

Rebuilding the answer takes two days. The team cannot tell which rows were excluded or why. The lesson is written into the next project’s checklist: every chart states its n; the cleaning log lives next to the data; the analysis workbook is handed over with the report.

The next handover includes a five-minute screen recording of the main table being rebuilt from the raw file. The professor signs in one pass.`,
        },
      ],
      takeaways: [
        'Recompute the numbers independently and check the argument separately.',
        'Hand over raw data, cleaned data, analysis files, codebook and instruments.',
        'Record who signed off, on which version and with what conditions.',
      ],
      exercise: {
        title: 'Choose the best QA step',
        prompt: 'You are one day from sending the report. What is the highest-value check?',
        options: [
          {
            text: 'Change the font and colour scheme',
            correct: false,
            why: 'Presentation matters, but it does not catch a wrong number or an unsupported claim.',
          },
          {
            text: 'Have a second person recompute the headline numbers and trace every recommendation to a finding',
            correct: true,
            why: 'This catches the errors that would damage trust in the report and the team.',
          },
          {
            text: 'Add more appendices',
            correct: false,
            why: 'More material can help checking, but only if the core numbers and claims are already verified.',
          },
          {
            text: 'Send it to the client and fix anything they notice',
            correct: false,
            why: 'The client is not your quality check. Errors found after handover cost trust that a day of checking would have protected.',
          },
        ],
      },
      quiz: [
        {
          q: 'What makes an analysis reproducible?',
          options: ['A polished PDF', 'Raw data, cleaned data, code or workbook, codebook and a stated owner', 'A long methods paragraph'],
          answer: 1,
          why: 'Reproduction needs the inputs and the steps, not a description of them.',
        },
        {
          q: 'What should the sign-off record include?',
          options: ['Only a signature', 'Who signed, the date, the version and any conditions', 'The client’s logo'],
          answer: 1,
          why: 'The record shows exactly what was approved, so later changes are visible.',
        },
      ],
      template: {
        title: 'Project handover checklist',
        filename: 'handover-checklist.md',
        body: `# Handover checklist: [project]

Version handed over: [v] · Date: [date] · Owner: [name] · Reviewer: [name]

## Numbers
- [ ] Headline numbers recomputed from the raw file by a second person
- [ ] Every percentage has a denominator
- [ ] Every chart states its n
- [ ] Tables and charts agree
- [ ] Rounding is consistent

## Argument
- [ ] Summary recommendation points to a finding
- [ ] Every finding has an n and a limit
- [ ] No causal verb without a supporting design
- [ ] Every external claim has a citation
- [ ] Appendix contains what the body references

## Files
- [ ] Raw data (untouched)
- [ ] Cleaned data with cleaning log
- [ ] Analysis workbook or code
- [ ] Codebook
- [ ] Questionnaire and consent form
- [ ] Search log and literature matrix
- [ ] Report PDF and editable source

## Sign-off
- [ ] Professor reviewed method, claims and limits
- [ ] Conditions recorded:
- [ ] Retention date and deletion owner:

## Handover notes
[Where each file lives; how to rebuild the main table; who to contact]`,
      },
    },
  ],
};
