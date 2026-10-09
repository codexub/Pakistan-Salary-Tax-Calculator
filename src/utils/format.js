// Display formatting (BR-11): international grouping, exactly 2 decimals, half up at display time only.
// `approx` is true when the 2-dp text is not exactly equal to the value (the UI prefixes "≈").

import { compare, fromPaisa, isRational, roundHalfUp, ZERO } from './rational.js';

function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatAmount(value) {
  if (!isRational(value)) throw new TypeError('formatAmount() expects an exact rational amount');
  if (compare(value, ZERO) < 0) throw new RangeError('formatAmount() does not format negative amounts');
  const paisa = roundHalfUp(value, 100n);
  const rupees = paisa / 100n;
  const cents = (paisa % 100n).toString().padStart(2, '0');
  return {
    text: `${groupThousands(rupees.toString())}.${cents}`,
    approx: compare(fromPaisa(paisa), value) !== 0,
  };
}

/** "Rs 1,234.50", or "≈Rs 333.33" when rounded for display. */
export function formatRs(value) {
  const { text, approx } = formatAmount(value);
  return `${approx ? '≈' : ''}Rs ${text}`;
}

/** Whole-rupee BigInt (e.g. a slab threshold) as "Rs 1,200,000". */
export function formatRupees(rupees) {
  if (typeof rupees !== 'bigint') throw new TypeError('formatRupees() expects a BigInt');
  return `Rs ${groupThousands(rupees.toString())}`;
}

/** Basis points as a percentage: 2300n → "23%", 150n → "1.5%". */
export function formatPercent(basisPoints) {
  if (typeof basisPoints !== 'bigint') throw new TypeError('formatPercent() expects BigInt basis points');
  const whole = basisPoints / 100n;
  const rest = (basisPoints % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return `${whole}${rest ? `.${rest}` : ''}%`;
}
