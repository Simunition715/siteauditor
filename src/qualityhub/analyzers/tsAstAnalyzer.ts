import { Project, Node, SyntaxKind, SourceFile } from "ts-morph";
import type { Finding } from "../core/types.js";
import type { FileInfo } from "../core/fileWalker.js";
import { getRuleById } from "../rules/index.js";

export async function analyzeWithTSAST(files: FileInfo[]): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Filter to TS/TSX files
  const tsFiles = files.filter(
    (f) => f.extension === "ts" || f.extension === "tsx"
  );

  if (tsFiles.length === 0) {
    return findings;
  }

  const project = new Project({
    useInMemoryFileSystem: true,
  });

  // Add files to project
  for (const file of tsFiles) {
    try {
      project.createSourceFile(file.path, file.content);
    } catch (e) {
      // Skip files that can't be parsed
      console.warn(`Could not parse ${file.path}: ${e}`);
    }
  }

  // Run rule checks
  const sourceFiles = project.getSourceFiles();
  let processed = 0;
  for (const sourceFile of sourceFiles) {
    processed++;
    if (processed % 20 === 0 || processed === sourceFiles.length) {
      console.log(
        `    [TS AST] Processed ${processed}/${sourceFiles.length} files...`
      );
    }
    // TS001: Missing await in async call
    checkMissingAwait(sourceFile, findings);

    // TS002: Empty catch block
    checkEmptyCatch(sourceFile, findings);

    // TS003: setState in render (heuristic)
    checkSetStateInRender(sourceFile, findings);

    // SEC001: eval() usage
    checkEvalUsage(sourceFile, findings);

    // SEC002: new Function() usage
    checkNewFunctionUsage(sourceFile, findings);

    // SEC003: dangerouslySetInnerHTML
    checkDangerouslySetInnerHTML(sourceFile, findings);

    // SEC004: Hard-coded secrets
    checkHardcodedSecrets(sourceFile, findings);

    // SMELL001: Function too long
    checkFunctionLength(sourceFile, findings);

    // SMELL002: Nested ternary
    checkNestedTernary(sourceFile, findings);

    // SMELL003: Excessive parameters
    checkExcessiveParameters(sourceFile, findings);

    // SMELL004: Duplicate string literals
    checkDuplicateStrings(sourceFile, findings);
  }

  return findings;
}

function checkMissingAwait(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("TS001");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    // Look for call expressions that return promises but aren't awaited
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      const parent = node.getParent();

      // Skip if already awaited or in a then/catch chain
      if (Node.isAwaitExpression(parent)) {
        return;
      }

      // Skip if it's assigned to a variable (might be intentional)
      if (Node.isVariableDeclaration(parent)) {
        return;
      }

      // Skip if it's in a return statement (might be intentional)
      if (Node.isReturnStatement(parent)) {
        return;
      }

      // Only flag if it's a standalone expression statement (likely a bug)
      if (Node.isExpressionStatement(parent)) {
        // Heuristic: if function name strongly suggests async operations
        const text = expression.getText();
        const asyncPatterns = [
          /\.(then|catch|finally)\(/i, // Promise chains
          /fetch\(/i, // fetch calls
          /axios\.(get|post|put|delete)/i, // axios calls
          /\.request\(/i, // request calls
          /async\s+\w+\(/i, // async function calls
        ];

        // Only flag if it matches async patterns AND is a standalone statement
        const isAsyncCall = asyncPatterns.some((pattern) => pattern.test(text));
        if (isAsyncCall) {
          const line = node.getStartLineNumber();
          findings.push(createFinding(rule, sourceFile.getFilePath(), line));
        }
      }
    }
  });
}

function checkEmptyCatch(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("TS002");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    if (Node.isCatchClause(node)) {
      const block = node.getBlock();
      if (block && block.getStatements().length === 0) {
        const line = node.getStartLineNumber();
        findings.push(createFinding(rule, sourceFile.getFilePath(), line));
      }
    }
  });
}

function checkSetStateInRender(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("TS003");
  if (!rule) return;

  // More accurate: look for setState calls directly in render/component functions
  // (not in useEffect, event handlers, etc.)
  sourceFile.forEachDescendant((node: any) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      const text = expression.getText();

      // Match React setState patterns: setState, setXxx (React hooks)
      if (/setState|set[A-Z][a-zA-Z]*/.test(text)) {
        // Check if we're in a render function or component body (not in useEffect/event handlers)
        let parent: any = node.getParent();
        let depth = 0;
        let inUseEffect = false;
        let inEventHandler = false;

        while (parent && depth < 10) {
          // Check if we're inside useEffect
          if (Node.isCallExpression(parent)) {
            const callText = parent.getExpression()?.getText() || "";
            if (callText === "useEffect" || callText.includes("useEffect")) {
              inUseEffect = true;
              break;
            }
          }

          // Check if we're in an event handler (onClick, onChange, etc.)
          if (Node.isPropertyAssignment(parent)) {
            const propName = parent.getName();
            if (/^on[A-Z]/.test(propName)) {
              inEventHandler = true;
              break;
            }
          }

          // Check if we're in a render function or component body
          if (
            Node.isFunctionDeclaration(parent) ||
            Node.isArrowFunction(parent) ||
            Node.isMethodDeclaration(parent)
          ) {
            const funcName =
              Node.isFunctionDeclaration(parent) ||
              Node.isMethodDeclaration(parent)
                ? parent.getName()
                : "";
            const isRenderFunction = /^render$|^component$|^Component$/.test(
              funcName || ""
            );

            // Only flag if it's in a render function AND not in useEffect/event handler
            if (isRenderFunction && !inUseEffect && !inEventHandler) {
              const line = node.getStartLineNumber();
              findings.push(
                createFinding(rule, sourceFile.getFilePath(), line)
              );
              break;
            }
          }

          parent = parent.getParent();
          depth++;
        }
      }
    }
  });
}

function checkEvalUsage(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SEC001");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      if (expression.getText() === "eval") {
        const line = node.getStartLineNumber();
        findings.push(createFinding(rule, sourceFile.getFilePath(), line));
      }
    }
  });
}

function checkNewFunctionUsage(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SEC002");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    if (Node.isNewExpression(node)) {
      const expression = node.getExpression();
      if (expression.getText() === "Function") {
        const line = node.getStartLineNumber();
        findings.push(createFinding(rule, sourceFile.getFilePath(), line));
      }
    }
  });
}

function checkDangerouslySetInnerHTML(
  sourceFile: SourceFile,
  findings: Finding[]
) {
  const rule = getRuleById("SEC003");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    if (Node.isPropertyAssignment(node)) {
      const name = node.getName();
      if (name === "dangerouslySetInnerHTML") {
        // Check if there's sanitization nearby (heuristic)
        const parent = node.getParent();
        const text = parent?.getText() || "";
        if (!/sanitize|purify|DOMPurify/i.test(text)) {
          const line = node.getStartLineNumber();
          findings.push(createFinding(rule, sourceFile.getFilePath(), line));
        }
      }
    }
  });
}

function checkHardcodedSecrets(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SEC004");
  if (!rule) return;

  // Pattern matching for common secret patterns
  const secretPatterns = [
    /(api[_-]?key|apikey)\s*[:=]\s*["']([^"']{20,})["']/i,
    /(secret|token|password|pwd)\s*[:=]\s*["']([^"']{10,})["']/i,
    /(bearer|authorization)\s*[:=]\s*["']([^"']{20,})["']/i,
  ];

  const content = sourceFile.getFullText();
  for (const pattern of secretPatterns) {
    const matches = content.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      if (match.index !== undefined) {
        const line = sourceFile.getLineAndColumnAtPos(match.index).line;
        findings.push(createFinding(rule, sourceFile.getFilePath(), line));
      }
    }
  }
}

function checkFunctionLength(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SMELL001");
  if (!rule) return;

  const filePath = sourceFile.getFilePath();
  const isTSX = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
  const isTest = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
  const isApiRoute = /(route|api|handler)\.(ts|tsx|js|jsx)$/.test(filePath);

  // Context-aware thresholds
  const thresholds = {
    lines: isTest ? 250 : isTSX ? 200 : isApiRoute ? 100 : 120,
    complexity: isTest ? 40 : isTSX ? 35 : isApiRoute ? 20 : 25,
  };

  sourceFile.forEachDescendant((node: any) => {
    if (
      Node.isFunctionDeclaration(node) ||
      Node.isFunctionExpression(node) ||
      Node.isArrowFunction(node)
    ) {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      const rawLength = end - start;

      // Check for suppression comment
      if (hasSuppressionComment(sourceFile, start, "SMELL001")) {
        return;
      }

      // Detect function type
      const funcName = Node.isFunctionDeclaration(node)
        ? node.getName() || ""
        : "";
      const isComponent = /^[A-Z]/.test(funcName) || isTSX;
      const isTestFunction = /^(test|it|describe|beforeEach|afterEach)/i.test(
        funcName
      );

      // Adjust threshold for component/test functions
      const effectiveThreshold = isTestFunction
        ? 250
        : isComponent && isTSX
        ? 200
        : thresholds.lines;

      // Calculate weighted complexity score
      const complexityScore = calculateFunctionComplexity(
        node,
        sourceFile,
        isTSX
      );

      // Only flag if both raw length AND complexity exceed thresholds
      if (
        rawLength > effectiveThreshold &&
        complexityScore > thresholds.complexity
      ) {
        // Escalate severity for high complexity
        const severity: Finding["severity"] =
          rawLength > 200 && complexityScore > 30
            ? "MAJOR"
            : (rule.severity as Finding["severity"]);

        findings.push(createFinding({ ...rule, severity }, filePath, start));
      }
    }
  });
}

function calculateFunctionComplexity(
  node: any,
  sourceFile: SourceFile,
  isTSX: boolean
): number {
  let complexity = 0;
  let jsxNodes = 0;
  let dataLiterals = 0;

  node.forEachDescendant((child: any) => {
    // Count statements
    if (
      Node.isIfStatement(child) ||
      Node.isForStatement(child) ||
      Node.isWhileStatement(child) ||
      Node.isSwitchStatement(child) ||
      Node.isTryStatement(child) ||
      Node.isReturnStatement(child) ||
      Node.isExpressionStatement(child)
    ) {
      complexity += 1;
    }

    // Count JSX nodes (discount heavily)
    if (Node.isJsxElement(child) || Node.isJsxSelfClosingElement(child)) {
      jsxNodes += 1;
    }

    // Count large data literals (discount)
    if (
      Node.isArrayLiteralExpression(child) ||
      Node.isObjectLiteralExpression(child)
    ) {
      const text = child.getText();
      if (text.length > 200) {
        dataLiterals += 1;
      }
    }

    // Count nested depth
    let depth = 0;
    let parent: any = child.getParent();
    while (parent && parent !== node && depth < 10) {
      if (
        Node.isIfStatement(parent) ||
        Node.isForStatement(parent) ||
        Node.isWhileStatement(parent)
      ) {
        depth += 1;
      }
      parent = parent.getParent();
    }
    if (depth > 3) {
      complexity += (depth - 3) * 0.1; // +10% per level beyond 3
    }
  });

  // Apply discounts
  complexity += jsxNodes * 0.1; // JSX counts as 0.1x
  complexity += dataLiterals * 0.2; // Large literals count as 0.2x

  return Math.round(complexity);
}

function checkNestedTernary(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SMELL002");
  if (!rule) return;

  const filePath = sourceFile.getFilePath();
  const isTSX = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");

  sourceFile.forEachDescendant((node: any) => {
    if (Node.isConditionalExpression(node)) {
      const line = node.getStartLineNumber();

      // Check for suppression comment
      if (hasSuppressionComment(sourceFile, line, "SMELL002")) {
        return;
      }

      // Calculate nesting depth and condition count
      const { depth, conditionCount, hasComplexExpressions } =
        analyzeTernaryComplexity(node);

      // Context-aware thresholds
      const maxDepth = isTSX ? 2 : 2; // Same for both, but different severity
      const maxConditions = isTSX ? 3 : 2;

      // Allow single ternary (depth 1, conditionCount 1)
      if (depth === 1 && conditionCount === 1) {
        return; // OK - single ternary is fine
      }

      // Check if in JSX context
      let inJSX = false;
      let parent: any = node.getParent();
      let depthCheck = 0;
      while (parent && depthCheck < 10) {
        if (
          Node.isJsxElement(parent) ||
          Node.isJsxSelfClosingElement(parent) ||
          Node.isJsxExpression(parent)
        ) {
          inJSX = true;
          break;
        }
        parent = parent.getParent();
        depthCheck++;
      }

      // Flag if exceeds thresholds
      if (
        depth > maxDepth ||
        conditionCount > maxConditions ||
        (depth === 2 && hasComplexExpressions)
      ) {
        // Escalate severity for complex cases
        const severity: Finding["severity"] =
          depth >= 3 || (depth === 2 && hasComplexExpressions)
            ? "MAJOR"
            : (rule.severity as Finding["severity"]);

        findings.push(createFinding({ ...rule, severity }, filePath, line));
      }
    }
  });
}

function analyzeTernaryComplexity(node: any): {
  depth: number;
  conditionCount: number;
  hasComplexExpressions: boolean;
} {
  let depth = 0;
  let conditionCount = 1; // Start with 1 for the root ternary
  let hasComplexExpressions = false;

  function traverse(ternary: any, currentDepth: number) {
    depth = Math.max(depth, currentDepth);

    // Check if expressions are complex (contain function calls, operations, etc.)
    const condition = ternary.getCondition();
    const trueExpr = ternary.getWhenTrue();
    const falseExpr = ternary.getWhenFalse();

    if (
      Node.isCallExpression(condition) ||
      Node.isBinaryExpression(condition) ||
      Node.isCallExpression(trueExpr) ||
      Node.isCallExpression(falseExpr)
    ) {
      hasComplexExpressions = true;
    }

    // Check nested ternaries
    if (Node.isConditionalExpression(trueExpr)) {
      conditionCount++;
      traverse(trueExpr, currentDepth + 1);
    }
    if (Node.isConditionalExpression(falseExpr)) {
      conditionCount++;
      traverse(falseExpr, currentDepth + 1);
    }
  }

  traverse(node, 1);

  return { depth, conditionCount, hasComplexExpressions };
}

function checkExcessiveParameters(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SMELL003");
  if (!rule) return;

  sourceFile.forEachDescendant((node: any) => {
    if (
      Node.isFunctionDeclaration(node) ||
      Node.isFunctionExpression(node) ||
      Node.isArrowFunction(node)
    ) {
      const line = node.getStartLineNumber();

      // Check for suppression comment
      if (hasSuppressionComment(sourceFile, line, "SMELL003")) {
        return;
      }

      const params = node.getParameters();
      const effectiveParamCount = countEffectiveParameters(params);

      // Detect function type
      const funcName = Node.isFunctionDeclaration(node)
        ? node.getName() || ""
        : "";
      const isConstructor =
        Node.isConstructorDeclaration(node) ||
        /^constructor$/i.test(funcName) ||
        /^[A-Z]/.test(funcName); // Class name pattern
      const isConfigFunction = /^(config|setup|init|create)/i.test(funcName);
      const isCallback = /^(on|handle|callback|cb)/i.test(funcName);

      // Context-aware thresholds
      const threshold = isConstructor
        ? 8
        : isConfigFunction
        ? 10
        : isCallback
        ? 4
        : 6;

      if (effectiveParamCount > threshold) {
        // Escalate severity for very high counts
        const severity: Finding["severity"] =
          effectiveParamCount >= 9
            ? "MAJOR"
            : (rule.severity as Finding["severity"]);

        findings.push(
          createFinding({ ...rule, severity }, sourceFile.getFilePath(), line)
        );
      }
    }
  });
}

function countEffectiveParameters(params: any[]): number {
  let count = 0;

  for (const param of params) {
    // Check if parameter is an object binding pattern (destructured)
    if (Node.isObjectBindingPattern(param.getNameNode())) {
      const binding = param.getNameNode();
      const properties = binding.getElements();
      // Count destructured properties, but cap at 3
      count += Math.min(properties.length, 3);
    } else if (Node.isArrayBindingPattern(param.getNameNode())) {
      // Array destructuring counts as 1
      count += 1;
    } else {
      // Regular parameter
      count += 1;
    }
  }

  return count;
}

function checkDuplicateStrings(sourceFile: SourceFile, findings: Finding[]) {
  const rule = getRuleById("SMELL004");
  if (!rule) return;

  const filePath = sourceFile.getFilePath();
  const isTest = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);

  // Skip test files - duplicate strings are often test data
  if (isTest) {
    return;
  }

  const stringMap = new Map<string, Array<{ line: number; node: any }>>();
  const commonWords = new Set([
    "the",
    "and",
    "or",
    "is",
    "are",
    "was",
    "were",
    "a",
    "an",
    "to",
    "of",
    "in",
    "on",
    "at",
    "for",
    "with",
    "by",
  ]);

  // Collect all string literals
  sourceFile.forEachDescendant((node: any) => {
    if (Node.isStringLiteral(node)) {
      const text = node.getText();
      const value = text.slice(1, -1); // Remove quotes

      // Skip short strings and common words
      if (value.length < 5 || commonWords.has(value.toLowerCase())) {
        return;
      }

      // Skip if in test-like context (mock data)
      const parent = node.getParent();
      if (
        parent &&
        Node.isCallExpression(parent) &&
        /mock|test|spec|fixture/i.test(parent.getText())
      ) {
        return;
      }

      const line = node.getStartLineNumber();
      if (!stringMap.has(value)) {
        stringMap.set(value, []);
      }
      stringMap.get(value)!.push({ line, node });
    }
  });

  // Flag strings that appear 3+ times
  for (const [value, occurrences] of stringMap.entries()) {
    if (occurrences.length >= 3) {
      const severity: Finding["severity"] =
        occurrences.length >= 5
          ? "MINOR"
          : (rule.severity as Finding["severity"]);
      const firstOccurrence = occurrences[0];
      findings.push(
        createFinding({ ...rule, severity }, filePath, firstOccurrence.line)
      );
    }
  }
}

function hasSuppressionComment(
  sourceFile: SourceFile,
  line: number,
  ruleId: string
): boolean {
  // Check line before and same line for suppression comment
  const lines = sourceFile.getFullText().split("\n");
  const checkLines = [
    lines[line - 1], // Line before
    lines[line - 2], // Two lines before (for function declarations)
  ];

  for (const lineText of checkLines) {
    if (!lineText) continue;
    const commentMatch = lineText.match(
      /\/\/\s*smell-disable\s+(\w+)(?:\s+reason:.*)?/i
    );
    if (commentMatch && commentMatch[1] === ruleId) {
      return true;
    }
  }

  return false;
}

function createFinding(
  rule: {
    id: string;
    title: string;
    description: string;
    remediation: string;
    category: Finding["category"];
    severity: Finding["severity"];
    effortMinutes: number;
    tags: string[];
  },
  filePath: string,
  line: number
): Finding {
  return {
    id: rule.id,
    ruleId: rule.id,
    title: rule.title,
    description: rule.description,
    remediation: rule.remediation,
    filePath,
    line,
    category: rule.category,
    severity: rule.severity,
    effortMinutes: rule.effortMinutes,
    tags: rule.tags,
    fingerprint: "", // Will be set by caller
  };
}
