import { formatPercent, formatRupees } from '../utils/format.js';
import { getRules } from '../data/rules.js';
import { COPY, periodHelp } from '../data/copy.js';
import Disclosure from './Disclosure.jsx';

function bandText(slab) {
  if (slab.number === 1) return `Up to ${formatRupees(slab.upperLimit)}`;
  if (slab.upperLimit === null) return `Above ${formatRupees(slab.threshold)}`;
  return `${formatRupees(slab.threshold)} to ${formatRupees(slab.upperLimit)}`;
}

function taxText(slab) {
  if (slab.rateBasisPoints === 0n) return 'No tax';
  const marginal = `${formatPercent(slab.rateBasisPoints)} of the amount above ${formatRupees(slab.threshold)}`;
  return slab.baseTax === 0n ? marginal : `${formatRupees(slab.baseTax)} + ${marginal}`;
}

function surchargeText(rules) {
  const s = rules.surcharge;
  return s.applies
    ? `${formatPercent(s.rateBasisPoints)} of the Division I income tax where taxable income exceeds ${formatRupees(s.threshold)}, with no marginal relief (${s.citation}).`
    : `None for salaried individuals: ${s.reason} (${s.citation}).`;
}

export default function SourcesAndAssumptions({ result, open, onToggle }) {
  const rules = getRules(result.taxYear);
  return (
    <Disclosure summary={COPY.SOURCES_SUMMARY} open={open} onToggle={onToggle} className="details-sources">
      <h3 className="subheading">Assumptions</h3>
      <ul className="plain-list">
        <li>{COPY.HELP_BASE}</li>
        <li>{periodHelp(result.period)}</li>
        <li>{COPY.NOTE_AVERAGE}</li>
        <li>{COPY.NOTE_DEDUCTIONS}</li>
        <li>{COPY.ASSUMPTION_SALARY_ONLY}</li>
      </ul>

      <h3 className="subheading" id="slab-table-title">{`Salary tax slabs, ${rules.label}`}</h3>
      <div className="table-scroll" role="region" aria-labelledby="slab-table-title" tabIndex={0}>
        <table className="slab-table">
          <thead>
            <tr>
              <th scope="col">Slab</th>
              <th scope="col">Annual taxable income</th>
              <th scope="col">Tax</th>
            </tr>
          </thead>
          <tbody>
            {rules.slabs.map((slab) => {
              const current = slab.number === result.slab.number;
              return (
                <tr key={slab.number} className={current ? 'is-current' : undefined} aria-current={current ? 'true' : undefined}>
                  <th scope="row">
                    {slab.number}
                    {current && <span className="badge">Your slab</span>}
                  </th>
                  <td>{bandText(slab)}</td>
                  <td>{taxText(slab)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="fine-print">{`Source: ${rules.citations.slabs}.`}</p>

      <h3 className="subheading">Surcharge</h3>
      <p>{surchargeText(rules)}</p>

      <h3 className="subheading">Supported range</h3>
      <p>
        {`Annual taxable income up to ${formatRupees(rules.supportedMaximum)}. Above this, super tax under ${rules.citations.superTax} also applies and is not calculated here.`}
      </p>

      <h3 className="subheading">Rounding</h3>
      <p>{`Tax payable is rounded to the nearest rupee (${rules.citations.rounding}).`}</p>

      <h3 className="subheading">Official documents</h3>
      <ul className="plain-list source-list">
        {rules.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
          </li>
        ))}
      </ul>
    </Disclosure>
  );
}
