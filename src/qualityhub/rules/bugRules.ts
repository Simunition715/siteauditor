import type { Rule } from "./index.js";

export const bugRules: Rule[] = [
  {
    id: "TS001",
    title: "Missing await in async call",
    description:
      "A promise returned from an async function call is used as a value without awaiting it. This can lead to unhandled promise rejections or incorrect execution order.",
    remediation:
      "Add 'await' before the async function call, or handle the promise with .then()/.catch().",
    category: "BUG",
    severity: "MAJOR",
    effortMinutes: 15,
    tags: ["typescript", "async", "promise"],
  },
  {
    id: "TS002",
    title: "Empty catch block",
    description:
      "A catch block is empty, which silently swallows errors and makes debugging difficult.",
    remediation:
      "Add error handling logic, logging, or re-throw the error if appropriate.",
    category: "BUG",
    severity: "MINOR",
    effortMinutes: 10,
    tags: ["error-handling"],
  },
  {
    id: "TS003",
    title: "Potential setState in render loop",
    description:
      "State updates detected in what appears to be a render loop or repeated side-effect. This can cause infinite loops or performance issues.",
    remediation:
      "Move state updates to event handlers, useEffect hooks, or other appropriate lifecycle methods.",
    category: "BUG",
    severity: "MAJOR",
    effortMinutes: 30,
    tags: ["react", "performance"],
  },
];
