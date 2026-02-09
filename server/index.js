const express = require("express");
const cors = require("cors");
const { auditWebsite } = require("./services/auditService");
const { createAuditJob, getJobStatus } = require("./services/jobService");
const { runQualityScan } = require("./services/qualityService");
const { runUxAudit } = require("./services/uxAuditService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Site Auditor API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Store jobs in memory (in production, use Redis)
const jobs = new Map();
const qualityJobs = new Map();
const uxJobs = new Map();

// Submit audit job
app.post("/api/audit", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const jobId = createAuditJob(jobs);

    // Run audit asynchronously
    auditWebsite(validUrl.href, jobId, jobs).catch((err) => {
      console.error("Audit error:", err);
      jobs.set(jobId, { status: "failed", error: err.message });
    });

    res.json({ jobId });
  } catch (error) {
    console.error("Error creating audit:", error);
    res.status(500).json({ error: "Failed to create audit job" });
  }
});

// Get job status
app.get("/api/audit/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = getJobStatus(jobs, jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

// QualityHub endpoints
app.post("/api/quality/scan", async (req, res) => {
  try {
    const { repoPath } = req.body;

    console.log("API received repoPath:", repoPath);
    console.log("Type:", typeof repoPath);

    if (!repoPath) {
      return res.status(400).json({ error: "Repository path is required" });
    }

    const jobId = createAuditJob(qualityJobs);

    // Run quality scan asynchronously
    runQualityScan(repoPath, jobId, qualityJobs).catch((err) => {
      console.error("Quality scan error:", err);
      qualityJobs.set(jobId, { status: "failed", error: err.message });
    });

    res.json({ jobId });
  } catch (error) {
    console.error("Error creating quality scan:", error);
    res.status(500).json({ error: "Failed to create quality scan job" });
  }
});

// Get quality scan job status
app.get("/api/quality/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJobStatus(qualityJobs, jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error getting quality job status:", error);
    res
      .status(500)
      .json({ error: "Failed to get job status", details: error.message });
  }
});

// UX Audit endpoints
app.post("/api/audit/ux", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const jobId = createAuditJob(uxJobs);

    // Run UX audit asynchronously
    runUxAudit(validUrl.href, jobId, uxJobs).catch((err) => {
      console.error("UX audit error:", err);
      uxJobs.set(jobId, { status: "failed", error: err.message });
    });

    res.json({ jobId });
  } catch (error) {
    console.error("Error creating UX audit:", error);
    res.status(500).json({ error: "Failed to create UX audit job" });
  }
});

// Get UX audit job status
app.get("/api/audit/ux/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJobStatus(uxJobs, jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error getting UX audit job status:", error);
    res
      .status(500)
      .json({ error: "Failed to get job status", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
