import type { Rule } from "./index.js";

export const smellRules: Rule[] = [
  {
    id: "SMELL001",
    title: "Function too long",
    description:
      "Function exceeds recommended length with high complexity, making it harder to understand, test, and maintain. Consider breaking it into smaller, focused functions with single responsibilities.",
    remediation:
      "Break the function into smaller, focused functions with single responsibilities. Extract validation, data transformation, I/O operations, and rendering into separate functions.",
    category: "CODE_SMELL",
    severity: "MINOR", // Can escalate to MAJOR for very long/high-complexity functions
    effortMinutes: 30,
    tags: ["maintainability", "complexity"],
  },
  {
    id: "SMELL002",
    title: "Nested ternary operator",
    description:
      "Deeply nested ternary operators (2+ levels) reduce code readability and can be confusing. Consider using if-else statements, early returns, or computed variables.",
    remediation:
      "Refactor to use if-else statements, early returns, or extract logic into a separate function. For UI state, consider using computed variables or a switch statement.",
    category: "CODE_SMELL",
    severity: "MINOR", // Can escalate to MAJOR for 3+ level nesting
    effortMinutes: 15,
    tags: ["readability"],
  },
  {
    id: "SMELL003",
    title: "Excessive function parameters",
    description:
      "Function has too many parameters (7+ for regular functions), indicating it may be doing too much or needs refactoring. Consider grouping related parameters into an options object.",
    remediation:
      "Group related parameters into an options object, or split the function into smaller functions. For constructors and configuration functions, this may be acceptable.",
    category: "CODE_SMELL",
    severity: "MINOR", // Can escalate to MAJOR for 9+ parameters
    effortMinutes: 20,
    tags: ["maintainability"],
  },
  {
    id: "SMELL004",
    title: "Duplicate string literals",
    description:
      "The same string literal appears 3+ times in the same file, suggesting it should be extracted to a constant to improve maintainability and reduce magic strings.",
    remediation:
      "Extract the string to a named constant or configuration object to improve maintainability. This is especially important for error messages, status codes, and configuration values.",
    category: "CODE_SMELL",
    severity: "INFO", // Can escalate to MINOR for 5+ occurrences
    effortMinutes: 10,
    tags: ["maintainability", "duplication"],
  },
];
