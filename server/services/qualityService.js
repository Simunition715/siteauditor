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

    // Resolve to absolute path
    const absoluteRepoPath =
      looksAbsolute || path.isAbsolute(cleanedPath)
        ? cleanedPath
        : path.resolve(process.cwd(), cleanedPath);

    // Normalize the path (handle Windows backslashes, etc.)
    const normalizedPath = path.normalize(absoluteRepoPath);

    console.log("Absolute repo path:", absoluteRepoPath);
    console.log("Normalized path:", normalizedPath);

    // Validate repo path exists
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new Error("Path is not a directory");
      }
    } catch (err) {
      jobs.set(jobId, {
        status: "failed",
        error: `Invalid repository path: ${err.message}. Tried: ${normalizedPath}`,
      });
      return;
    }

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
