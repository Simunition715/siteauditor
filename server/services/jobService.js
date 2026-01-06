const { randomUUID } = require("crypto");

function createAuditJob(jobs) {
  const jobId = randomUUID();
  jobs.set(jobId, {
    status: "processing",
    progress: 0,
    result: null,
    error: null,
  });
  return jobId;
}

function getJobStatus(jobs, jobId) {
  return jobs.get(jobId) || null;
}

function updateJobProgress(jobs, jobId, progress) {
  const job = jobs.get(jobId);
  if (job) {
    job.progress = progress;
  }
}

function updateJobResult(jobs, jobId, result) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = "completed";
    job.progress = 100;
    job.result = result;
  }
}

function updateJobError(jobs, jobId, error) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = "failed";
    job.error = error;
  }
}

module.exports = {
  createAuditJob,
  getJobStatus,
  updateJobProgress,
  updateJobResult,
  updateJobError,
};
