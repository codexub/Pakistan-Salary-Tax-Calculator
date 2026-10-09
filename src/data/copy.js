// Interface wording from docs/user-stories.md BR-17 (exact strings; tests compare against the document).

export const COPY = Object.freeze({
  EMPTY_STATE: 'Enter your taxable salary and press Calculate.',
  STALE_STATE: 'Inputs changed. Press Calculate to update the results.',
  HELP_BASE: 'Enter taxable salary after exempt allowances. This calculator does not compute exemptions.',
  HELP_MONTHLY: 'Assumes the same taxable salary for all 12 months.',
  HELP_ANNUAL: 'Enter total taxable salary for the year, including taxable bonuses.',
  PAYABLE_CAPTION: 'Rounded to the nearest rupee under section 219 of the Income Tax Ordinance, 2001.',
  NOTE_ZERO_TAX: 'No income tax is payable on this amount.',
  NOTE_DEDUCTIONS:
    'Income after income tax excludes other payroll deductions such as EOBI, provident fund, Zakat and loan repayments.',
  NOTE_AVERAGE:
    'Monthly figures are annual amounts divided by 12. They are estimates, not a reconciliation of tax withheld on any payslip.',
  NOTE_ROUNDING:
    'Amounts are shown to 2 decimal places, rounded half up; ≈ marks a value rounded for display. Because each figure is rounded separately, 12 × a monthly figure may differ from the annual figure by up to Rs 0.06.',
  // US-08-AC5
  NOTE_CLIFF:
    'In Tax Year 2026, once taxable income exceeds Rs 10,000,000, a 9% surcharge applies to the whole income tax under Division I, not only to income above Rs 10,000,000 (Income Tax Ordinance, 2001, s.4AB proviso, inserted by Finance Act, 2025). The Ordinance provides no marginal relief, so near this threshold tax payable can rise by more than the extra income.',
  ASSUMPTION_SALARY_ONLY: 'This estimate covers salary income only.',
  DETAILS_SUMMARY: 'Calculation details (13 steps)',
  SOURCES_SUMMARY: 'Official sources and assumptions',
});

export const periodHelp = (period) => (period === 'annual' ? COPY.HELP_ANNUAL : COPY.HELP_MONTHLY);
