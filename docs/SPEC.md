# Pakistan Salary Income Tax Calculator — Specification

Status: **pre-implementation**. Approved decisions D1–D4 are incorporated.

| Document | Role |
|---|---|
| [app-roles.md](app-roles.md), [jobs-to-be-done.md](jobs-to-be-done.md) | Who the app is for and what they need |
| [tax-rules.md](tax-rules.md) | Verified law for both years (the legal source) |
| **[user-stories.md](user-stories.md)** | **The single source of acceptance criteria** (US-, BR-, TC- and EX- IDs) |
| This file | Scope, assumptions and behaviour, citing those IDs; no acceptance criteria of its own |
| [TEST_PLAN.md](TEST_PLAN.md) | Maps each test to US-, BR-, TC- and EX- IDs |
| [ui-design.md](ui-design.md) | Proposed interface: layout, visual tokens, components, user flow |

If this file and user-stories.md disagree, user-stories.md governs. Fix this file, and record the conflict in user-stories.md Appendix B.

## 1. Problem

A salaried employee in Pakistan (role R-1) wants to estimate their annual income tax and their income after tax, for budgeting or for comparing salary offers (jobs J-1 to J-3). They also need to understand and check the basis of the estimate (J-4 to J-8). The app shows the result together with a step-by-step, sourced breakdown.

## 2. Scope

**In scope:**
- Two years: FY 2025-26 (TY 2026) and FY 2026-27 (TY 2027) (US-01).
- Salary-only taxable income entered monthly or annually in PKR (US-02 to US-04).
- Annual tax payable and average monthly tax (US-05).
- Annual and average monthly income after income tax (US-06).
- A full calculation breakdown, surcharge explanation, and sources and assumptions (US-07 to US-09).
- The supported range (US-10), validation (US-11), editing (US-12), error recovery (US-13) and Reset (US-14).

**Out of scope:**
- Business, freelance, rental, pension and other income.
- Exemption or allowance calculations; tax credits and rebates; Zakat.
- Active Taxpayer List (ATL) status (no effect on salary tax; tax-rules.md §B).
- Payslip withholding (s.149) schedules.
- s.4C super tax, which instead defines the supported range (BR-16).
- Tax-return preparation; saving or sharing results.

**Stack:** React 19 (JavaScript/JSX), plain CSS and Vite 8, with Vitest 5 for tests, on Node.js 24 LTS (pinned in `.nvmrc`; switch with `nvm use`). All calculation runs in the browser, with no backend, network calls, accounts or API keys (TC-01, TC-02).

**Location:** the repository root.

## 3. Assumptions

| ID | Assumption | Rule / criteria |
|---|---|---|
| A1 | The amount entered is taxable salary **after exempt allowances**. No exemption calculation is done. | BR-09, US-02-AC5 |
| A2 | Annual input is total taxable salary for the year, including taxable bonuses. | BR-08, US-03-AC3 |
| A3 | Monthly input × 12, with the same salary for all 12 months and no partial-year option. | BR-07, US-02-AC3 |
| A4 | All income is salary, so the clause (2) salaried rates apply (salary is more than 75% of taxable income). | tax-rules.md §B, US-09-AC2 |
| A5 | Results are the annual tax liability, not payslip withholding. The average monthly tax is not a payroll reconciliation. | BR-12, US-05-AC3 |
| A6 | Income after income tax = annual taxable income − annual tax payable. Other payroll deductions are excluded. | BR-13, US-06 |
| A7 | The TY 2026 surcharge has no marginal relief, so the cliff above Rs 10,000,000 is shown as the law produces it. | US-08-AC2, US-08-AC5 |
| A8 | Supported maximum = the s.4C threshold: Rs 150,000,000.00 (TY 2026), Rs 500,000,000.00 (TY 2027), inclusive. Nothing is shown above it. | BR-16, US-10 |

## 4. Calculation and rounding (behaviour)

| Step | Rule |
|---|---|
| Parse | Validated input becomes an exact integer number of **paisa** (BigInt). There is no floating point anywhere in the calculation (TC-03). |
| Annualise | annual = monthly × 12 (exact), or the annual input as entered (BR-07, BR-08). |
| Range check | Exact annualised paisa ≤ the year's maximum; otherwise `ABOVE_MAX` (BR-16). |
| Slab | The highest slab whose threshold the income *exceeds*. Slab 1 (threshold 0) applies for income ≤ 600,000. An amount exactly on a limit uses the lower slab (US-07-AC4). |
| Excess | income − threshold (exact). |
| Marginal tax | excess × rate (exact; rates held as integer basis points). |
| Division I tax | base tax + marginal tax (exact). |
| Surcharge | TY 2026: if income > 10,000,000, then 9% × Division I tax, otherwise 0. TY 2027: always 0, with the withdrawal reason shown (US-08). |
| Calculated tax before rounding | Division I tax + surcharge (exact). |
| Annual tax payable | s.219: the fractional rupee is dropped if under 50 paisa, otherwise rounded up to the next whole rupee (BR-10, US-07-AC6). |
| Average monthly tax | payable ÷ 12, kept exact (BR-12). |
| Annual / average monthly income after tax | annual income − payable, and that ÷ 12, kept exact (BR-13). |

**Display:** BR-11 (Rs, international grouping, 2 dp half up at display only; ≈ when inexact; rounding note with every result).
**Labels:** "Calculated tax before rounding" and "Annual tax payable" are kept distinct, and the summary shows only tax payable (US-07-AC7).

## 5. Input validation

Validation runs only on Calculate (button or Enter). Leading and trailing whitespace is trimmed first. Checks run in this order, and the first failure wins. **Messages and the complete list of examples are in user-stories.md BR-06**; this table defines each key's precise condition.

| # | Key | Condition |
|---|---|---|
| V1 | `EMPTY` | Empty after trimming (blank is not zero; BR-03) |
| V2 | `NEGATIVE` | Starts with `-` followed by a digit or `.` (so `-1e6` → `NEGATIVE`, `-abc` → `INVALID_CHARS`, `-Infinity` → `NON_FINITE`) |
| V3 | `NON_FINITE` | Matches `Infinity`, `-Infinity`, `NaN` or `∞`, case-insensitively |
| V4 | `EXPONENT` | Digits, commas and dots followed by `e`/`E`, an optional sign, then digits |
| V5 | `INVALID_CHARS` | Any character other than ASCII `0-9`, `,` and `.` (including letters, `Rs`, `+`, internal spaces, and non-ASCII digits) |
| V6 | `FORMAT` | More than one `.`; a `.` without digits on both sides; or a comma after the `.` |
| V7 | `DECIMALS` | More than 2 digits after the `.` |
| V8 | `GROUPING` | The integer part contains commas but matches neither international `^[1-9]\d{0,2}(,\d{3})+$` nor lakh `^[1-9]\d?(,\d{2})*,\d{3}$` |
| V9 | `LEADING_ZERO` | The integer part has no commas and doesn't match `^(0|[1-9]\d*)$` |
| V10 | `ABOVE_MAX` | The exact annualised amount exceeds the selected year's maximum (BR-16) |

The grouping is validated **before** commas are removed (BR-05). Zero is valid (BR-03).

## 6. User interface behaviour

| Behaviour | Rule | Criteria |
|---|---|---|
| Defaults | FY 2026-27 (Tax Year 2027), Monthly, blank amount, no output | BR-01, US-01-AC1, US-14-AC1 |
| Controls | Financial-year radio group (two choices showing FY name, dates and tax year), Monthly/Annual radio group, amount field, Calculate and Reset buttons. Details are in ui-design.md | BR-02, TC-05 |
| Enter key | Submits, the same as Calculate | US-02-AC6 |
| Invalidation | Any change to year, period or amount immediately clears the result, breakdown and error, and shows `STALE_STATE` | BR-14, BR-17, US-12, US-13-AC1, US-13-AC2 |
| Reset | Restores the defaults, clears all output, collapses the expandable sections, shows `EMPTY_STATE`, and puts focus in the amount field | BR-15, BR-18, US-14 |
| Recovery | Correct the input and press Calculate; no reload is needed, and year and period are kept | US-13 |
| Accessibility | Error in a `role="alert"` element linked by `aria-describedby`, input marked `aria-invalid`; labelled controls, keyboard operation, visible focus, AA contrast, 320 px reflow | US-11-AC4, TC-05 |
| Expandable sections | "Calculation details" and "Official sources and assumptions" start collapsed and keep their state until Reset; decision-critical notes stay outside them | BR-18 |
| Wording | All fixed interface text comes from the BR-17 table | BR-17 |
| Help text | Exemption sentence always, plus one period-specific sentence | BR-09, US-02-AC3, US-02-AC5, US-03-AC3 |
| Notes with results | Payroll deductions excluded (BR-13); monthly tax is not a payroll reconciliation (BR-12); display rounding (BR-11); surcharge cliff (TY 2026 above Rs 10m only) | US-05-AC3, US-06-AC3, US-08-AC5 |

## 7. Breakdown content

Present for every valid amount, including 0, for the selected year, inside the expandable "Calculation details" section (BR-18, US-07-AC1, US-07-AC2). Each step shows a label, the formula, the substituted numbers, the result per BR-11, and its basis (US-09-AC1):

1. Annualisation: "Monthly Rs X × 12 = Rs Y" or "Annual amount used as entered: Rs Y" (basis BR-07 or BR-08).
2. Applicable slab: number, range ("exceeds A, does not exceed B") and threshold.
3. Base tax.
4. Income above threshold = Y − threshold.
5. Marginal rate.
6. Marginal tax = excess × rate.
7. Division I tax = base + marginal.
8. Surcharge, as one of:
   - TY 2026 above 10,000,000: test, basis (Division I tax), 9% and amount;
   - TY 2026 at or below 10,000,000: "not applicable: does not exceed Rs 10,000,000";
   - TY 2027: "not applicable: withdrawn for salaried individuals by Finance Act, 2026" (US-08).
9. Calculated tax before rounding.
10. s.219 rounding → annual tax payable, stating whether the fraction was dropped or rounded up (US-07-AC6).
11. Average monthly tax (BR-12).
12. Annual income after tax (BR-13).
13. Average monthly income after tax (BR-13).

Steps 2–7 cite First Schedule Part I Division I clause (2) and the year's Finance Act; step 8 cites s.4AB; step 10 cites s.219.

## 8. Project structure (as built)

```
pakistan-salary-tax-calculator/
  README.md, package.json, package-lock.json, index.html, vite.config.js, .nvmrc, .gitignore
  src/
    main.jsx, App.jsx     entry point and page shell (state via useReducer)
    components/           CalculatorForm (year, period, salary field, actions), Disclosure,
                          ResultsPanel (main result, supporting results, notes), CalculationDetails,
                          SourcesAndAssumptions (see ui-design.md §4)
    styles/app.css        all styling (plain CSS, custom properties)
    utils/                calculation engine and page logic (no React):
                          parseAmount.js (SPEC §5), annualize.js, calculateTax.js (totals and 13 steps),
                          format.js (BR-11), rational.js (exact BigInt arithmetic), messages.js (BR-06),
                          state.js (page reducer)
    data/                 ty2026.js, ty2027.js (verified rule sets), rules.js (registry and consistency
                          checks), copy.js (BR-17 interface wording)
  tests/                  Vitest suites, fixtures/expected.json (generated; see TEST_PLAN.md)
  tools/                  reference_values.py (--stories → user-stories Appendix A; --json → fixture),
                          rule_checks.py (tax-rules.md worked calculations)
  docs/                   product documents, verification record, transcripts/ (AI session exports)
```

## 9. Acceptance criteria

**All acceptance criteria live in [user-stories.md](user-stories.md).** The criteria previously listed here (AC1–AC20) were moved without loss:

| Former | Now |
|---|---|
| AC1 defaults | BR-01, US-01-AC1, US-14-AC1 |
| AC2 valid parse examples | BR-05 valid examples, US-04-AC5 |
| AC3 invalid examples | BR-06, US-11-AC1 |
| AC4 lakh = international | US-04-AC1 |
| AC5 above maximum, no partial result | BR-16, US-10-AC2 to US-10-AC4 |
| AC6 recovery after error | US-13 |
| AC7 Enter calculates | US-02-AC6 |
| AC8 change clears output | BR-14, US-12, US-13-AC1, US-13-AC2 |
| AC9 Reset | BR-15, US-14 |
| AC10 summary figures, 2 dp | US-05-AC1, US-06-AC1, BR-11 |
| AC11 derived from s.219 payable | BR-10, US-06-AC1 |
| AC12 match reference values | US-07-AC4, Appendix A, TC-04 |
| AC13 help text and deductions note | BR-09, US-02-AC5, US-06-AC3 |
| AC14 13-step breakdown incl. 0 and 600,000 | US-07-AC1 to US-07-AC3 |
| AC15 before/after s.219 labels | US-07-AC6, US-07-AC7 |
| AC16 ≈ marker and rounding note | BR-11, US-07-AC5, US-05-AC2 |
| AC17 surcharge applicable / not applicable | US-08-AC1 to US-08-AC5 |
| AC18 npm scripts offline | TC-01 |
| AC19 no runtime network requests | TC-02 |
| AC20 all tests pass | TC-04 |
