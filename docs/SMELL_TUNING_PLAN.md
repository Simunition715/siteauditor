# Code Smell Tuning Plan

## Overview

This document outlines the tuning strategy for QualityHub's code smell detection rules. The goal is to reduce false positives while maintaining high signal for real maintainability issues across different stacks (React, Next.js, Node.js, etc.).

## Current State

### Implemented Rules

- **SMELL001**: Function too long (threshold: 150 lines)
- **SMELL002**: Nested ternary operator (flags any nested ternary)
- **SMELL003**: Excessive function parameters (threshold: 6+)
- **SMELL004**: Duplicate string literals (defined but not implemented)

### Known Issues

1. **SMELL001**: Flags React/Next.js components with large JSX blocks (false positive)
2. **SMELL002**: Flags single ternaries in JSX (too aggressive)
3. **SMELL003**: Works reasonably but could be context-aware
4. **SMELL004**: Not implemented

---

## Tuning Strategy

### SMELL001: Function Too Long

#### Current Implementation

- Simple line count: `endLine - startLine > 150`
- No distinction between code and markup
- No complexity weighting

#### Problems

- React components with large JSX are flagged
- Data-heavy functions (large object literals) are flagged
- No consideration of actual complexity

#### New Heuristic

**Weighted Complexity Score** instead of raw LOC:

1. **Statement Counting** (primary metric):

   - Count actual statements (if, for, while, switch, return, try-catch, assignments)
   - Discount JSX/HTML template nodes (count as 0.1x weight)
   - Discount large data literals (arrays/objects > 10 items count as 0.2x)

2. **Complexity Multipliers**:

   - Nested depth: +10% per level beyond 3
   - Multiple responsibilities: +20% if function contains validation + IO + transform + render

3. **File Type Biasing**:

   - `.tsx`/`.jsx` files: 200 line threshold (markup-heavy)
   - `.ts`/`.js` files: 120 line threshold (code-heavy)
   - Test files (`*.test.ts`, `*.spec.ts`): 250 line threshold

4. **Function Type Biasing**:

   - React components: 200 lines
   - API route handlers: 100 lines
   - Utility functions: 80 lines
   - Test functions: 250 lines

5. **Severity Escalation**:
   - MINOR: 120-200 lines (or equivalent complexity)
   - MAJOR: 200+ lines with high branching (cyclomatic > 15)

#### Thresholds

```typescript
const thresholds = {
  default: { lines: 120, complexity: 25 },
  tsx: { lines: 200, complexity: 35 },
  test: { lines: 250, complexity: 40 },
  api: { lines: 100, complexity: 20 },
};
```

#### When to Ignore vs. Fix

**Ignore (suppress)**:

- React components with mostly JSX
- Data transformation functions with large input/output objects
- Test setup functions
- Generated code

**Fix**:

- Functions with high branching and multiple responsibilities
- Functions that mix validation, IO, transformation, and rendering
- Functions that are hard to test due to length

---

### SMELL002: Nested Ternary Operator

#### Current Implementation

- Flags ANY nested ternary (depth >= 2)
- No context awareness

#### Problems

- Flags single ternaries in JSX (false positive)
- Doesn't distinguish between simple and complex nesting

#### New Heuristic

1. **Allow Single Ternary Everywhere**:

   - `condition ? a : b` → OK
   - Only flag when depth >= 2 OR chained conditions >= 3

2. **Context-Aware Detection**:

   - **In JSX/TSX**: Only flag if depth >= 3 OR has complex expressions
   - **In regular code**: Flag if depth >= 2
   - **In return statements**: Flag if depth >= 2

3. **Complexity Check**:

   - Count conditions: `a ? b : c ? d : e` = 2 conditions (OK)
   - `a ? b : c ? d : e ? f : g` = 3 conditions (FLAG)

4. **Severity**:
   - MINOR: 2-level nesting in JSX
   - MAJOR: 3+ level nesting OR 2-level with complex expressions

#### Thresholds

```typescript
const thresholds = {
  jsx: { maxDepth: 2, maxConditions: 3 },
  code: { maxDepth: 2, maxConditions: 2 },
};
```

#### When to Ignore vs. Fix

**Ignore**:

- Single ternaries: `isActive ? 'active' : 'inactive'`
- Simple 2-level in JSX: `isLoading ? <Spinner /> : error ? <Error /> : <Content />`

**Fix**:

- 3+ level nesting
- Complex expressions in ternaries
- Ternaries with side effects

---

### SMELL003: Excessive Function Parameters

#### Current Implementation

- Simple count: `params.length > 6`
- No context awareness

#### Problems

- Works reasonably but could be smarter about:
  - Destructured parameters
  - Options objects
  - Configuration functions

#### New Heuristic

1. **Count Effective Parameters**:

   - Regular params: count as 1
   - Destructured object: count as number of properties (max 3)
   - Options object: count as 1 (even if it has many properties)

2. **Context-Aware Thresholds**:

   - Constructor: 8 parameters
   - Configuration/setup function: 10 parameters
   - Regular function: 6 parameters
   - Callback/event handler: 4 parameters

3. **Severity**:
   - MINOR: 7-8 parameters
   - MAJOR: 9+ parameters

#### Thresholds

```typescript
const thresholds = {
  default: 6,
  constructor: 8,
  config: 10,
  callback: 4,
};
```

#### When to Ignore vs. Fix

**Ignore**:

- Constructors with many required fields
- Configuration functions (e.g., `createConfig(a, b, c, d, e, f, g)`)

**Fix**:

- Regular functions with 7+ parameters
- Functions where parameters could be grouped into objects

---

### SMELL004: Duplicate String Literals

#### Current Implementation

- Not implemented

#### New Heuristic

1. **Detection**:

   - Find string literals that appear 3+ times in the same file
   - Minimum length: 5 characters (avoid false positives on common words)
   - Exclude: single characters, common words ("the", "and", "or")

2. **Context**:

   - Only flag if strings are used in similar contexts
   - Ignore test data, mock strings

3. **Severity**:
   - INFO: 3-4 occurrences
   - MINOR: 5+ occurrences

#### Thresholds

```typescript
const thresholds = {
  minLength: 5,
  minOccurrences: 3,
  excludeCommon: true,
};
```

#### When to Ignore vs. Fix

**Ignore**:

- Test data
- Mock strings
- Common words

**Fix**:

- Magic strings used in business logic
- Error messages
- Configuration values

---

## Suppression Strategy

### Inline Suppression Comments

Support comments like:

```typescript
// smell-disable SMELL001 reason: React component with large JSX, acceptable for this UI
function MyComponent() {
  // ... 200 lines of JSX
}
```

### File-Type Biasing

Automatically adjust thresholds based on file extension and content:

- `.tsx`/`.jsx`: More lenient for markup
- `.test.ts`: More lenient for test files
- `route.ts`/`api.ts`: Stricter for API handlers

---

## Implementation Plan

1. ✅ Create tuning plan document
2. ✅ Update `checkFunctionLength` with weighted complexity
3. ✅ Update `checkNestedTernary` with context awareness
4. ✅ Update `checkExcessiveParameters` with context awareness
5. ✅ Implement `checkDuplicateStrings` (SMELL004)
6. ✅ Add suppression comment parsing
7. ✅ Create test fixtures
8. ✅ Create test harness
9. ✅ Update rule definitions with new severities

---

## Test Strategy

### Fixtures Structure

```
tests/fixtures/smells/
  ├── SMELL001/
  │   ├── true-positive-long-function.ts
  │   ├── true-negative-react-component.tsx
  │   ├── true-negative-data-heavy.ts
  │   └── edge-case-mixed.tsx
  ├── SMELL002/
  │   ├── true-positive-nested-ternary.tsx
  │   ├── true-negative-single-ternary.tsx
  │   └── edge-case-jsx-ternary.tsx
  ├── SMELL003/
  │   ├── true-positive-many-params.ts
  │   ├── true-negative-constructor.ts
  │   └── edge-case-destructured.ts
  └── SMELL004/
      ├── true-positive-duplicate-strings.ts
      ├── true-negative-test-data.ts
      └── edge-case-common-words.ts
```

### Test Harness

- Run analyzer on each fixture
- Assert expected finding counts
- Assert expected rule IDs
- Report false positives/negatives

---

## Success Criteria

1. **False Positive Reduction**: < 10% false positive rate
2. **True Positive Retention**: > 90% of real issues still caught
3. **Stack Agnostic**: Works for React, Next.js, Node.js, etc.
4. **Explainable**: Each finding has clear reasoning

---

## Migration Notes

- Existing baselines may need regeneration
- Some findings will disappear (false positives removed)
- Some new findings may appear (better detection)
- Severity changes: some MINOR → MAJOR for high-complexity cases
