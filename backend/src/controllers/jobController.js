import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createJob, getJobById, listJobs } from "../models/jobModel.js";
import { getStudentProfileByUserId, listStudentsForJob } from "../models/studentModel.js";
import { HttpError } from "../utils/httpError.js";
import { ROLES } from "../utils/constants.js";
import { rankJobsForStudent } from "../services/matchingService.js";

export const createJobValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("company").trim().notEmpty().withMessage("Company is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("requirements").isArray().withMessage("Requirements must be an array"),
  body("minCgpa").isFloat({ min: 0, max: 10 }).withMessage("Minimum CGPA must be between 0 and 10")
];

export const createJobHandler = asyncHandler(async (req, res) => {
  const job = await createJob({
    ...req.body,
    postedBy: req.user.id,
    verified: req.user.role === ROLES.TPO
  });
  res.status(201).json({ success: true, data: job });
});

export const listJobsHandler = asyncHandler(async (req, res) => {
  const onlyVerified = req.user?.role === ROLES.STUDENT || req.query.onlyVerified === "true";
  const postedBy =
    req.user?.role === ROLES.RECRUITER && req.query.mine === "true" ? req.user.id : null;
  const jobs = await listJobs({ onlyVerified, postedBy });
  res.json({ success: true, data: jobs });
});

export const getJobHandler = asyncHandler(async (req, res) => {
  const job = await getJobById(req.params.id);
  if (!job) {
    throw new HttpError(404, "Job not found");
  }
  res.json({ success: true, data: job });
});

export const getCandidatesForJob = asyncHandler(async (req, res) => {
  const job = await getJobById(req.params.id);
  if (!job) {
    throw new HttpError(404, "Job not found");
  }

  if (req.user.role === ROLES.RECRUITER && job.posted_by !== req.user.id) {
    throw new HttpError(403, "You can only view candidates for your jobs");
  }

  const candidates = await listStudentsForJob(req.params.id, req.user.role === ROLES.TPO);
  res.json({ success: true, data: candidates });
});

export const getMatchedJobsForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === ROLES.STUDENT && req.user.id !== studentId) {
    throw new HttpError(403, "Students can only access their own matches");
  }

  const profile = await getStudentProfileByUserId(studentId);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  const jobs = await listJobs({ onlyVerified: true });
  const rankedJobs = rankJobsForStudent(profile, jobs);

  res.json({ success: true, data: rankedJobs });
});
