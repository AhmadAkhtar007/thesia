// Faculty workspace (demo): types and illustrative seed data, ported from the
// standalone thesia-faculty.html prototype. Everything is sample content; the
// workspace stores changes in this browser only.

export type FacultyTaskStatus =
  | 'In progress'
  | 'Ready for review'
  | 'Approved'
  | 'AI revision required'
  | 'Changes requested';

export interface FacultyFlag {
  level: 'Critical' | 'Advisory';
  title: string;
  where: string;
  suggestion: string;
  resolved: boolean;
}

export interface FacultyTask {
  id: string;
  /** Project id. */
  p: string;
  /** Student id. */
  s: string;
  title: string;
  due: string;
  status: FacultyTaskStatus;
  /** Submission version number; 0 when nothing has been submitted yet. */
  v: number;
  desc: string;
  /** Latest submitted text. */
  work?: string;
  /** Previous submitted text. */
  previous?: string;
  /** Simulated AI screening summary. */
  summary?: string;
  flags?: FacultyFlag[];
  /** Faculty decision note, set on approval or change request. */
  decision?: string;
  /** Review time in minutes, recorded with the decision. */
  minutes?: number;
}

export interface FacultyProject {
  id: string;
  name: string;
  type: string;
  client: string;
  deadline: string;
  question: string;
  brief: string;
  phase: string;
  students: string[];
}

export interface FacultyStudent {
  id: string;
  name: string;
  field: string;
  role: string;
}

export interface FacultyLog {
  date: string;
  task: string;
  p: string;
  minutes: number;
}

export interface FacultyState {
  profile: string;
  projects: FacultyProject[];
  students: FacultyStudent[];
  tasks: FacultyTask[];
  /** Research-quality checklist progress per project: array of checked indexes. */
  checks: Record<string, number[]>;
  /** Simulated verification record per signed-off project. */
  signed: Record<string, { id: string; by: string }>;
  /** Confirmed student contributions, keyed as `${projectId}:${studentId}`. */
  confirmed: Record<string, boolean>;
  logs: FacultyLog[];
  weeklyCap: number;
}

export const FACULTY_SEED: FacultyState = {
  profile: 'Dr. Sara Ahmed',
  projects: [
    {
      id: 'p1',
      name: 'Consumer Behaviour Study',
      type: 'Industry research',
      client: 'Sample retail company',
      deadline: '2026-11-28',
      question: 'What factors influence repeat purchases among online retail customers?',
      brief: 'Identify the primary retention drivers through a structured survey, literature review and descriptive analysis.',
      phase: 'Analysis',
      students: ['s1', 's2', 's3'],
    },
    {
      id: 'p2',
      name: 'Renewable Energy Adoption',
      type: 'Academic research',
      client: 'Faculty-led study',
      deadline: '2026-12-05',
      question: 'What barriers limit household adoption of rooftop solar?',
      brief: 'Review literature and develop an interview methodology for household energy decision-making.',
      phase: 'Research design',
      students: ['s4', 's5'],
    },
    {
      id: 'p3',
      name: 'Market Entry Analysis',
      type: 'Industry research',
      client: 'Sample technology company',
      deadline: '2026-11-21',
      question: 'Which customer segment is best suited for a new B2B product?',
      brief: 'Compare customer segments and present a defensible recommendation.',
      phase: 'Final report',
      students: ['s6', 's7'],
    },
  ],
  students: [
    { id: 's1', name: 'Ayesha Khan', field: 'Business Analytics', role: 'Investigation' },
    { id: 's2', name: 'Hamza Ali', field: 'Economics', role: 'Formal analysis' },
    { id: 's3', name: 'Mariam Shah', field: 'Computer Science', role: 'Data curation' },
    { id: 's4', name: 'Bilal Ahmad', field: 'Electrical Engineering', role: 'Methodology' },
    { id: 's5', name: 'Fatima Noor', field: 'Environmental Science', role: 'Investigation' },
    { id: 's6', name: 'Omar Hassan', field: 'Management Sciences', role: 'Writing – original draft' },
    { id: 's7', name: 'Zainab Malik', field: 'Economics', role: 'Formal analysis' },
  ],
  tasks: [
    {
      id: 't1',
      p: 'p1',
      s: 's1',
      title: 'Literature review',
      due: '2026-11-15',
      status: 'Ready for review',
      v: 3,
      desc: 'Synthesise relevant evidence on customer retention and identify research gaps.',
      work: 'The literature suggests that repeat purchase intention is influenced by perceived value, trust and service recovery. We propose examining these constructs in a cross-sectional survey. The findings will be interpreted as associations rather than causal relationships.',
      previous: 'The literature proves that perceived value causes repeat purchases. We will survey customers to validate the causal effect.',
      summary: 'The latest version removes unsupported causal language, defines the research constructs and distinguishes association from causality.',
      flags: [
        {
          level: 'Critical',
          title: 'Causal claim overstated',
          where: 'Paragraph 1',
          suggestion: 'Distinguish association from causation in a cross-sectional design.',
          resolved: true,
        },
        {
          level: 'Advisory',
          title: 'Clarify sampling limitations',
          where: 'Methods note',
          suggestion: 'Add a short explanation of how convenience sampling could affect generalisability.',
          resolved: false,
        },
      ],
    },
    {
      id: 't2',
      p: 'p1',
      s: 's2',
      title: 'Survey methodology',
      due: '2026-11-16',
      status: 'Ready for review',
      v: 2,
      desc: 'Design a survey instrument and justify the sample.',
      work: 'The survey uses a five-point Likert scale for trust, satisfaction and purchase intention. We will recruit a convenience sample of 150 respondents and pilot the instrument with 10 participants.',
      previous: 'We will survey 150 respondents using questions on satisfaction and trust.',
      summary: 'The revised instrument now defines response scales and includes a pilot. The proposed sample should be evaluated against the study objectives.',
      flags: [
        {
          level: 'Advisory',
          title: 'Review sample justification',
          where: 'Sampling plan',
          suggestion: 'Justify the target sample given the planned analyses.',
          resolved: false,
        },
      ],
    },
    { id: 't3', p: 'p1', s: 's3', title: 'Clean survey dataset', due: '2026-11-18', status: 'In progress', v: 0, desc: 'Document missing values and remove duplicate records.' },
    { id: 't4', p: 'p1', s: 's2', title: 'Research question and scope', due: '2026-11-10', status: 'Approved', v: 2, desc: 'Define research question and scope.', minutes: 9 },
    {
      id: 't5',
      p: 'p1',
      s: 's1',
      title: 'Interview protocol',
      due: '2026-11-19',
      status: 'AI revision required',
      v: 1,
      desc: 'Draft an interview guide.',
      work: 'Why do you prefer our brand over competitors? How much more would you pay for our superior products?',
      summary: 'Leading questions introduce response bias. Faculty review is blocked until the critical issue is corrected.',
      flags: [
        {
          level: 'Critical',
          title: 'Leading questions',
          where: 'Questions 1–2',
          suggestion: 'Use neutral wording that does not presume preference or superiority.',
          resolved: false,
        },
      ],
    },
    { id: 't6', p: 'p2', s: 's4', title: 'Research design', due: '2026-11-17', status: 'In progress', v: 0, desc: 'Propose a suitable interview methodology.' },
    { id: 't7', p: 'p2', s: 's5', title: 'Background literature', due: '2026-11-12', status: 'Approved', v: 1, minutes: 12, desc: 'Review adoption barriers.' },
    {
      id: 't8',
      p: 'p3',
      s: 's6',
      title: 'Final report',
      due: '2026-11-18',
      status: 'Ready for review',
      v: 4,
      desc: 'Prepare the final market-entry recommendation.',
      work: 'Segment A shows higher stated willingness to pay and a shorter assumed sales cycle. We recommend a limited pilot in Segment A before committing to a broader rollout. Sample limitations and assumptions are documented.',
      previous: 'We recommend immediate full rollout in Segment A.',
      summary: 'The revised report qualifies the recommendation and adds pilot validation and limitations.',
      flags: [
        {
          level: 'Critical',
          title: 'Unsupported certainty',
          where: 'Recommendations',
          suggestion: 'Present a pilot recommendation rather than a definitive market claim.',
          resolved: true,
        },
      ],
    },
    { id: 't9', p: 'p3', s: 's7', title: 'Segment comparison', due: '2026-11-13', status: 'Approved', v: 2, minutes: 16, desc: 'Compare segments using consistent criteria.' },
  ],
  checks: {},
  signed: {},
  confirmed: {},
  logs: [
    { date: '2026-11-11', task: 'Research question and scope', p: 'p1', minutes: 9 },
    { date: '2026-11-12', task: 'Background literature', p: 'p2', minutes: 12 },
    { date: '2026-11-13', task: 'Segment comparison', p: 'p3', minutes: 16 },
  ],
  weeklyCap: 120,
};
