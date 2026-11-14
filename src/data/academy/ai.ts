import type { Track } from '../../lib/types';

export const aiTrack: Track = {
  id: 'ai',
  title: 'AI in research, responsibly',
  level: 'Intermediate',
  audience: 'Anyone using AI tools in their research',
  summary: 'Use AI to work faster without fabricated citations, leaked data or undisclosed shortcuts.',
  lessons: [
    {
      id: 'ai-without-fooling-yourself',
      title: 'Using AI without fooling yourself',
      minutes: 8,
      summary: 'Where AI genuinely helps, where it goes wrong, and the rules journals now expect you to follow.',
      body: `AI assistants can speed up research. They can also produce confident nonsense. The difference is how you use them.

## Where AI helps

- Brainstorming search terms and synonyms.
- Explaining a method or statistical test you don’t understand yet.
- Summarising a paper **you then read yourself**.
- Debugging code and suggesting cleaner approaches.
- Improving the clarity of your own writing, especially in a second language.

## Where it goes wrong

- **Fabricated references.** Language models can invent papers, authors and DOIs that look real. Check every citation in a database before you use it.
- **Plausible errors.** Summaries can miss caveats or reverse a finding.
- **Out-of-date knowledge.** Models may not know recent work.
- **Bias.** Outputs can reflect gaps in what the model was trained on, including less coverage of research from the Global South.

## Rules to follow

- **Never paste participants’ personal or confidential data** into a public AI tool.
- **Verify** every fact, number and citation against the original source.
- **Disclose** your use of AI. Many journals now require a statement saying which tools you used and for what.
- **AI is not an author.** Publishers and the Committee on Publication Ethics (COPE) agree that AI tools can’t take responsibility for work, so they can’t be listed as authors.
- **Check your university’s policy** on AI in coursework and theses.

## A safe workflow

Think first, then ask AI for options, then check and decide yourself. Keep a short log of how you used AI so you can disclose it accurately later.`,
      takeaways: [
        'Verify every citation: AI can invent references.',
        'Never share participant data with public AI tools.',
        'Disclose AI use; AI can’t be an author.',
      ],
      quiz: [
        {
          q: 'An AI tool gives you five references. What do you do?',
          options: ['Paste them into your reference list', 'Look each one up in a database and read it before citing', 'Use only the first one'],
          answer: 1,
          why: 'Language models can fabricate convincing references.',
        },
        {
          q: 'Can an AI tool be listed as a co-author?',
          options: ['Yes, if it wrote a lot', 'No, it can’t take responsibility for the work', 'Only in conference papers'],
          answer: 1,
          why: 'Authorship requires accountability, which AI tools can’t provide.',
        },
      ],
    },
    {
      id: 'ai-literature-search',
      title: 'AI-assisted literature search, checked by hand',
      minutes: 6,
      summary: 'Combine AI discovery tools with database searches, and document what you did.',
      body: `AI-powered discovery tools can find related papers quickly. Some show a map of papers connected by citations; others answer a question with sentences drawn from papers. **Semantic Scholar**, for example, is a free search engine that adds short AI summaries to many papers.

## Use them for discovery, not as the final word

1. Start with a clear question and keywords.
2. Use an AI discovery tool to find candidate papers and related work you missed.
3. Run a **structured search** in at least one database (Google Scholar, PubMed, Scopus or a field database) so you are not relying on one tool’s ranking.
4. Read the abstracts yourself and screen against your inclusion criteria.
5. Read the full text of every paper you plan to cite.

## Check AI answers against the source

If a tool says “Study X found Y”, open study X and find the sentence. Look for the numbers, the population and the limitations. Summaries often drop the conditions that matter.

## Document your search

Write down which tools and databases you used, the search terms, the date, and how many results you screened. This makes your review reproducible and makes disclosure easy.`,
      takeaways: [
        'AI tools are good for discovery; databases are still needed for a structured search.',
        'Open the source for every claim before citing it.',
        'Record tools, terms and dates for reproducibility.',
      ],
      quiz: [
        {
          q: 'An AI tool summarises a study’s finding. Before citing it, you should…',
          options: ['Cite the summary', 'Open the paper and confirm the finding, population and limits', 'Ask the tool again'],
          answer: 1,
          why: 'Summaries can drop conditions or misstate results.',
        },
      ],
    },
  ],
};
