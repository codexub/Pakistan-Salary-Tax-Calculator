import { useReducer, useRef } from 'react';
import CalculatorForm from './components/CalculatorForm.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import { initialState, reducer } from './utils/state.js';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const amountRef = useRef(null);

  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">Pakistan Salary Tax Estimator</h1>
          <p className="page-header__subtitle">Income tax and take-home pay for salaried individuals</p>
        </div>
      </header>

      <main className="container layout">
        <CalculatorForm
          amountRef={amountRef}
          state={state}
          onYearChange={(taxYear) => dispatch({ type: 'yearChanged', taxYear })}
          onPeriodChange={(period) => dispatch({ type: 'periodChanged', period })}
          onAmountChange={(amountText) => dispatch({ type: 'amountEdited', amountText })}
          onCalculate={() => dispatch({ type: 'calculate' })}
          onReset={() => {
            dispatch({ type: 'reset' });
            amountRef.current?.focus();
          }}
        />
        <ResultsPanel
          state={state}
          onDetailsToggle={(open) => dispatch({ type: 'detailsToggled', open })}
          onSourcesToggle={(open) => dispatch({ type: 'sourcesToggled', open })}
        />
      </main>

      <footer className="page-footer">
        <div className="container">
          Estimate only · Law verified 9 October 2026 · Salary income only · Nothing you enter leaves this page
        </div>
      </footer>
    </>
  );
}
