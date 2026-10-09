import { formatPercent, formatRs } from '../utils/format.js';
import { COPY } from '../data/copy.js';
import Disclosure from './Disclosure.jsx';

function stepValue(step) {
  if (step.id === 'slab') return `Slab ${step.slabNumber}`;
  if (step.id === 'rate') return formatPercent(step.rateBasisPoints);
  return formatRs(step.value);
}

// US-09-AC1: legal citations link to the year's consolidated Ordinance on FBR; assumptions cite their BR ID.
function Basis({ basis }) {
  if (basis.kind === 'law') {
    return (
      <p className="step__basis">
        {'Source: '}
        <a href={basis.source.url} target="_blank" rel="noopener noreferrer" title={basis.source.title}>
          {basis.citation}
        </a>
      </p>
    );
  }
  return <p className="step__basis">{`Assumption (${basis.ref}): ${basis.text}`}</p>;
}

export default function CalculationDetails({ result, open, onToggle }) {
  const periodText = result.period === 'monthly' ? 'monthly' : 'annual';
  return (
    <Disclosure summary={COPY.DETAILS_SUMMARY} open={open} onToggle={onToggle} className="details-steps">
      <p className="details__context">
        {`${result.yearLabel} · ${formatRs(result.inputAmount)} ${periodText} taxable salary`}
      </p>
      <ol className="steps">
        {result.steps.map((step) => (
          <li key={step.id} className="step" data-step={step.id}>
            <div className="step__head">
              <span className="step__label">{step.label}</span>
              <span className="step__value">{stepValue(step)}</span>
            </div>
            <p className="step__formula">
              <span className="step__key">Formula:</span> {step.formula}
            </p>
            <p className="step__substitution">{step.substitution}</p>
            <Basis basis={step.basis} />
          </li>
        ))}
      </ol>
    </Disclosure>
  );
}
