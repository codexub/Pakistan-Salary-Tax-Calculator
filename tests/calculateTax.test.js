import { describe, expect, it } from 'vitest';
import { annualize } from '../src/utils/annualize.js';
import { applySection219, calculateTax } from '../src/utils/calculateTax.js';
import { formatAmount } from '../src/utils/format.js';
import { ERROR_MESSAGES } from '../src/utils/messages.js';
import { parseAmount } from '../src/utils/parseAmount.js';
import { isRational } from '../src/utils/rational.js';
import ty2027 from '../src/data/ty2027.js';
import { assertRulesConsistent, getRules, SUPPORTED_TAX_YEARS } from '../src/data/rules.js';
import { casesById, exact, expected, sameValue } from './helpers.js';

const run = (c) => {
  const parsed = parseAmount(c.input);
  expect(parsed.ok, `fixture input ${c.input} must parse`).toBe(true);
  return calculateTax({ taxYear: c.taxYear, period: c.period, amountPaisa: parsed.paisa });
};

function expectMoney(actual, money, label) {
  expect(isRational(actual), `${label} is an exact rational`).toBe(true);
  expect(sameValue(actual, money.exact), `${label}: exact ${money.exact}`).toBe(true);
  expect(formatAmount(actual), `${label}: display`).toEqual({ text: money.display, approx: money.approx });
}

const groups = [...new Set(expected.cases.map((c) => c.group))];

describe('T-C01 every reference case matches the independently derived values (Appendix A)', () => {
  it('fixture holds all Appendix A cases for both years', () => {
    expect(expected.cases).toHaveLength(114);
    expect(new Set(expected.cases.map((c) => c.taxYear))).toEqual(new Set([2026, 2027]));
  });

  for (const group of groups) {
    describe(group, () => {
      const cases = expected.cases.filter((c) => c.group === group);
      it.each(cases)('$id: $input $period, Tax Year $taxYear', (c) => {
        const r = run(c);
        if (c.error) {
          expect(r.ok).toBe(false);
          expect(r.error.key).toBe('ABOVE_MAX');
          return;
        }
        expect(r.ok).toBe(true);
        const e = c.result;
        expectMoney(r.annualTaxableIncome, c.annual, 'annual taxable income');
        expect(r.slab.number).toBe(e.slab);
        expect(r.slab.threshold).toBe(BigInt(e.threshold));
        expect(r.slab.rateBasisPoints).toBe(BigInt(e.ratePercent) * 100n);
        expectMoney({ n: r.slab.baseTax, d: 1n }, e.baseTax, 'base tax');
        expectMoney(r.excess, e.excess, 'excess');
        expectMoney(r.marginalTax, e.marginalTax, 'marginal tax');
        expectMoney(r.divisionITax, e.divisionITax, 'Division I tax');
        expectMoney(r.surcharge.amount, e.surcharge, 'surcharge');
        expect(r.surcharge.applies).toBe(e.surchargeApplies);
        expectMoney(r.taxBeforeRounding, e.taxBeforeRounding, 'tax before rounding');
        expectMoney(r.taxPayable, e.taxPayable, 'tax payable');
        expect(r.section219.outcome).toBe(e.s219);
        expectMoney(r.averageMonthlyTax, e.avgMonthlyTax, 'average monthly tax');
        expectMoney(r.incomeAfterTax, e.incomeAfterTax, 'income after tax');
        expectMoney(r.averageMonthlyIncomeAfterTax, e.avgMonthlyIncomeAfterTax, 'average monthly income after tax');
      });
    });
  }
});

describe('coverage of the required examples (derived from the fixture, not the app)', () => {
  const annualOf = (c) => exact(c.annual.exact);
  const atRupees = (c, rupees) => { const a = annualOf(c); return a.n === rupees * a.d; };
  const plusPaisa = (c, rupees, p) => { const a = annualOf(c); return a.n * 100n === (rupees * 100n + p) * a.d; };

  for (const taxYear of SUPPORTED_TAX_YEARS) {
    const rules = getRules(taxYear);
    const yearCases = expected.cases.filter((c) => c.taxYear === taxYear && c.result);

    it(`Tax Year ${taxYear}: every band has an example inside it`, () => {
      for (const slab of rules.slabs) {
        const inBand = yearCases.filter((c) => c.result.slab === slab.number);
        expect(inBand.length, `band ${slab.number}`).toBeGreaterThanOrEqual(3);
      }
    });

    it(`Tax Year ${taxYear}: every boundary is tested 0.01 below, exactly at, and 0.01 above`, () => {
      for (const slab of rules.slabs.filter((s) => s.upperLimit !== null)) {
        const b = slab.upperLimit;
        expect(yearCases.some((c) => plusPaisa(c, b, -1n)), `${b} − 0.01`).toBe(true);
        expect(yearCases.some((c) => atRupees(c, b)), `${b}`).toBe(true);
        expect(yearCases.some((c) => plusPaisa(c, b, 1n)), `${b} + 0.01`).toBe(true);
      }
    });

    it(`Tax Year ${taxYear}: surcharge threshold and supported maximum are tested below, at and above`, () => {
      for (const b of [10_000_000n, rules.supportedMaximum]) {
        const all = expected.cases.filter((c) => c.taxYear === taxYear);
        expect(all.some((c) => plusPaisa(c, b, -1n)), `${b} − 0.01`).toBe(true);
        expect(all.some((c) => atRupees(c, b)), `${b}`).toBe(true);
        expect(all.some((c) => plusPaisa(c, b, 1n)), `${b} + 0.01`).toBe(true);
      }
    });
  }
});

describe('T-C02 monthly and annual equivalents give identical results (US-03-AC2)', () => {
  const pairs = [
    ['EX-26-22', 'EX-26-12'], ['EX-26-23', 'EX-26-14'], ['EX-26-35', 'EX-26-36'], ['EX-26-37', 'EX-26-38'],
    ['EX-27-26', 'EX-27-12'], ['EX-27-27', 'EX-27-14'], ['EX-27-39', 'EX-27-40'], ['EX-27-41', 'EX-27-42'],
  ];
  const fields = ['annualTaxableIncome', 'excess', 'marginalTax', 'divisionITax', 'taxBeforeRounding', 'taxPayable',
    'averageMonthlyTax', 'incomeAfterTax', 'averageMonthlyIncomeAfterTax'];

  it.each(pairs)('%s (monthly) = %s (annual)', (monthlyId, annualId) => {
    expect(casesById[monthlyId].period).toBe('monthly');
    expect(casesById[annualId].period).toBe('annual');
    const m = run(casesById[monthlyId]);
    const a = run(casesById[annualId]);
    for (const f of fields) expect(m[f], f).toEqual(a[f]);
    expect(m.slab).toBe(a.slab);
    expect(m.surcharge.amount).toEqual(a.surcharge.amount);
  });
});

describe('T-C05/T-C06 surcharge threshold, basis and cliff note (US-08)', () => {
  it('TY 2026 at exactly Rs 10,000,000: no surcharge, reason stated (EX-26-25)', () => {
    const r = run(casesById['EX-26-25']);
    expect(r.surcharge.applies).toBe(false);
    expect(r.surcharge.reason).toBe('taxable income does not exceed Rs 10,000,000');
    expect(r.showCliffNote).toBe(false);
  });

  it('TY 2026 at Rs 10,000,000.01: 9% of the whole Division I tax (EX-26-26)', () => {
    const r = run(casesById['EX-26-26']);
    expect(r.surcharge.applies).toBe(true);
    expect(r.surcharge.basis).toBe('Division I income tax');
    expect(r.surcharge.basisAmount).toEqual(r.divisionITax);
    expect(r.surcharge.rateBasisPoints).toBe(900n);
    // surcharge × 10000 = Division I tax × 900, checked by cross-multiplication
    expect(r.surcharge.amount.n * 10000n * r.divisionITax.d).toBe(r.divisionITax.n * 900n * r.surcharge.amount.d);
    expect(r.showCliffNote).toBe(true);
  });

  it('TY 2026 cliff: tax payable jumps by Rs 241,290 across the threshold (EX-26-25 → EX-26-26)', () => {
    const below = run(casesById['EX-26-25']).taxPayable;
    const above = run(casesById['EX-26-26']).taxPayable;
    expect(above.n - below.n).toBe(241_290n);
  });

  it('TY 2027: never a surcharge, with the withdrawal reason (EX-27-30, EX-27-42)', () => {
    for (const id of ['EX-27-30', 'EX-27-42']) {
      const r = run(casesById[id]);
      expect(r.surcharge.applies).toBe(false);
      expect(r.surcharge.reason).toBe('withdrawn for salaried individuals by Finance Act, 2026');
      expect(r.showCliffNote).toBe(false);
    }
  });

  it('cliff note shows exactly when the fixture says the surcharge applies', () => {
    for (const c of expected.cases.filter((x) => x.result)) {
      expect(run(c).showCliffNote, c.id).toBe(c.result.surchargeApplies);
    }
  });
});

describe('s.219 rounding of tax payable (BR-10, US-07-AC6)', () => {
  it.each([
    ['1/2', '1/1', 'rounded up'],
    ['4999/10000', '0/1', 'dropped'],
    ['1340499993/500', '2681000/1', 'rounded up'], // 2,680,999.986 (EX-26-27)
    ['584458000763/200000', '2922290/1', 'dropped'], // 2,922,290.003815 (EX-26-26)
    ['6000/1', '6000/1', 'exact'],
  ])('%s → %s (%s)', (before, payable, outcome) => {
    const b = exact(before);
    const r = applySection219({ n: b.n, d: b.d });
    expect(sameValue(r.payable, payable)).toBe(true);
    expect(r.outcome).toBe(outcome);
  });
});

describe('T-C04 breakdown steps (US-07-AC1, US-07-AC7, US-09-AC1)', () => {
  const ids = ['annualisation', 'slab', 'baseTax', 'excess', 'rate', 'marginalTax', 'divisionITax', 'surcharge',
    'taxBeforeRounding', 'taxPayable', 'averageMonthlyTax', 'incomeAfterTax', 'averageMonthlyIncomeAfterTax'];

  it.each(['EX-26-01', 'EX-26-26', 'EX-27-02', 'EX-27-25'])('%s has the 13 steps in order with a basis', (id) => {
    const r = run(casesById[id]);
    expect(r.steps.map((s) => s.id)).toEqual(ids);
    expect(r.steps.map((s) => s.number)).toEqual(ids.map((_, i) => i + 1));
    r.steps.forEach((s, i) => {
      const expectAssumption = [0, 10, 11, 12].includes(i);
      expect(s.basis.kind, s.id).toBe(expectAssumption ? 'assumption' : 'law');
      expect(s.substitution.length, s.id).toBeGreaterThan(0);
    });
    expect(r.steps[0].basis.ref).toBe(casesById[id].period === 'monthly' ? 'BR-07' : 'BR-08');
  });

  it('monthly zero shows "Rs 0.00 × 12 = Rs 0.00" (EX-27-02, US-07-AC2)', () => {
    expect(run(casesById['EX-27-02']).steps[0].substitution).toBe('Rs 0.00 × 12 = Rs 0.00');
  });

  it('step texts name the slab, surcharge outcome and s.219 outcome', () => {
    const r26 = run(casesById['EX-26-26']);
    expect(r26.steps[1].substitution).toBe('Slab 6: taxable income exceeds Rs 4,100,000; threshold Rs 4,100,000');
    expect(r26.steps[7].substitution).toBe(
      'Taxable income Rs 10,000,000.01 exceeds Rs 10,000,000, so 9% × ≈Rs 2,681,000.00 = ≈Rs 241,290.00');
    expect(r26.steps[9].substitution).toContain('(0.003815) is less than 50 paisa, so it is disregarded');
    expect(r26.steps[9].substitution).toMatch(/→ Rs 2,922,290\.00$/);

    expect(run(casesById['EX-27-30']).steps[7].substitution)
      .toBe('Not applicable: withdrawn for salaried individuals by Finance Act, 2026');
    expect(run(casesById['EX-27-08']).steps[9].substitution).toContain('is 50 paisa or more, so it counts as one rupee');
    expect(run(casesById['EX-27-12']).steps[1].substitution)
      .toBe('Slab 1: taxable income does not exceed Rs 600,000; threshold Rs 0');
  });

  it('labels "Calculated tax before rounding" and "Annual tax payable" separately (US-07-AC7)', () => {
    const [before, payable] = run(casesById['EX-27-08']).steps.slice(8, 10);
    expect(before.label).toBe('Calculated tax before rounding');
    expect(payable.label).toBe('Annual tax payable (rounded to the nearest rupee under s.219)');
  });
});

describe('T-C07 amounts above the supported maximum (BR-16, US-10)', () => {
  it.each(['EX-26-31', 'EX-26-34', 'EX-27-35', 'EX-27-38'])('%s returns ABOVE_MAX with no figures', (id) => {
    const c = casesById[id];
    const r = run(c);
    expect(r).toEqual({
      ok: false,
      error: {
        key: 'ABOVE_MAX',
        annual: c.annual.display,
        max: c.max.display,
        message: `Annualised taxable salary of Rs ${c.annual.display} exceeds Rs ${c.max.display}, the highest amount this version supports for Tax Year ${c.taxYear}. Above this amount, super tax under section 4C also applies, and this version doesn't calculate it. No result is shown.`,
      },
    });
  });
});

describe('T-C08 year labels (US-01-AC4)', () => {
  it('labels each result with its year', () => {
    expect(run(casesById['EX-26-36']).yearLabel).toBe('FY 2025-26 (Tax Year 2026)');
    expect(run(casesById['EX-27-40']).yearLabel).toBe('FY 2026-27 (Tax Year 2027)');
  });
});

describe('no silent zero for unknown years, missing rules or bad input', () => {
  const amountPaisa = 300_000_000n;

  it.each([2025, 2028, '2027', undefined, null])('unknown tax year %j throws', (taxYear) => {
    expect(() => calculateTax({ taxYear, period: 'annual', amountPaisa })).toThrow(/No verified tax rules/);
    expect(() => getRules(taxYear)).toThrow(RangeError);
  });

  it.each(['weekly', undefined, 'Monthly'])('unknown period %j throws', (period) => {
    expect(() => calculateTax({ taxYear: 2027, period, amountPaisa })).toThrow(/Unknown salary period/);
  });

  it.each([3_000_000, -1n, '300000000'])('malformed amount %s throws', (bad) => {
    expect(() => calculateTax({ taxYear: 2027, period: 'annual', amountPaisa: bad })).toThrow(TypeError);
  });

  it('only the two verified years are registered', () => {
    expect(SUPPORTED_TAX_YEARS).toEqual([2026, 2027]);
  });

  it('rule sets are internally consistent, and a tampered set is rejected', () => {
    expect(assertRulesConsistent(getRules(2026))).toBe(true);
    expect(assertRulesConsistent(getRules(2027))).toBe(true);
    const tampered = { ...ty2027, slabs: ty2027.slabs.map((s) => (s.number === 5 ? { ...s, baseTax: 316_001n } : s)) };
    expect(() => assertRulesConsistent(tampered)).toThrow(/base tax of slab 5/);
    expect(() => assertRulesConsistent({ ...ty2027, supportedMaximum: undefined })).toThrow(/supported maximum/);
    expect(() => assertRulesConsistent({ ...ty2027, surcharge: undefined })).toThrow(/surcharge/);
  });

  it('rules are frozen', () => {
    expect(Object.isFrozen(getRules(2026))).toBe(true);
    expect(Object.isFrozen(getRules(2027).slabs[0])).toBe(true);
  });
});

describe('annualisation (BR-07, BR-08)', () => {
  it('multiplies monthly paisa by 12 exactly and leaves annual unchanged', () => {
    expect(annualize(4_166_666_666n, 'monthly')).toBe(49_999_999_992n);
    expect(annualize(1n, 'monthly')).toBe(12n);
    expect(annualize(123n, 'annual')).toBe(123n);
  });
});

describe('T-C09 every monetary result is exact (TC-03)', () => {
  it('no JS number appears in any monetary field', () => {
    for (const id of ['EX-26-26', 'EX-26-32', 'EX-27-37', 'EX-27-46', 'EX-26-05']) {
      const r = run(casesById[id]);
      for (const f of ['inputAmount', 'annualTaxableIncome', 'excess', 'marginalTax', 'divisionITax', 'taxBeforeRounding',
        'taxPayable', 'averageMonthlyTax', 'incomeAfterTax', 'averageMonthlyIncomeAfterTax']) {
        expect(isRational(r[f]), `${id} ${f}`).toBe(true);
      }
      for (const s of r.steps) if (s.value !== null) expect(isRational(s.value), `${id} step ${s.id}`).toBe(true);
    }
  });

  it('error keys used by the engine all have documented messages', () => {
    expect(Object.keys(ERROR_MESSAGES)).toHaveLength(9);
  });
});
