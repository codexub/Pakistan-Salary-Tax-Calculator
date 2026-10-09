// Exact non-floating-point arithmetic for money (TC-03).
// A rational is a frozen { n, d } pair of BigInts in rupees, with d > 0 and gcd(n, d) = 1.

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function rational(n, d = 1n) {
  if (typeof n !== 'bigint' || typeof d !== 'bigint') {
    throw new TypeError('rational() requires BigInt numerator and denominator');
  }
  if (d === 0n) throw new RangeError('rational() denominator must not be zero');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return Object.freeze({ n: n / g, d: d / g });
}

export const ZERO = rational(0n);

export function isRational(x) {
  return x !== null && typeof x === 'object' && typeof x.n === 'bigint' && typeof x.d === 'bigint';
}

export const fromPaisa = (paisa) => rational(paisa, 100n);
export const fromRupees = (rupees) => rational(rupees, 1n);

export const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
export const divByInteger = (a, k) => rational(a.n, a.d * k);

/** Multiply by a rate held as integer basis points (1% = 100). */
export const applyBasisPoints = (a, basisPoints) => rational(a.n * basisPoints, a.d * 10000n);

export function compare(a, b) {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export const equals = (a, b) => a.n === b.n && a.d === b.d;

/** Largest integer ≤ a. */
export function floor(a) {
  const q = a.n / a.d; // BigInt division truncates toward zero
  return a.n < 0n && q * a.d !== a.n ? q - 1n : q;
}

/** Round to a whole number of units, halves up: floor(a × units + 1/2). Returns a BigInt count of units. */
export function roundHalfUp(a, unitsPerRupee = 1n) {
  return floor(add(mul(a, rational(unitsPerRupee)), rational(1n, 2n)));
}
