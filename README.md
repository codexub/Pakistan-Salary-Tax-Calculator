# Pakistan Salary Tax Estimator

A single-page calculator for **salaried individuals in Pakistan**. You enter your taxable salary, and it shows:
- your annual income tax and average monthly tax;
- your annual and average monthly income after income tax;
- a 13-step breakdown with the actual numbers substituted, each step tied to the law it comes from.

It covers **FY 2025-26 (Tax Year 2026)** and **FY 2026-27 (Tax Year 2027)** and runs entirely in your browser.

**Live site:** https://pk-salary-tax-calculator.netlify.app · **Source:** https://github.com/codexub/Pakistan-Salary-Tax-Calculator

**Who it serves:** a salaried employee planning a budget or comparing a salary offer who wants to know what they actually keep after income tax, and why.

**Why I chose it** (in my words): "What's better than to have an in depth salary tax calculator for Pakistani Residents, that they understand each break down of their and how the finalized amount being made up in accordance with Pakistani Laws. So, I believe, it's a general need for every job person, in order to have a better understanding of their take home salary."

## Stack

- **React 19.3.0** with **JavaScript/JSX**: function components and the built-in `useReducer` / `useRef`
- **Plain CSS**: custom properties, Grid/Flexbox, media queries; no CSS framework
- **Vite 8.3.4** with @vitejs/plugin-react 6.1.2, for development and production builds
- **Vitest 5.0.3**, jsdom 30.1.2 and Testing Library for tests
- No backend, accounts, API keys or paid services. The only runtime dependencies are `react` and `react-dom`.

## What it does

- Choose the financial year; each option shows its dates and tax-year label.
- Enter monthly or annual **taxable** salary in PKR. Commas in international (`1,200,000`) or lakh (`12,00,000`) style are accepted, with up to 2 decimal places.
- Main result: **annual tax payable**, rounded to the nearest rupee under s.219 of the Income Tax Ordinance. Supporting results: average monthly tax, annual and monthly income after tax, and annual taxable income.
- Expandable **Calculation details**, with the formula and actual numbers for each step:
  1. annualisation;
  2. slab and threshold;
  3. base tax;
  4. income above the threshold;
  5. marginal rate;
  6. marginal tax;
  7. Division I tax;
  8. surcharge basis and amount, or why none applies;
  9. tax before rounding;
  10. s.219 rounding to tax payable;
  11. average monthly tax;
  12. annual income after tax;
  13. monthly income after tax.
- Each legal step links to the official FBR document. Zero-tax cases and display rounding are explained.
- Expandable **Official sources and assumptions**: the year's full slab table with "Your slab" marked, the surcharge rule, the supported range, and the FBR documents.
- Clear inline errors; any edit clears the previous result; Reset.
- **Privacy:** nothing is stored, and nothing is sent. Production builds include a Content-Security-Policy with `connect-src 'none'`.

### Not covered

- **Exemptions and allowances:** enter taxable salary after exempt allowances.
- **Tax credits and rebates:** charitable donations, pension contributions, and the teacher/researcher rebate (which ended after Tax Year 2025).
- Zakat and other deductible allowances.
- Business, freelance, rental, capital-gains or foreign income.
- Pensions, and arrears taxed at earlier years' rates.
- Payslip withholding schedules (s.149). Results are annual liability, not a payslip reconciliation.
- Tax-return preparation.
- **Super tax (s.4C).** Instead of computing it, the app refuses amounts above the supported range: **Rs 150,000,000** a year for Tax Year 2026 and **Rs 500,000,000** for Tax Year 2027.

### Financial-year and tax-year labels

| Financial year | Dates | Tax year |
|---|---|---|
| FY 2025-26 | 1 July 2025 – 30 June 2026 | Tax Year 2026 |
| FY 2026-27 (default) | 1 July 2026 – 30 June 2027 | Tax Year 2027 |

## Tax sources and assumptions

The law was verified on **2026-10-09** against enacted primary sources; details, page references and file checksums are in [docs/tax-rules.md](docs/tax-rules.md).

- **Finance Act, 2025** (Act No. XIX of 2025) and **Finance Act, 2026** (Act No. XLIII of 2026), from the FBR site.
- **Income Tax Ordinance, 2001,** FBR consolidations amended up to 31.07.2025, 20.02.2026 and 30.06.2026.
- FBR Circulars No. 01 of 2025-26 and No. 02 of 2026-27, plus the withholding rate cards for Tax Years 2026 and 2027. These were used only to corroborate the law.
- [taxcalculator.pk](https://taxcalculator.pk/) was used only for comparison, not as authority.

Key rules applied:
- The salaried slab table (First Schedule, Part I, Division I, clause (2)): 6 slabs for Tax Year 2026 and 8 for Tax Year 2027.
- **Tax Year 2026:** a 9% surcharge on the whole Division I tax when taxable income exceeds Rs 10,000,000, with no marginal relief.
- **Tax Year 2027:** no surcharge for salaried individuals.
- s.219 rounding to the nearest rupee.

Assumptions:
- Input is taxable salary after exempt allowances, and salary is the person's only income.
- Monthly input is multiplied by 12, assuming the same salary every month.
- Annual input may include taxable bonuses.
- Monthly figures are averages (annual ÷ 12).
- "Income after income tax" excludes other payroll deductions such as EOBI, provident fund, Zakat and loan repayments.

Known legal caveats are listed in tax-rules.md §F:
- "no marginal relief" rests on there being no relief provision in the law;
- which Finance Act governs which tax year is an interpretation of each Act's start date;
- some unamended sections were read only in FBR's compiled versions of the Ordinance.

This is an estimate, not tax advice.

## Prerequisites

- **Node.js 24.21.0** (LTS "Krypton"), pinned in [`.nvmrc`](.nvmrc), with the npm it ships, **npm 11.19.0**. Only this combination was tested. `package.json` declares `"node": ">=24.21.0"`.
- **nvm** to switch versions; 0.40.6 was used.
- **Python 3**, only if you want to regenerate expected test values (`tools/`). The app doesn't need it.

## Install, run, test, build

```bash
cd pakistan-salary-tax-calculator
nvm install          # first time only: installs Node 24.21.0 from .nvmrc
nvm use              # run in every new terminal before npm commands
npm ci               # exact install from package-lock.json
```
```bash
npm run dev          # development server: http://localhost:5173
```
```bash
npm test             # 358 Vitest tests (engine, interface, privacy)
```
```bash
npm run build        # production build in dist/
npm run preview      # serve the production build: http://localhost:4173
```

npm 11 may print an `install-scripts` warning about `fsevents`, an optional macOS file-watcher dependency. Tests and builds work without approving it.

## Repository layout

```
pakistan-salary-tax-calculator/
├── README.md, package.json, package-lock.json, index.html, vite.config.js, .nvmrc, .gitignore
├── src/
│   ├── main.jsx, App.jsx        entry point and page shell
│   ├── components/              React components (display only)
│   ├── styles/app.css           plain CSS
│   ├── utils/                   calculation engine, formatting, validation, page reducer
│   └── data/                    verified rule sets for each tax year, interface wording
├── tests/                       Vitest suites + fixtures/expected.json
├── tools/                       independent Python reference calculators
└── docs/                        product documents, verification record, transcripts/
```

`docs/transcripts/` contains [`session-transcript.md`](docs/transcripts/session-transcript.md), the transcript of this project's Claude Code session from 2026-10-08 22:16 UTC to 2026-10-09 01:53 UTC. It was made by a script from a copy of the session's `.jsonl` export (a copy from which I omitted irrelevant content), and it is not a summary. It contains only the user and assistant messages, verbatim and in order. Tool calls and outputs, Claude's internal reasoning and system metadata are left out.

## Deployment

The app is hosted on **Netlify** (free plan) at **https://pk-salary-tax-calculator.netlify.app**, deployed from the `main` branch of the GitHub repository. Every push to `main` triggers a new build and deploy.

[`netlify.toml`](netlify.toml) sets:
- build command `npm run build`, publish folder `dist`, and Node 24.21.0;
- security headers: a Content-Security-Policy with `connect-src 'none'` and `frame-ancestors 'none'`, plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and a restrictive `Permissions-Policy`;
- one-year immutable caching for the hashed assets.

Netlify adds HTTPS, with HSTS and an HTTP→HTTPS redirect. There are no serverless functions or server code.

## Project documents

| Document | Contents |
|---|---|
| [docs/app-roles.md](docs/app-roles.md) | Role R-1, the salaried employee |
| [docs/jobs-to-be-done.md](docs/jobs-to-be-done.md) | Jobs J-1 to J-8 |
| [docs/user-stories.md](docs/user-stories.md) | Stories US-01 to US-14 with acceptance criteria and statuses; behaviour rules; 114 expected results |
| [docs/tax-rules.md](docs/tax-rules.md) | Verified law, sources, worked calculations, boundary checks |
| [docs/SPEC.md](docs/SPEC.md) | Scope, assumptions, behaviour |
| [docs/ui-design.md](docs/ui-design.md) | Layout, colours, components, user flow |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Test design, coverage matrix, results log |
| [docs/manual-test-checklist.md](docs/manual-test-checklist.md) | Manual checks with expected values |
| [docs/verification.md](docs/verification.md) | Evidence for each story; failed and untested items |
| [docs/transcripts/session-transcript.md](docs/transcripts/session-transcript.md) | AI session transcript: user and assistant messages |

**Status (audit 2026-10-09):** all **14 stories** and all **5 technical criteria** are **Implemented**. One criterion, US-09-AC1 (the breakdown's legal citations must link to the FBR documents), failed in the audit; it was fixed, tested, and then re-checked by me in Safari, Chrome and Firefox. Evidence is in [docs/verification.md](docs/verification.md).

## AI tools used

- **Claude Code** in the Claude desktop app (Code tab), running **Claude Opus 5.5** (model ID `claude-opus-5-5`). It was the only AI tool and model used.
- It was used for:
  - research and verification of the law;
  - the product documents;
  - all code and tests;
  - the independent Python reference calculators;
  - browser checks in the app's built-in browser pane.
- I directed the work, reviewed each output, answered its questions, and did the manual testing.

**Hand edits:** none. I made no manual changes to the code or documents; all files were written by Claude Code at my direction.

**Time spent:** the recorded Claude session spans **about 3 hours 23 minutes**, starting around 3:16 AM PKT on 9 October 2026 (22:16 UTC on 8 October). Of that:
- **about 2 hours 15 minutes** went to building and completing the app, through my manual testing and the README;
- the remainder went to configuration for production and deployment: the git repository, publishing to GitHub, Netlify hosting, and the transcript.

## Browser checks and known limitations

**Checked by Claude** in the Claude desktop app's built-in browser (Chromium engine, `Chrome/152.0.7977.130`), on both the dev server and the production preview:
- **All 114 expected results** (every band boundary, the surcharge threshold, zero and small values, the supported maximums, monthly/annual pairs): every figure and all 13 breakdown steps matched the independent calculations, with 0 mismatches.
- **All 46 documented invalid inputs:** exact messages, field marked invalid, no result.
- **Real keyboard:** Enter calculates; Tab order; visible focus ring; Enter/Space open the sections; arrow keys change the year; edits clear the result; error recovery; Reset.
- **Layout** at 320, 375, 768 and 1280 px: no sideways scrolling.
- **Production security policy:** network requests are blocked, and nothing is stored.

**Checked by me** (the reviewer): every item marked for me in the manual checklist, all passed. That includes my own terminal and an offline run, VoiceOver, 200% zoom, a phone, and the FBR links. I also re-checked the breakdown's citation links after the US-09 fix. **Browsers:** Safari, Chrome and Firefox, all working.

**Known limitations:**
- Claude tested only its embedded Chromium. Safari, Chrome and Firefox were tested by me; their exact versions weren't recorded, and other browsers weren't tested.
- If the same result is calculated twice, a screen reader may not re-announce it, because the announcement text doesn't change.
- jsdom can't simulate keyboard toggling of `<summary>`, so that part is verified in the browser only.
- Super tax, exemptions and credits are out of scope (see above).
- nvm's global default on my machine is still Node 16. Run `nvm use` in the project folder before any npm command.
- **Netlify badge:** Netlify injects a "Powered by Netlify" badge script into hosted pages by default. It is **turned off** for this site (Project configuration → General → Powered by Netlify badge), so the live page loads only the app's own JavaScript and CSS and the browser console is clean. Netlify still adds a harmless HTML comment to the page.
