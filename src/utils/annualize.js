// Annualisation (BR-07, BR-08): monthly × 12, or the annual amount as entered. Exact, in paisa.

export const PERIODS = Object.freeze(['monthly', 'annual']);

export function annualize(amountPaisa, period) {
  if (typeof amountPaisa !== 'bigint' || amountPaisa < 0n) {
    throw new TypeError('annualize() expects a non-negative BigInt amount in paisa');
  }
  if (period === 'monthly') return amountPaisa * 12n;
  if (period === 'annual') return amountPaisa;
  throw new RangeError(`Unknown salary period "${String(period)}". Expected "monthly" or "annual".`);
}
