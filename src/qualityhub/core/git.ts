import { simpleGit, SimpleGit } from "simple-git";
import { existsSync } from "fs";
import { join } from "path";

let gitInstance: SimpleGit | null = null;

function getGit(): SimpleGit | null {
  if (gitInstance) {
    return gitInstance;
  }

  // Check if we're in a git repo
  const gitDir = join(process.cwd(), ".git");
  if (!existsSync(gitDir)) {
    return null;
  }

  gitInstance = simpleGit(process.cwd());
  return gitInstance;
}

export interface ChangedFile {
  file: string;
  changes: Array<{
    start: number;
    end: number;
  }>;
}

/**
 * Get changed files and line ranges from git diff
 * This is optional and used for "new code" detection
 */
export async function getChangedFiles(
  baseBranch: string = "main"
): Promise<ChangedFile[]> {
  const git = getGit();
  if (!git) {
    return [];
  }

  try {
    const diff = await git.diff([`${baseBranch}...HEAD`, "--numstat"]);
    const changedFiles: ChangedFile[] = [];

    // Parse diff output to get file names
    // For MVP, we'll just return file names without line ranges
    // Full implementation would parse unified diff format
    const lines = diff.split("\n").filter(Boolean);
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length >= 3) {
        const file = parts[2];
        changedFiles.push({
          file,
          changes: [], // Would parse actual line ranges from unified diff
        });
      }
    }

    return changedFiles;
  } catch (e) {
    // If branch doesn't exist or other git error, return empty
    return [];
  }
}

/**
 * Check if a file path is in the changed files list
 */
export function isFileChanged(
  filePath: string,
  changedFiles: ChangedFile[]
): boolean {
  return changedFiles.some((cf) => cf.file === filePath);
}

/**
 * Check if a line number is in the changed ranges for a file
 */
export function isLineChanged(
  filePath: string,
  line: number,
  changedFiles: ChangedFile[]
): boolean {
  const changedFile = changedFiles.find((cf) => cf.file === filePath);
  if (!changedFile) {
    return false;
  }

  // If no specific line ranges, assume all lines are changed
  if (changedFile.changes.length === 0) {
    return true;
  }

  return changedFile.changes.some(
    (change) => line >= change.start && line <= change.end
  );
}
