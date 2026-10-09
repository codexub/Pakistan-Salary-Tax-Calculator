// @vitest-environment jsdom
// Interface tests T-U01 to T-U25 (docs/TEST_PLAN.md §5). Expected wording is read from docs/user-stories.md
// (BR-06, BR-17, US-08-AC5) and expected figures from tests/fixtures/expected.json (independent Python fractions).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { COPY } from '../src/data/copy.js';
import { casesById, documentedCopy, documentedErrors, documentedValidInputs } from './helpers.js';

const DOC = documentedCopy();
const ERRORS = Object.fromEntries(documentedErrors().map((e) => [e.key, e.message]));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------- helpers ----------

const setup = () => {
  const user = userEvent.setup();
  render(<App />);
  return user;
};

const amountInput = () => screen.getByRole('textbox', { name: /taxable salary \(PKR\)/ });
const yearRadio = (taxYear) => screen.getByRole('radio', { name: new RegExp(`Tax Year ${taxYear}`) });
const periodRadio = (period) => screen.getByRole('radio', { name: period === 'monthly' ? 'Monthly' : 'Annual' });
const resultsRegion = () => screen.getByRole('region', { name: 'Your estimate' });
const calculateButton = () => screen.getByRole('button', { name: 'Calculate' });
const resetButton = () => screen.getByRole('button', { name: 'Reset' });

/** Fixture money → the exact text the UI must show. */
const rs = (money) => `${money.approx ? '≈' : ''}Rs ${money.display}`;

async function calculate(user, { taxYear, period, amount, via = 'button' }) {
  if (taxYear) await user.click(yearRadio(taxYear));
  if (period) await user.click(periodRadio(period));
  await user.clear(amountInput());
  if (amount !== '') await user.type(amountInput(), amount);
  if (via === 'enter') await user.keyboard('{Enter}');
  else await user.click(calculateButton());
}

const fromCase = (id, overrides = {}) => {
  const c = casesById[id];
  return { taxYear: c.taxYear, period: c.period, amount: c.input, ...overrides };
};

const mainFigure = () => resultsRegion().querySelector('.result-main__figure');
const supporting = (label) => within(resultsRegion()).getByText(label, { selector: 'dt' }).nextElementSibling.textContent;

function expectSummary(caseId) {
  const r = casesById[caseId].result;
  expect(mainFigure().textContent).toBe(rs(r.taxPayable));
  expect(supporting('Average monthly tax')).toBe(rs(r.avgMonthlyTax));
  expect(supporting('Annual income after income tax')).toBe(rs(r.incomeAfterTax));
  expect(supporting('Average monthly income after income tax')).toBe(rs(r.avgMonthlyIncomeAfterTax));
  expect(supporting('Annual taxable income')).toBe(rs(casesById[caseId].annual));
}

const hasResult = () => resultsRegion().querySelector('.result-main') !== null;
const statusText = () => resultsRegion().querySelector('.results__status')?.textContent ?? null;

async function openDetails(user) {
  await user.click(screen.getByText(DOC.DETAILS_SUMMARY));
  return [...resultsRegion().querySelectorAll('.steps > li')];
}

async function openSources(user) {
  await user.click(screen.getByText(DOC.SOURCES_SUMMARY));
  return resultsRegion().querySelector('.details-sources');
}

// ---------- tests ----------

describe('interface wording matches docs/user-stories.md BR-17 exactly', () => {
  it('every BR-17 key is defined in the app with the documented text', () => {
    for (const [key, text] of Object.entries(DOC)) expect(COPY[key], key).toBe(text);
    expect(Object.keys(COPY).sort()).toEqual(Object.keys(DOC).sort());
  });
});

describe('T-U01/T-U02 defaults and year choices (BR-01, BR-02, US-01-AC1)', () => {
  it('loads with FY 2026-27, Monthly, a blank amount and no output', () => {
    setup();
    expect(yearRadio(2027).checked).toBe(true);
    expect(yearRadio(2026).checked).toBe(false);
    expect(periodRadio('monthly').checked).toBe(true);
    expect(amountInput().value).toBe('');
    expect(statusText()).toBe(DOC.EMPTY_STATE);
    expect(hasResult()).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers exactly two years, each with FY name, dates and tax-year label', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Financial year' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.map((r) => r.closest('label').textContent)).toEqual([
      'FY 2026-271 July 2026 – 30 June 2027Tax Year 2027',
      'FY 2025-261 July 2025 – 30 June 2026Tax Year 2026',
    ]);
  });
});

describe('T-U03/T-U04/T-U05/T-U08/T-U12 results for both years (US-01 to US-03, US-06)', () => {
  it('Annual 3,000,000 gives Rs 300,000.00 (TY 2026) and Rs 276,000.00 (TY 2027), with year labels', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-36'));
    expectSummary('EX-26-36');
    expect(within(resultsRegion()).getByText('FY 2025-26 (Tax Year 2026)', { selector: '.result-main__year' })).toBeTruthy();
    await calculate(user, fromCase('EX-27-40'));
    expectSummary('EX-27-40');
    expect(within(resultsRegion()).getByText('FY 2026-27 (Tax Year 2027)', { selector: '.result-main__year' })).toBeTruthy();
    const steps = await openDetails(user);
    expect(steps).toHaveLength(13);
    expect(resultsRegion().querySelector('.details__context').textContent).toContain('FY 2026-27 (Tax Year 2027)');
  });

  it.each(['EX-27-39', 'EX-26-37', 'EX-27-42', 'EX-26-23'])('%s matches the fixture', async (id) => {
    const user = setup();
    await calculate(user, fromCase(id));
    expectSummary(id);
  });
});

describe('T-U06 Enter calculates (US-02-AC6)', () => {
  it('Monthly 100000 + Enter equals the button result (EX-27-27)', async () => {
    const user = setup();
    await calculate(user, { amount: '100000', via: 'enter' });
    expectSummary('EX-27-27');
  });
});

describe('T-U07 help text per period (BR-09, US-02-AC3, US-02-AC5, US-03-AC3)', () => {
  it('shows the exemption sentence plus the period sentence, linked to the field', async () => {
    const user = setup();
    const help = document.getElementById('salary-help');
    expect(help.textContent).toBe(`${DOC.HELP_BASE} ${DOC.HELP_MONTHLY}`);
    expect(amountInput().getAttribute('aria-describedby')).toContain('salary-help');
    expect(screen.getByLabelText('Monthly taxable salary (PKR)')).toBe(amountInput());
    await user.click(periodRadio('annual'));
    expect(help.textContent).toBe(`${DOC.HELP_BASE} ${DOC.HELP_ANNUAL}`);
    expect(screen.getByLabelText('Annual taxable salary (PKR)')).toBe(amountInput());
  });
});

describe('T-U09 number formats (US-04-AC1, US-04-AC2)', () => {
  it.each(['1200000', '1,200,000', '12,00,000'])('Annual %s gives the EX-27-14 summary', async (amount) => {
    const user = setup();
    await calculate(user, { period: 'annual', amount });
    expectSummary('EX-27-14');
  });

  it.each(documentedValidInputs())('BR-05 valid input "$input" is accepted through the interface (US-04-AC3 to AC5)', async ({ input, paisa }) => {
    const user = setup();
    await calculate(user, { period: 'annual', amount: input });
    const rupees = (paisa / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(supporting('Annual taxable income')).toBe(`Rs ${rupees}.${(paisa % 100n).toString().padStart(2, '0')}`);
  });

  it('accepts exactly two decimals through the interface (US-04-AC4)', async () => {
    const user = setup();
    await calculate(user, { period: 'annual', amount: '100.12' });
    expect(supporting('Annual taxable income')).toBe('Rs 100.12');
  });

  it('Annual 50,00,000.50 shows Rs 5,000,000.50 (EX-27-46)', async () => {
    const user = setup();
    await calculate(user, { period: 'annual', amount: '50,00,000.50' });
    expectSummary('EX-27-46');
  });
});

describe('T-U10/T-U11 main result first, notes visible without expanding (US-05, US-06, US-07-AC7)', () => {
  it('annual tax payable is the first figure, with label, year and caption', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-26'));
    const region = resultsRegion();
    const figures = [...region.querySelectorAll('.result-main__figure, .result-list dd, .step__value')];
    expect(figures[0]).toBe(mainFigure());
    expect(region.querySelector('.result-main__label').textContent).toBe('Annual tax payable');
    expect(region.querySelector('.result-main__caption').textContent).toBe(DOC.PAYABLE_CAPTION);
    expect([...region.querySelectorAll('.result-list dt')].map((d) => d.textContent)).toEqual([
      'Average monthly tax', 'Annual income after income tax', 'Average monthly income after income tax',
      'Annual taxable income',
    ]);
    // The before-rounding figure appears only inside the calculation details.
    const outsideDetails = [...region.children].filter((el) => !el.matches('details'));
    expect(outsideDetails.some((el) => el.textContent.includes('Calculated tax before rounding'))).toBe(false);
  });

  it.each(['EX-27-40', 'EX-26-26'])('%s shows the three notes verbatim with sections collapsed', async (id) => {
    const user = setup();
    await calculate(user, fromCase(id));
    const notes = [...resultsRegion().querySelectorAll('.notes > .note')].map((n) => n.textContent);
    expect(notes).toEqual(expect.arrayContaining([DOC.NOTE_AVERAGE, DOC.NOTE_DEDUCTIONS, DOC.NOTE_ROUNDING]));
    expect([...resultsRegion().querySelectorAll('details')].every((d) => !d.open)).toBe(true);
  });
});

describe('zero-tax cases (US-05-AC5, US-07-AC2, US-07-AC3)', () => {
  it.each(['EX-27-01', 'EX-27-12', 'EX-26-07'])('%s shows Rs 0.00 and the zero-tax note', async (id) => {
    const user = setup();
    await calculate(user, fromCase(id));
    expect(mainFigure().textContent).toBe('Rs 0.00');
    expect(resultsRegion().querySelector('.result-main__zero').textContent).toBe(DOC.NOTE_ZERO_TAX);
  });

  it('no zero-tax note when tax is payable (EX-27-08)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-08'));
    expect(mainFigure().textContent).toBe('Rs 1.00');
    expect(resultsRegion().querySelector('.result-main__zero')).toBeNull();
  });

  it('T-U13 Monthly 0 shows all 13 steps at Rs 0.00 with the annualisation', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-02'));
    const steps = await openDetails(user);
    expect(steps).toHaveLength(13);
    expect(steps[0].querySelector('.step__substitution').textContent).toBe('Rs 0.00 × 12 = Rs 0.00');
    expect(steps[1].querySelector('.step__substitution').textContent)
      .toBe('Slab 1: taxable income does not exceed Rs 600,000; threshold Rs 0');
    expect(steps[4].querySelector('.step__value').textContent).toBe('0%');
    for (const i of [2, 5, 6, 7, 8, 9, 10, 11, 12]) {
      expect(steps[i].querySelector('.step__value').textContent, `step ${i + 1}`).toBe('Rs 0.00');
    }
  });

  it('T-U13 Annual 600,000 stays in slab 1 with no tax (EX-27-12)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-12'));
    const steps = await openDetails(user);
    expect(steps[1].querySelector('.step__value').textContent).toBe('Slab 1');
    expect(steps[9].querySelector('.step__value').textContent).toBe('Rs 0.00');
  });
});

describe('calculation details show the actual substituted numbers (US-07, US-09-AC1)', () => {
  it('EX-26-37 (Monthly 1,000,000, TY 2026): every step matches the independent values', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-37'));
    const steps = await openDetails(user);
    const sub = (i) => steps[i].querySelector('.step__substitution').textContent;
    const val = (i) => steps[i].querySelector('.step__value').textContent;
    const r = casesById['EX-26-37'].result;
    expect(sub(0)).toBe('Rs 1,000,000.00 × 12 = Rs 12,000,000.00');
    expect(sub(1)).toBe('Slab 6: taxable income exceeds Rs 4,100,000; threshold Rs 4,100,000');
    expect(val(2)).toBe(rs(r.baseTax));
    expect(sub(3)).toBe(`Rs 12,000,000.00 − Rs 4,100,000 = ${rs(r.excess)}`);
    expect(val(4)).toBe('35%');
    expect(sub(5)).toBe(`${rs(r.excess)} × 35% = ${rs(r.marginalTax)}`);
    expect(sub(6)).toBe(`${rs(r.baseTax)} + ${rs(r.marginalTax)} = ${rs(r.divisionITax)}`);
    expect(sub(7)).toBe(`Taxable income Rs 12,000,000.00 exceeds Rs 10,000,000, so 9% × ${rs(r.divisionITax)} = ${rs(r.surcharge)}`);
    expect(sub(8)).toBe(`${rs(r.divisionITax)} + ${rs(r.surcharge)} = ${rs(r.taxBeforeRounding)}`);
    expect(sub(9)).toBe(`${rs(r.taxBeforeRounding)}: already a whole rupee, so nothing is rounded → ${rs(r.taxPayable)}`);
    expect(sub(10)).toBe(`${rs(r.taxPayable)} ÷ 12 = ${rs(r.avgMonthlyTax)}`);
    expect(sub(11)).toBe(`Rs 12,000,000.00 − ${rs(r.taxPayable)} = ${rs(r.incomeAfterTax)}`);
    expect(sub(12)).toBe(`${rs(r.incomeAfterTax)} ÷ 12 = ${rs(r.avgMonthlyIncomeAfterTax)}`);
    // Every step shows its basis: legal source or assumption (US-09-AC1).
    const bases = steps.map((s) => s.querySelector('.step__basis').textContent);
    expect(bases[0]).toBe(`Assumption (BR-07): ${DOC.HELP_MONTHLY}`);
    expect(bases[1]).toMatch(/^Source: Income Tax Ordinance, 2001, First Schedule, Part I, Division I, clause \(2\), as substituted by Finance Act, 2025$/);
    expect(bases[7]).toBe('Source: Income Tax Ordinance, 2001, s.4AB proviso (inserted by Finance Act, 2025)');
    expect(bases[9]).toBe('Source: Income Tax Ordinance, 2001, s.219');
    expect(bases[10]).toBe(`Assumption (BR-12): ${DOC.NOTE_AVERAGE}`);
    expect(bases[11]).toBe(`Assumption (BR-13): ${DOC.NOTE_DEDUCTIONS}`);
  });

  // URLs of the consolidated Ordinance texts B1 and B3 in docs/tax-rules.md §A.
  it.each([
    ['EX-26-26', 'https://download1.fbr.gov.pk/Docs/2025881983148210Income-Tax-Ordinance,-2001-Amended-upto-31.07.2025.pdf'],
    ['EX-27-39', 'https://download1.fbr.gov.pk/Docs/2026724177725705IncomeTaxOrdinanace2001.pdf'],
  ])('%s: every legal citation links to that year\'s Ordinance; assumptions have no link (US-09-AC1)', async (id, url) => {
    const user = setup();
    await calculate(user, fromCase(id));
    const steps = await openDetails(user);
    steps.forEach((step, i) => {
      const link = step.querySelector('.step__basis a');
      if ([0, 10, 11, 12].includes(i)) {
        expect(link, `step ${i + 1}`).toBeNull();
      } else {
        expect(link.getAttribute('href'), `step ${i + 1}`).toBe(url);
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.textContent.startsWith('Income Tax Ordinance, 2001')).toBe(true);
      }
    });
  });

  it('labels the before-rounding and payable figures separately (US-07-AC7)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-08'));
    const steps = await openDetails(user);
    expect(steps[8].querySelector('.step__label').textContent).toBe('Calculated tax before rounding');
    expect(steps[8].querySelector('.step__value').textContent).toBe('Rs 0.50');
    expect(steps[9].querySelector('.step__label').textContent)
      .toBe('Annual tax payable (rounded to the nearest rupee under s.219)');
    expect(steps[9].querySelector('.step__substitution').textContent).toContain('50 paisa or more, so it counts as one rupee');
  });
});

describe('T-U14 surcharge and cliff note (US-08)', () => {
  it('TY 2026 above Rs 10m: cliff note visible while collapsed; basis, rate and amount in details', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-26'));
    const important = resultsRegion().querySelector('.note--important');
    expect(important.textContent).toBe(DOC.NOTE_CLIFF);
    const steps = await openDetails(user);
    expect(steps[7].querySelector('.step__substitution').textContent).toBe(
      'Taxable income Rs 10,000,000.01 exceeds Rs 10,000,000, so 9% × ≈Rs 2,681,000.00 = ≈Rs 241,290.00');
    expect(mainFigure().textContent).toBe('Rs 2,922,290.00');
  });

  it('TY 2026 at exactly Rs 10m: no surcharge and no cliff note (EX-26-25)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-25'));
    expect(resultsRegion().querySelector('.note--important')).toBeNull();
    const steps = await openDetails(user);
    expect(steps[7].querySelector('.step__substitution').textContent)
      .toBe('Not applicable: taxable income does not exceed Rs 10,000,000');
  });

  it('TY 2027: withdrawn, no cliff note (EX-27-30)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-30'));
    expect(resultsRegion().querySelector('.note--important')).toBeNull();
    const steps = await openDetails(user);
    expect(steps[7].querySelector('.step__substitution').textContent)
      .toBe('Not applicable: withdrawn for salaried individuals by Finance Act, 2026');
  });
});

describe('T-U15 sources and assumptions match the selected year (US-09)', () => {
  it.each([
    ['EX-26-26', 6, 6, 'Finance Act, 2025 (Act No. XIX of 2025)', 'https://download1.fbr.gov.pk/Docs/2025629106147620FInanceAct2025.pdf'],
    ['EX-27-25', 8, 8, 'Finance Act, 2026 (Act No. XLIII of 2026)', 'https://download1.fbr.gov.pk/Docs/20266291261044366FinanceAct2026.pdf'],
    ['EX-27-01', 8, 1, 'Finance Act, 2026 (Act No. XLIII of 2026)', 'https://download1.fbr.gov.pk/Docs/20266291261044366FinanceAct2026.pdf'],
  ])('%s: %i slab rows, slab %i marked, year sources', async (id, rows, currentSlab, actTitle, actUrl) => {
    const user = setup();
    await calculate(user, fromCase(id));
    const section = await openSources(user);
    const assumptions = [...section.querySelector('.plain-list').children].map((li) => li.textContent);
    const periodSentence = casesById[id].period === 'monthly' ? DOC.HELP_MONTHLY : DOC.HELP_ANNUAL;
    expect(assumptions).toEqual([DOC.HELP_BASE, periodSentence, DOC.NOTE_AVERAGE, DOC.NOTE_DEDUCTIONS, DOC.ASSUMPTION_SALARY_ONLY]);
    const bodyRows = [...section.querySelectorAll('.slab-table tbody tr')];
    expect(bodyRows).toHaveLength(rows);
    const current = bodyRows.filter((tr) => tr.getAttribute('aria-current') === 'true');
    expect(current).toHaveLength(1);
    expect(current[0].querySelector('th').textContent).toBe(`${currentSlab}Your slab`);
    const link = within(section).getByRole('link', { name: actTitle });
    expect(link.getAttribute('href')).toBe(actUrl);
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('T-U16 amounts above the supported range show no figures (BR-16, US-10)', () => {
  it.each(['EX-26-31', 'EX-26-34', 'EX-27-35', 'EX-27-38'])('%s', async (id) => {
    const user = setup();
    const c = casesById[id];
    await calculate(user, fromCase(id));
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe(
      `Annualised taxable salary of Rs ${c.annual.display} exceeds Rs ${c.max.display}, the highest amount this version supports for Tax Year ${c.taxYear}. Above this amount, super tax under section 4C also applies, and this version doesn't calculate it. No result is shown.`);
    expect(hasResult()).toBe(false);
    expect(resultsRegion().textContent).not.toMatch(/Rs \d/);
    expect(resultsRegion().querySelector('details')).toBeNull();
  });
});

describe('T-U17/T-U18 invalid input: associated, announced, no misleading result (US-11)', () => {
  it('abc → INVALID_CHARS alert linked to the field; fixing it removes aria-invalid', async () => {
    const user = setup();
    await calculate(user, { amount: 'abc' });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe(ERRORS.INVALID_CHARS);
    expect(amountInput().getAttribute('aria-invalid')).toBe('true');
    expect(amountInput().getAttribute('aria-describedby').split(' ')).toContain(alert.id);
    expect(hasResult()).toBe(false);
    await calculate(user, { amount: '100000' });
    expect(amountInput().hasAttribute('aria-invalid')).toBe(false);
    expectSummary('EX-27-27');
  });

  it('blank → EMPTY, never a zero result', async () => {
    const user = setup();
    await user.click(calculateButton());
    expect(screen.getByRole('alert').textContent).toBe(ERRORS.EMPTY);
    expect(hasResult()).toBe(false);
  });

  it.each([['-5', 'NEGATIVE'], ['1e6', 'EXPONENT'], ['Infinity', 'NON_FINITE'], ['100.123', 'DECIMALS'],
    ['1,2000', 'GROUPING'], ['007', 'LEADING_ZERO'], ['.5', 'FORMAT']])('"%s" → %s message, no result', async (amount, key) => {
    const user = setup();
    await calculate(user, { amount });
    expect(screen.getByRole('alert').textContent).toBe(ERRORS[key]);
    expect(hasResult()).toBe(false);
  });

  it('a result is announced politely', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-39'));
    const live = resultsRegion().querySelector('[aria-live="polite"]');
    expect(live.textContent).toBe('Annual tax payable Rs 276,000.00 for FY 2026-27 (Tax Year 2027).');
  });
});

describe('T-U19 editing invalidates the previous result (BR-14, US-12)', () => {
  it('changing the amount shows STALE_STATE until Calculate', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-39'));
    await user.type(amountInput(), '0');
    expect(hasResult()).toBe(false);
    expect(resultsRegion().querySelector('details')).toBeNull();
    expect(statusText()).toBe(DOC.STALE_STATE);
    expect(resultsRegion().querySelector('[aria-live="polite"]').textContent).toBe('');
  });

  it('changing the period invalidates; recalculating gives the annual result (EX-27-44)', async () => {
    const user = setup();
    await calculate(user, { amount: '250,000' });
    await user.click(periodRadio('annual'));
    expect(hasResult()).toBe(false);
    expect(statusText()).toBe(DOC.STALE_STATE);
    await user.click(calculateButton());
    expectSummary('EX-27-44');
  });

  it('changing the year invalidates; recalculating gives that year (EX-26-36)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-40'));
    await user.click(yearRadio(2026));
    expect(hasResult()).toBe(false);
    expect(statusText()).toBe(DOC.STALE_STATE);
    await user.click(calculateButton());
    expectSummary('EX-26-36');
  });

  it('editing before any calculation keeps EMPTY_STATE', async () => {
    const user = setup();
    await user.type(amountInput(), '5');
    expect(statusText()).toBe(DOC.EMPTY_STATE);
  });
});

describe('T-U20/T-U21 correcting an error (US-13)', () => {
  it('GROUPING error clears on edit; corrected lakh input calculates (EX-27-45)', async () => {
    const user = setup();
    await calculate(user, { amount: '12,00,000,000' });
    expect(screen.getByRole('alert').textContent).toBe(ERRORS.GROUPING);
    await user.type(amountInput(), '{Backspace}');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(statusText()).toBe(DOC.STALE_STATE);
    await calculate(user, { amount: '12,00,000' });
    expect(yearRadio(2027).checked).toBe(true);
    expect(periodRadio('monthly').checked).toBe(true);
    expectSummary('EX-27-45');
  });

  it('ABOVE_MAX clears when the year changes, and is not re-checked until Calculate', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-38'));
    expect(screen.getByRole('alert')).toBeTruthy();
    await user.click(yearRadio(2026));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(statusText()).toBe(DOC.STALE_STATE);
    await user.click(calculateButton());
    expect(screen.getByRole('alert').textContent).toContain('Tax Year 2026');
  });
});

describe('T-U22 Reset (BR-15, US-14)', () => {
  it('from a result with both sections open: defaults, EMPTY_STATE, focus, sections collapsed next time', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-26-26'));
    await openDetails(user);
    await openSources(user);
    await user.click(resetButton());
    expect(yearRadio(2027).checked).toBe(true);
    expect(periodRadio('monthly').checked).toBe(true);
    expect(amountInput().value).toBe('');
    expect(statusText()).toBe(DOC.EMPTY_STATE);
    expect(hasResult()).toBe(false);
    expect(document.activeElement).toBe(amountInput());
    await calculate(user, { amount: '100000' });
    expect([...resultsRegion().querySelectorAll('details')].every((d) => !d.open)).toBe(true);
  });

  it('from an error: clears it; Calculate afterwards gives EMPTY', async () => {
    const user = setup();
    await calculate(user, { taxYear: 2026, period: 'annual', amount: 'abc' });
    await user.click(resetButton());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(yearRadio(2027).checked).toBe(true);
    await user.click(calculateButton());
    expect(screen.getByRole('alert').textContent).toBe(ERRORS.EMPTY);
  });
});

describe('T-U24 expandable sections (BR-18)', () => {
  it('start collapsed with documented summaries and keep their state across recalculation', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-39'));
    const [details, sources] = resultsRegion().querySelectorAll('details');
    expect(details.querySelector('summary').textContent).toBe(DOC.DETAILS_SUMMARY);
    expect(sources.querySelector('summary').textContent).toBe(DOC.SOURCES_SUMMARY);
    expect(details.open).toBe(false);
    await openDetails(user);
    expect(resultsRegion().querySelectorAll('details')[0].open).toBe(true);
    await calculate(user, { amount: '260000' });
    const reopened = resultsRegion().querySelectorAll('details');
    expect(reopened[0].open).toBe(true);
    expect(reopened[1].open).toBe(false);
    expect(reopened[0].querySelector('.step__substitution').textContent).toBe('Rs 260,000.00 × 12 = Rs 3,120,000.00');
  });

  it('uses native <summary> elements (keyboard toggling is browser behaviour; jsdom does not emulate it)', async () => {
    const user = setup();
    await calculate(user, fromCase('EX-27-39'));
    const summaries = [...resultsRegion().querySelectorAll('details > summary')];
    expect(summaries).toHaveLength(2);
    // Enter/Space on a focused <summary> fires a click in real browsers; the click handler is what toggles.
    await user.click(summaries[1]);
    expect(resultsRegion().querySelectorAll('details')[1].open).toBe(true);
    await user.click(summaries[1]);
    expect(resultsRegion().querySelectorAll('details')[1].open).toBe(false);
  });
});

describe('T-U25 labels and keyboard-only use (TC-05)', () => {
  it('every control has a visible label or legend', () => {
    setup();
    expect(screen.getByRole('group', { name: 'Financial year' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Salary period' })).toBeTruthy();
    const label = document.querySelector('label[for="salary"]');
    expect(label.textContent).toBe('Monthly taxable salary (PKR)');
    expect(screen.getAllByRole('radio').every((r) => r.closest('label'))).toBe(true);
  });

  it('a keyboard-only session: change year with arrows, type, Enter, Tab to Reset, activate it', async () => {
    const user = setup();
    yearRadio(2027).focus();
    await user.keyboard('{ArrowDown}');
    expect(yearRadio(2026).checked).toBe(true);
    let guard = 0;
    while (document.activeElement !== amountInput() && guard < 8) { await user.tab(); guard += 1; }
    expect(document.activeElement).toBe(amountInput());
    await user.keyboard('1000000{Enter}');
    expectSummary('EX-26-37');
    await user.tab();
    expect(document.activeElement).toBe(calculateButton());
    await user.tab();
    expect(document.activeElement).toBe(resetButton());
    await user.keyboard('{Enter}');
    expect(yearRadio(2027).checked).toBe(true);
    expect(document.activeElement).toBe(amountInput());
  });
});

describe('T-U23 salary data is neither sent nor persisted (TC-02)', () => {
  it('no fetch, XHR, beacon, storage or cookie during calculate, edit and reset', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const xhrOpen = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const beacon = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });

    const user = setup();
    await calculate(user, fromCase('EX-26-26'));
    await openDetails(user);
    await user.type(amountInput(), '1');
    await user.click(resetButton());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    vi.unstubAllGlobals();
  });
});
