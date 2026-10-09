// Native <details>/<summary> whose open state is owned by App (BR-18), so it survives recalculation and
// Reset can collapse it. The summary's click (also fired by Enter/Space in browsers) toggles the state.
export default function Disclosure({ summary, open, onToggle, className = '', children }) {
  return (
    <details className={`disclosure ${className}`.trim()} open={open}>
      <summary
        className="disclosure__summary"
        onClick={(e) => {
          e.preventDefault();
          onToggle(!open);
        }}
      >
        {summary}
      </summary>
      <div className="disclosure__body">{children}</div>
    </details>
  );
}
