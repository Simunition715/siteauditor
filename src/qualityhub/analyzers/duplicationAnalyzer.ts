import type { FileInfo } from "../core/fileWalker.js";

export interface DuplicationBlock {
  file: string;
  startLine: number;
  endLine: number;
  normalizedLines: string[];
}

/**
 * Simple duplication detection based on normalized line sequences
 */
export function analyzeDuplication(
  files: FileInfo[],
  minBlockSize: number = 10
): {
  blocks: DuplicationBlock[];
  duplicatedLines: number;
  totalLines: number;
} {
  const blocks: DuplicationBlock[] = [];
  const lineMap = new Map<string, Array<{ file: string; line: number }>>();

  console.log(`    [Duplication] Processing ${files.length} files...`);
  let processed = 0;

  // Normalize and index lines
  for (const file of files) {
    processed++;
    if (processed % 50 === 0 || processed === files.length) {
      console.log(
        `    [Duplication] Processed ${processed}/${files.length} files...`
      );
    }

    const lines = file.content.split("\n");

    // Skip very large files to avoid performance issues
    if (lines.length > 5000) {
      console.log(
        `    [Duplication] Skipping large file: ${file.path} (${lines.length} lines)`
      );
      continue;
    }

    const normalizedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const normalized = normalizeLine(lines[i]);
      normalizedLines.push(normalized);

      if (normalized.trim().length > 0) {
        if (!lineMap.has(normalized)) {
          lineMap.set(normalized, []);
        }
        lineMap.get(normalized)!.push({ file: file.path, line: i + 1 });
      }
    }

    // Find repeated blocks (only for smaller files to avoid performance issues)
    if (normalizedLines.length <= 2000) {
      findRepeatedBlocks(file.path, normalizedLines, minBlockSize, blocks);
    }
  }

  // Calculate totals
  let duplicatedLines = 0;
  const seenBlocks = new Set<string>();

  for (const block of blocks) {
    const key = `${block.file}:${block.startLine}:${block.endLine}`;
    if (!seenBlocks.has(key)) {
      duplicatedLines += block.endLine - block.startLine + 1;
      seenBlocks.add(key);
    }
  }

  const totalLines = files.reduce(
    (sum, f) => sum + f.content.split("\n").length,
    0
  );

  return {
    blocks,
    duplicatedLines,
    totalLines,
  };
}

function normalizeLine(line: string): string {
  // Remove leading/trailing whitespace
  let normalized = line.trim();

  // Remove comments (simple heuristic)
  if (normalized.startsWith("//")) {
    return "";
  }
  normalized = normalized.replace(/\/\*.*?\*\//g, "");

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ");

  // Remove string literals (replace with placeholder)
  normalized = normalized.replace(/["'][^"']*["']/g, '""');

  // Remove numbers (optional - can be too aggressive)
  // normalized = normalized.replace(/\b\d+\b/g, "0");

  return normalized;
}

function findRepeatedBlocks(
  filePath: string,
  normalizedLines: string[],
  minBlockSize: number,
  blocks: DuplicationBlock[]
): void {
  // Optimized sliding window approach - limit iterations for performance
  // Only check every Nth position to speed up
  const stepSize = Math.max(1, Math.floor(normalizedLines.length / 1000));
  const maxIterations = 10000; // Limit total iterations
  let iterations = 0;

  for (
    let start = 0;
    start < normalizedLines.length - minBlockSize && iterations < maxIterations;
    start += stepSize
  ) {
    // Limit block size to avoid checking huge blocks
    const maxBlockSize = Math.min(50, normalizedLines.length - start);
    for (
      let blockSize = minBlockSize;
      blockSize <= maxBlockSize && iterations < maxIterations;
      blockSize += 5
    ) {
      iterations++;
      const end = start + blockSize;
      if (end > normalizedLines.length) break;

      const block = normalizedLines.slice(start, end);
      const blockText = block.join("\n");

      // Check if this block appears elsewhere (optimized - only check every Nth position)
      const checkStep = Math.max(1, Math.floor(normalizedLines.length / 500));
      for (
        let i = 0;
        i < normalizedLines.length - block.length && iterations < maxIterations;
        i += checkStep
      ) {
        iterations++;
        if (i === start) continue; // Skip the original position

        const candidate = normalizedLines.slice(i, i + block.length);
        if (candidate.join("\n") === blockText) {
          // Found a duplicate block
          blocks.push({
            file: filePath,
            startLine: start + 1,
            endLine: end,
            normalizedLines: block,
          });
          break; // Only count once per occurrence
        }
      }

      if (iterations >= maxIterations) break;
    }

    if (iterations >= maxIterations) break;
  }
}
