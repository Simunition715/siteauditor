// Test suppression comment - should NOT be flagged
// smell-disable SMELL001 reason: This is a known long component, acceptable for this UI

export function LongComponent() {
  // This function is intentionally long and has suppression comment
  // It should NOT trigger SMELL001

  return (
    <div>
      {/* Lots of JSX here */}
      <h1>Component</h1>
      {/* ... 200+ lines of JSX ... */}
    </div>
  );
}
