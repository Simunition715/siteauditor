// TRUE NEGATIVE: Single ternary (should NOT be flagged)
// Expected: NO SMELL002 finding

function MyComponent({ isActive }) {
  return (
    <div>
      {/* Single ternary - OK */}
      {isActive ? <ActiveIcon /> : <InactiveIcon />}

      {/* Another single ternary - OK */}
      <span className={isActive ? "active" : "inactive"}>Status</span>
    </div>
  );
}

function regularFunction(value: number) {
  // Single ternary in regular code - OK
  return value > 0 ? "positive" : "negative";
}
