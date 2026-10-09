// FY 2026-27 (Tax Year 2027). Verified 2026-10-09; see docs/tax-rules.md §2 and §F.
// Amounts in whole rupees (BigInt); rates in basis points (1% = 100n).

const FINANCE_ACT_2026 = {
  title: 'Finance Act, 2026 (Act No. XLIII of 2026)',
  url: 'https://download1.fbr.gov.pk/Docs/20266291261044366FinanceAct2026.pdf',
};
const ORDINANCE_2026 = {
  title: 'Income Tax Ordinance, 2001, amended up to 30.06.2026 (FBR consolidation)',
  url: 'https://download1.fbr.gov.pk/Docs/2026724177725705IncomeTaxOrdinanace2001.pdf',
};

export default Object.freeze({
  taxYear: 2027,
  financialYear: 'FY 2026-27',
  label: 'FY 2026-27 (Tax Year 2027)',
  period: Object.freeze({ start: '1 July 2026', end: '30 June 2027' }),

  // First Schedule, Part I, Division I, clause (2), as substituted by Finance Act 2026 s.5(44)(a)(i).
  slabs: Object.freeze([
    Object.freeze({ number: 1, threshold: 0n, upperLimit: 600_000n, baseTax: 0n, rateBasisPoints: 0n }),
    Object.freeze({ number: 2, threshold: 600_000n, upperLimit: 1_200_000n, baseTax: 0n, rateBasisPoints: 100n }),
    Object.freeze({ number: 3, threshold: 1_200_000n, upperLimit: 2_200_000n, baseTax: 6_000n, rateBasisPoints: 1_100n }),
    Object.freeze({ number: 4, threshold: 2_200_000n, upperLimit: 3_200_000n, baseTax: 116_000n, rateBasisPoints: 2_000n }),
    Object.freeze({ number: 5, threshold: 3_200_000n, upperLimit: 4_100_000n, baseTax: 316_000n, rateBasisPoints: 2_500n }),
    Object.freeze({ number: 6, threshold: 4_100_000n, upperLimit: 5_600_000n, baseTax: 541_000n, rateBasisPoints: 2_900n }),
    Object.freeze({ number: 7, threshold: 5_600_000n, upperLimit: 7_000_000n, baseTax: 976_000n, rateBasisPoints: 3_200n }),
    Object.freeze({ number: 8, threshold: 7_000_000n, upperLimit: null, baseTax: 1_424_000n, rateBasisPoints: 3_500n }),
  ]),

  // s.4AB proviso as amended by Finance Act 2026 s.5(2)(b): "no surcharge shall be payable" on salary.
  surcharge: Object.freeze({
    applies: false,
    reason: 'withdrawn for salaried individuals by Finance Act, 2026',
    citation: 'Income Tax Ordinance, 2001, s.4AB proviso (as amended by Finance Act, 2026)',
  }),

  // s.4C super tax (Division IIB row 4, as substituted by Finance Act 2026) starts above Rs 500 million.
  supportedMaximum: 500_000_000n,

  citations: Object.freeze({
    slabs: 'Income Tax Ordinance, 2001, First Schedule, Part I, Division I, clause (2), as substituted by Finance Act, 2026',
    surcharge: 'Income Tax Ordinance, 2001, s.4AB proviso (as amended by Finance Act, 2026)',
    rounding: 'Income Tax Ordinance, 2001, s.219',
    superTax: 'Income Tax Ordinance, 2001, s.4C and First Schedule, Part I, Division IIB',
  }),
  // Linked from every legal citation in the breakdown (US-09-AC1).
  ordinance: Object.freeze(ORDINANCE_2026),
  sources: Object.freeze([FINANCE_ACT_2026, ORDINANCE_2026, Object.freeze({
    title: 'FBR Circular No. 02 of 2026-27 (08.09.2026)',
    url: 'https://download1.fbr.gov.pk/Docs/202698139527880CircularNo.2of2026-27.pdf',
  })]),
});
