# Interface Design (implemented)

A single-page calculator in React (JavaScript/JSX) with plain CSS. All behaviour and wording come from [user-stories.md](user-stories.md) (BR-, US- and TC- IDs); this document covers only layout, look and structure.

## 1. Principles

- **Focused.** One task on one page: no navigation, marketing, sign-in or other tools.
- **Answer first.** Annual tax payable is the largest thing in the results. The supporting figures come next, and the proof (details and sources) is one click away.
- **Calm and legible.** Off-white page, white cards, dark text, a single deep-green accent, system fonts, generous spacing, hairline borders and almost no shadow.
- **Plain web technology.** Semantic HTML, ordinary class names, CSS custom properties and standard media queries. No UI library, CSS framework or icon font.

## 2. Layout

**Wide screens (≥ 900 px):** two columns inside a centred container (max 1040 px).

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pakistan Salary Tax Estimator                                       │
│  Income tax and take-home pay for salaried individuals               │
├───────────────────────────┬──────────────────────────────────────────┤
│ ┌───────────────────────┐ │ ┌──────────────────────────────────────┐ │
│ │ Financial year        │ │ │ Annual tax payable                   │ │
│ │ ◉ FY 2026-27          │ │ │ Rs 276,000.00             (large)    │ │
│ │   1 Jul 2026–30 Jun 27│ │ │ FY 2026-27 (Tax Year 2027)           │ │
│ │   Tax Year 2027       │ │ │ Rounded to the nearest rupee …       │ │
│ │ ○ FY 2025-26          │ │ ├──────────────────────────────────────┤ │
│ │   1 Jul 2025–30 Jun 26│ │ │ Average monthly tax    Rs 23,000.00  │ │
│ │   Tax Year 2026       │ │ │ Annual income after tax Rs 2,724,000 │ │
│ │                       │ │ │ Monthly income after tax Rs 227,000  │ │
│ │ Salary period         │ │ │ Annual taxable income Rs 3,000,000   │ │
│ │ [ Monthly | Annual ]  │ │ ├──────────────────────────────────────┤ │
│ │                       │ │ │ notes: deductions · average ·        │ │
│ │ Taxable salary (PKR)  │ │ │        rounding · (cliff, TY26 >10m) │ │
│ │ Rs [ 250,000       ]  │ │ ├──────────────────────────────────────┤ │
│ │ help text …           │ │ │ ▸ Calculation details (13 steps)     │ │
│ │ (inline error here)   │ │ │ ▸ Official sources and assumptions   │ │
│ │                       │ │ └──────────────────────────────────────┘ │
│ │ [Calculate]  [Reset]  │ │                                          │
│ └───────────────────────┘ │                                          │
├───────────────────────────┴──────────────────────────────────────────┤
│  Estimate only · law verified 9 Oct 2026 · salary income only        │
└──────────────────────────────────────────────────────────────────────┘
```

**Narrow screens (< 900 px):** one column, with the input card above the results. Below 480 px, card padding tightens, the period toggle stays full width, and the year choices stack (they already do). Nothing scrolls horizontally down to 320 px (TC-05). The slab table inside the sources section gets its own horizontal scroll container if needed.

The input card is compact: 340 px wide on wide screens and not sticky. The results column takes the remaining width. Before the first calculation, the results card shows only `EMPTY_STATE`.

## 3. Visual tokens (CSS custom properties on `:root`)

| Token | Value | Use | Contrast (checked) |
|---|---|---|---|
| `--color-bg` | `#F7F5F0` | Page background (off-white) | — |
| `--color-surface` | `#FFFFFF` | Cards | — |
| `--color-text` | `#1C1F23` | Body text, figures | 16.5:1 on surface; 15.2:1 on bg |
| `--color-text-muted` | `#5A6169` | Help text, captions, labels of secondary figures | 6.3:1 on surface; 5.8:1 on bg |
| `--color-border` | `#DCD7CC` | Hairline card and section dividers (decorative) | — |
| `--color-control-border` | `#8A8F96` | Input, radio and button outlines | 3.3:1 on surface (UI ≥ 3:1) |
| `--color-accent` | `#1F5C4D` | **The one accent:** primary button, selected radio, links, focus ring, "Your slab" marker | 7.8:1 on surface; white text on it 7.8:1 |
| `--color-accent-soft` | `#EAF2EE` | Selected year-card fill, highlighted slab row | text 14.5:1; accent 6.8:1 |
| `--color-note` | `#F2EFE8` | Note panel background | text 14.4:1; muted 5.5:1 |
| `--color-error` | `#B42318` | Error text and invalid-field border (functional, not decorative) | 6.6:1 on surface |
| `--color-error-soft` | `#FDF1EF` | Error message background | error text 6.0:1 |
| `--font-sans` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | All text | — |
| `--font-size-*` | 0.875 / 1 / 1.125 / 1.5 / 2.25 rem | caption / body / section title / page title / main result | — |
| `--space-*` | 4, 8, 12, 16, 24, 32, 48 px | Spacing scale; cards use 24 px padding (16 px below 480 px) | — |
| `--radius-card` / `--radius-control` | 12 px / 8 px | Corners | — |
| `--shadow-card` | `0 1px 2px rgb(0 0 0 / 0.04)` | Minimal, cards only | — |
| `--focus-ring` | 2 px solid accent outline + 2 px offset | All focusable elements, via `:focus-visible` | accent 7.8:1 |

Figures use `font-variant-numeric: tabular-nums` so amounts line up. The page sets `color-scheme: light` and has no animation; `prefers-reduced-motion` is respected trivially. Minimum control height is 44 px.

## 4. Component structure

```
App                         state owner (useReducer); renders the page shell
├── PageHeader              <header>: h1 title + one-line subtitle
├── <main class="layout">
│   ├── CalculatorForm      <section class="card input-card"> + <form noValidate onSubmit>
│   │   ├── YearChoice      <fieldset> "Financial year": two radio cards (FY name, dates, tax year)
│   │   ├── PeriodChoice    <fieldset> "Salary period": segmented radios Monthly | Annual
│   │   ├── SalaryField     <label> + "Rs" prefix + <input type="text" inputMode="decimal">,
│   │   │                   help text (BR-09) + inline error (role="alert")
│   │   └── FormActions     <button type="submit"> Calculate · <button type="button"> Reset
│   └── ResultsPanel        <section class="card results" aria-labelledby="results-title">
│       ├── ResultsStatus   EMPTY_STATE / STALE_STATE text, or a visually hidden polite live summary
│       ├── MainResult      Annual tax payable (largest figure), year label, PAYABLE_CAPTION
│       ├── SupportingResults <dl>: average monthly tax, annual and monthly income after tax,
│       │                   annual taxable income
│       ├── ResultNotes     NOTE_DEDUCTIONS, NOTE_AVERAGE, NOTE_ROUNDING, NOTE_CLIFF (conditional)
│       ├── CalculationDetails  <details>/<summary> DETAILS_SUMMARY → <ol> of BreakdownStep
│       │   └── BreakdownStep   label, formula, substituted numbers, result, basis (citation or BR)
│       └── SourcesAndAssumptions <details>/<summary> SOURCES_SUMMARY →
│           ├── SlabTable       the year's bands; applicable row "Your slab", aria-current
│           ├── AssumptionList  verbatim BR-17 assumption strings
│           └── SourceList      FBR links from tax-rules.md §A
└── PageFooter              <footer>: one line, "Estimate only · law verified 9 Oct 2026"
```

**Pure modules (no React; final paths in SPEC §8):** `data/ty2026.js` and `data/ty2027.js` (rules), `utils/parseAmount.js`, `utils/calculateTax.js` (returns totals plus 13 step objects with basis references), `utils/format.js` (BR-11) and `data/copy.js` (the BR-17 strings, in one place so tests and components share them).

**Component rules**
- Only `App` holds state. Children receive values and callbacks as props, and every presentational component is a pure function of its props.
- Components never calculate tax. They render what `calculateTax` returns, so the numbers on screen are exactly the numbers the tests check.
- Each component has its own small CSS block in `styles/app.css`, using ordinary classes (`.card`, `.input-card`, `.year-option`, `.segmented`, `.field`, `.field-error`, `.btn`, `.btn-primary`, `.btn-secondary`, `.result-main`, `.result-figure`, `.result-list`, `.note`, `.note-important`, `.details`, `.step`, `.slab-table`, `.is-current`). State is shown with attributes where they exist (`[aria-invalid="true"]`, `[aria-current="true"]`, `details[open]`, `:checked`).
- One media query, `@media (min-width: 900px)`, switches to two columns; `@media (max-width: 479px)` tightens padding.

## 5. State and data flow

```
state = { year: 2027, period: "monthly", amountText: "",
          status: "empty" | "result" | "error" | "stale",
          result: null | CalculationResult, error: null | {key, message},
          detailsOpen: false, sourcesOpen: false }
```

| Action | Effect | Rules |
|---|---|---|
| `yearChanged` / `periodChanged` / `amountEdited` | Update the input. If status was `result` or `error`, set it to `stale` and clear `result` and `error` (from `empty` it stays `empty`) | BR-14 |
| `calculate` (submit button or Enter) | `parseAmount` → `calculateTax`; status becomes `result` or `error`. `detailsOpen`/`sourcesOpen` are kept | BR-06, BR-18 |
| `toggleDetails` / `toggleSources` | Mirror the `<details>` open state into state | BR-18 |
| `reset` | Back to the initial state above; focus moves to the amount input | BR-15 |

## 6. User flow

```
            load
              │
              ▼
   ┌──────────────────┐   Calculate (invalid)   ┌─────────────────┐
   │ EMPTY            │ ──────────────────────▶ │ ERROR           │
   │ EMPTY_STATE text │                         │ inline message, │
   └──────────────────┘                         │ field invalid   │
         │ Calculate (valid)                    └─────────────────┘
         ▼                                         │ edit any input
   ┌──────────────────┐   edit any input        ┌─────────────────┐
   │ RESULT           │ ──────────────────────▶ │ STALE           │
   │ main + support + │                         │ STALE_STATE     │
   │ notes + ▸details │ ◀────────────────────── │ text            │
   └──────────────────┘   Calculate (valid)     └─────────────────┘
   Reset from any state → EMPTY (defaults, focus in the amount field)
```

**A typical session (Hina, R-1, comparing an offer; jobs J-1 and J-2):**
1. The page opens on FY 2026-27, Monthly. Hina types `210,000` and presses Enter. The main result shows her annual tax payable, with income after tax underneath.
2. She changes the amount to `260,000`. The old figures disappear and "Inputs changed…" appears, so she can't mistake the old number for the new one. She presses Enter and the new result appears.
3. She opens "Calculation details" to see the slab, rate and each step, and "Official sources and assumptions" to see the Finance Act 2026 and FBR links. Both stay open while she tries more amounts.
4. She switches to FY 2025-26 to see what changed since last year, calculates, then presses Reset to start over.

**Focus and announcements**
- After Calculate, focus stays in the amount field so the user can keep adjusting. A visually hidden `aria-live="polite"` region announces a one-line summary, e.g. "Annual tax payable Rs 276,000.00 for Tax Year 2027".
- Errors use `role="alert"` beside the field (US-11-AC4).
- Reset moves focus to the amount field (BR-15).

## 7. Accessibility checklist (TC-05)

- `<html lang="en">`; one `h1`; the results title and section summaries form a logical heading order.
- Year and period are native radio inputs inside `fieldset`/`legend`. The year cards are styled `label`s wrapping each radio, so the dates and tax year are part of the accessible name.
- The amount input has a visible `label`, and `aria-describedby` points to the help text plus, when present, the error. `aria-invalid` is set only while an error is shown.
- The `≈` marker always comes with visible text, and the rounding note explains it; colour never carries meaning alone (an error has text plus a border, and the current slab has a "Your slab" label).
- `<details>/<summary>` gives keyboard and screen-reader expand/collapse with no custom script.
- Visible `:focus-visible` ring on every interactive element; 44 px targets; reflows at 320 px; usable at 200% zoom.

## 8. Traceability

| Interface element | Story / rule |
|---|---|
| YearChoice (dates + tax-year labels) | BR-02, US-01 |
| PeriodChoice, SalaryField, help text | BR-07–BR-09, US-02–US-04 |
| Calculate / Enter, Reset | US-02-AC6, BR-15, US-14 |
| Inline error | BR-06, US-11, US-13 |
| MainResult | US-05-AC1 |
| SupportingResults, ResultNotes | US-05, US-06, US-08-AC5, BR-11–BR-13, BR-17 |
| CalculationDetails | BR-18, US-07, US-08 |
| SourcesAndAssumptions | BR-18, US-09 |
| Stale / empty states | BR-14, BR-17, US-12 |
| Above-range message (inline error) | BR-16, US-10 |
| Layout, focus, contrast | TC-05 |

## 9. Design choices (as built)

These were offered as open choices before implementation. No alternative was requested, so the proposed defaults were built.

1. **Year control: radio cards, not a dropdown.** With only two years, radio cards show each year's dates and tax-year label without opening anything; a `<select>` can't lay out multi-line options.
2. **Annual taxable income is shown among the supporting results,** alongside the three required figures, so the annualised base is visible at a glance.
3. **Accent colour: deep green `#1F5C4D`,** with 7.8:1 contrast on white.
