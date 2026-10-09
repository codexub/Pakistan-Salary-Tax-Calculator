# Manual Test Checklist

Run against `npm run dev` (http://localhost:5173) or `npm run preview` (http://localhost:4173). Expected figures come from `tools/reference_values.py` (independent exact fractions); IDs refer to user-stories.md and its Appendix A.

**Status key**
- **A**: automated (Vitest, 339 tests, all passing on Node 24.21.0)
- **B**: checked by Claude on 2026-10-09 in the built-in browser pane on the running dev server. That browser is the Chromium engine inside the Claude desktop app (`Chrome/152.0.7977.130`); no other browser was tested.
- **Y**: you must check

Tick each **Y** row, and any **B** row you want to see for yourself. A story moves to Implemented only after its rows pass for you.

## 1. Startup (TC-01)

| # | Steps | Expected | Status |
|---|---|---|---|
| 1.1 | In the project folder: `nvm install`, `nvm use`, `npm install` | `.nvmrc` selects Node v24.21.0; install finishes with 0 vulnerabilities | B (Claude's shell); **Y** in your terminal |
| 1.2 | `npm test` | 5 files, 339 tests passed | A, B; **Y** |
| 1.3 | `npm run dev`, then open http://localhost:5173 | "VITE v8.3.4 ready"; page titled "Pakistan Salary Tax Calculator" | B (Terminal tab "dev server") |
| 1.4 | `npm run build`, then `npm run preview`, then open http://localhost:4173 | Build succeeds; same page | B (Claude's shell) |
| 1.5 | After install, disconnect from the network; repeat 1.2–1.4 | All still work offline | **Y** |

## 2. Normal calculation, one per year (US-01, US-02, US-05, US-06, US-07)

Open "Calculation details" and check each step value.

| # | Input | Expected visible values | Status |
|---|---|---|---|
| 2.1 | FY 2025-26, Monthly `1,000,000` (EX-26-37) | Main: **Rs 3,685,290.00**, "FY 2025-26 (Tax Year 2026)". Supporting: Rs 307,107.50 · Rs 8,314,710.00 · Rs 692,892.50 · Rs 12,000,000.00. Steps: Rs 1,000,000.00 × 12 = Rs 12,000,000.00 → Slab 6 (threshold Rs 4,100,000) → base Rs 616,000.00 → excess Rs 7,900,000.00 → 35% → marginal Rs 2,765,000.00 → Division I Rs 3,381,000.00 → surcharge 9% × Rs 3,381,000.00 = Rs 304,290.00 → before rounding Rs 3,685,290.00 → payable Rs 3,685,290.00 ("already a whole rupee") → ÷12 Rs 307,107.50 → Rs 8,314,710.00 → Rs 692,892.50. Surcharge-cliff note visible without expanding | A, B |
| 2.2 | FY 2026-27, Monthly `250,000` (EX-27-39) | Main: **Rs 276,000.00**, "FY 2026-27 (Tax Year 2027)". Steps: Rs 3,000,000.00 → Slab 4 (threshold Rs 2,200,000) → base Rs 116,000.00 → excess Rs 800,000.00 → 20% → Rs 160,000.00 → Rs 276,000.00 → surcharge "Not applicable: withdrawn for salaried individuals by Finance Act, 2026" → Rs 276,000.00 → Rs 23,000.00 · Rs 2,724,000.00 · Rs 227,000.00. No cliff note | A, B |
| 2.3 | Both of the above: compare the step arithmetic with your own calculator | Every step equals base + rate × excess; surcharge = 9% × Division I tax | **Y** |

## 3. Zero tax and rounding (US-05-AC4, US-05-AC5, US-07-AC2, US-07-AC5, US-07-AC6)

| # | Input (FY 2026-27, Annual) | Expected | Status |
|---|---|---|---|
| 3.1 | `0` (EX-27-01) | Rs 0.00, "No income tax is payable on this amount.", 13 steps all Rs 0.00, Slab 1 | A, B |
| 3.2 | Monthly `0` (EX-27-02) | Step 1 "Rs 0.00 × 12 = Rs 0.00" | A |
| 3.3 | `600,049.99` (EX-27-07) | Before rounding **≈Rs 0.50**, payable **Rs 0.00**, s.219 step says "less than 50 paisa … disregarded"; zero-tax note shown | A, B |
| 3.4 | `600,050` (EX-27-08) | Before rounding Rs 0.50, payable **Rs 1.00** ("50 paisa or more … one rupee"); average monthly ≈Rs 0.08; after tax Rs 600,049.00 | A, B |
| 3.5 | Any result | The rounding note is visible; ≈ appears only on rounded values | A, B; **Y** (readability) |

## 4. Monthly/annual equivalence (US-03-AC2)

| # | Input | Expected | Status |
|---|---|---|---|
| 4.1 | FY 2026-27: Monthly `1,000,000`, then Annual `12,000,000` (EX-27-41/42) | Identical figures: Rs 3,174,000.00 · Rs 264,500.00 · Rs 8,826,000.00 · Rs 735,500.00; only step 1 wording differs | A, B |
| 4.2 | FY 2025-26: Monthly `250,000`, then Annual `3,000,000` (EX-26-35/36) | Both Rs 300,000.00 | A, B |

## 5. Every band and surcharge threshold (US-07-AC4, US-08)

For each limit L, enter Annual **L − 0.01**, **L** and **L + 0.01**. An amount exactly at L stays in the lower slab; L + 0.01 moves to the next slab with the same tax payable.

| Year | L (Rs) | Tax payable at L | Slab at L / at L + 0.01 | Status |
|---|---|---|---|---|
| TY 2026 | 600,000 · 1,200,000 · 2,200,000 · 3,200,000 · 4,100,000 | 0.00 · 6,000.00 · 116,000.00 · 346,000.00 · 616,000.00 | 1/2 · 2/3 · 3/4 · 4/5 · 5/6 | A, B |
| TY 2027 | 600,000 · 1,200,000 · 2,200,000 · 3,200,000 · 4,100,000 · 5,600,000 · 7,000,000 | 0.00 · 6,000.00 · 116,000.00 · 316,000.00 · 541,000.00 · 976,000.00 · 1,424,000.00 | 1/2 · 2/3 · 3/4 · 4/5 · 5/6 · 6/7 · 7/8 | A, B |
| TY 2026 surcharge | `10,000,000` → **Rs 2,681,000.00**, step 8 "Not applicable: taxable income does not exceed Rs 10,000,000", no cliff note. `10,000,000.01` → **Rs 2,922,290.00** (surcharge ≈Rs 241,290.00 on Division I ≈Rs 2,681,000.00), after tax Rs 7,077,710.01, cliff note shown. Monthly `833,333.33` → Rs 2,681,000.00; `833,333.34` → Rs 2,922,290.00 | | | A, B |
| TY 2027 surcharge | `10,000,000.01` → Rs 2,474,000.00, step 8 "withdrawn …", no cliff note | | | A, B |

## 6. Input handling (BR-03 to BR-06, BR-16, US-04, US-10, US-11)

Expected for every error: the message appears below the field, the field gets a red border, and the results area shows no figures.

| # | Input | Expected message / result | Status |
|---|---|---|---|
| 6.1 | blank | "Enter your taxable salary." (not a zero result) | A, B |
| 6.2 | `0`, `0.00` | Valid zero-tax result (3.1) | A, B |
| 6.3 | `-5` | "The amount cannot be negative." | A, B |
| 6.4 | `abc`, `Rs 5000`, `1 000` | "Use digits only, with optional commas and a decimal point." | A, B |
| 6.5 | `1e6`; `Infinity` | "Scientific notation isn't supported…"; "Enter a finite amount in rupees." | A, B |
| 6.6 | `100.12` valid; `100.123` | "Use at most two decimal places." | A, B |
| 6.7 | `.5`, `5.` | "Enter a number like 1500 or 1500.50." | A, B |
| 6.8 | `1,2000`, `12,00,000,000` | "Commas must follow international grouping (1,200,000) or lakh grouping (12,00,000), not a mix." | A, B |
| 6.9 | `1,200,000`, `12,00,000`, `1200000` (Annual) | Same result: Rs 6,000.00 (EX-27-14) | A, B |
| 6.10 | `007` | "Remove leading zeros, e.g. 7 instead of 007." | A, B |
| 6.11 | TY 2026 Annual `150,000,000` / `150,000,000.01`; Monthly `12,500,000.01` | Rs 56,332,290.00 / "…Rs 150,000,000.01 exceeds Rs 150,000,000.00 … Tax Year 2026 … super tax under section 4C …" with no figures / same, citing Rs 150,000,000.12 | A, B |
| 6.12 | TY 2027 Annual `500,000,000` / `500,000,000.01`; Monthly `41,666,666.66` / `41,666,666.67` | Rs 173,974,000.00 / error / Rs 173,974,000.00 / error citing Rs 500,000,000.04 | A, B |

All 46 documented invalid examples (BR-06) and all 114 Appendix A cases were run in the browser on 2026-10-09: 0 mismatches.

## 7. Editing, recovery, Reset (BR-14, BR-15, US-12, US-13, US-14)

| # | Steps | Expected | Status |
|---|---|---|---|
| 7.1 | Get a result, then type one more digit | Figures and details disappear at once; "Inputs changed. Press Calculate to update the results." | A, B (real keystrokes) |
| 7.2 | Get a result, then switch Monthly→Annual or change the year | Same as 7.1; Calculate shows the new scenario | A, B |
| 7.3 | Enter `12,00,000,000` + Enter, then press Backspace | Error and red border disappear on the edit | A, B (real keystrokes) |
| 7.4 | Replace with `12,00,000` + Enter (FY 2026-27, Monthly) | Rs 4,014,000.00; year and period unchanged | A, B (real keystrokes) |
| 7.5 | With details open, press Reset | FY 2026-27, Monthly, empty field, "Enter your taxable salary and press Calculate.", cursor in the field; next result has sections collapsed | A, B |

## 8. Keyboard and focus (TC-05, US-02-AC6, US-11-AC4)

| # | Steps | Expected | Status |
|---|---|---|---|
| 8.1 | Type an amount, press Enter | Calculates; cursor stays in the field | A, B |
| 8.2 | Tab from the field | Order: Calculate → Reset → "Calculation details" → "Official sources and assumptions" | B (up to "Calculation details"); **Y** (the rest, and Shift+Tab back) |
| 8.3 | Watch every focused control | Clearly visible green outline ring | B (computed style + screenshot of Reset); **Y** (all controls, your display) |
| 8.4 | Enter / Space on a section heading | Opens / closes it | B |
| 8.5 | Arrow keys on the year and period options | Selection moves; old result invalidated | A, B (year) |
| 8.6 | VoiceOver (Cmd+F5): trigger an error, then a result | Error read once when shown; result summary read politely | **Y** |

## 9. Layout and readability (TC-05)

| # | Width | Expected | Status |
|---|---|---|---|
| 9.1 | 320 px, result shown, both sections open | One column; no sideways page scroll; only the slab table scrolls inside its box; no text under 12 px | B |
| 9.2 | 375 px and 768 px | One column; no sideways scroll | B |
| 9.3 | 1280 px | Two columns (input 340 px, results 644 px), centred 1040 px | B |
| 9.4 | Any width | Annual tax payable reads as the main result; notes are readable; nothing overlaps | B (screenshots); **Y** (judgement) |
| 9.5 | 200% browser zoom | Still usable, no overlap | **Y** |
| 9.6 | A real phone (portrait) | Readable, tappable, no sideways scroll | **Y** |

## 10. Sources, privacy and other browsers

| # | Steps | Expected | Status |
|---|---|---|---|
| 10.1 | Open "Official sources and assumptions" for each year | Year's own slab table (6 or 8 rows), "Your slab" marked, its Finance Act and FBR links | A, B |
| 10.2 | Click each FBR link | Opens the FBR PDF in a new tab | **Y** |
| 10.2a | **Added after your review (US-09-AC1):** for each year, open "Calculation details" and click the "Source: Income Tax Ordinance, 2001, …" link on steps 2–10 | Opens that year's consolidated Ordinance PDF in a new tab (TY 2026: amended up to 31.07.2025; TY 2027: amended up to 30.06.2026). Steps 1 and 11–13 show "Assumption (BR-…)" with no link | A, B; **Y: done 2026-10-09**, reviewer reports it working in Safari, Chrome and Firefox |
| 10.3 | Production preview: browser DevTools → Network while calculating | No requests after page load; no stored data | B (CSP blocked test fetches; storage empty) |
| 10.4 | Safari, Firefox, Chrome (desktop) and Safari on iOS | Same behaviour as above | **Y**: reviewer reports Safari, Chrome and Firefox working (versions not recorded); iOS Safari not separately reported; not tested by Claude |
