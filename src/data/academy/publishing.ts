import type { Track } from '../../lib/types';

export const publishing: Track = {
  id: 'publishing',
  title: 'Publishing and presenting',
  level: 'Intermediate',
  audience: 'Undergraduate and master’s with a finished project',
  summary: 'Write up your work, pick a legitimate venue, survive peer review, present well and agree authorship fairly.',
  lessons: [
    {
      id: 'imrad',
      title: 'Writing up with IMRaD',
      minutes: 7,
      summary: 'Introduction, Methods, Results and Discussion: the structure most journals expect, and the order to write it in.',
      body: `Most empirical papers follow **IMRaD**: Introduction, Methods, Results and Discussion, with an abstract on top.

## What goes where

- **Introduction:** the problem, what is known, the gap, and your question or aim. End with a clear statement of what this paper does.
- **Methods:** enough detail for someone to repeat the study: design, setting, participants, measures, procedures, analysis, ethics approval.
- **Results:** what you found, without interpretation. Lead with the main result. Use tables and figures, and don’t repeat every number in the text.
- **Discussion:** what the results mean, how they compare with earlier work, limitations, and implications. Don’t claim more than your data supports.
- **Abstract:** 150 to 300 words summarising all four sections. Many readers read only this.

## Write in a different order

Write **Methods** first (you know what you did), then **Results**, then **Discussion**, then the **Introduction**, and the **abstract and title last**. The story becomes clear once the results are written.

## Reporting guidelines

For many study types there is an agreed checklist of what to report, collected by the **EQUATOR Network**: CONSORT for randomised trials, STROBE for observational studies, PRISMA for systematic reviews, COREQ for qualitative interviews and focus groups. Journals often require them. Use them as you write, not after.

## Clear writing

Short sentences. One idea per paragraph, starting with a topic sentence. Define abbreviations once. Prefer active voice where it is clearer: “We interviewed 30 riders” beats “30 riders were interviewed by the researchers”.`,
      takeaways: [
        'Methods should let someone repeat your study.',
        'Write Methods and Results first, the Introduction and abstract last.',
        'Use the EQUATOR reporting checklist for your study type.',
      ],
      quiz: [
        {
          q: 'Where do limitations belong?',
          options: ['Results', 'Discussion', 'Abstract only'],
          answer: 1,
          why: 'The Discussion interprets results, including their limits.',
        },
        {
          q: 'Which checklist fits an observational survey study?',
          options: ['CONSORT', 'STROBE', 'PRISMA'],
          answer: 1,
          why: 'STROBE covers observational designs such as cross-sectional, cohort and case-control studies.',
        },
      ],
    },
    {
      id: 'choosing-a-venue',
      title: 'Choosing a journal or conference, and spotting predatory ones',
      minutes: 8,
      summary: 'Match your work to a legitimate venue and recognise the warning signs of predatory publishers and conferences.',
      tool: '/tools/legit-check',
      body: `Where you publish affects who reads your work and how it’s judged. Predatory outlets take fees and offer little or no real peer review. They target students and early-career researchers, often by email.

## Choosing a legitimate venue

- **Scope:** read the aims and scope and look at recent articles. Would yours fit?
- **Audience:** who reads it? Local practitioners, international researchers, policymakers?
- **Indexing:** is it in Scopus or Web of Science? For open-access journals, is it listed in **DOAJ**?
- **In Pakistan:** HEC’s Journal Recognition System (**HJRS**) categorises journals; check whether your university requires a certain category.
- **Costs and speed:** check article processing charges and typical review times on the journal site.

## Warning signs of a predatory journal

- Flattering, unsolicited emails inviting you to submit, often outside your field.
- Promises of acceptance or peer review in days.
- A very broad scope, such as “all disciplines”.
- Fees that appear only after acceptance, or aren’t stated clearly.
- Made-up metrics (an “impact factor” not from Clarivate) and fake indexing claims.
- Editorial board members who don’t list the journal on their own pages.
- A title that copies a well-known journal’s name.

## Predatory conferences

Some organisers list hundreds of “international conferences” in the same hotel on the same day, across unrelated fields. Real conferences are run by a university, learned society or professional body, have a named programme committee, and publish past proceedings you can find. If a conference claims IEEE sponsorship, check IEEE’s own conference listings.

## Use a checklist

The **Think. Check. Submit.** initiative offers a simple checklist for journals and books. Thesia’s Legit Check tool walks you through these signs and gives you a risk score.`,
      takeaways: [
        'Check scope, audience and indexing (Scopus, Web of Science, DOAJ, HJRS).',
        'Unsolicited invitations and promises of fast acceptance are red flags.',
        'Real conferences have a known host, a named committee and findable past proceedings.',
      ],
      quiz: [
        {
          q: 'An email invites you to publish in “all fields” with peer review in 72 hours. What is this most likely?',
          options: ['A top journal', 'A predatory journal', 'A preprint server'],
          answer: 1,
          why: 'Broad scope, unsolicited invitation and unrealistic review speed are classic warning signs.',
        },
        {
          q: 'How can you verify an open-access journal’s legitimacy?',
          options: ['Check whether it is listed in DOAJ', 'Trust the impact factor on its homepage', 'See if its website looks professional'],
          answer: 0,
          why: 'DOAJ screens open-access journals; homepage metrics can be fabricated.',
        },
      ],
    },
    {
      id: 'peer-review',
      title: 'Peer review and responding to reviewers',
      minutes: 7,
      summary: 'What happens after you submit, and how to write a response that gets your paper accepted.',
      body: `## After you submit

1. The **editor** checks fit and quality. Many papers are rejected here (a *desk rejection*), often within days. That’s normal.
2. If it passes, the editor sends it to two or three **peer reviewers**, usually anonymous experts.
3. Reviewers recommend a decision. The editor decides: **accept**, **minor revisions**, **major revisions** or **reject**.
4. Review can take weeks to months, depending on the field.

Acceptance without any revisions is rare. “Major revisions” is good news: the editor wants to see it again.

## Writing a response letter

- Thank the editor and reviewers briefly.
- Respond to **every** comment, in order. Copy each comment, then write your response beneath it.
- Say exactly what you changed and **where** (page and line, or section).
- If you disagree, do it politely and with evidence. “We respectfully disagree, because…” and cite data or literature.
- If a request is impossible (for example, collecting new data), explain why and address the concern another way, such as adding a limitation.

## After a rejection

Read the reviews, wait a day, then improve the paper using any useful comments and submit to another suitable venue. Most published papers were rejected somewhere first.

## Reviewing others

Once you have published, you may be invited to review. Be specific, kind and constructive, and focus on whether the conclusions follow from the evidence.`,
      takeaways: [
        'Desk rejections and major revisions are normal.',
        'Answer every comment and say exactly what changed and where.',
        'Disagree politely, with evidence.',
      ],
      quiz: [
        {
          q: 'A reviewer asks for an analysis you think is unnecessary. What do you do?',
          options: ['Ignore the comment', 'Explain politely, with evidence, why you didn’t do it, or do it as a supplement', 'Withdraw the paper'],
          answer: 1,
          why: 'Every comment needs a response; reasoned disagreement is acceptable.',
        },
        {
          q: 'What does “major revisions” usually mean?',
          options: ['The paper is rejected', 'The editor will reconsider after substantial changes', 'The paper is accepted as is'],
          answer: 1,
          why: 'It’s an invitation to revise and resubmit.',
        },
      ],
    },
    {
      id: 'posters-and-talks',
      title: 'Posters, talks and conference networking',
      minutes: 6,
      summary: 'Make a poster people stop to read, give a clear short talk, and follow up with the people you meet.',
      body: `## Posters

- Make the **title your main finding**: “Riders who took breaks reported fewer heat symptoms” beats “A study of heat stress”.
- Aim for **300 to 800 words**. Big figures, few words.
- Text should be readable from about two metres away.
- Order sections left to right, top to bottom: question, method, key results, so what.
- Add a QR code to your paper, data or profile.

## Short talks

For a 10-minute talk, plan about 8 slides. A simple structure:

1. Why this matters (one slide)
2. The question
3. What we did
4. The main result (one clear figure)
5. What it means and what’s next

Practise aloud and time yourself. Put the take-home message on the last slide and leave it up during questions.

## Answering questions

Listen to the whole question. Repeat it if the room is large. If you don’t know, say so and offer to follow up. Treat critical questions as free peer review.

## Networking

Prepare a 20-second introduction: who you are, what you work on, and what you’re looking for. Ask people about their work first. Within 48 hours, send a short follow-up email that mentions what you talked about. This is how many students find supervisors and collaborators.`,
      takeaways: [
        'Make the poster title your main finding.',
        'One message per slide; end on the take-home message.',
        'Follow up within 48 hours with the people you meet.',
      ],
      quiz: [
        {
          q: 'Which poster title is stronger?',
          options: ['A Study of Water Quality', 'Half of sampled streams feeding Rawal Lake tested positive for E. coli'],
          answer: 1,
          why: 'It states the main finding, so passers-by learn it in seconds.',
        },
        {
          q: 'You can’t answer a question after your talk. What should you do?',
          options: ['Make up an answer', 'Say you don’t know and offer to follow up', 'Change the subject'],
          answer: 1,
          why: 'Honesty builds credibility, and following up starts a conversation.',
        },
      ],
    },
    {
      id: 'authorship',
      title: 'Authorship and credit',
      minutes: 6,
      summary: 'Who counts as an author, how order is decided, and why you should agree early, in writing.',
      body: `Authorship disputes are among the most common problems in research teams. Most can be prevented by talking early.

## Who is an author?

The International Committee of Medical Journal Editors (**ICMJE**) recommends that authors meet **all four** criteria:

1. Substantial contributions to the conception or design, or to acquiring, analysing or interpreting the data;
2. Drafting the work or revising it critically for important content;
3. Final approval of the version to be published;
4. Agreeing to be accountable for all aspects of the work.

Many fields outside medicine use similar standards. People who helped but don’t meet the criteria, such as someone who collected data only, should be **acknowledged** by name.

## Problems to avoid

- **Gift authorship:** adding someone who didn’t contribute, such as a senior person for prestige.
- **Ghost authorship:** leaving out someone who did substantial work.
- **Coercion:** demanding authorship in exchange for access, data or a signature.

## Author order

Conventions differ. In many sciences the first author did most of the work and the last author supervised; in economics and mathematics, alphabetical order is common. Agree on the order, and how it might change, **at the start**.

## CRediT: say who did what

Journals increasingly publish a **CRediT statement** listing each person’s roles: conceptualization, data curation, formal analysis, investigation, methodology, software, supervision, writing and more. On Thesia every project uses these roles, so your profile shows exactly what you contributed, whether or not you became an author.`,
      takeaways: [
        'Authors meet all four ICMJE criteria; others are acknowledged.',
        'Agree authorship and order in writing at the start.',
        'CRediT roles make every contribution visible.',
      ],
      quiz: [
        {
          q: 'A student collected survey data but didn’t help analyse, write or approve the paper. What is fair?',
          options: ['Automatic first authorship', 'Acknowledgement by name and CRediT role, unless they contribute further', 'No mention'],
          answer: 1,
          why: 'Data collection alone usually doesn’t meet authorship criteria, but it should be credited.',
        },
        {
          q: 'When should a team agree on authorship?',
          options: ['After acceptance', 'At the start, in writing', 'Never; the editor decides'],
          answer: 1,
          why: 'Early agreement prevents most disputes.',
        },
      ],
    },
  ],
};
