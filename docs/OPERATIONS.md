# Running Thesia day to day

Everything below happens in the admin console at `/admin`. It opens only for confirmed admin emails (see `docs/SETUP.md`, step 1). In demo mode the console is open to anyone so the product can be shown, and it only shows what was done in that browser.

## Every morning: the inbox (Admin → Inbox)

Institution enquiries, teaching and ambassador applications, scholarship applications, company challenges, student challenge interest, suggested conferences and labs, country waitlists and feedback all land here.

- Open an item, reply with **Reply by email**, then set its status (New → In progress → Done) and leave a team note.
- **Export CSV** gives you a sheet for the week's follow-ups or a CRM import.
- Promise in the forms: a reply within three working days.

## Onboarding a school or university (Admin → Organisations)

1. After the school signs, **Add an organisation**: name, type, city, seats bought, a programme note (e.g. "Young Researchers Programme, spring 2027").
2. Copy the **invite link** (`/join/<CODE>`) and send it to the school. Students open it, create a free account and join. The page tells them exactly what their coordinator will see.
3. Ask the teacher or ORIC contact to create an account, then enter their email under **Make coordinator**. They get a notification and a dashboard at `/org/<id>`: every student's lessons, tracks, applications, bootcamps and certificates, last-active date, and a CSV export for QA/ORIC/funder reports.
4. Need more seats? Change **Seats** on the organisation row. Joining stops automatically when seats run out.
5. Selling: show prospects the sample dashboard at `/org/sample` (clearly labelled, made-up students).

## Running a bootcamp cohort

**Before it starts (Admin → Enrollments, Admin → Cohorts)**
- Paid seats confirm themselves when Lemon Squeezy reports the payment.
- Approved scholarships and school-funded seats: set the seat to **Confirmed**. The student is notified and their cohort space opens. Free bootcamps (Research Launchpad) open on reservation.
- In **Cohorts**, pick the bootcamp and fill in the live-session link, schedule, materials folder, instructor and an announcement (Markdown). Only students with a seat can see these.

**Each week**
- Students hand in work (a link plus a note) per week in their cohort space at `/bootcamps/<id>/cohort`.
- In **Cohorts → Handed-in work**, write feedback and **Send feedback**. The student is notified. If they edit after feedback, it goes back to "Needs feedback".

**At the end**
- In **Enrollments**, set each finisher to **Completed**. That issues their certificate (with its own verification page and an Add to LinkedIn button) and notifies them.
- Export the enrollments CSV for your records and the instructor's pay.

## Academy certificates

Issued automatically when someone finishes every lesson in a track with at least half of each quiz right. Nothing to do. Anyone can check a certificate at `/certificate/<ID>` or `/certificate/verify`.

## Verifying passports (Admin → People)

Verify a person after checking identity and affiliation (a university email, a faculty page, an ID card for staff). Verified passports show a green mark. Prioritise project leads and mentors, especially anyone working with school students.

## Project leads and contributions

When a lead marks an applicant **Accepted**, they can **Confirm contribution** with the CRediT roles the person held. Those appear on the student's passport as confirmed by the lead. Leads can't apply to or confirm themselves; spot-check leads who confirm many contributions.

## Safeguarding

- Reports arrive by email with "Safeguarding concern" in the subject (from the link in every message thread and on `/safeguarding`). Reply within one working day.
- To suspend an account immediately: in Supabase → Authentication → Users, delete it, or ban it with the Auth admin API (`ban_duration`) if you need to keep the record for an investigation.
- School students' passports are private by design; certificates stay verifiable by ID.

## Weekly numbers (Admin → Overview)

People, new sign-ups, lessons, applications, seats by status, revenue, organisations, top referrers (for the ambassador programme), top universities and countries. Use the same numbers in NIC and investor updates.
