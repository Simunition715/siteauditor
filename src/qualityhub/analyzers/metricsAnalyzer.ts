import { Project, Node, SyntaxKind } from "ts-morph";
import type { FileMetrics, Metrics } from "../core/types.js";
import type { FileInfo } from "../core/fileWalker.js";

export async function analyzeMetrics(
  files: FileInfo[]
): Promise<FileMetrics[]> {
  const fileMetrics: FileMetrics[] = [];

  // Separate TS and JS files
  const tsFiles = files.filter(
    (f) => f.extension === "ts" || f.extension === "tsx"
  );
  const jsFiles = files.filter(
    (f) => f.extension === "js" || f.extension === "jsx"
  );

  // Analyze TS files with ts-morph
  if (tsFiles.length > 0) {
    console.log(
      `    [Metrics] Processing ${tsFiles.length} TypeScript files...`
    );
    const project = new Project({
      useInMemoryFileSystem: true,
    });

    let processed = 0;
    for (const file of tsFiles) {
      processed++;
      if (processed % 50 === 0 || processed === tsFiles.length) {
        console.log(
          `    [Metrics] Processed ${processed}/${tsFiles.length} TS files...`
        );
      }
      try {
        const sourceFile = project.createSourceFile(file.path, file.content);
        const metrics = calculateMetrics(sourceFile);
        fileMetrics.push({
          filePath: file.path,
          metrics,
        });
      } catch (e) {
        // Fallback to simple metrics
        const metrics = calculateSimpleMetrics(file.content);
        fileMetrics.push({
          filePath: file.path,
          metrics,
        });
      }
    }
  }

  // Analyze JS files with simple heuristics
  if (jsFiles.length > 0) {
    console.log(
      `    [Metrics] Processing ${jsFiles.length} JavaScript files...`
    );
    let processed = 0;
    for (const file of jsFiles) {
      processed++;
      if (processed % 50 === 0 || processed === jsFiles.length) {
        console.log(
          `    [Metrics] Processed ${processed}/${jsFiles.length} JS files...`
        );
      }
      const metrics = calculateSimpleMetrics(file.content);
      fileMetrics.push({
        filePath: file.path,
        metrics,
      });
    }
  }

  return fileMetrics;
}

function calculateMetrics(sourceFile: any): Metrics {
  const content = sourceFile.getFullText();
  const lines = content.split("\n");

  // Count LOC (non-empty, non-comment lines)
  let loc = 0;
  let commentLoc = 0;
  let inMultiLineComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    // Check for comments
    if (trimmed.startsWith("//")) {
      commentLoc++;
      continue;
    }
    if (trimmed.includes("/*")) {
      inMultiLineComment = true;
      commentLoc++;
    }
    if (trimmed.includes("*/")) {
      inMultiLineComment = false;
      commentLoc++;
      continue;
    }
    if (inMultiLineComment) {
      commentLoc++;
      continue;
    }

    loc++;
  }

  // Calculate cyclomatic complexity
  const functions: Array<{ name: string; line: number; complexity: number }> =
    [];

  sourceFile.forEachDescendant((node: any) => {
    if (
      Node.isFunctionDeclaration(node) ||
      Node.isFunctionExpression(node) ||
      Node.isArrowFunction(node)
    ) {
      const name =
        Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node)
          ? node.getName() || "anonymous"
          : "arrow";
      const line = node.getStartLineNumber();
      const complexity = calculateCyclomaticComplexity(node);
      functions.push({ name, line, complexity });
    }
  });

  const fileComplexity =
    functions.length > 0
      ? functions.reduce((sum, f) => sum + f.complexity, 0) / functions.length
      : 0;

  return {
    loc,
    commentLoc,
    functions,
    fileComplexity,
    duplication: {
      duplicatedLines: 0, // Will be calculated by duplication analyzer
      duplicatedBlocks: 0,
      duplicationPercentage: 0,
    },
  };
}

function calculateCyclomaticComplexity(node: any): number {
  let complexity = 1; // Base complexity

  node.forEachDescendant((child: any) => {
    const kind = child.getKind();
    // Count branching nodes
    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ForStatement ||
      kind === SyntaxKind.ForInStatement ||
      kind === SyntaxKind.ForOfStatement ||
      kind === SyntaxKind.WhileStatement ||
      kind === SyntaxKind.DoStatement ||
      kind === SyntaxKind.CaseClause ||
      kind === SyntaxKind.ConditionalExpression ||
      kind === SyntaxKind.BinaryExpression
    ) {
      const text = child.getText();
      // Count logical operators that create branches
      if (text.includes("&&") || text.includes("||")) {
        complexity += (text.match(/&&|\|\|/g) || []).length;
      } else {
        complexity += 1;
      }
    }
  });

  return complexity;
}

function calculateSimpleMetrics(content: string): Metrics {
  const lines = content.split("\n");
  let loc = 0;
  let commentLoc = 0;
  let inMultiLineComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    if (trimmed.startsWith("//")) {
      commentLoc++;
      continue;
    }
    if (trimmed.includes("/*")) {
      inMultiLineComment = true;
      commentLoc++;
    }
    if (trimmed.includes("*/")) {
      inMultiLineComment = false;
      commentLoc++;
      continue;
    }
    if (inMultiLineComment) {
      commentLoc++;
      continue;
    }

    loc++;
  }

  // Simple complexity estimation for JS files
  const complexityKeywords = [
    "if",
    "else",
    "for",
    "while",
    "switch",
    "case",
    "catch",
  ];

  // Operators that need special handling (can't use word boundaries)
  const operatorPatterns = [/&&/g, /\|\|/g, /\?/g];

  let complexity = 1;

  // Count keywords with word boundaries
  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    const matches = content.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }

  // Count operators
  for (const pattern of operatorPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return {
    loc,
    commentLoc,
    functions: [], // Would need AST parsing for accurate function list
    fileComplexity: complexity,
    duplication: {
      duplicatedLines: 0,
      duplicatedBlocks: 0,
      duplicationPercentage: 0,
    },
  };
}
