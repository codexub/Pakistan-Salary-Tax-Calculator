import { getRules, SUPPORTED_TAX_YEARS } from '../data/rules.js';
import { COPY, periodHelp } from '../data/copy.js';

// Newest year first; it is also the default (BR-01).
const YEAR_OPTIONS = [...SUPPORTED_TAX_YEARS].sort((a, b) => b - a).map(getRules);

function YearChoice({ taxYear, onChange }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset__legend">Financial year</legend>
      <div className="year-options">
        {YEAR_OPTIONS.map((rules) => {
          const checked = rules.taxYear === taxYear;
          return (
            <label key={rules.taxYear} className={`year-option${checked ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="taxYear"
                value={rules.taxYear}
                checked={checked}
                onChange={() => onChange(rules.taxYear)}
              />
              <span className="year-option__body">
                <span className="year-option__fy">{rules.financialYear}</span>
                <span className="year-option__dates">{`${rules.period.start} – ${rules.period.end}`}</span>
                <span className="year-option__ty">{`Tax Year ${rules.taxYear}`}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PeriodChoice({ period, onChange }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset__legend">Salary period</legend>
      <div className="segmented">
        {[['monthly', 'Monthly'], ['annual', 'Annual']].map(([value, label]) => (
          <label key={value} className={`segmented__option${period === value ? ' is-selected' : ''}`}>
            <input
              className="segmented__input"
              type="radio"
              name="period"
              value={value}
              checked={period === value}
              onChange={() => onChange(value)}
            />
            <span className="segmented__label">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// React 19: `ref` is an ordinary prop on function components.
function SalaryField({ period, value, error, onChange, ref }) {
  const describedBy = error ? 'salary-error salary-help' : 'salary-help';
  return (
    <div className="field">
      <label className="field__label" htmlFor="salary">
        {period === 'monthly' ? 'Monthly taxable salary (PKR)' : 'Annual taxable salary (PKR)'}
      </label>
      <div className={`field__control${error ? ' is-invalid' : ''}`}>
        <span className="field__prefix" aria-hidden="true">Rs</span>
        <input
          ref={ref}
          id="salary"
          className="field__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck="false"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
        />
      </div>
      {error && (
        <p id="salary-error" className="field__error" role="alert">
          {error.message}
        </p>
      )}
      <p id="salary-help" className="field__help">
        <span>{COPY.HELP_BASE}</span> <span>{periodHelp(period)}</span>
      </p>
    </div>
  );
}

export default function CalculatorForm({
  state, onYearChange, onPeriodChange, onAmountChange, onCalculate, onReset, amountRef,
}) {
  return (
    <section className="card input-card" aria-labelledby="input-title">
      <h2 id="input-title" className="card__title">Your salary</h2>
      <form
        className="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onCalculate();
        }}
      >
        <YearChoice taxYear={state.taxYear} onChange={onYearChange} />
        <PeriodChoice period={state.period} onChange={onPeriodChange} />
        <SalaryField
          ref={amountRef}
          period={state.period}
          value={state.amountText}
          error={state.error}
          onChange={onAmountChange}
        />
        <div className="form__actions">
          <button type="submit" className="btn btn-primary">Calculate</button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
        </div>
      </form>
    </section>
  );
}
