import type { Project } from '../lib/types';

// Sample projects for the beta. They show the kinds of work researchers post on Thesia and are
// labelled "Sample" everywhere in the interface. Replace them with real postings at launch.

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'smog-asthma-lahore',
    title: 'Winter smog and asthma visits in Lahore',
    summary: 'Link daily PM2.5 readings to hospital outpatient asthma visits across three winters.',
    description: `Every winter Lahore's air quality drops to hazardous levels, but we have little local evidence on how much each smog day adds to hospital load. This project builds a daily time series of PM2.5 (from public monitors) and outpatient asthma visits (from two partner hospitals, de-identified) for November to February, 2023–2026.

**What we will do**
- Clean and merge monitor data with weather controls.
- Estimate the lagged effect of PM2.5 on visits with a distributed-lag model.
- Write a short policy brief alongside the paper.

**What you will learn:** time-series data cleaning, distributed-lag models in R, and how hospital data is handled ethically.`,
    fields: ['public-health', 'environment'],
    tags: ['air pollution', 'PM2.5', 'asthma', 'time series', 'R', 'Lahore', 'smog'],
    levels: ['undergrad', 'masters'],
    city: 'Lahore',
    country: 'Pakistan',
    mode: 'hybrid',
    hoursPerWeek: 6,
    durationWeeks: 12,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'data-curation', title: 'Air-quality data curator', description: 'Pull and clean monitor data, document every decision in a log.', spots: 2, skills: ['Excel', 'R or Python', 'Attention to detail'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Analysis assistant', description: 'Run distributed-lag models with the lead and check robustness.', spots: 1, skills: ['R', 'Regression', 'Statistics'] },
      { id: 'r3', credit: 'writing-draft', title: 'Policy brief writer', description: 'Turn findings into a two-page brief for city officials.', spots: 1, skills: ['Writing', 'Public health'] },
    ],
    lead: { name: 'Ayesha Rehman', handle: 'ayesha-r', affiliation: 'PhD candidate, environmental health' },
    ethics: 'approved',
    credit: 'Authorship follows contribution: contributors who meet journal criteria are co-authors; everyone is listed with their CRediT role.',
    applyBy: '2026-10-31',
    startDate: '2026-11-10',
    status: 'open',
    createdAt: '2026-09-28',
    isSample: true,
  },
  {
    id: 'saraiki-asr',
    title: 'Speech recognition for Saraiki and Punjabi dialects',
    summary: 'Build an open dataset and fine-tune a speech model for under-served Pakistani languages.',
    description: `Most speech recognition tools work poorly for Saraiki and regional Punjabi. We are recording consented speech from volunteers across South Punjab, transcribing it, and fine-tuning an open-source speech model. The dataset will be released openly for other researchers.

**What we will do**
- Collect 40 hours of consented, transcribed speech.
- Fine-tune and evaluate an open speech model (word error rate by dialect).
- Publish the dataset with a datasheet describing who is represented.

**What you will learn:** dataset design, consent for speech data, model fine-tuning and evaluation.`,
    fields: ['cs-ai', 'humanities'],
    tags: ['NLP', 'speech recognition', 'Saraiki', 'Punjabi', 'low-resource languages', 'Python', 'dataset'],
    levels: ['undergrad', 'masters'],
    city: 'Multan',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 5,
    durationWeeks: 16,
    compensation: 'stipend',
    stipend: 'PKR 15,000 per month for transcribers',
    roles: [
      { id: 'r1', credit: 'data-curation', title: 'Transcriber (Saraiki speaker)', description: 'Transcribe recordings using our guidelines; flag unclear audio.', spots: 6, skills: ['Saraiki', 'Urdu script', 'Typing'] },
      { id: 'r2', credit: 'software', title: 'ML research assistant', description: 'Fine-tune and evaluate models; keep experiments reproducible.', spots: 2, skills: ['Python', 'PyTorch', 'Git'] },
      { id: 'r3', credit: 'investigation', title: 'Field recording coordinator', description: 'Organise consented recording sessions in your town.', spots: 2, skills: ['Organising', 'Saraiki or Punjabi'] },
    ],
    lead: { name: 'Hamza Khalid', handle: 'hamza-k', affiliation: 'Lecturer, Computer Science' },
    ethics: 'approved',
    credit: 'Dataset contributors are named in the dataset release; research assistants who meet authorship criteria co-author the paper.',
    applyBy: '2026-11-15',
    startDate: '2026-12-01',
    status: 'open',
    createdAt: '2026-10-02',
    isSample: true,
  },
  {
    id: 'glof-gilgit',
    title: 'Mapping glacial lakes in Gilgit-Baltistan from satellite imagery',
    summary: 'Track how fast glacial lakes are growing and which villages sit downstream.',
    description: `Glacial lake outburst floods (GLOFs) threaten communities across Gilgit-Baltistan and Chitral. Using free Sentinel-2 imagery, we map lake area every year since 2017 and overlay settlements and roads downstream.

**What we will do**
- Delineate lakes with NDWI and manual checks.
- Build a growth-rate table and flag fast-growing lakes.
- Share a public map with local disaster-management offices.

**What you will learn:** remote sensing with Google Earth Engine, GIS, and communicating risk responsibly.`,
    fields: ['environment', 'engineering'],
    tags: ['GLOF', 'glaciers', 'remote sensing', 'GIS', 'climate', 'Earth Engine', 'Gilgit-Baltistan'],
    levels: ['undergrad', 'masters'],
    city: 'Islamabad',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 6,
    durationWeeks: 14,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Lake mapper', description: 'Delineate lakes year by year and record uncertainty.', spots: 3, skills: ['GIS', 'QGIS or Earth Engine'] },
      { id: 'r2', credit: 'visualization', title: 'Map and figure designer', description: 'Make the public map and paper figures.', spots: 1, skills: ['Cartography', 'Design'] },
      { id: 'r3', credit: 'validation', title: 'Accuracy checker', description: 'Cross-check a sample of lakes against high-resolution imagery.', spots: 1, skills: ['Remote sensing', 'Patience'] },
    ],
    lead: { name: 'Dr. Sana Mirza', handle: 'sana-m', affiliation: 'Assistant professor, remote sensing' },
    ethics: 'not-required',
    credit: 'Co-authorship for substantial contributors; all contributors credited on the public map.',
    applyBy: '2026-11-05',
    startDate: '2026-11-20',
    status: 'open',
    createdAt: '2026-09-30',
    isSample: true,
  },
  {
    id: 'microfinance-women-south-punjab',
    title: 'Microfinance and women-led home businesses in South Punjab',
    summary: 'Interviews and repayment records to understand what helps women’s home businesses grow.',
    description: `Microfinance loans to women in South Punjab are often used for household needs rather than the business. We combine anonymised repayment records from a partner lender with 40 in-depth interviews to understand what helps loans turn into growing businesses.

**What we will do**
- Conduct and transcribe interviews in Urdu and Saraiki.
- Code interviews thematically with a shared codebook.
- Link themes to repayment patterns.

**What you will learn:** qualitative interviewing, thematic analysis, mixed-methods design and research ethics with vulnerable groups.`,
    fields: ['economics', 'social'],
    tags: ['microfinance', 'women', 'qualitative', 'interviews', 'thematic analysis', 'mixed methods', 'South Punjab'],
    levels: ['undergrad', 'masters'],
    city: 'Bahawalpur',
    country: 'Pakistan',
    mode: 'hybrid',
    hoursPerWeek: 8,
    durationWeeks: 10,
    compensation: 'paid',
    stipend: 'PKR 2,500 per completed interview',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Field interviewer', description: 'Conduct consented interviews with women entrepreneurs.', spots: 4, skills: ['Urdu', 'Saraiki', 'Interviewing', 'Empathy'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Qualitative coder', description: 'Code transcripts with the team codebook in NVivo or Taguette.', spots: 2, skills: ['Thematic analysis', 'Careful reading'] },
    ],
    lead: { name: 'Usman Tariq', handle: 'usman-t', affiliation: 'Research associate, development economics' },
    ethics: 'approved',
    credit: 'Interviewers and coders are acknowledged by name and CRediT role; authorship by contribution.',
    applyBy: '2026-10-25',
    startDate: '2026-11-03',
    status: 'open',
    createdAt: '2026-09-22',
    isSample: true,
  },
  {
    id: 'heat-riders-karachi',
    title: 'Heat stress among Karachi’s delivery riders',
    summary: 'A student-led study measuring heat exposure and symptoms in motorbike delivery workers.',
    description: `Delivery riders spend long hours on the road during Karachi’s heatwaves. This student-led study surveys riders about symptoms, hydration and breaks, and logs on-road temperature with low-cost sensors for a subgroup.

**What we will do**
- Survey 300 riders with a validated heat-symptom questionnaire.
- Log temperature for 30 riders over two weeks.
- Share practical recommendations with delivery companies.

**What you will learn:** occupational health survey design, sensor data, and turning research into workplace change.`,
    fields: ['public-health'],
    tags: ['heat', 'occupational health', 'gig workers', 'survey', 'sensors', 'Karachi', 'climate'],
    levels: ['undergrad'],
    city: 'Karachi',
    country: 'Pakistan',
    mode: 'onsite',
    hoursPerWeek: 6,
    durationWeeks: 10,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Survey enumerator', description: 'Interview riders at hubs; follow the consent script.', spots: 6, skills: ['Urdu', 'Confidence', 'Mobile survey apps'] },
      { id: 'r2', credit: 'data-curation', title: 'Sensor data lead', description: 'Set up loggers and clean temperature data.', spots: 1, skills: ['Excel', 'Python', 'Hardware basics'] },
    ],
    lead: { name: 'Omar Farooq', handle: 'omar-f', affiliation: 'MBBS final year (student lead)' },
    ethics: 'in-review',
    credit: 'Student team co-authors the paper; faculty supervisor listed for supervision.',
    applyBy: '2026-11-01',
    startDate: '2026-11-15',
    status: 'open',
    createdAt: '2026-10-04',
    isSample: true,
  },
  {
    id: 'amr-poultry-faisalabad',
    title: 'Antibiotic resistance in poultry farms near Faisalabad',
    summary: 'Sample poultry farms and test E. coli isolates for resistance to common antibiotics.',
    description: `Antibiotics are widely used in Pakistani poultry, often without veterinary supervision. We collect samples from 30 farms, isolate E. coli, and test resistance patterns, alongside a short farmer questionnaire on antibiotic use.

**What we will do**
- Collect and process samples with biosafety procedures.
- Run disk diffusion tests and record results.
- Link resistance to reported antibiotic use.

**What you will learn:** microbiology lab techniques, biosafety, and One Health research.`,
    fields: ['biology', 'agriculture', 'public-health'],
    tags: ['AMR', 'antibiotic resistance', 'microbiology', 'poultry', 'One Health', 'lab work', 'Faisalabad'],
    levels: ['undergrad', 'masters'],
    city: 'Faisalabad',
    country: 'Pakistan',
    mode: 'onsite',
    hoursPerWeek: 10,
    durationWeeks: 12,
    compensation: 'course-credit',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Lab assistant', description: 'Process samples and run susceptibility tests under supervision.', spots: 3, skills: ['Microbiology lab', 'Biosafety'] },
      { id: 'r2', credit: 'data-curation', title: 'Data manager', description: 'Maintain the sample register and results database.', spots: 1, skills: ['Excel', 'Record keeping'] },
    ],
    lead: { name: 'Zainab Hussain', handle: 'zainab-h', affiliation: 'MPhil Microbiology' },
    ethics: 'approved',
    credit: 'Contributors listed by CRediT role; authorship by contribution.',
    applyBy: '2026-11-10',
    startDate: '2026-11-24',
    status: 'open',
    createdAt: '2026-09-26',
    isSample: true,
  },
  {
    id: 'textbook-gender',
    title: 'How gender appears in Punjab school textbooks',
    summary: 'A content analysis of Grade 1–8 textbooks: who is shown, doing what, and how often.',
    description: `Textbooks shape what children think is normal. We code every image and named character in Grade 1–8 English, Urdu and General Knowledge textbooks for gender, role and setting, and compare editions over time.

**What we will do**
- Build and test a coding scheme with inter-rater reliability checks.
- Code all textbooks in pairs.
- Publish the coded dataset openly.

**What you will learn:** content analysis, reliability statistics (Cohen’s kappa), and education policy. Good first project: no prior experience needed.`,
    fields: ['education', 'social'],
    tags: ['gender', 'textbooks', 'content analysis', 'education policy', 'beginner friendly', 'Punjab'],
    levels: ['high-school', 'undergrad'],
    city: 'Remote',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 3,
    durationWeeks: 8,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Textbook coder', description: 'Code images and characters using the scheme, in pairs.', spots: 10, skills: ['Careful reading', 'Urdu', 'English'] },
      { id: 'r2', credit: 'validation', title: 'Reliability checker', description: 'Calculate agreement between coders and resolve disagreements.', spots: 1, skills: ['Excel', 'Basic statistics'] },
    ],
    lead: { name: 'Saima Akhtar', affiliation: 'Schoolteacher and M.Ed researcher' },
    ethics: 'not-required',
    credit: 'All coders named in the dataset; substantial contributors co-author.',
    applyBy: '2026-11-20',
    startDate: '2026-12-01',
    status: 'open',
    createdAt: '2026-10-05',
    isSample: true,
  },
  {
    id: 'rawal-water',
    title: 'Citizen science water-quality map of the Rawal Lake catchment',
    summary: 'Test stream water monthly with simple kits and build an open map of pollution hotspots.',
    description: `Rawal Lake supplies drinking water to Rawalpindi, but the streams feeding it pass through growing settlements. School and university volunteers test water monthly (pH, turbidity, nitrates, E. coli presence) at fixed points and upload results to an open map.

**What we will do**
- Train volunteers to sample safely and consistently.
- Test 20 sites monthly for six months.
- Publish an open dataset and a public map.

**What you will learn:** field sampling, quality control in citizen science, and data mapping. Open to high-school students with a guardian’s consent.`,
    fields: ['environment', 'chemistry'],
    tags: ['water quality', 'citizen science', 'Rawal Lake', 'field sampling', 'high school', 'mapping'],
    levels: ['high-school', 'undergrad'],
    city: 'Islamabad',
    country: 'Pakistan',
    mode: 'onsite',
    hoursPerWeek: 3,
    durationWeeks: 24,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Field sampler', description: 'Collect and test samples at assigned sites each month.', spots: 12, skills: ['Reliability', 'Outdoor fieldwork'] },
      { id: 'r2', credit: 'visualization', title: 'Map maintainer', description: 'Update the open map after each sampling round.', spots: 1, skills: ['Google Sheets', 'Basic GIS'] },
    ],
    lead: { name: 'Twin Cities Water Watch', affiliation: 'Volunteer science club' },
    ethics: 'not-required',
    credit: 'Every volunteer credited on the dataset and map.',
    applyBy: '2026-12-15',
    startDate: '2027-01-05',
    status: 'open',
    createdAt: '2026-10-06',
    isSample: true,
  },
  {
    id: 'mobile-money-peshawar',
    title: 'Why small shopkeepers in Peshawar do or don’t use mobile money',
    summary: 'Survey 250 kiryana stores on digital payment adoption, trust and costs.',
    description: `Digital payments are growing fast in Pakistan, but many small shops still prefer cash. We survey 250 shopkeepers across Peshawar on adoption, fees, trust and customer demand, and test which factors predict adoption.

**What we will do**
- Pilot and run a structured survey.
- Analyse adoption with logistic regression.
- Share findings with fintech and policy audiences.

**What you will learn:** sampling small businesses, survey fieldwork and logistic regression.`,
    fields: ['business', 'economics'],
    tags: ['fintech', 'mobile money', 'digital payments', 'small business', 'survey', 'Peshawar'],
    levels: ['undergrad'],
    city: 'Peshawar',
    country: 'Pakistan',
    mode: 'onsite',
    hoursPerWeek: 5,
    durationWeeks: 8,
    compensation: 'paid',
    stipend: 'PKR 300 per completed survey',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Survey enumerator', description: 'Interview shopkeepers in assigned markets.', spots: 5, skills: ['Pashto', 'Urdu', 'Survey apps'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Analysis assistant', description: 'Clean data and run the regression models.', spots: 1, skills: ['Stata or R', 'Regression'] },
    ],
    lead: { name: 'Imran Shah', affiliation: 'Lecturer, business studies' },
    ethics: 'approved',
    credit: 'Authorship by contribution; enumerators acknowledged by name.',
    applyBy: '2026-10-28',
    startDate: '2026-11-05',
    status: 'open',
    createdAt: '2026-09-20',
    isSample: true,
  },
  {
    id: 'xai-retinopathy',
    title: 'Explainable AI for diabetic retinopathy screening on local images',
    summary: 'Test whether public retinopathy models work on images from Pakistani clinics, and explain their errors.',
    description: `Models trained on Western datasets may fail on images from local cameras and patients. With an eye hospital partner, we evaluate open models on de-identified local images and use saliency methods to understand failure cases.

**What we will do**
- Evaluate three open models against ophthalmologist labels.
- Analyse failures with Grad-CAM and error categories.
- Fine-tune on a local subset and re-evaluate.

**What you will learn:** medical imaging evaluation, explainability methods and dataset shift.`,
    fields: ['cs-ai', 'public-health'],
    tags: ['medical imaging', 'explainable AI', 'diabetic retinopathy', 'deep learning', 'dataset shift', 'Python'],
    levels: ['undergrad', 'masters'],
    city: 'Islamabad',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 8,
    durationWeeks: 16,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'software', title: 'Deep learning assistant', description: 'Run evaluations and fine-tuning experiments.', spots: 2, skills: ['Python', 'PyTorch', 'Computer vision'] },
      { id: 'r2', credit: 'validation', title: 'Reproducibility checker', description: 'Re-run experiments from the logs and confirm results.', spots: 1, skills: ['Git', 'Python'] },
    ],
    lead: { name: 'Faisal Nawaz', handle: 'faisal-n', affiliation: 'MS Data Science' },
    ethics: 'approved',
    credit: 'Authorship by contribution; code contributors listed in the repository.',
    applyBy: '2026-11-12',
    startDate: '2026-11-25',
    status: 'open',
    createdAt: '2026-10-01',
    isSample: true,
  },
  {
    id: 'student-help-seeking',
    title: 'Mental health help-seeking among university students in Islamabad',
    summary: 'A survey and focus groups on why students do or don’t use campus counselling.',
    description: `Many universities now have counsellors, but few students use them. We survey students at four universities on stigma, awareness and barriers, then run focus groups to understand the results.

**What we will do**
- Run a validated help-seeking attitudes survey.
- Hold six focus groups with trained facilitators.
- Recommend changes to counselling services.

**What you will learn:** psychology research ethics, validated scales, focus-group facilitation and mixed methods. All team members complete safeguarding training before fieldwork.`,
    fields: ['psychology', 'public-health', 'education'],
    tags: ['mental health', 'students', 'help-seeking', 'survey', 'focus groups', 'Islamabad'],
    levels: ['undergrad', 'masters'],
    city: 'Islamabad',
    country: 'Pakistan',
    mode: 'hybrid',
    hoursPerWeek: 5,
    durationWeeks: 12,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Survey coordinator', description: 'Distribute the survey at your campus and track responses.', spots: 4, skills: ['Organising', 'Communication'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Focus-group analyst', description: 'Transcribe and code focus groups.', spots: 2, skills: ['Qualitative analysis', 'Urdu', 'English'] },
    ],
    lead: { name: 'Dr. Hira Qureshi', handle: 'hira-q', affiliation: 'Clinical psychologist and lecturer' },
    ethics: 'approved',
    credit: 'Authorship by contribution; all contributors listed with CRediT roles.',
    applyBy: '2026-11-08',
    startDate: '2026-11-18',
    status: 'open',
    createdAt: '2026-09-29',
    isSample: true,
  },
  {
    id: 'solar-net-metering',
    title: 'Does rooftop solar still pay off after net-metering changes?',
    summary: 'Model household payback periods for rooftop solar under old and new tariff rules.',
    description: `Rooftop solar has boomed in Pakistan, and net-metering rules have been changing. We collect real bills and system quotes from 120 households and model payback periods under different tariff scenarios.

**What we will do**
- Collect bills and installation quotes with consent.
- Build a transparent payback model in a spreadsheet and Python.
- Publish a calculator households can use.

**What you will learn:** energy economics, financial modelling and communicating uncertainty.`,
    fields: ['engineering', 'economics', 'environment'],
    tags: ['solar', 'net metering', 'energy policy', 'financial modelling', 'households', 'Python', 'Excel'],
    levels: ['undergrad', 'masters'],
    city: 'Lahore',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 5,
    durationWeeks: 10,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'data-curation', title: 'Household data collector', description: 'Collect bills and quotes from households in your city.', spots: 6, skills: ['Communication', 'Spreadsheets'] },
      { id: 'r2', credit: 'methodology', title: 'Model builder', description: 'Build and document the payback model.', spots: 1, skills: ['Excel', 'Python', 'Finance basics'] },
    ],
    lead: { name: 'Dr. Kamran Yousaf', affiliation: 'Energy policy researcher' },
    ethics: 'not-required',
    credit: 'Authorship by contribution; data collectors acknowledged by name.',
    applyBy: '2026-11-18',
    startDate: '2026-12-01',
    status: 'open',
    createdAt: '2026-10-03',
    isSample: true,
  },
  {
    id: 'psl-toss',
    title: 'Does winning the toss matter in the PSL?',
    summary: 'A beginner-friendly sports statistics project using every Pakistan Super League match.',
    description: `Commentators say the toss decides matches at some grounds. We collect ball-by-ball data for every PSL match and test whether toss winners win more often, and whether it depends on the ground, dew, or batting first.

**What we will do**
- Build a clean match dataset from public scorecards.
- Test the toss effect with simple statistics, then logistic regression.
- Write a short paper and a public explainer.

**What you will learn:** data collection, hypothesis testing and logistic regression, on a topic you already care about.`,
    fields: ['physics-math'],
    tags: ['statistics', 'cricket', 'sports analytics', 'beginner friendly', 'hypothesis testing', 'R', 'Python'],
    levels: ['high-school', 'undergrad'],
    city: 'Remote',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 3,
    durationWeeks: 8,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'data-curation', title: 'Scorecard data collector', description: 'Enter and check match data from public scorecards.', spots: 4, skills: ['Spreadsheets', 'Cricket knowledge'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Stats analyst', description: 'Run tests and models with the lead.', spots: 2, skills: ['Statistics', 'R or Python'] },
    ],
    lead: { name: 'Fatima Zahra', handle: 'fatima-z', affiliation: 'BS Statistics (student lead)' },
    ethics: 'not-required',
    credit: 'Student team co-authors; all contributors credited.',
    applyBy: '2026-11-25',
    startDate: '2026-12-05',
    status: 'open',
    createdAt: '2026-10-07',
    isSample: true,
  },
  {
    id: 'predatory-awareness',
    title: 'How well do early-career researchers in Pakistan spot predatory journals?',
    summary: 'A national survey testing whether researchers can tell predatory outlets from legitimate ones.',
    description: `Predatory journals and conferences charge fees without real peer review, and they target early-career researchers. We show participants real journal and conference invitations and ask them to judge which are legitimate, then test whether training changes their answers.

**What we will do**
- Build a set of real, anonymised invitations with known status.
- Survey 500 researchers across universities.
- Test a short training module in a randomised design.

**What you will learn:** survey experiments, randomisation, and meta-research.`,
    fields: ['education', 'social'],
    tags: ['predatory journals', 'meta-research', 'research integrity', 'survey experiment', 'randomised'],
    levels: ['undergrad', 'masters', 'phd'],
    city: 'Remote',
    country: 'Pakistan',
    mode: 'remote',
    hoursPerWeek: 4,
    durationWeeks: 12,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'methodology', title: 'Instrument designer', description: 'Help build and test the invitation set and questionnaire.', spots: 2, skills: ['Survey design', 'Research integrity'] },
      { id: 'r2', credit: 'project-admin', title: 'University outreach lead', description: 'Recruit participants at your university.', spots: 6, skills: ['Communication', 'Networking'] },
    ],
    lead: { name: 'Thesia Research Desk', affiliation: 'Thesia' },
    ethics: 'in-review',
    credit: 'Authorship by contribution; outreach leads acknowledged.',
    applyBy: '2026-11-30',
    startDate: '2026-12-10',
    status: 'open',
    createdAt: '2026-10-08',
    isSample: true,
  },
  {
    id: 'sylhet-floods-schooling',
    title: 'Flood displacement and children’s schooling in Sylhet',
    summary: 'Track how repeated floods affect school attendance and dropout in north-east Bangladesh.',
    description: `Sylhet division has faced severe floods in recent years. We combine school attendance records with household interviews to measure how displacement affects learning, and which supports help children return.

**What we will do**
- Collect attendance records from partner schools.
- Interview 120 households in Bangla and Sylheti.
- Analyse attendance before and after flood events.

**What you will learn:** education research in emergencies, panel data and fieldwork ethics.`,
    fields: ['education', 'environment', 'social'],
    tags: ['floods', 'climate', 'education', 'displacement', 'Bangladesh', 'panel data'],
    levels: ['undergrad', 'masters'],
    city: 'Sylhet',
    country: 'Bangladesh',
    mode: 'hybrid',
    hoursPerWeek: 6,
    durationWeeks: 12,
    compensation: 'stipend',
    stipend: 'BDT 6,000 per month for field roles',
    roles: [
      { id: 'r1', credit: 'investigation', title: 'Household interviewer', description: 'Interview families in Bangla or Sylheti.', spots: 4, skills: ['Bangla', 'Sylheti', 'Interviewing'] },
      { id: 'r2', credit: 'formal-analysis', title: 'Panel data analyst (remote)', description: 'Analyse attendance data; open to students anywhere.', spots: 1, skills: ['Stata or R', 'Panel data'] },
    ],
    lead: { name: 'Nusrat Jahan', handle: 'nusrat-j', affiliation: 'Research officer, education' },
    ethics: 'approved',
    credit: 'Authorship by contribution; field team acknowledged.',
    applyBy: '2026-11-14',
    startDate: '2026-12-01',
    status: 'open',
    createdAt: '2026-10-02',
    isSample: true,
  },
  {
    id: 'naija-pidgin-corpus',
    title: 'A sentiment corpus for Nigerian Pidgin',
    summary: 'Build an open, annotated dataset of Nigerian Pidgin text for sentiment analysis.',
    description: `Nigerian Pidgin is spoken by tens of millions of people but has few NLP resources. We collect public text, annotate sentiment with native speakers, and release the corpus with baseline models.

**What we will do**
- Write annotation guidelines and train annotators.
- Annotate 20,000 sentences with agreement checks.
- Train and publish baseline models.

**What you will learn:** annotation project design, agreement metrics and NLP baselines. Remote, open to students worldwide.`,
    fields: ['cs-ai', 'humanities'],
    tags: ['NLP', 'Nigerian Pidgin', 'sentiment analysis', 'annotation', 'low-resource languages', 'dataset'],
    levels: ['undergrad', 'masters'],
    city: 'Lagos',
    country: 'Nigeria',
    mode: 'remote',
    hoursPerWeek: 4,
    durationWeeks: 12,
    compensation: 'unpaid',
    roles: [
      { id: 'r1', credit: 'data-curation', title: 'Annotator (Pidgin speaker)', description: 'Label sentences following the guidelines.', spots: 8, skills: ['Nigerian Pidgin', 'Careful reading'] },
      { id: 'r2', credit: 'software', title: 'Baseline model builder', description: 'Train and evaluate baseline classifiers; open to non-speakers.', spots: 2, skills: ['Python', 'NLP', 'Transformers'] },
    ],
    lead: { name: 'Chiamaka Okafor', handle: 'chiamaka-o', affiliation: 'MSc Linguistics' },
    ethics: 'not-required',
    credit: 'Annotators named in the dataset; authorship by contribution.',
    applyBy: '2026-11-22',
    startDate: '2026-12-01',
    status: 'open',
    createdAt: '2026-10-05',
    isSample: true,
  },
];
