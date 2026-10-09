// Salary income tax calculation (docs/SPEC.md §4; user-stories.md BR-07 to BR-16, US-07, US-08).
// Every amount is an exact rational (see rational.js); nothing here uses floating point.

import { annualize } from './annualize.js';
import { formatAmount, formatPercent, formatRs, formatRupees } from './format.js';
import { aboveMaxMessage } from './messages.js';
import {
  add, applyBasisPoints, compare, divByInteger, floor, fromPaisa, fromRupees, roundHalfUp, sub, ZERO,
} from './rational.js';
import { getRules } from '../data/rules.js';

/** The applicable slab: the highest slab whose threshold the income exceeds (slab 1 for income ≤ its limit). */
export function findSlab(rules, annualIncome) {
  let applicable = rules.slabs[0];
  for (const slab of rules.slabs) {
    if (compare(annualIncome, fromRupees(slab.threshold)) > 0) applicable = slab;
  }
  return applicable;
}

/** Division I tax = base tax + rate × (income − threshold). */
export function calculateDivisionITax(slab, annualIncome) {
  const excess = sub(annualIncome, fromRupees(slab.threshold));
  const marginalTax = applyBasisPoints(excess, slab.rateBasisPoints);
  return { excess, marginalTax, divisionITax: add(fromRupees(slab.baseTax), marginalTax) };
}

/** s.4AB surcharge for salaried individuals in the given year. Never silently zero: reason is always stated. */
export function calculateSurcharge(rules, annualIncome, divisionITax) {
  const rule = rules.surcharge;
  if (!rule.applies) {
    return { applies: false, amount: ZERO, reason: rule.reason, citation: rule.citation };
  }
  if (compare(annualIncome, fromRupees(rule.threshold)) <= 0) {
    return {
      applies: false, amount: ZERO, citation: rule.citation, threshold: rule.threshold,
      reason: `taxable income does not exceed ${formatRupees(rule.threshold)}`,
    };
  }
  return {
    applies: true,
    amount: applyBasisPoints(divisionITax, rule.rateBasisPoints),
    rateBasisPoints: rule.rateBasisPoints,
    threshold: rule.threshold,
    basis: rule.basis,
    basisAmount: divisionITax,
    citation: rule.citation,
  };
}

/** s.219: fractions under 50 paisa are disregarded; 50 paisa or more count as one rupee. */
export function applySection219(taxBeforeRounding) {
  const payable = fromRupees(roundHalfUp(taxBeforeRounding));
  const fraction = sub(taxBeforeRounding, fromRupees(floor(taxBeforeRounding)));
  const cmp = compare(payable, taxBeforeRounding);
  return { payable, fraction, outcome: cmp > 0 ? 'rounded up' : cmp < 0 ? 'dropped' : 'exact' };
}

/** Income after income tax and monthly averages, all from the s.219 tax payable (BR-10, BR-12, BR-13). */
export function deriveIncomeAfterTax(annualIncome, taxPayable) {
  const incomeAfterTax = sub(annualIncome, taxPayable);
  return {
    averageMonthlyTax: divByInteger(taxPayable, 12n),
    incomeAfterTax,
    averageMonthlyIncomeAfterTax: divByInteger(incomeAfterTax, 12n),
  };
}

/** Exact decimal text of a terminating rational (used for the s.219 fraction), e.g. "0.003815". */
function exactDecimal(value) {
  for (let places = 0n; places <= 12n; places += 1n) {
    const scaled = value.n * 10n ** places;
    if (scaled % value.d === 0n) {
      const digits = (scaled / value.d).toString().padStart(Number(places) + 1, '0');
      if (places === 0n) return digits;
      return `${digits.slice(0, -Number(places))}.${digits.slice(-Number(places))}`;
    }
  }
  return `≈${formatAmount(value).text}`;
}

function slabRange(slab) {
  if (slab.number === 1) return `does not exceed ${formatRupees(slab.upperLimit)}`;
  if (slab.upperLimit === null) return `exceeds ${formatRupees(slab.threshold)}`;
  return `exceeds ${formatRupees(slab.threshold)} but does not exceed ${formatRupees(slab.upperLimit)}`;
}

const law = (citation, source) => ({ kind: 'law', citation, source });
const assumption = (ref, text) => ({ kind: 'assumption', ref, text });

function buildSteps(c) {
  const { rules, period, inputAmount, annualIncome, slab, excess, marginalTax, divisionITax, surcharge,
    taxBeforeRounding, s219, derived } = c;
  const slabCitation = rules.citations.slabs;
  const s219Text = {
    exact: 'already a whole rupee, so nothing is rounded',
    dropped: `fraction of a rupee (${exactDecimal(s219.fraction)}) is less than 50 paisa, so it is disregarded`,
    'rounded up': `fraction of a rupee (${exactDecimal(s219.fraction)}) is 50 paisa or more, so it counts as one rupee`,
  }[s219.outcome];

  return [
    {
      id: 'annualisation', label: 'Annual taxable income',
      formula: period === 'monthly' ? 'Monthly taxable salary × 12' : 'Annual taxable salary, used as entered',
      substitution: period === 'monthly'
        ? `${formatRs(inputAmount)} × 12 = ${formatRs(annualIncome)}`
        : `Annual amount used as entered: ${formatRs(annualIncome)}`,
      value: annualIncome,
      basis: period === 'monthly'
        ? assumption('BR-07', 'Assumes the same taxable salary for all 12 months.')
        : assumption('BR-08', 'Enter total taxable salary for the year, including taxable bonuses.'),
    },
    {
      id: 'slab', label: 'Applicable slab', formula: 'The slab whose range contains the annual taxable income',
      substitution: `Slab ${slab.number}: taxable income ${slabRange(slab)}; threshold ${formatRupees(slab.threshold)}`,
      value: fromRupees(slab.threshold), slabNumber: slab.number, basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'baseTax', label: 'Base tax', formula: `Fixed amount for slab ${slab.number}`,
      substitution: formatRs(fromRupees(slab.baseTax)), value: fromRupees(slab.baseTax), basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'excess', label: 'Income above threshold', formula: 'Annual taxable income − threshold',
      substitution: `${formatRs(annualIncome)} − ${formatRupees(slab.threshold)} = ${formatRs(excess)}`,
      value: excess, basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'rate', label: 'Marginal rate', formula: `Rate for slab ${slab.number}`,
      substitution: formatPercent(slab.rateBasisPoints), value: null, rateBasisPoints: slab.rateBasisPoints,
      basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'marginalTax', label: 'Marginal tax', formula: 'Income above threshold × marginal rate',
      substitution: `${formatRs(excess)} × ${formatPercent(slab.rateBasisPoints)} = ${formatRs(marginalTax)}`,
      value: marginalTax, basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'divisionITax', label: 'Income tax before surcharge (Division I)', formula: 'Base tax + marginal tax',
      substitution: `${formatRs(fromRupees(slab.baseTax))} + ${formatRs(marginalTax)} = ${formatRs(divisionITax)}`,
      value: divisionITax, basis: law(slabCitation, rules.ordinance),
    },
    {
      id: 'surcharge', label: 'Surcharge',
      formula: surcharge.applies ? `${formatPercent(surcharge.rateBasisPoints)} × Division I tax` : 'Not applicable',
      substitution: surcharge.applies
        ? `Taxable income ${formatRs(annualIncome)} exceeds ${formatRupees(surcharge.threshold)}, so `
          + `${formatPercent(surcharge.rateBasisPoints)} × ${formatRs(divisionITax)} = ${formatRs(surcharge.amount)}`
        : `Not applicable: ${surcharge.reason}`,
      value: surcharge.amount, applies: surcharge.applies, basis: law(surcharge.citation, rules.ordinance),
    },
    {
      id: 'taxBeforeRounding', label: 'Calculated tax before rounding', formula: 'Division I tax + surcharge',
      substitution: `${formatRs(divisionITax)} + ${formatRs(surcharge.amount)} = ${formatRs(taxBeforeRounding)}`,
      value: taxBeforeRounding, basis: law(`${slabCitation}; ${surcharge.citation}`, rules.ordinance),
    },
    {
      id: 'taxPayable', label: 'Annual tax payable (rounded to the nearest rupee under s.219)',
      formula: 'Round the calculated tax to the nearest rupee',
      substitution: `${formatRs(taxBeforeRounding)}: ${s219Text} → ${formatRs(s219.payable)}`,
      value: s219.payable, outcome: s219.outcome, basis: law(rules.citations.rounding, rules.ordinance),
    },
    {
      id: 'averageMonthlyTax', label: 'Average monthly tax', formula: 'Annual tax payable ÷ 12',
      substitution: `${formatRs(s219.payable)} ÷ 12 = ${formatRs(derived.averageMonthlyTax)}`,
      value: derived.averageMonthlyTax,
      basis: assumption('BR-12', 'Monthly figures are annual amounts divided by 12. They are estimates, not a reconciliation of tax withheld on any payslip.'),
    },
    {
      id: 'incomeAfterTax', label: 'Annual income after income tax', formula: 'Annual taxable income − annual tax payable',
      substitution: `${formatRs(annualIncome)} − ${formatRs(s219.payable)} = ${formatRs(derived.incomeAfterTax)}`,
      value: derived.incomeAfterTax,
      basis: assumption('BR-13', 'Income after income tax excludes other payroll deductions such as EOBI, provident fund, Zakat and loan repayments.'),
    },
    {
      id: 'averageMonthlyIncomeAfterTax', label: 'Average monthly income after income tax',
      formula: 'Annual income after income tax ÷ 12',
      substitution: `${formatRs(derived.incomeAfterTax)} ÷ 12 = ${formatRs(derived.averageMonthlyIncomeAfterTax)}`,
      value: derived.averageMonthlyIncomeAfterTax,
      basis: assumption('BR-13', 'Income after income tax excludes other payroll deductions such as EOBI, provident fund, Zakat and loan repayments.'),
    },
  ].map((step, i) => Object.freeze({ number: i + 1, ...step }));
}

/**
 * Calculates a salary-only estimate.
 * @param {{ taxYear: number, period: 'monthly'|'annual', amountPaisa: bigint }} input amount from parseAmount()
 * @returns {{ ok: true, ... } | { ok: false, error: { key: 'ABOVE_MAX', message, annual, max } }}
 * Throws for an unknown tax year, an unknown period or a malformed amount; it never returns a silent zero.
 */
export function calculateTax({ taxYear, period, amountPaisa }) {
  const rules = getRules(taxYear);
  const annualPaisa = annualize(amountPaisa, period);
  const annualIncome = fromPaisa(annualPaisa);
  const maximum = fromRupees(rules.supportedMaximum);

  if (compare(annualIncome, maximum) > 0) {
    const annual = formatAmount(annualIncome).text;
    const max = formatAmount(maximum).text;
    return {
      ok: false,
      error: Object.freeze({ key: 'ABOVE_MAX', message: aboveMaxMessage({ annual, max, taxYear }), annual, max }),
    };
  }

  const slab = findSlab(rules, annualIncome);
  const { excess, marginalTax, divisionITax } = calculateDivisionITax(slab, annualIncome);
  const surcharge = calculateSurcharge(rules, annualIncome, divisionITax);
  const taxBeforeRounding = add(divisionITax, surcharge.amount);
  const s219 = applySection219(taxBeforeRounding);
  const derived = deriveIncomeAfterTax(annualIncome, s219.payable);
  const inputAmount = fromPaisa(amountPaisa);

  return Object.freeze({
    ok: true,
    taxYear: rules.taxYear,
    yearLabel: rules.label,
    period,
    inputAmount,
    annualTaxableIncome: annualIncome,
    slab,
    excess,
    marginalTax,
    divisionITax,
    surcharge,
    taxBeforeRounding,
    section219: { outcome: s219.outcome, fraction: s219.fraction },
    taxPayable: s219.payable,
    averageMonthlyTax: derived.averageMonthlyTax,
    incomeAfterTax: derived.incomeAfterTax,
    averageMonthlyIncomeAfterTax: derived.averageMonthlyIncomeAfterTax,
    showCliffNote: surcharge.applies, // US-08-AC5: TY 2026 above Rs 10,000,000 only
    steps: buildSteps({
      rules, period, inputAmount, annualIncome, slab, excess, marginalTax, divisionITax, surcharge,
      taxBeforeRounding, s219, derived,
    }),
  });
}

