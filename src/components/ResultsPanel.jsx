import { formatRs } from '../utils/format.js';
import { COPY } from '../data/copy.js';
import CalculationDetails from './CalculationDetails.jsx';
import SourcesAndAssumptions from './SourcesAndAssumptions.jsx';

function MainResult({ result }) {
  const zeroTax = result.taxPayable.n === 0n;
  return (
    <div className="result-main">
      <h3 className="result-main__label">Annual tax payable</h3>
      <p className="result-main__figure">{formatRs(result.taxPayable)}</p>
      <p className="result-main__year">{result.yearLabel}</p>
      {zeroTax && <p className="result-main__zero">{COPY.NOTE_ZERO_TAX}</p>}
      <p className="result-main__caption">{COPY.PAYABLE_CAPTION}</p>
    </div>
  );
}

function SupportingResults({ result }) {
  const rows = [
    ['Average monthly tax', result.averageMonthlyTax],
    ['Annual income after income tax', result.incomeAfterTax],
    ['Average monthly income after income tax', result.averageMonthlyIncomeAfterTax],
    ['Annual taxable income', result.annualTaxableIncome],
  ];
  return (
    <dl className="result-list">
      {rows.map(([label, value]) => (
        <div key={label} className="result-list__row">
          <dt>{label}</dt>
          <dd>{formatRs(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ResultNotes({ result }) {
  return (
    <div className="notes">
      {result.showCliffNote && (
        <p className="note note--important">{COPY.NOTE_CLIFF}</p>
      )}
      <p className="note">{COPY.NOTE_AVERAGE}</p>
      <p className="note">{COPY.NOTE_DEDUCTIONS}</p>
      <p className="note">{COPY.NOTE_ROUNDING}</p>
    </div>
  );
}

export default function ResultsPanel({ state, onDetailsToggle, onSourcesToggle }) {
  const { status, result } = state;
  const announcement = status === 'result'
    ? `Annual tax payable ${formatRs(result.taxPayable)} for ${result.yearLabel}.`
    : '';

  return (
    <section className="card results" aria-labelledby="results-title">
      <h2 id="results-title" className="card__title">Your estimate</h2>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

      {status !== 'result' && (
        <p className="results__status" data-status={status}>
          {status === 'stale' ? COPY.STALE_STATE : COPY.EMPTY_STATE}
        </p>
      )}

      {status === 'result' && (
        <>
          <MainResult result={result} />
          <SupportingResults result={result} />
          <ResultNotes result={result} />
          <CalculationDetails result={result} open={state.detailsOpen} onToggle={onDetailsToggle} />
          <SourcesAndAssumptions result={result} open={state.sourcesOpen} onToggle={onSourcesToggle} />
        </>
      )}
    </section>
  );
}
