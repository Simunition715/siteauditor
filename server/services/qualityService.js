const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;

const execAsync = promisify(exec);

async function runQualityScan(repoPath, jobId, jobs) {
  // Helper function to update job status with logs
  const updateJob = (updates) => {
    const current = jobs.get(jobId) || { logs: [] };
    const newLogs = [...(current.logs || [])];
    if (updates.message && updates.message !== current.message) {
      newLogs.push({
        message: updates.message,
        timestamp: new Date().toISOString(),
        type: "info",
      });
    }
    jobs.set(jobId, {
      ...current,
      ...updates,
      logs: newLogs,
    });
  };

  try {
    updateJob({
      status: "running",
      progress: 0,
      message: "Initializing scan...",
    });

    // Log the received path for debugging
    console.log("Received repoPath:", repoPath);
    console.log("Current working directory:", process.cwd());

    // Clean the path - remove any quotes or extra whitespace
    let cleanedPath = repoPath.trim().replace(/^["']|["']$/g, "");

    // Convert forward slashes to backslashes on Windows for consistency
    if (process.platform === "win32") {
      cleanedPath = cleanedPath.replace(/\//g, "\\");
    }

    // Check if it looks like an absolute path (starts with drive letter on Windows, or / on Unix)
    const looksAbsolute =
      process.platform === "win32"
        ? /^[A-Za-z]:\\/.test(cleanedPath) || cleanedPath.startsWith("\\\\")
        : cleanedPath.startsWith("/");

    console.log("Cleaned path:", cleanedPath);
    console.log("Looks absolute?", looksAbsolute);
    console.log("path.isAbsolute?", path.isAbsolute(cleanedPath));

    // If it's a relative path, try multiple resolution strategies
    let normalizedPath;
    if (looksAbsolute || path.isAbsolute(cleanedPath)) {
      // Already absolute, use as-is
      normalizedPath = path.normalize(cleanedPath);
    } else {
      // Relative path - try multiple locations before defaulting to current directory
      const currentDir = process.cwd();
      const parentDir = path.dirname(currentDir);
      const homeDir = process.platform === "win32"
        ? (process.env.USERPROFILE || process.env.HOME)
        : process.env.HOME;

      // Priority order:
      // 1. Check as sibling to current directory (most common case)
      // 2. Check in home directory
      // 3. Check in home/Documents, home/Desktop, etc.
      // 4. Finally, resolve relative to current directory

      const candidatePaths = [];

      // Sibling to current directory
      candidatePaths.push(path.join(parentDir, cleanedPath));

      // In home directory
      if (homeDir) {
        candidatePaths.push(path.join(homeDir, cleanedPath));
        candidatePaths.push(path.join(homeDir, "Documents", cleanedPath));
        candidatePaths.push(path.join(homeDir, "Desktop", cleanedPath));
        candidatePaths.push(path.join(homeDir, "projects", cleanedPath));
        candidatePaths.push(path.join(homeDir, "Projects", cleanedPath));
      }

      // Check which path actually exists
      let foundPath = null;
      for (const candidatePath of candidatePaths) {
        try {
          const stats = await fs.stat(candidatePath);
          if (stats.isDirectory()) {
            foundPath = candidatePath;
            console.log("Found folder at:", foundPath);
            break;
          }
        } catch {
          // Continue checking
        }
      }

      // Use found path, or prioritize sibling path (don't resolve relative to current directory)
      // This way, if user enters "worlds", it checks C:\Users\callm\worlds first, not C:\Users\callm\siteauditor\worlds
      if (foundPath) {
        normalizedPath = foundPath;
      } else {
        // Prioritize sibling path over current directory resolution
        // This is the most common case - folders next to the project
        normalizedPath = path.join(parentDir, cleanedPath);
        console.log("No existing path found, using sibling path:", normalizedPath);
      }
    }

    // Normalize the path (handle Windows backslashes, etc.)
    normalizedPath = path.normalize(normalizedPath);

    console.log("Normalized path:", normalizedPath);

    // Validate repo path exists
    let pathExists = false;
    let actualStats = null;
    try {
      actualStats = await fs.stat(normalizedPath);
      if (actualStats.isDirectory()) {
        pathExists = true;
      } else {
        throw new Error("Path exists but is not a directory (it's a file)");
      }
    } catch (err) {
      // Path doesn't exist or is not a directory
      // Let's add more diagnostic info
      console.log("Path validation failed:", err.message);
      console.log("Normalized path that failed:", normalizedPath);

      // Try to see what's in the parent directory
      try {
        const parentDir = path.dirname(normalizedPath);
        const parentExists = await fs.stat(parentDir).catch(() => null);
        if (parentExists && parentExists.isDirectory()) {
          const siblings = await fs.readdir(parentDir).catch(() => []);
          console.log("Contents of parent directory:", siblings);

          // Check for case-insensitive match
          const caseInsensitiveMatch = siblings.find(
            (sibling) => sibling.toLowerCase() === path.basename(normalizedPath).toLowerCase()
          );
          if (caseInsensitiveMatch) {
            const correctedPath = path.join(parentDir, caseInsensitiveMatch);
            console.log("Found case-insensitive match:", correctedPath);
            try {
              const correctedStats = await fs.stat(correctedPath);
              if (correctedStats.isDirectory()) {
                // Use the corrected path!
                normalizedPath = correctedPath;
                pathExists = true;
                console.log("Using corrected path:", normalizedPath);
              }
            } catch {}
          }
        }
      } catch (parentErr) {
        console.log("Could not check parent directory:", parentErr.message);
      }

      if (!pathExists) {
      // Try to find the path in common locations
      const commonLocations = [];

      if (process.platform === "win32") {
        const homeDir = process.env.USERPROFILE || process.env.HOME;
        const username = process.env.USERNAME || "user";

        if (homeDir) {
          // Check in user's home directory and subdirectories
          commonLocations.push(
            path.join(homeDir, cleanedPath),
            path.join(homeDir, "Documents", cleanedPath),
            path.join(homeDir, "Desktop", cleanedPath),
            path.join(homeDir, "projects", cleanedPath),
            path.join(homeDir, "Projects", cleanedPath),
            path.join(homeDir, "source", cleanedPath),
            path.join(homeDir, "Source", cleanedPath),
            path.join(homeDir, "dev", cleanedPath),
            path.join(homeDir, "Dev", cleanedPath),
            path.join(homeDir, "code", cleanedPath),
            path.join(homeDir, "Code", cleanedPath),
            path.join(homeDir, "repos", cleanedPath),
            path.join(homeDir, "Repos", cleanedPath),
            path.join(homeDir, "repositories", cleanedPath),
            path.join(homeDir, "Repositories", cleanedPath)
          );
        }

        // Also check common C:\Users paths
        commonLocations.push(
          path.join("C:", "Users", username, cleanedPath),
          path.join("C:", "Users", username, "Documents", cleanedPath),
          path.join("C:", "Users", username, "Desktop", cleanedPath),
          path.join("C:", "Users", username, "projects", cleanedPath),
          path.join("C:", "Users", username, "Projects", cleanedPath),
          path.join("C:", "Users", username, "source", cleanedPath),
          path.join("C:", "Users", username, "Source", cleanedPath),
          path.join("C:", "Users", username, "dev", cleanedPath),
          path.join("C:", "Users", username, "Dev", cleanedPath)
        );

        // Check parent directory (in case they're in a subfolder)
        try {
          const parentDir = path.dirname(process.cwd());
          commonLocations.push(path.join(parentDir, cleanedPath));
        } catch {}

        // Check sibling directories (async, so we'll do this separately)
        // Note: This is done after the initial check to avoid blocking
      } else {
        const homeDir = process.env.HOME;
        if (homeDir) {
          commonLocations.push(
            path.join(homeDir, cleanedPath),
            path.join(homeDir, "Documents", cleanedPath),
            path.join(homeDir, "Desktop", cleanedPath),
            path.join(homeDir, "projects", cleanedPath),
            path.join(homeDir, "Projects", cleanedPath),
            path.join(homeDir, "src", cleanedPath),
            path.join(homeDir, "code", cleanedPath),
            path.join(homeDir, "repos", cleanedPath)
          );
        }
      }

      // Check if any common location exists
      let foundPath = null;
      for (const commonPath of commonLocations) {
        try {
          const stats = await fs.stat(commonPath);
          if (stats.isDirectory()) {
            foundPath = commonPath;
            break;
          }
        } catch {
          // Continue checking
        }
      }

      // Also check sibling directories if not found yet
      if (!foundPath && process.platform === "win32") {
        try {
          const currentDir = process.cwd();
          const parentDir = path.dirname(currentDir);
          const siblings = await fs.readdir(parentDir).catch(() => []);

          // Check if any sibling folder matches the name (case-insensitive)
          const folderName = path.basename(cleanedPath);
          for (const sibling of siblings) {
            const siblingPath = path.join(parentDir, sibling);
            // Check if sibling itself matches (case-insensitive)
            if (sibling.toLowerCase() === folderName.toLowerCase()) {
              try {
                const stats = await fs.stat(siblingPath);
                if (stats.isDirectory()) {
                  foundPath = siblingPath;
                  console.log("✓ Found matching sibling folder:", foundPath);
                  break;
                }
              } catch {}
            }
          }

          // If still not found and it's just a folder name (no path separators), check sibling directly
          if (!foundPath && !path.isAbsolute(cleanedPath) && !cleanedPath.includes(path.sep) && !cleanedPath.includes('\\')) {
            const directSiblingPath = path.join(parentDir, cleanedPath);
            try {
              const stats = await fs.stat(directSiblingPath);
              if (stats.isDirectory()) {
                foundPath = directSiblingPath;
                console.log("✓ Found folder as direct sibling:", foundPath);
              }
            } catch {}
          }
        } catch (siblingErr) {
          console.log("Error checking siblings:", siblingErr.message);
        }
      }

        let errorMessage = `Invalid repository path: ${err.message}\n\n`;
        errorMessage += `Attempted path: ${normalizedPath}\n\n`;

        // Add diagnostic info if we checked the parent directory
        try {
          const parentDir = path.dirname(normalizedPath);
          const siblings = await fs.readdir(parentDir).catch(() => []);
          if (siblings.length > 0) {
            errorMessage += `Found ${siblings.length} items in "${parentDir}":\n`;
            siblings.slice(0, 15).forEach(sibling => {
              errorMessage += `  • ${sibling}\n`;
            });
            if (siblings.length > 15) {
              errorMessage += `  ... and ${siblings.length - 15} more\n`;
            }
            errorMessage += `\n`;

            // Check for similar names
            const folderName = path.basename(normalizedPath).toLowerCase();
            const similar = siblings.filter(s => {
              const sLower = s.toLowerCase();
              return sLower.includes(folderName) || folderName.includes(sLower) ||
                     sLower.startsWith(folderName.substring(0, 5)) ||
                     folderName.startsWith(sLower.substring(0, 5));
            });
            if (similar.length > 0) {
              errorMessage += `Similar folder names found in this directory:\n`;
              similar.forEach(s => {
                errorMessage += `  • ${s}\n`;
              });
              errorMessage += `\n`;
            }

            // Check if it might be a sibling (same parent, different folder)
            const currentDirName = path.basename(process.cwd());
            const siblingPath = path.join(parentDir, cleanedPath);
            errorMessage += `Note: You're currently in "${currentDirName}". `;
            errorMessage += `If "${cleanedPath}" is a sibling folder (same parent directory), it should be at:\n`;
            errorMessage += `  ${siblingPath}\n\n`;

            // Actually check if the sibling exists
            try {
              const siblingStats = await fs.stat(siblingPath);
              if (siblingStats.isDirectory()) {
                errorMessage += `✓ FOUND IT! The folder exists as a sibling at:\n`;
                errorMessage += `  ${siblingPath}\n\n`;
                errorMessage += `Please use this full path: ${siblingPath}`;
                // Update foundPath so we can use it
                foundPath = siblingPath;
              } else {
                errorMessage += `(Checked sibling location - not found there either)\n\n`;
              }
            } catch (siblingErr) {
              errorMessage += `(Checked sibling location "${siblingPath}" - not found)\n\n`;
            }
          }
        } catch {}

        if (foundPath) {
          errorMessage += `✓ Found a matching folder at:\n${foundPath}\n\n`;
          errorMessage += `Please use this full absolute path instead.`;
        } else {
          // Try one more thing - search in the user's home directory (limited depth)
          errorMessage += `Searching for "${cleanedPath}" in common locations...\n\n`;

          const searchPaths = [];
          if (process.platform === "win32") {
            const homeDir = process.env.USERPROFILE || process.env.HOME;
            if (homeDir) {
              // Search in common subdirectories - look for the EXACT folder name
              const commonSubdirs = ["Documents", "Desktop", "Downloads", "projects", "Projects", "source", "Source", "dev", "Dev", "code", "Code"];
              for (const subdir of commonSubdirs) {
                // Only check if the folder exists WITH the exact name we're looking for
                searchPaths.push(path.join(homeDir, subdir, cleanedPath));
              }
              // Also check directly in home
              searchPaths.push(path.join(homeDir, cleanedPath));
            }
          }

          let searchFound = false;
          for (const searchPath of searchPaths.slice(0, 20)) { // Limit to 20 searches
            try {
              const stats = await fs.stat(searchPath);
              // CRITICAL: Make sure it's a directory AND the basename matches what we're looking for
              if (stats.isDirectory()) {
                const searchPathBase = path.basename(searchPath);
                const cleanedPathBase = path.basename(cleanedPath);
                // Only match if the folder name matches (case-insensitive)
                if (searchPathBase.toLowerCase() === cleanedPathBase.toLowerCase()) {
                  errorMessage += `✓ FOUND IT! The folder exists at:\n`;
                  errorMessage += `  ${searchPath}\n\n`;
                  errorMessage += `Please use this full path: ${searchPath}`;
                  searchFound = true;
                  foundPath = searchPath;
                  break;
                }
              }
            } catch {}
          }

          // If not found, also suggest similar folder names that were found earlier
          if (!searchFound) {
            try {
              const parentDir = path.dirname(normalizedPath);
              const siblings = await fs.readdir(parentDir).catch(() => []);
              const folderName = path.basename(normalizedPath).toLowerCase();
              const similar = siblings.filter(s => {
                const sLower = s.toLowerCase();
                // More strict matching - folder should start with similar characters
                return (sLower.startsWith(folderName.substring(0, 4)) || folderName.startsWith(sLower.substring(0, 4))) &&
                       Math.abs(sLower.length - folderName.length) < 10; // Length should be similar
              });

              if (similar.length > 0) {
                errorMessage += `Did you mean one of these folders?\n`;
                similar.forEach(s => {
                  const suggestedPath = path.join(parentDir, s);
                  errorMessage += `  • ${suggestedPath}\n`;
                });
                errorMessage += `\n`;
              }
            } catch {}
          }

          if (!searchFound) {
            errorMessage += `The folder "${cleanedPath}" was not found in any common location.\n\n`;
            errorMessage += `⚠️ IMPORTANT: Please use the FULL absolute path to your repository folder.\n\n`;
            errorMessage += `How to get the correct path:\n\n`;
            errorMessage += `Method 1 - Use File Explorer:\n`;
            errorMessage += `  1. Open File Explorer (Windows key + E)\n`;
            errorMessage += `  2. Navigate to your "worlds-map-and-video" folder\n`;
            errorMessage += `  3. Click in the address bar at the top (or press Ctrl+L)\n`;
            errorMessage += `  4. The full path will be highlighted - copy it (Ctrl+C)\n`;
            errorMessage += `  5. Paste it into the form\n\n`;
            errorMessage += `Method 2 - Use the Browse Button:\n`;
            errorMessage += `  • Click the "Browse" button in the form\n`;
            errorMessage += `  • Navigate to and select your "worlds-map-and-video" folder\n`;
            errorMessage += `  • The path will be filled automatically\n\n`;
            errorMessage += `The path should look something like:\n`;
            errorMessage += `  C:\\Users\\callm\\worlds-map-and-video\n`;
            errorMessage += `  C:\\Users\\callm\\Documents\\worlds-map-and-video\n`;
            errorMessage += `  C:\\Users\\callm\\Desktop\\worlds-map-and-video\n`;
            errorMessage += `  (or wherever your folder actually is)`;
          }
        }

        jobs.set(jobId, {
          status: "failed",
          error: errorMessage,
        });
        return;
      }
    }

    // If we get here, the path exists and is valid
    console.log("✓ Valid repository path:", normalizedPath);

    // Check if qualityhub.config exists, if not, create a default one
    const configPath = path.join(normalizedPath, "qualityhub.config.js");
    let configExists = false;
    try {
      await fs.access(configPath);
      configExists = true;
    } catch (err) {
      // Config doesn't exist, that's okay - QualityHub will use defaults
    }

    // Get the project root (where QualityHub is installed)
    const projectRoot = path.resolve(__dirname, "../..");

    // Build QualityHub first (if not already built)
    updateJob({
      status: "running",
      progress: 5,
      message: "Validating repository path...",
    });
    // Check if QualityHub is already built
    // Note: rootDir is src/qualityhub, so output is dist/cli/index.js (not dist/qualityhub/cli/index.js)
    const qualityHubCli = path.join(projectRoot, "dist", "cli", "index.js");

    let cliExists = false;
    try {
      await fs.access(qualityHubCli);
      cliExists = true;
      console.log("QualityHub CLI already exists, skipping build");
      updateJob({
        progress: 15,
        message: "QualityHub CLI found, ready to scan",
      });
    } catch (err) {
      // CLI doesn't exist, need to build
      console.log("QualityHub CLI not found, building...");
      updateJob({
        progress: 10,
        message: "Building QualityHub...",
      });
      try {
        // Use npx to run tsc (works even if tsc not in PATH)
        const buildCmd = `npx tsc -p "${path.join(
          projectRoot,
          "tsconfig.qualityhub.json"
        )}"`;
        console.log("Building QualityHub:", buildCmd);
        await execAsync(buildCmd, { cwd: projectRoot });
        console.log("QualityHub build completed");

        // Verify it was built
        await fs.access(qualityHubCli);
        cliExists = true;
        updateJob({
          progress: 20,
          message: "QualityHub build completed",
        });
      } catch (buildErr) {
        console.error("Build failed:", buildErr.message);
        updateJob({
          progress: 10,
          message: `Build failed: ${buildErr.message}`,
        });
        throw new Error(
          `QualityHub build failed: ${buildErr.message}. Please run 'npm run build:qualityhub' manually.`
        );
      }
    }

    if (!cliExists) {
      throw new Error(
        `QualityHub CLI not found at ${qualityHubCli}. Build may have failed.`
      );
    }

    // Run scan - change to repo directory so QualityHub scans it
    updateJob({
      status: "running",
      progress: 25,
      message: "Discovering files...",
    });

    const originalCwd = process.cwd();
    process.chdir(normalizedPath);

    try {
      // qualityHubCli is already defined above
      const scanCmd = `node "${qualityHubCli}" scan`;
      console.log("Executing scan command:", scanCmd);
      console.log("Working directory:", normalizedPath);

      // Parse stdout for progress updates
      const parseStdoutForProgress = (output) => {
        const lines = output.split("\n");
        for (const line of lines) {
          if (line.includes("Found") && line.includes("files")) {
            const match = line.match(/Found (\d+) files/);
            if (match) {
              updateJob({
                progress: 35,
                message: `Found ${match[1]} files to analyze`,
              });
            }
          } else if (line.includes("ESLint analyzer")) {
            updateJob({
              progress: 45,
              message: "Running ESLint analyzer...",
            });
          } else if (line.includes("TypeScript AST analyzer")) {
            updateJob({
              progress: 55,
              message: "Running TypeScript AST analyzer...",
            });
          } else if (line.includes("Metrics analyzer")) {
            updateJob({
              progress: 65,
              message: "Calculating code metrics...",
            });
          } else if (line.includes("Duplication analyzer")) {
            updateJob({
              progress: 70,
              message: "Analyzing code duplication...",
            });
          } else if (line.includes("Coverage analyzer")) {
            updateJob({
              progress: 75,
              message: "Analyzing test coverage...",
            });
          } else if (line.includes("Dependency analyzer")) {
            updateJob({
              progress: 78,
              message: "Checking dependencies...",
            });
          } else if (line.includes("Generating reports")) {
            updateJob({
              progress: 85,
              message: "Generating reports...",
            });
          } else if (line.includes("[ESLint] Processed")) {
            // Extract progress from ESLint logs
            const match = line.match(/Processed (\d+)\/(\d+)/);
            if (match) {
              const current = parseInt(match[1]);
              const total = parseInt(match[2]);
              const pct = 45 + Math.floor((current / total) * 5); // 45-50% range
              updateJob({
                progress: pct,
                message: `ESLint: ${current}/${total} files processed`,
              });
            }
          } else if (line.includes("[TS AST] Processed")) {
            // Extract progress from TS AST logs
            const match = line.match(/Processed (\d+)\/(\d+)/);
            if (match) {
              const current = parseInt(match[1]);
              const total = parseInt(match[2]);
              const pct = 55 + Math.floor((current / total) * 5); // 55-60% range
              updateJob({
                progress: pct,
                message: `TypeScript AST: ${current}/${total} files processed`,
              });
            }
          } else if (line.includes("[Metrics] Processed")) {
            // Extract progress from Metrics logs
            const match = line.match(/Processed (\d+)\/(\d+)/);
            if (match) {
              const current = parseInt(match[1]);
              const total = parseInt(match[2]);
              const pct = 65 + Math.floor((current / total) * 5); // 65-70% range
              updateJob({
                progress: pct,
                message: `Metrics: ${current}/${total} files processed`,
              });
            }
          }
        }
      };

      // Use spawn instead of exec to stream output in real-time
      const { spawn } = require("child_process");
      let stdout = "";
      let stderr = "";

      const scanResult = await new Promise((resolve, reject) => {
        const [nodeCmd, ...args] = scanCmd.replace(/"/g, "").split(" ");
        const child = spawn(nodeCmd, args, {
          cwd: normalizedPath,
          shell: true,
        });

        // Stream stdout line by line
        child.stdout.on("data", (data) => {
          const chunk = data.toString();
          stdout += chunk;
          console.log("Scan output:", chunk);

          // Parse each line for progress updates
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              parseStdoutForProgress(line);
              // Add log entry for any meaningful output
              if (
                line.trim() &&
                !line.includes("Starting") &&
                !line.includes("Discovering")
              ) {
                updateJob({
                  message: line.trim().substring(0, 150),
                });
              }
            }
          }
        });

        child.stderr.on("data", (data) => {
          const chunk = data.toString();
          stderr += chunk;
          console.error("Scan stderr:", chunk);

          // Add error to logs
          updateJob({
            message: `Warning: ${chunk.substring(0, 100)}`,
          });
        });

        child.on("close", (code) => {
          if (code !== 0) {
            const errorMsg = stderr || `Process exited with code ${code}`;
            updateJob({
              status: "failed",
              progress: 30,
              message: `Scan failed: ${errorMsg.substring(0, 200)}`,
              error: errorMsg,
            });
            reject(new Error(`QualityHub scan failed: ${errorMsg}`));
            return;
          }

          // Parse final stdout for progress
          parseStdoutForProgress(stdout);

          // Resolve with stdout and stderr
          resolve({ stdout, stderr });
        });

        child.on("error", (err) => {
          updateJob({
            status: "failed",
            progress: 30,
            message: `Scan error: ${err.message}`,
            error: err.message,
          });
          reject(err);
        });
      });

      stdout = scanResult.stdout;
      stderr = scanResult.stderr;

      // Read the generated report
      updateJob({
        status: "running",
        progress: 90,
        message: "Reading report...",
      });
      const reportPath = path.join(
        normalizedPath,
        ".qualityhub",
        "report.json"
      );

      let reportData;
      try {
        const reportContent = await fs.readFile(reportPath, "utf-8");
        reportData = JSON.parse(reportContent);
        console.log(
          "Report loaded successfully. Findings:",
          reportData.findings?.length || 0
        );
      } catch (err) {
        console.error("Failed to read report file:", err.message);
        console.log("Report path:", reportPath);
        // If report doesn't exist, create a basic one from stdout
        reportData = {
          findings: [],
          metrics: [],
          summary: {
            totalFindings: 0,
            byCategory: { BUG: 0, VULNERABILITY: 0, CODE_SMELL: 0 },
            bySeverity: {
              INFO: 0,
              MINOR: 0,
              MAJOR: 0,
              CRITICAL: 0,
              BLOCKER: 0,
            },
            newFindings: 0,
            totalLoc: 0,
            totalComplexity: 0,
            duplicationPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          stdout: stdout.substring(0, 2000), // First 2000 chars of output
        };
      }

      // Restore original directory
      process.chdir(originalCwd);

      updateJob({
        status: "completed",
        progress: 100,
        message: "Scan complete!",
        result: reportData,
      });
    } catch (err) {
      process.chdir(originalCwd);
      console.error("Error during scan execution:", err);
      console.error("Error stack:", err.stack);
      throw err;
    }
  } catch (error) {
    console.error("Quality scan error:", error);
    console.error("Error stack:", error.stack);
    const current = jobs.get(jobId) || { logs: [] };
    jobs.set(jobId, {
      ...current,
      status: "failed",
      error: error.message || "Quality scan failed",
      errorDetails: error.stack,
      logs: [
        ...(current.logs || []),
        {
          message: `Error: ${error.message || "Quality scan failed"}`,
          timestamp: new Date().toISOString(),
          type: "error",
        },
      ],
    });
  }
}

module.exports = { runQualityScan };
