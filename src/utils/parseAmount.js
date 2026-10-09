// Parsing and validation (docs/SPEC.md §5; user-stories.md BR-03 to BR-06).
// Returns { ok: true, paisa: BigInt } or { ok: false, error: { key, message } }.
// No floating-point number is ever created from the input.

import { ERROR_MESSAGES } from './messages.js';

const INTERNATIONAL = /^[1-9]\d{0,2}(,\d{3})+$/;
const LAKH = /^[1-9]\d?(,\d{2})*,\d{3}$/;
const NO_COMMAS = /^(0|[1-9]\d*)$/;

const fail = (key) => ({ ok: false, error: Object.freeze({ key, message: ERROR_MESSAGES[key] }) });

export function parseAmount(text) {
  if (typeof text !== 'string') throw new TypeError('parseAmount() expects the raw input string');
  const value = text.trim();

  if (value === '') return fail('EMPTY'); // V1: blank is not zero
  if (/^-[\d.]/.test(value)) return fail('NEGATIVE'); // V2
  if (/^[+-]?(infinity|nan|∞)$/i.test(value)) return fail('NON_FINITE'); // V3
  if (/^\d[\d.,]*e[+-]?\d+$/i.test(value)) return fail('EXPONENT'); // V4
  if (/[^0-9.,]/.test(value)) return fail('INVALID_CHARS'); // V5: ASCII digits, comma, point only

  const parts = value.split('.');
  if (parts.length > 2) return fail('FORMAT'); // V6
  const [integerPart, fraction] = parts;
  if (fraction !== undefined && (integerPart === '' || fraction === '' || fraction.includes(','))) {
    return fail('FORMAT'); // V6
  }
  if (fraction !== undefined && fraction.length > 2) return fail('DECIMALS'); // V7

  if (integerPart.includes(',')) {
    // V8: validate grouping before removing commas.
    if (!INTERNATIONAL.test(integerPart) && !LAKH.test(integerPart)) return fail('GROUPING');
  } else if (!NO_COMMAS.test(integerPart)) {
    return fail('LEADING_ZERO'); // V9
  }

  const rupees = BigInt(integerPart.replace(/,/g, ''));
  const paisa = BigInt((fraction ?? '').padEnd(2, '0'));
  return { ok: true, paisa: rupees * 100n + paisa };
}
