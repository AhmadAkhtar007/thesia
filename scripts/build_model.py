"""Builds the Thesia three-year financial model (Excel) with live formulas.

python3 scripts/build_model.py  ->  docs/Thesia-Financial-Model.xlsx
"""
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = "docs/Thesia-Financial-Model.xlsx"
FONT = "Arial"
BLUE = Font(name=FONT, color="0000FF")
BLACK = Font(name=FONT, color="000000")
GREEN = Font(name=FONT, color="008000")
BOLD = Font(name=FONT, bold=True)
TITLE = Font(name=FONT, bold=True, size=14)
HEAD = Font(name=FONT, bold=True, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="1D2856")
SECTION_FILL = PatternFill("solid", fgColor="EEF3FA")
KEY_FILL = PatternFill("solid", fgColor="FFFF00")
THIN = Side(style="thin", color="B9C6DC")
USD = '$#,##0;($#,##0);"-"'
INT = '#,##0;(#,##0);"-"'
PCT = '0.0%;(0.0%);"-"'
DEC = '0.00;(0.00);"-"'

wb = Workbook()

# ---------------------------------------------------------------- Read me
rm = wb.active
rm.title = "Read me"
rows = [
    ("Thesia: three-year financial model (Q1 2027 to Q4 2029)", TITLE),
    ("Prepared October 2026 for NIC applications and investor conversations. All figures in US dollars.", None),
    ("", None),
    ("How to use", BOLD),
    ("1. Change inputs only on the Assumptions sheet. Blue text = an input you can change. Yellow fill = a key assumption to validate first.", None),
    ("2. Pick a scenario in Assumptions!C5: 1 = Low, 2 = Base, 3 = High. It scales sign-ups, paid conversion and B2B sales.", None),
    ("3. Model recalculates by quarter; Summary rolls it up by year and shows when $100K ARR is reached.", None),
    ("", None),
    ("Colour legend", BOLD),
    ("Blue text: hardcoded input   |   Black text: formula   |   Green text: link to another sheet   |   Yellow fill: key assumption", None),
    ("", None),
    ("Revenue streams", BOLD),
    ("Scholar Pro subscriptions (B2C, recurring)  |  Live bootcamps (B2C, per cohort)  |  Young Researchers Programme for schools (B2B, recurring)", None),
    ("University and research-office licences (B2B, recurring)  |  Industry research challenges (B2B, per challenge)", None),
    ("Prices are list prices in USD, multiplied by a fair-pricing factor for the buyer's country income group (Pakistan = 0.30).", None),
    ("", None),
    ("ARR definition", BOLD),
    ("Recurring ARR = (Pro + school programme + university licence revenue in the quarter) x 4. Bootcamps and challenges are excluded from ARR.", None),
    ("", None),
    ("Status of the numbers", BOLD),
    ("These are planning assumptions for a pre-revenue beta, not results. Each input has a note saying where it comes from or what would validate it.", None),
    ("External facts used: Lemon Squeezy fee 5% + $0.50 per transaction (lemonsqueezy.com/pricing, checked 8 Oct 2026); Polygence Core from $2,895 (Immerse Education guide 2026);", None),
    ("~1.96M university students in Pakistan in 2024-25 (Gallup Pakistan via ProPakistani, 24 Jun 2026); NIC Karachi Orbit grants up to PKR 5M (yespress.io).", None),
]
for i, (text, font) in enumerate(rows, start=1):
    c = rm.cell(row=i, column=1, value=text)
    c.font = font or Font(name=FONT)
rm.column_dimensions["A"].width = 150

# ---------------------------------------------------------------- Assumptions
A = wb.create_sheet("Assumptions")
A.column_dimensions["A"].width = 46
for col in "BCDE":
    A.column_dimensions[col].width = 14
A.column_dimensions["F"].width = 90
A["A1"] = "Assumptions"
A["A1"].font = TITLE
A["A2"] = "Blue cells are inputs. Per-year inputs apply to every quarter of that year."
A["A2"].font = Font(name=FONT, italic=True)

names = {}  # name -> absolute reference string for scalar; for per-year: (row)
r = 4


def section(title):
    global r
    r += 1
    A.cell(row=r, column=1, value=title).font = BOLD
    for c in range(1, 7):
        A.cell(row=r, column=c).fill = SECTION_FILL
    r += 1


def year_header():
    global r
    for c, t in zip(range(3, 6), ["2027", "2028", "2029"]):
        cell = A.cell(row=r, column=c, value=t)
        cell.font = BOLD
        cell.alignment = Alignment(horizontal="center")
    A.cell(row=r, column=6, value="Source or rationale").font = BOLD
    r += 1


def scalar(name, label, value, fmt, note, key=False):
    global r
    A.cell(row=r, column=1, value=label).font = Font(name=FONT)
    c = A.cell(row=r, column=3, value=value)
    c.font = BLUE
    c.number_format = fmt
    if key:
        c.fill = KEY_FILL
    A.cell(row=r, column=6, value=note).font = Font(name=FONT, size=9)
    names[name] = f"Assumptions!$C${r}"
    r += 1


def per_year(name, label, values, fmt, note, key=False):
    global r
    A.cell(row=r, column=1, value=label).font = Font(name=FONT)
    for i, v in enumerate(values):
        c = A.cell(row=r, column=3 + i, value=v)
        c.font = BLUE
        c.number_format = fmt
        if key:
            c.fill = KEY_FILL
    A.cell(row=r, column=6, value=note).font = Font(name=FONT, size=9)
    names[name] = f"Assumptions!$C${r}:$E${r}"
    r += 1


A["A4"] = "Scenario"
A["A4"].font = BOLD
A["A5"] = "Scenario (1 Low, 2 Base, 3 High)"
A["C5"] = 2
A["C5"].font = BLUE
A["C5"].fill = KEY_FILL
A["F5"] = "Switch scenarios to test sensitivity."
names["scenario"] = "Assumptions!$C$5"
A["A6"] = "Scenario multipliers"
A["A6"].font = BOLD
for c, t in zip(range(3, 6), ["Low", "Base", "High"]):
    A.cell(row=6, column=c, value=t).font = BOLD
A["A7"] = "Sign-up volume multiplier"
A["A8"] = "Paid conversion multiplier"
for c, v in zip(range(3, 6), [0.7, 1.0, 1.3]):
    A.cell(row=7, column=c, value=v).font = BLUE
    A.cell(row=7, column=c).number_format = DEC
for c, v in zip(range(3, 6), [0.7, 1.0, 1.3]):
    A.cell(row=8, column=c, value=v).font = BLUE
    A.cell(row=8, column=c).number_format = DEC
A["A9"] = "B2B sales multiplier (schools, universities, challenges, cohorts)"
for c, v in zip(range(3, 6), [0.7, 1.0, 1.3]):
    A.cell(row=9, column=c, value=v).font = BLUE
    A.cell(row=9, column=c).number_format = DEC
A["F7"] = "Low/High = 30% below/above Base."
names["scen_signup"] = "INDEX(Assumptions!$C$7:$E$7,Assumptions!$C$5)"
names["scen_conv"] = "INDEX(Assumptions!$C$8:$E$8,Assumptions!$C$5)"
names["scen_b2b"] = "INDEX(Assumptions!$C$9:$E$9,Assumptions!$C$5)"
r = 10

section("Students and reach")
scalar("start_registered", "Registered students at end of Q4 2026", 1500, INT,
       "Beta launch target through campus ambassadors, Buraaq and student societies. Validate with real sign-ups by Dec 2026.", key=True)
scalar("new_q1", "New sign-ups in Q1 2027", 2000, INT,
       "~0.1% of Pakistan's ~1.96M university students (Gallup Pakistan, 2026) plus school students.", key=True)
year_header()
per_year("signup_growth", "Quarter-on-quarter growth in new sign-ups", [0.30, 0.20, 0.15], PCT,
         "Word of mouth, ambassadors in 30+ universities, and 2028-29 expansion to Bangladesh, Nigeria and Kenya.", key=True)
per_year("active_rate", "Share of registered students active each quarter", [0.30, 0.30, 0.30], PCT,
         "Typical for education communities; tracked in the beta as quarterly active users.")
per_year("mix_pk", "Share of buyers in Pakistan", [0.85, 0.70, 0.55], PCT, "Pakistan-first launch, then other countries.")
per_year("mix_low", "Share of buyers in other lower-income countries", [0.10, 0.20, 0.30], PCT, "Country leads in South Asia and Africa from mid-2027.")
per_year("mix_high", "Share of buyers in upper-middle and high-income countries", [0.05, 0.10, 0.15], PCT, "Diaspora and international students joining remote projects.")

section("Fair pricing multipliers (share of list price paid)")
scalar("mult_pk", "Pakistan (lower-middle income)", 0.30, DEC, "Thesia pricing tier C; matches src/lib/pricing.ts.")
scalar("mult_low", "Other lower-income countries (blend of tiers C and D)", 0.25, DEC, "Average of 0.30 and 0.20.")
scalar("mult_high", "Upper-middle and high income (blend of tiers A and B)", 0.80, DEC, "Average of 1.00 and 0.60.")

section("Scholar Pro subscription")
scalar("pro_price", "List price per year ($)", 72, USD, "Same as the in-app price ($8/month or $72/year before fair pricing).")
year_header()
per_year("pro_conv", "Active students paying for Pro", [0.02, 0.03, 0.04], PCT,
         "Freemium education apps commonly convert 2-5% of active users. Validate with a Pro waitlist in the beta.", key=True)

section("Live bootcamps")
scalar("seats", "Seats per cohort", 25, INT, "Small cohorts for live teaching.")
scalar("fill", "Share of seats filled", 0.80, PCT, "Assumption.")
scalar("bc_price", "Average list price per seat ($)", 150, USD, "Average of paid bootcamps ($79 to $249 list) in src/data/bootcamps.ts.")
scalar("schol_share", "Share of seats on scholarship", 0.20, PCT, "Need-based seats.")
scalar("schol_disc", "Average scholarship discount", 0.60, PCT, "Scholarships cover 25-100% of the fee.")
scalar("instructor", "Instructor fee per cohort ($)", 500, USD, "Pakistani researcher rates; validate with 3-5 instructors.")
year_header()
per_year("cohorts", "Paid cohorts per quarter", [3, 5, 7], INT, "Seven bootcamp formats; more cohorts as demand grows.", key=True)

section("Young Researchers Programme (schools)")
scalar("school_students", "Students per school cohort", 30, INT, "One class or club per cohort.")
scalar("school_cohorts", "Cohorts per school per year", 2, INT, "One per term.")
scalar("school_price", "List price per student ($)", 149, USD, "In-app list price; schools in Pakistan pay 30% = about $44.")
scalar("school_cost", "Mentor delivery cost per school cohort ($)", 400, USD, "Two mentors for 8 weeks.")
scalar("school_churn", "Schools lost per quarter", 0.03, PCT, "About 12% a year.")
year_header()
per_year("new_schools", "New partner schools per quarter", [2, 4, 6], INT,
         "Beaconhouse-tier schools; fees there are Rs 28,500-38,500/month, so ~$44 per student per term is a small add-on (YSRS brief).", key=True)

section("University and research-office licences")
scalar("uni_price", "Licence per university per year ($)", 1800, USD, "About PKR 500,000. Validate with 2-3 ORICs.", key=True)
scalar("uni_churn", "Universities lost per quarter", 0.02, PCT, "Annual contracts; low churn.")
year_header()
per_year("new_unis", "New licensed universities per quarter", [1, 3, 4], INT, "Start with universities where Thesia has ambassadors.")

section("Industry research challenges")
scalar("chal_fee", "Fee per challenge ($)", 1500, USD, "Covers recruitment, supervision and ethics; prize money is passed through separately.")
scalar("chal_cost", "Supervision cost (share of fee)", 0.30, PCT, "Paid to a faculty supervisor.")
year_header()
per_year("challenges", "Challenges per quarter", [1, 3, 5], INT, "Pakistani firms, NGOs and development partners.")

section("Operating costs (per month unless stated)")
scalar("pay_pct", "Payment processing: percentage of B2C revenue", 0.065, PCT,
       "Lemon Squeezy 5% + $0.50 per transaction (lemonsqueezy.com/pricing, 8 Oct 2026), plus 1.5% allowance for international card fees.")
scalar("pay_fixed", "Payment processing: fixed fee per transaction ($)", 0.50, '$0.00', "Lemon Squeezy.")
scalar("ai_cost", "AI guide cost per active student per quarter ($)", 0.05, '$0.00', "Claude Haiku answers with a 10-question daily cap; most students ask a few questions a quarter.")
year_header()
per_year("hosting", "Hosting and software ($/month)", [100, 300, 800], USD, "Supabase, Vercel, email, domain.")
per_year("team", "Team ($/month)", [1500, 5000, 12000], USD, "2027 part-time ops and content; 2028 two full-time; 2029 six people across countries.", key=True)
per_year("marketing", "Marketing and ambassadors ($/month)", [300, 1500, 4000], USD, "Campus events, ambassador stipends, social content.")
per_year("other", "Legal, accounting and events ($/month)", [150, 400, 800], USD, "Company registration (SECP), audit, showcase events.")

section("Funding (cash in, by quarter)")
scalar("start_cash", "Cash at start of Q1 2027 ($)", 0, USD, "Bootstrapped beta.")
fund_row = r
A.cell(row=r, column=1, value="Quarter").font = BOLD
quarters = [f"Q{q} {y}" for y in (2027, 2028, 2029) for q in (1, 2, 3, 4)]
r += 1
A.cell(row=r, column=1, value="Grants and investment ($)")
fund_values = [0, 18000, 0, 0, 150000, 0, 0, 0, 0, 0, 0, 0]
# Lay out 12 quarters across two rows of the sheet for readability: labels row + values row in columns B..M
for i, (qn, v) in enumerate(zip(quarters, fund_values)):
    A.cell(row=fund_row, column=2 + i, value=qn).font = BOLD
    c = A.cell(row=r, column=2 + i, value=v)
    c.font = BLUE
    c.number_format = USD
    c.fill = KEY_FILL if v else PatternFill()
    A.column_dimensions[get_column_letter(2 + i)].width = max(A.column_dimensions[get_column_letter(2 + i)].width or 10, 12)
names["funding"] = f"Assumptions!$B${r}:$M${r}"
A.cell(row=r + 1, column=1, value="Q2 2027: milestone grant of about PKR 5M (e.g. NIC Karachi Orbit offers up to PKR 5M). Q1 2028: pre-seed round. Both are targets, not commitments.").font = Font(name=FONT, size=9)
r += 3
A.freeze_panes = "B4"

# ---------------------------------------------------------------- Model
M = wb.create_sheet("Model")
M.column_dimensions["A"].width = 44
M.column_dimensions["B"].width = 10
FIRST, LAST = 3, 14  # columns C..N
for c in range(FIRST, LAST + 1):
    M.column_dimensions[get_column_letter(c)].width = 13
M["A1"] = "Quarterly model"
M["A1"].font = TITLE
M.cell(row=2, column=1, value="Quarter").font = HEAD
M.cell(row=3, column=1, value="Year").font = BOLD
M.cell(row=4, column=1, value="Year index").font = Font(name=FONT, color="808080")
for i in range(12):
    col = FIRST + i
    h = M.cell(row=2, column=col, value=quarters[i])
    h.font = HEAD
    h.alignment = Alignment(horizontal="center")
    M.cell(row=3, column=col, value=str(2027 + i // 4)).alignment = Alignment(horizontal="center")
    M.cell(row=4, column=col, value=i // 4 + 1).font = Font(name=FONT, color="808080")
for col in range(1, LAST + 1):
    M.cell(row=2, column=col).fill = HEAD_FILL

mrow = {}
cur = 5


def L(c):
    return get_column_letter(c)


def yr(name, c):
    return f"INDEX({names[name]},{L(c)}$4)"


def add(key, label, formula_fn, fmt, bold=False, section_title=None, note=None):
    """formula_fn(col) -> formula string without '='."""
    global cur
    if section_title:
        cur += 1
        cell = M.cell(row=cur, column=1, value=section_title)
        cell.font = BOLD
        for c in range(1, LAST + 1):
            M.cell(row=cur, column=c).fill = SECTION_FILL
        cur += 1
    mrow[key] = cur  # set first so a row can refer to its own previous quarter
    M.cell(row=cur, column=1, value=label).font = BOLD if bold else Font(name=FONT)
    if note:
        M.cell(row=cur, column=1).comment = Comment(note, "Thesia model")
    for c in range(FIRST, LAST + 1):
        cell = M.cell(row=cur, column=c, value="=" + formula_fn(c))
        cell.number_format = fmt
        cell.font = BOLD if bold else BLACK
    mrow[key] = cur
    cur += 1


def ref(key, c):
    return f"{L(c)}{mrow[key]}"


def prev(key, c):
    return f"{L(c - 1)}{mrow[key]}"


# Students
add("new", "New sign-ups", lambda c: f"{names['new_q1']}*{names['scen_signup']}" if c == FIRST else f"{prev('new', c)}*(1+{yr('signup_growth', c)})", INT, section_title="Students")
add("reg", "Registered students (end of quarter)", lambda c: f"{names['start_registered']}+{ref('new', c)}" if c == FIRST else f"{prev('reg', c)}+{ref('new', c)}", INT, bold=True)
add("active", "Active students", lambda c: f"{ref('reg', c)}*{yr('active_rate', c)}", INT)
add("blend", "Blended fair-pricing multiplier", lambda c: f"{yr('mix_pk', c)}*{names['mult_pk']}+{yr('mix_low', c)}*{names['mult_low']}+{yr('mix_high', c)}*{names['mult_high']}", DEC,
    note="Average share of list price paid, weighted by where buyers live.")

# Pro
add("pro_subs", "Scholar Pro subscribers", lambda c: f"{ref('active', c)}*{yr('pro_conv', c)}*{names['scen_conv']}", INT, section_title="Scholar Pro")
add("rev_pro", "Pro revenue ($)", lambda c: f"{ref('pro_subs', c)}*{names['pro_price']}*{ref('blend', c)}/4", USD)

# Bootcamps
add("cohorts", "Paid cohorts", lambda c: f"{yr('cohorts', c)}*{names['scen_b2b']}", DEC, section_title="Live bootcamps")
add("bc_seats", "Paid seats", lambda c: f"{ref('cohorts', c)}*{names['seats']}*{names['fill']}", INT)
add("rev_bc", "Bootcamp revenue ($)", lambda c: f"{ref('bc_seats', c)}*{names['bc_price']}*{ref('blend', c)}*(1-{names['schol_share']}*{names['schol_disc']})", USD)

# Schools
add("schools", "Active partner schools", lambda c: f"{yr('new_schools', c)}*{names['scen_b2b']}" if c == FIRST else f"{prev('schools', c)}*(1-{names['school_churn']})+{yr('new_schools', c)}*{names['scen_b2b']}", DEC, section_title="Young Researchers Programme (schools)")
add("rev_school", "School programme revenue ($)", lambda c: f"{ref('schools', c)}*{names['school_cohorts']}*{names['school_students']}*{names['school_price']}*{names['mult_pk']}/4", USD)

# Universities
add("unis", "Licensed universities", lambda c: f"{yr('new_unis', c)}*{names['scen_b2b']}" if c == FIRST else f"{prev('unis', c)}*(1-{names['uni_churn']})+{yr('new_unis', c)}*{names['scen_b2b']}", DEC, section_title="University licences")
add("rev_uni", "Licence revenue ($)", lambda c: f"{ref('unis', c)}*{names['uni_price']}/4", USD)

# Challenges
add("chal", "Industry challenges", lambda c: f"{yr('challenges', c)}*{names['scen_b2b']}", DEC, section_title="Industry research challenges")
add("rev_chal", "Challenge revenue ($)", lambda c: f"{ref('chal', c)}*{names['chal_fee']}", USD)

# Revenue totals
add("rev_total", "Total revenue ($)", lambda c: f"{ref('rev_pro', c)}+{ref('rev_bc', c)}+{ref('rev_school', c)}+{ref('rev_uni', c)}+{ref('rev_chal', c)}", USD, bold=True, section_title="Revenue")
add("arr", "Recurring ARR ($)", lambda c: f"({ref('rev_pro', c)}+{ref('rev_school', c)}+{ref('rev_uni', c)})*4", USD, bold=True,
    note="Pro + schools + licences, annualised. Excludes bootcamps and challenges.")
add("runrate", "Annualised revenue run-rate, all streams ($)", lambda c: f"{ref('rev_total', c)}*4", USD)

# Costs
add("c_pay", "Payment processing ($)", lambda c: f"({ref('rev_pro', c)}+{ref('rev_bc', c)})*{names['pay_pct']}+({ref('pro_subs', c)}/4+{ref('bc_seats', c)})*{names['pay_fixed']}", USD, section_title="Direct costs")
add("c_inst", "Instructors ($)", lambda c: f"{ref('cohorts', c)}*{names['instructor']}", USD)
add("c_school", "School delivery ($)", lambda c: f"{ref('schools', c)}*{names['school_cohorts']}/4*{names['school_cost']}", USD)
add("c_chal", "Challenge supervision ($)", lambda c: f"{ref('rev_chal', c)}*{names['chal_cost']}", USD)
add("c_ai", "AI guide ($)", lambda c: f"{ref('active', c)}*{names['ai_cost']}", USD)
add("c_host", "Hosting and software ($)", lambda c: f"{yr('hosting', c)}*3", USD)
add("c_direct", "Total direct costs ($)", lambda c: f"SUM({L(c)}{mrow['c_pay']}:{L(c)}{mrow['c_host']})", USD, bold=True)
add("gross", "Gross profit ($)", lambda c: f"{ref('rev_total', c)}-{ref('c_direct', c)}", USD, bold=True)
add("gm", "Gross margin", lambda c: f"IF({ref('rev_total', c)}=0,0,{ref('gross', c)}/{ref('rev_total', c)})", PCT)

add("c_team", "Team ($)", lambda c: f"{yr('team', c)}*3", USD, section_title="Operating costs")
add("c_mkt", "Marketing and ambassadors ($)", lambda c: f"{yr('marketing', c)}*3", USD)
add("c_other", "Legal, accounting and events ($)", lambda c: f"{yr('other', c)}*3", USD)
add("opex", "Total operating costs ($)", lambda c: f"{ref('c_team', c)}+{ref('c_mkt', c)}+{ref('c_other', c)}", USD, bold=True)
add("ebitda", "Operating profit (loss) ($)", lambda c: f"{ref('gross', c)}-{ref('opex', c)}", USD, bold=True)

add("fund", "Grants and investment ($)", lambda c: f"INDEX({names['funding']},{c - FIRST + 1})", USD, section_title="Cash")
add("cash", "Cash at end of quarter ($)", lambda c: f"{names['start_cash']}+{ref('ebitda', c)}+{ref('fund', c)}" if c == FIRST else f"{prev('cash', c)}+{ref('ebitda', c)}+{ref('fund', c)}", USD, bold=True)

# Funding row links in green
for c in range(FIRST, LAST + 1):
    M.cell(row=mrow["fund"], column=c).font = GREEN
M.freeze_panes = "C5"

# ---------------------------------------------------------------- Summary
S = wb.create_sheet("Summary", 1)
S.column_dimensions["A"].width = 46
for col in "BCD":
    S.column_dimensions[col].width = 16
S["A1"] = "Summary by year"
S["A1"].font = TITLE
S["A2"] = "=\"Scenario: \"&CHOOSE(Assumptions!$C$5,\"Low\",\"Base\",\"High\")"
S["A2"].font = GREEN
for c, y in zip(range(2, 5), ["2027", "2028", "2029"]):
    h = S.cell(row=4, column=c, value=y)
    h.font = HEAD
    h.fill = HEAD_FILL
    h.alignment = Alignment(horizontal="center")
S.cell(row=4, column=1, value="").fill = HEAD_FILL

srow = 5
yr_range = f"Model!$C$3:$N$3"


def ssum(label, key, fmt=USD, bold=False):
    global srow
    S.cell(row=srow, column=1, value=label).font = BOLD if bold else Font(name=FONT)
    for c in range(2, 5):
        cell = S.cell(row=srow, column=c, value=f"=SUMIF({yr_range},{get_column_letter(c)}$4,Model!$C${mrow[key]}:$N${mrow[key]})")
        cell.number_format = fmt
        cell.font = Font(name=FONT, color="008000", bold=bold)
    srow += 1


def send(label, key, fmt=USD, bold=False):
    """Value at the last quarter of each year."""
    global srow
    S.cell(row=srow, column=1, value=label).font = BOLD if bold else Font(name=FONT)
    for c, mcol in zip(range(2, 5), ["F", "J", "N"]):
        cell = S.cell(row=srow, column=c, value=f"=Model!{mcol}{mrow[key]}")
        cell.number_format = fmt
        cell.font = Font(name=FONT, color="008000", bold=bold)
    srow += 1


def shead(t):
    global srow
    srow += 1
    S.cell(row=srow, column=1, value=t).font = BOLD
    for c in range(1, 5):
        S.cell(row=srow, column=c).fill = SECTION_FILL
    srow += 1


shead("Revenue ($)")
first_rev = srow
ssum("Scholar Pro", "rev_pro")
ssum("Bootcamps", "rev_bc")
ssum("Schools programme", "rev_school")
ssum("University licences", "rev_uni")
ssum("Industry challenges", "rev_chal")
last_rev = srow - 1
ssum("Total revenue", "rev_total", bold=True)
total_rev_row = srow - 1
ssum("Gross profit", "gross")
S.cell(row=srow, column=1, value="Gross margin")
for c in range(2, 5):
    L_ = get_column_letter(c)
    cell = S.cell(row=srow, column=c, value=f"=IF({L_}{total_rev_row}=0,0,{L_}{srow - 1}/{L_}{total_rev_row})")
    cell.number_format = PCT
srow += 1
ssum("Operating costs", "opex")
ssum("Operating profit (loss)", "ebitda", bold=True)

shead("End of year")
send("Recurring ARR ($)", "arr", bold=True)
arr_row = srow - 1
send("Registered students", "reg", INT)
send("Active students", "active", INT)
send("Scholar Pro subscribers", "pro_subs", INT)
send("Partner schools", "schools", DEC)
send("Licensed universities", "unis", DEC)
send("Cash ($)", "cash", USD, bold=True)

shead("Milestones")
S.cell(row=srow, column=1, value="First quarter with recurring ARR of $100K or more")
S.cell(row=srow, column=2, value=f'=IFERROR(INDEX(Model!$C$2:$N$2,MATCH(TRUE,INDEX(Model!$C${mrow["arr"]}:$N${mrow["arr"]}>=100000,0),0)),"Not reached")').font = Font(name=FONT, bold=True)
S.cell(row=srow, column=2).fill = KEY_FILL
srow += 1
S.cell(row=srow, column=1, value="Lowest cash balance over the period ($)")
c = S.cell(row=srow, column=2, value=f"=MIN(Model!$C${mrow['cash']}:$N${mrow['cash']})")
c.number_format = USD
srow += 1
S.cell(row=srow, column=1, value="Recurring share of revenue in 2029")
c = S.cell(row=srow, column=2, value=f"=IF(D{total_rev_row}=0,0,(D{first_rev}+D{first_rev + 2}+D{first_rev + 3})/D{total_rev_row})")
c.number_format = PCT
srow += 1
S.cell(row=srow, column=1, value="Marketing spend per new sign-up, 2028 ($)")
c = S.cell(row=srow, column=2, value=f"=SUMIF({yr_range},\"2028\",Model!$C${mrow['c_mkt']}:$N${mrow['c_mkt']})/SUMIF({yr_range},\"2028\",Model!$C${mrow['new']}:$N${mrow['new']})")
c.number_format = '$0.00'
srow += 2

# Charts: revenue by stream per year (stacked) and recurring ARR by quarter
cats = Reference(S, min_col=2, max_col=4, min_row=4, max_row=4)
chart = BarChart()
chart.type = "col"
chart.grouping = "stacked"
chart.overlap = 100
chart.title = "Revenue by stream ($)"
for rr in range(first_rev, last_rev + 1):
    chart.add_data(Reference(S, min_col=1, max_col=4, min_row=rr, max_row=rr), from_rows=True, titles_from_data=True)
chart.set_categories(cats)
chart.height = 8
chart.width = 16
S.add_chart(chart, "F4")

line = LineChart()
line.title = "Recurring ARR by quarter ($)"
line.add_data(Reference(M, min_col=FIRST, max_col=LAST, min_row=mrow["arr"], max_row=mrow["arr"]), from_rows=True, titles_from_data=False)
line.set_categories(Reference(M, min_col=FIRST, max_col=LAST, min_row=2, max_row=2))
line.legend = None
line.height = 8
line.width = 16
S.add_chart(line, "F21")

for ws in (A, M, S):
    for row in ws.iter_rows():
        for cell in row:
            if cell.font and cell.font.name != FONT:
                f = cell.font
                cell.font = Font(name=FONT, bold=f.bold, italic=f.italic, color=f.color, size=f.size)

wb.save(OUT)
print("saved", OUT, "rows:", mrow)
