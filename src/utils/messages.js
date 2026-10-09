// Error messages from docs/user-stories.md BR-06 (exact wording).

export const ERROR_MESSAGES = Object.freeze({
  EMPTY: 'Enter your taxable salary.',
  NEGATIVE: 'The amount cannot be negative.',
  NON_FINITE: 'Enter a finite amount in rupees.',
  EXPONENT: "Scientific notation isn't supported. Type the full amount, e.g. 1000000.",
  INVALID_CHARS: 'Use digits only, with optional commas and a decimal point.',
  FORMAT: 'Enter a number like 1500 or 1500.50.',
  DECIMALS: 'Use at most two decimal places.',
  GROUPING: 'Commas must follow international grouping (1,200,000) or lakh grouping (12,00,000), not a mix.',
  LEADING_ZERO: 'Remove leading zeros, e.g. 7 instead of 007.',
});

export function aboveMaxMessage({ annual, max, taxYear }) {
  return `Annualised taxable salary of Rs ${annual} exceeds Rs ${max}, the highest amount this version supports for Tax Year ${taxYear}. Above this amount, super tax under section 4C also applies, and this version doesn't calculate it. No result is shown.`;
}
