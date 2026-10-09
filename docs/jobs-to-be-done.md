# Jobs To Be Done

Each job is an outcome the person needs whether or not this application exists. IDs are stable; retired IDs are never reused.
Role: [R-1 Salaried Employee](app-roles.md#r-1-salaried-employee).

## Planning from income after income tax

### J-1: Plan spending from expected income after income tax
- **Role:** R-1
- **When** I set my monthly and yearly budget,
- **I want** to know how much of my salary will remain after income tax,
- **so I can** commit to spending and saving amounts I can actually afford.

### J-2: Judge a salary offer or raise by what I keep
- **Role:** R-1
- **When** I'm offered a new salary or a raise,
- **I want** to know how much more I would keep after income tax, not just how much more I would be paid,
- **so I can** decide whether the change is worth it.

### J-3: Avoid over-budgeting from a figure that excludes other deductions
- **Role:** R-1
- **When** I plan from an after-tax figure,
- **I want** to know which other payroll deductions it does not account for,
- **so I can** allow for them and not overspend.

## Understanding how the year's rules affect income

### J-4: Know which year's rules apply to my income
- **Role:** R-1
- **When** budget changes are announced or a new financial year starts,
- **I want** to know which year's enacted rules govern the income I'm planning around,
- **so I can** avoid planning on outdated rates or on proposals that never became law.

### J-5: Understand how the rules turn my salary into tax
- **Role:** R-1
- **When** I see how much tax I'm expected to pay,
- **I want** to understand which part of the rules applies to my level of income and how it produces that amount,
- **so I can** explain the figure to myself or my family and anticipate how it changes if my income changes.

### J-6: Anticipate threshold effects on what I keep
- **Role:** R-1
- **When** my income is near a point where the rules change,
- **I want** to know how crossing that point affects what I keep,
- **so I can** avoid being surprised by a smaller-than-expected gain. Example: in Tax Year 2026, earning just over Rs 10 million triggers a surcharge on the whole tax.

## Checking the basis before relying on an estimate

### J-7: Verify an estimate before relying on it
- **Role:** R-1
- **When** I'm about to make a financial decision based on a tax estimate,
- **I want** to check the source of its rates, the assumptions it makes and the steps from salary to result,
- **so I can** trust it, or know exactly where it may not fit my situation.

### J-8: Know when an estimate doesn't fit my situation
- **Role:** R-1
- **When** my circumstances fall outside what a simple salary estimate covers (for example, very high income or non-salary income),
- **I want** to be told plainly that the estimate doesn't apply,
- **so I can** seek a proper calculation instead of relying on a misleading number.

---

## Flagged: proposed "jobs" that are actually features

These came up during scoping. They describe *how* a tool behaves, not an outcome the person needs, so they are not jobs. Each is recorded against the job it serves.

| Proposed item | Why it is a feature | Serves |
|---|---|---|
| Choose a financial year | A control, not an outcome | J-4 |
| Enter salary as monthly or annual | An input option | J-1, J-2 |
| See a step-by-step breakdown with formulas and sources | A presentation of the basis | J-5, J-7 |
| Show calculated tax before and after s.219 rounding | A presentation detail | J-7 |
| Accept lakh-style and international commas | Input handling | J-1 (ease of entering a known figure) |
| Clear input validation, reset and recovery after errors | Interaction quality | All jobs (reliable use) |
| Refuse incomes above the supported range | A safeguard | J-8 |
| Show average monthly tax | An output format | J-1 |
