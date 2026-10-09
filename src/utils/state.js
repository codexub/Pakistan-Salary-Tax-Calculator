// Page state as a pure reducer (docs/ui-design.md §5). Tax formulas live in the engine modules (src/utils/), never in components.
// Nothing is persisted: state exists only in memory for the life of the page.

import { calculateTax } from './calculateTax.js';
import { parseAmount } from './parseAmount.js';
import { DEFAULT_TAX_YEAR } from '../data/rules.js';

export const initialState = Object.freeze({
  taxYear: DEFAULT_TAX_YEAR,
  period: 'monthly',
  amountText: '',
  status: 'empty', // 'empty' | 'result' | 'error' | 'stale'
  result: null,
  error: null,
  detailsOpen: false,
  sourcesOpen: false,
});

// BR-14: any input change removes a shown result or error; before the first calculation it stays 'empty'.
function withInputChange(state, changes) {
  const hadOutput = state.status === 'result' || state.status === 'error';
  return { ...state, ...changes, status: hadOutput ? 'stale' : state.status, result: null, error: null };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'yearChanged':
      return withInputChange(state, { taxYear: action.taxYear });
    case 'periodChanged':
      return withInputChange(state, { period: action.period });
    case 'amountEdited':
      return withInputChange(state, { amountText: action.amountText });
    case 'calculate': {
      const parsed = parseAmount(state.amountText);
      if (!parsed.ok) return { ...state, status: 'error', result: null, error: parsed.error };
      const outcome = calculateTax({ taxYear: state.taxYear, period: state.period, amountPaisa: parsed.paisa });
      if (!outcome.ok) return { ...state, status: 'error', result: null, error: outcome.error };
      return { ...state, status: 'result', result: outcome, error: null };
    }
    case 'detailsToggled':
      return { ...state, detailsOpen: action.open };
    case 'sourcesToggled':
      return { ...state, sourcesOpen: action.open };
    case 'reset':
      return initialState; // BR-15: defaults, no output, sections collapsed
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
