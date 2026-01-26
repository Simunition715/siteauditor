import type { Rule } from "./index.js";

export const securityRules: Rule[] = [
  {
    id: "SEC001",
    title: "Use of eval()",
    description:
      "The eval() function executes arbitrary JavaScript code, which is a serious security risk if user input is involved.",
    remediation:
      "Avoid eval(). Use JSON.parse() for JSON data, or use a safer alternative that doesn't execute code.",
    category: "VULNERABILITY",
    severity: "CRITICAL",
    effortMinutes: 60,
    tags: ["security", "injection"],
  },
  {
    id: "SEC002",
    title: "Use of new Function()",
    description:
      "The Function constructor can execute arbitrary code, similar to eval(), and poses security risks.",
    remediation:
      "Avoid new Function(). Use safer alternatives like function declarations or arrow functions.",
    category: "VULNERABILITY",
    severity: "CRITICAL",
    effortMinutes: 60,
    tags: ["security", "injection"],
  },
  {
    id: "SEC003",
    title: "dangerouslySetInnerHTML without sanitization",
    description:
      "dangerouslySetInnerHTML is used without obvious sanitization, which can lead to XSS vulnerabilities.",
    remediation:
      "Sanitize HTML content before using dangerouslySetInnerHTML, or use a library like DOMPurify.",
    category: "VULNERABILITY",
    severity: "MAJOR",
    effortMinutes: 45,
    tags: ["security", "xss", "react"],
  },
  {
    id: "SEC004",
    title: "Potential hard-coded secret",
    description:
      "Code contains patterns that look like API keys, tokens, or secrets. These should not be hard-coded.",
    remediation:
      "Move secrets to environment variables or a secure secrets management system. Never commit secrets to version control.",
    category: "VULNERABILITY",
    severity: "MINOR",
    effortMinutes: 30,
    tags: ["security", "secrets"],
  },
];
