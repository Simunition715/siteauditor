import { glob } from "glob";
import { readFileSync } from "fs";
import type { QualityHubConfig } from "./types.js";

export interface FileInfo {
  path: string;
  content: string;
  extension: string;
}

export async function findFiles(config: QualityHubConfig): Promise<FileInfo[]> {
  const files: FileInfo[] = [];

  for (const pattern of config.include) {
    const matches = await glob(pattern, {
      ignore: config.exclude,
      absolute: false,
      cwd: process.cwd(),
    });

    for (const filePath of matches) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const extension = filePath.split(".").pop()?.toLowerCase() || "";
        files.push({
          path: filePath,
          content,
          extension,
        });
      } catch (e) {
        // Skip files that can't be read
        console.warn(`Warning: Could not read file ${filePath}`);
      }
    }
  }

  return files;
}
