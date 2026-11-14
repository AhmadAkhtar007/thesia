import { Markdown, PageHead } from '../components/ui';
import { CONTACT_EMAIL } from '../lib/config';

const PRIVACY = `**Last updated: 8 October 2026.** Thesia is in beta, and this policy will be updated as the service grows.

## What we collect

- **Account details:** your email address and, if you choose, a password. Passwords are handled by our authentication provider and never stored by us in readable form.
- **What you add to your passport:** name, level, affiliation, city, country, fields, skills, headline, bio and links.
- **Activity:** projects you post, applications you send, items you save, lessons you complete and bootcamp seats you reserve.
- **Things you send us:** suggestions, enquiries, scholarship applications and waitlist sign-ups.

We don’t sell your data, and we don’t show advertising.

## Who can see what

- Your **research passport** is public by default, so labs and project leads can see it. You can make it private at any time.
- An **application** is visible to you and to the lead of the project you applied to.
- Saved items, lesson progress and scholarship applications are **private** to you and the Thesia team.

## Services we use

We use trusted providers to run Thesia: Supabase for our database and sign-in, Vercel for hosting, a payment provider for card payments (we never see your card number), and Anthropic’s API for the research guide. Questions you send to the guide are processed to produce an answer; don’t include other people’s personal data in them.

## Young people

Students aged 13 to 17 may use Thesia with the knowledge of a parent or guardian. Projects involving participants under 18 must have guardian consent and ethics approval. Thesia is not for children under 13.

## Your choices

You can edit or delete your profile information at any time. To export or delete your account and data, email ${CONTACT_EMAIL} and we’ll do it within 30 days.

## Contact

Questions about privacy: ${CONTACT_EMAIL}.`;

const TERMS = `**Last updated: 8 October 2026.** Thesia is in beta. By using it, you agree to these terms.

## Using Thesia

Use your real name and accurate information. Be respectful in applications and messages. Don’t post spam, harassment or anything illegal.

## Research integrity

Everyone on Thesia agrees to do honest research. That means no fabricated or falsified data, no plagiarism, and following the ethics, consent and data-protection rules of each project. Breaking these rules can lead to removal.

## Posting projects

If you post a project, you are responsible for it: describing roles accurately, obtaining ethics approval where people are involved, protecting participants and their data, paying any promised stipends, and crediting contributors fairly using their CRediT roles. Thesia doesn’t employ contributors and isn’t a party to the arrangement between project leads and contributors.

## Listings

We check conferences, labs and programmes against official sources, but details change. Always confirm dates and requirements on the official site. Thesia isn’t responsible for third-party events or programmes.

## Paid services

Prices are shown in US dollars and adjusted by country. Bootcamps are refundable in full until the second session. Scholar Pro can be cancelled at any time and remains active until the end of the paid period. Payments are processed by our payment provider under its terms.

## No guarantees

Thesia helps you find opportunities and build skills. We can’t guarantee admission, employment, publication, funding or any other outcome.

## Your content

You own what you post. You allow Thesia to display it on the service so others can find and use it as intended.

## Changes and contact

We may update these terms and will tell you about significant changes. These terms are governed by the laws of Pakistan. Contact: ${CONTACT_EMAIL}.`;

export function Privacy() {
  return (
    <div className="wrap wrap-narrow page">
      <PageHead title="Privacy" />
      <Markdown source={PRIVACY} />
    </div>
  );
}

export function Terms() {
  return (
    <div className="wrap wrap-narrow page">
      <PageHead title="Terms of use" />
      <Markdown source={TERMS} />
    </div>
  );
}
