import ty2026 from './ty2026.js';
import ty2027 from './ty2027.js';

/**
 * Throws if a rule set is malformed: slabs must start at 0, be contiguous, and each base tax must equal
 * the previous slab's tax at its upper limit (docs/tax-rules.md §1.8 and §2.8).
 */
export function assertRulesConsistent(rules) {
  const { slabs } = rules;
  if (!Array.isArray(slabs) || slabs.length === 0) throw new Error(`Tax Year ${rules.taxYear}: no slabs`);
  if (slabs[0].threshold !== 0n || slabs[0].baseTax !== 0n) {
    throw new Error(`Tax Year ${rules.taxYear}: first slab must start at 0 with no base tax`);
  }
  slabs.forEach((slab, i) => {
    const last = i === slabs.length - 1;
    if ((slab.upperLimit === null) !== last) {
      throw new Error(`Tax Year ${rules.taxYear}: only the last slab may be unbounded`);
    }
    if (last) return;
    const next = slabs[i + 1];
    if (next.threshold !== slab.upperLimit) {
      throw new Error(`Tax Year ${rules.taxYear}: slab ${next.number} does not start where slab ${slab.number} ends`);
    }
    // Tax at the shared boundary, in basis-point units, must agree under both formulas.
    const lowerFormula = slab.baseTax * 10000n + (slab.upperLimit - slab.threshold) * slab.rateBasisPoints;
    if (lowerFormula !== next.baseTax * 10000n) {
      throw new Error(`Tax Year ${rules.taxYear}: base tax of slab ${next.number} does not match slab ${slab.number}`);
    }
  });
  if (typeof rules.supportedMaximum !== 'bigint' || rules.supportedMaximum <= 0n) {
    throw new Error(`Tax Year ${rules.taxYear}: missing supported maximum`);
  }
  if (!rules.surcharge || typeof rules.surcharge.applies !== 'boolean') {
    throw new Error(`Tax Year ${rules.taxYear}: missing surcharge rule`);
  }
  return true;
}

const REGISTRY = new Map([ty2026, ty2027].map((rules) => {
  assertRulesConsistent(rules);
  return [rules.taxYear, rules];
}));

export const SUPPORTED_TAX_YEARS = Object.freeze([...REGISTRY.keys()]);
export const DEFAULT_TAX_YEAR = 2027;

/** Returns the verified rules for a tax year, or throws. It never falls back to another year or to zero. */
export function getRules(taxYear) {
  const rules = REGISTRY.get(taxYear);
  if (!rules) {
    throw new RangeError(`No verified tax rules for tax year ${String(taxYear)}. Supported: ${SUPPORTED_TAX_YEARS.join(', ')}.`);
  }
  return rules;
}
