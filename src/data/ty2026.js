// FY 2025-26 (Tax Year 2026). Verified 2026-10-09; see docs/tax-rules.md §1 and §F.
// Amounts in whole rupees (BigInt); rates in basis points (1% = 100n).

const FINANCE_ACT_2025 = {
  title: 'Finance Act, 2025 (Act No. XIX of 2025)',
  url: 'https://download1.fbr.gov.pk/Docs/2025629106147620FInanceAct2025.pdf',
};
const ORDINANCE_2025 = {
  title: 'Income Tax Ordinance, 2001, amended up to 31.07.2025 (FBR consolidation)',
  url: 'https://download1.fbr.gov.pk/Docs/2025881983148210Income-Tax-Ordinance,-2001-Amended-upto-31.07.2025.pdf',
};

export default Object.freeze({
  taxYear: 2026,
  financialYear: 'FY 2025-26',
  label: 'FY 2025-26 (Tax Year 2026)',
  period: Object.freeze({ start: '1 July 2025', end: '30 June 2026' }),

  // First Schedule, Part I, Division I, clause (2), as substituted by Finance Act 2025 s.10(48)(A)(i).
  slabs: Object.freeze([
    Object.freeze({ number: 1, threshold: 0n, upperLimit: 600_000n, baseTax: 0n, rateBasisPoints: 0n }),
    Object.freeze({ number: 2, threshold: 600_000n, upperLimit: 1_200_000n, baseTax: 0n, rateBasisPoints: 100n }),
    Object.freeze({ number: 3, threshold: 1_200_000n, upperLimit: 2_200_000n, baseTax: 6_000n, rateBasisPoints: 1_100n }),
    Object.freeze({ number: 4, threshold: 2_200_000n, upperLimit: 3_200_000n, baseTax: 116_000n, rateBasisPoints: 2_300n }),
    Object.freeze({ number: 5, threshold: 3_200_000n, upperLimit: 4_100_000n, baseTax: 346_000n, rateBasisPoints: 3_000n }),
    Object.freeze({ number: 6, threshold: 4_100_000n, upperLimit: null, baseTax: 616_000n, rateBasisPoints: 3_500n }),
  ]),

  // s.4AB proviso (inserted by Finance Act 2025): 9% of the Division I tax where taxable income
  // exceeds Rs 10 million. No marginal relief (docs/tax-rules.md §F8).
  surcharge: Object.freeze({
    applies: true,
    rateBasisPoints: 900n,
    threshold: 10_000_000n,
    basis: 'Division I income tax',
    citation: 'Income Tax Ordinance, 2001, s.4AB proviso (inserted by Finance Act, 2025)',
  }),

  // s.4C super tax (Division IIB, "tax year 2026 and onwards") starts above Rs 150 million; not calculated.
  supportedMaximum: 150_000_000n,

  citations: Object.freeze({
    slabs: 'Income Tax Ordinance, 2001, First Schedule, Part I, Division I, clause (2), as substituted by Finance Act, 2025',
    surcharge: 'Income Tax Ordinance, 2001, s.4AB proviso (inserted by Finance Act, 2025)',
    rounding: 'Income Tax Ordinance, 2001, s.219',
    superTax: 'Income Tax Ordinance, 2001, s.4C and First Schedule, Part I, Division IIB',
  }),
  // Linked from every legal citation in the breakdown (US-09-AC1).
  ordinance: Object.freeze(ORDINANCE_2025),
  sources: Object.freeze([FINANCE_ACT_2025, ORDINANCE_2025, Object.freeze({
    title: 'FBR Circular No. 01 of 2025-26 (02.08.2025)',
    url: 'https://download1.fbr.gov.pk/Docs/2025841183918948CircularNo01of2025-26IncomeTax.pdf',
  })]),
});
