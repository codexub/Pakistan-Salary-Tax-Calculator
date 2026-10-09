import { describe, expect, it } from 'vitest';
import { formatAmount, formatPercent, formatRs, formatRupees } from '../src/utils/format.js';
import { rational } from '../src/utils/rational.js';

// Expected strings from docs/TEST_PLAN.md §4 (T-F01, T-F03) and user-stories.md BR-11.
describe('T-F01 two decimals, half up, ≈ marker (BR-11)', () => {
  it.each([
    [rational(0n), '0.00', false],
    [rational(5n, 1000n), '0.01', true], // 0.005 rounds half up
    [rational(4999n, 1_000_000n), '0.00', true], // 0.004999
    [rational(4000n, 12n), '333.33', true],
    [rational(2469135n, 2n), '1,234,567.50', false],
    [rational(116000n, 12n), '9,666.67', true],
    [rational(150_000_000n), '150,000,000.00', false], // T-F03: international grouping on output
  ])('%o → %s (approx %s)', (value, text, approx) => {
    expect(formatAmount(value)).toEqual({ text, approx });
  });

  it('prefixes Rs and the ≈ marker', () => {
    expect(formatRs(rational(4000n, 12n))).toBe('≈Rs 333.33');
    expect(formatRs(rational(276_000n))).toBe('Rs 276,000.00');
  });

  it('refuses floats and negative values instead of guessing', () => {
    expect(() => formatAmount(0.1)).toThrow(TypeError);
    expect(() => formatAmount(rational(-1n))).toThrow(RangeError);
  });
});

describe('rupees and rates', () => {
  it('formats whole-rupee thresholds and basis-point rates', () => {
    expect(formatRupees(10_000_000n)).toBe('Rs 10,000,000');
    expect(formatRupees(0n)).toBe('Rs 0');
    expect(formatPercent(2300n)).toBe('23%');
    expect(formatPercent(150n)).toBe('1.5%');
    expect(formatPercent(0n)).toBe('0%');
  });
});
