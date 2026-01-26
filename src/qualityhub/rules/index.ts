import type { Finding, Category, Severity } from "../core/types.js";
import { bugRules } from "./bugRules.js";
import { securityRules } from "./securityRules.js";
import { smellRules } from "./smellRules.js";

export interface Rule {
  id: string;
  title: string;
  description: string;
  remediation: string;
  category: Category;
  severity: Severity;
  effortMinutes: number;
  tags: string[];
}

export const allRules: Rule[] = [...bugRules, ...securityRules, ...smellRules];

export function getRuleById(id: string): Rule | undefined {
  return allRules.find((r) => r.id === id);
}
