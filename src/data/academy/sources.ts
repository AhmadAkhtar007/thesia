import type { LessonSource } from '../../lib/types';

/**
 * Curated further reading for each lesson, keyed `${trackId}/${lessonId}`.
 * Only open, stable sources an applied researcher can actually use: handbooks,
 * reporting checklists, free textbooks and standards bodies.
 */
const SOURCES: Record<string, LessonSource[]> = {
  'scoping/company-question': [
    {
      title: 'Cochrane Handbook — Chapter 2: Determining the scope and the questions',
      url: 'https://training.cochrane.org/handbook/current/chapter-02',
      note: 'How a broad concern becomes an answerable question with a defined population, comparison and outcome.',
    },
    {
      title: 'Cochrane Handbook — Chapter 3: Planning the review',
      url: 'https://training.cochrane.org/handbook/current/chapter-03',
      note: 'Why the decision, the question and the finish line are written down before anyone collects data.',
    },
  ],
  'scoping/search-strategy': [
    {
      title: 'Cochrane Handbook — Chapter 4: Searching for and selecting studies',
      url: 'https://training.cochrane.org/handbook/current/chapter-04',
      note: 'Records a search so a colleague can rerun it and land on the same papers.',
    },
    {
      title: 'PRISMA 2020 statement',
      url: 'https://www.prisma-statement.org/',
      note: 'The reporting checklist and flow diagram that keep a search log honest about what was found and screened.',
    },
    {
      title: 'Google Scholar search help',
      url: 'https://scholar.google.com/intl/en/scholar/help.html',
      note: 'Operators, alerts and library links for the breadth search in the first pass.',
    },
  ],
  'scoping/read-a-paper': [
    {
      title: 'S. Keshav — How to Read a Paper',
      url: 'https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf',
      note: 'The three-pass method: five minutes to decide, an hour to understand, a session to reproduce.',
    },
    {
      title: 'Catalogue of Bias',
      url: 'https://catalogofbias.org/',
      note: 'Short entries on the biases to look for while reading: selection, confounding, measurement, reporting.',
    },
    {
      title: 'EQUATOR Network — reporting guidelines',
      url: 'https://www.equator-network.org/reporting-guidelines/',
      note: 'What a trustworthy paper of a given type is expected to report, so you can spot what is missing.',
    },
  ],
  'scoping/literature-matrix': [
    {
      title: 'PRISMA 2020 statement',
      url: 'https://www.prisma-statement.org/',
      note: 'Counting what you screened and included, so the matrix matches the search log.',
    },
    {
      title: 'Zotero',
      url: 'https://www.zotero.org/',
      note: 'Free reference manager: keeps the rows of your matrix and exports the citations at report time.',
    },
    {
      title: 'EQUATOR Network — reporting guidelines',
      url: 'https://www.equator-network.org/reporting-guidelines/',
      note: 'Check what each included study should have reported before a blank cell becomes “no effect”.',
    },
  ],
  'fieldwork/design-fit': [
    {
      title: 'Catalogue of Bias',
      url: 'https://catalogofbias.org/',
      note: 'Design choices that create bias, and the design that avoids each one.',
    },
    {
      title: 'STROBE statement',
      url: 'https://www.strobe-statement.org/',
      note: 'Reporting checklist for cohort, case-control and cross-sectional studies — reusable design vocabulary.',
    },
    {
      title: 'Cochrane Handbook — Chapter 3: Planning the review',
      url: 'https://training.cochrane.org/handbook/current/chapter-03',
      note: 'Choosing the design from the question and the decision, not from the data that happens to be available.',
    },
  ],
  'fieldwork/sampling': [
    {
      title: 'OpenIntro Statistics (free textbook)',
      url: 'https://www.openintro.org/',
      note: 'Chapters on sampling distributions, standard error and confidence intervals, with worked examples.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook — Measures of scale',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm',
      note: 'Why variability, not the average, decides how many people you need.',
    },
    {
      title: 'Australian Bureau of Statistics — statistical terms and concepts',
      url: 'https://www.abs.gov.au/statistics/understanding-statistics/statistical-terms-and-concepts',
      note: 'Plain-language definitions of sample, population and margin of error for the methods section.',
    },
  ],
  'fieldwork/writing-questions': [
    {
      title: 'Pew Research Center — Questionnaire design',
      url: 'https://www.pewresearch.org/our-methods/u-s-surveys/questionnaire-design/',
      note: 'Practical rules from a survey organisation: one idea per question, neutral wording, tested options.',
    },
    {
      title: 'Pew Research Center — Writing survey questions',
      url: 'https://www.pewresearch.org/our-methods/u-s-surveys/writing-survey-questions/',
      note: 'Worked before-and-after rewrites of questions that people answered badly the first time.',
    },
    {
      title: 'AAPOR — standards and ethics',
      url: 'https://aapor.org/standards-and-ethics/',
      note: 'Disclosure standards: who sponsored the survey, how the sample was drawn, what was asked.',
    },
  ],
  'fieldwork/fieldwork-ethics': [
    {
      title: 'The Belmont Report',
      url: 'https://www.hhs.gov/ohrp/regulations-and-policy/belmont-report/index.html',
      note: 'Respect for persons, beneficence and justice — the three principles behind every consent form.',
    },
    {
      title: 'WMA Declaration of Helsinki',
      url: 'https://www.wma.net/policies-post/wma-declaration-of-helsinki/',
      note: 'The medical-research baseline for consent, risk and ethics review, updated as it evolves.',
    },
    {
      title: 'UKRI ESRC — research ethics guidance',
      url: 'https://www.ukri.org/councils/esrc/guidance-for-applicants/research-ethics-guidance/',
      note: 'A social-science framework for consent, anonymity and handling harm while in the field.',
    },
  ],
  'analysis/prepare-data': [
    {
      title: 'H. Wickham — Tidy Data (Journal of Statistical Software)',
      url: 'https://www.jstatsoft.org/article/view/v059i10',
      note: 'One variable per column, one observation per row: the shape every cleaning decision aims at.',
    },
    {
      title: 'UK Data Service',
      url: 'https://ukdataservice.ac.uk/',
      note: 'Guidance on documenting and cleaning survey data so the steps can be repeated by someone else.',
    },
    {
      title: 'The Turing Way — Research Data Management',
      url: 'https://the-turing-way.netlify.app/reproducible-research/rdm',
      note: 'Versioning and documenting data so a cleaned file can be traced back to the raw one.',
    },
  ],
  'analysis/describe-data': [
    {
      title: 'OpenIntro Statistics (free textbook)',
      url: 'https://www.openintro.org/',
      note: 'Distributions, means, medians and spread, with the graphs your summary table should match.',
    },
    {
      title: 'NIST/SEMATECH e-Handbook — Measures of scale',
      url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm',
      note: 'Standard deviation, range and when a single summary hides the story.',
    },
    {
      title: 'Australian Bureau of Statistics — statistical terms and concepts',
      url: 'https://www.abs.gov.au/statistics/understanding-statistics/statistical-terms-and-concepts',
      note: 'Definitions that keep the language in your findings exact.',
    },
  ],
  'analysis/choose-test': [
    {
      title: 'UCLA IDRE — What statistical analysis should I use?',
      url: 'https://stats.oarc.ucla.edu/other/mult-pkg/whatstat/',
      note: 'A decision table linking the type of question and variables to a test.',
    },
    {
      title: 'American Statistical Association — statement on p-values',
      url: 'https://www.tandfonline.com/doi/full/10.1080/00031305.2016.1154108',
      note: 'What a p-value does and does not tell a manager.',
    },
    {
      title: 'Catalogue of Bias',
      url: 'https://catalogofbias.org/',
      note: 'The biases that make a statistically significant result misleading.',
    },
  ],
  'analysis/qualitative-synthesis': [
    {
      title: 'Braun & Clarke — Using thematic analysis in psychology',
      url: 'https://www.tandfonline.com/doi/abs/10.1191/1478088706qp063oa',
      note: 'The original six phases of thematic analysis, and the difference between a theme and a topic.',
    },
    {
      title: 'Pope, Ziebland & Mays — Analysing qualitative data (BMJ)',
      url: 'https://www.bmj.com/content/320/7227/114',
      note: 'A short, practical account of indexing, charting and interpreting interview data.',
    },
    {
      title: 'COREQ checklist',
      url: 'https://academic.oup.com/intqhc/article/19/6/349/1791966',
      note: 'What to report about coding and reflexivity so readers can judge how systematic the themes are.',
    },
  ],
  'reporting/report-structure': [
    {
      title: 'EQUATOR Network — reporting guidelines',
      url: 'https://www.equator-network.org/',
      note: 'Pick the checklist that matches your study before writing the first section.',
    },
    {
      title: 'UNICEF Innocenti — Writing a policy brief',
      url: 'https://www.unicef-irc.org/publications/pdf/brief_1_policy_briefs_eng.pdf',
      note: 'A short structure for a decision-maker: problem, options, recommendation.',
    },
    {
      title: 'The Turing Way — Guide for Communication',
      url: 'https://the-turing-way.netlify.app/communication/communication',
      note: 'Turning analysis into something a non-specialist can act on without losing accuracy.',
    },
  ],
  'reporting/write-findings': [
    {
      title: 'American Statistical Association — statement on p-values',
      url: 'https://www.tandfonline.com/doi/full/10.1080/00031305.2016.1154108',
      note: 'How to phrase a result without claiming more than the data supports.',
    },
    {
      title: 'Catalogue of Bias',
      url: 'https://catalogofbias.org/',
      note: 'The claims to avoid: causal language from a design that cannot show cause.',
    },
    {
      title: 'STROBE statement',
      url: 'https://www.strobe-statement.org/',
      note: 'The items an observational findings section must include, so nothing important goes missing.',
    },
  ],
  'reporting/citations': [
    {
      title: 'Purdue OWL — citation resources',
      url: 'https://owl.purdue.edu/owl/research_and_citation/resources.html',
      note: 'How to format a reference in APA, MLA and Chicago, with examples for each source type.',
    },
    {
      title: 'APA Style — citations',
      url: 'https://apastyle.apa.org/style-grammar-guidelines/citations',
      note: 'The official APA rules for in-text citations and the reference list.',
    },
    {
      title: 'Retraction Watch Database',
      url: 'https://retractiondatabase.org/',
      note: 'Check whether a paper you are about to cite has been retracted — before your reader does.',
    },
  ],
  'reporting/review-and-signoff': [
    {
      title: 'Center for Open Science — TOP guidelines',
      url: 'https://www.cos.io/initiatives/top-guidelines',
      note: 'Transparency expectations for the data, code and materials behind a report.',
    },
    {
      title: 'GO FAIR — FAIR principles',
      url: 'https://www.go-fair.org/fair-principles/',
      note: 'What makes the data behind the report findable and reusable by the next team.',
    },
    {
      title: 'The Turing Way — Research Data Management',
      url: 'https://the-turing-way.netlify.app/reproducible-research/rdm',
      note: 'Practical steps for a handover: versioned data, documented code, a re-runnable analysis.',
    },
  ],
};

export const sourcesFor = (trackId: string, lessonId: string): LessonSource[] =>
  SOURCES[`${trackId}/${lessonId}`] ?? [];

/** Every lesson key that has further reading, used by the data tests. */
export const LESSON_SOURCE_KEYS = Object.keys(SOURCES);
