import { describe, expect, it } from 'vitest';
import { parseAmount } from '../src/utils/parseAmount.js';
import { documentedErrors, documentedValidInputs } from './helpers.js';

describe('T-P01 documented valid inputs parse to exact paisa (BR-03 to BR-05, US-04)', () => {
  const valid = documentedValidInputs();

  it('reads the BR-05 table from user-stories.md', () => {
    expect(valid).toHaveLength(16);
  });

  it.each(valid)('$input', ({ input, paisa }) => {
    expect(parseAmount(input)).toEqual({ ok: true, paisa });
  });

  it('accepts exactly two decimal places (US-04-AC4)', () => {
    expect(parseAmount('100.12')).toEqual({ ok: true, paisa: 10012n });
  });
});

describe('T-P02 every documented invalid input returns its key and message (BR-06, US-11-AC1)', () => {
  const errors = documentedErrors();

  it('reads all nine non-range error keys from user-stories.md', () => {
    expect(errors.map((e) => e.key)).toEqual([
      'EMPTY', 'NEGATIVE', 'NON_FINITE', 'EXPONENT', 'INVALID_CHARS', 'FORMAT', 'DECIMALS', 'GROUPING', 'LEADING_ZERO',
    ]);
  });

  const rows = errors.flatMap(({ key, inputs, message }) => inputs.map((input) => ({ key, input, message })));
  it.each(rows)('$key ← "$input"', ({ key, input, message }) => {
    expect(parseAmount(input)).toEqual({ ok: false, error: { key, message } });
  });
});

describe('T-P03 check order (US-11-AC3)', () => {
  it.each([
    ['-1e6', 'NEGATIVE'],
    ['-abc', 'INVALID_CHARS'],
    ['-Infinity', 'NON_FINITE'],
    ['1.000,00', 'FORMAT'],
    ['0.001', 'DECIMALS'],
    ['1,000.999', 'DECIMALS'],
    ['00.50', 'LEADING_ZERO'],
    ['01,000', 'GROUPING'],
  ])('"%s" → %s', (input, key) => {
    expect(parseAmount(input).error.key).toBe(key);
  });
});

describe('T-P04 blank is not zero (BR-03, US-11-AC2)', () => {
  it.each(['', '   ', '\t'])('blank %j → EMPTY', (input) => {
    expect(parseAmount(input).error.key).toBe('EMPTY');
  });
  it.each(['0', '0.0', '0.00'])('%s → 0 paisa', (input) => {
    expect(parseAmount(input)).toEqual({ ok: true, paisa: 0n });
  });
});

describe('precision: no floating point (TC-03)', () => {
  it.each([
    ['0.29', 29n], // 0.29 * 100 in floating point is 28.999999999999996
    ['1.15', 115n], // 1.15 * 100 in floating point is 114.99999999999999
    ['8,33,333.34', 83_333_334n],
    ['999,999,999,999,999.99', 99_999_999_999_999_999n], // above Number.MAX_SAFE_INTEGER, still exact
  ])('%s → %s paisa', (input, paisa) => {
    expect(parseAmount(input)).toEqual({ ok: true, paisa });
  });

  it('rejects non-string input instead of guessing', () => {
    expect(() => parseAmount(1200000)).toThrow(TypeError);
    expect(() => parseAmount(undefined)).toThrow(TypeError);
  });
});
