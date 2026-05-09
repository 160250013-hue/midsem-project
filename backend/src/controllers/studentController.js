import { body } from "express-validator";
import fs from "fs/promises";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getStudentProfileByUserId, upsertStudentProfile } from "../models/studentModel.js";
import { listJobs } from "../models/jobModel.js";
import { rankJobsForStudent } from "../services/matchingService.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const studentProfileValidation = [
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("cgpa").isFloat({ min: 0, max: 10 }).withMessage("CGPA must be between 0 and 10"),
  body("skills").isArray().withMessage("Skills must be an array")
];

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }
  res.json({ success: true, data: profile });
});

export const upsertProfile = asyncHandler(async (req, res) => {
  const profile = await upsertStudentProfile({
    userId: req.user.id,
    department: req.body.department,
    cgpa: req.body.cgpa,
    skills: req.body.skills,
    resumeUrl: req.body.resumeUrl ?? req.body.resume_url ?? "",
    projects: req.body.projects,
    preferences: req.body.preferences,
    graduationYear: req.body.graduationYear ?? req.body.graduation_year ?? null,
    facultyMentorId: req.body.facultyMentorId ?? req.body.faculty_mentor_id ?? null
  });
  res.json({ success: true, data: profile });
});

export const getMatches = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Complete your profile before viewing matches");
  }

  const jobs = await listJobs({ onlyVerified: true });
  const rankedJobs = rankJobsForStudent(profile, jobs);
  res.json({ success: true, data: rankedJobs });
});

const knownSkills = [
  "react",
  "node.js",
  "node",
  "express",
  "postgresql",
  "mongodb",
  "python",
  "java",
  "c++",
  "sql",
  "docker",
  "kubernetes",
  "aws",
  "tailwind",
  "javascript",
  "typescript",
  "machine learning",
  "data analysis"
];

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Resume PDF file is required");
  }

  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  const fileBuffer = await fs.readFile(req.file.path);
  const parsed = await pdfParse(fileBuffer);
  const text = (parsed.text || "").toLowerCase();

  const extractedSkills = knownSkills.filter((skill) => text.includes(skill));
  const mergedSkills = Array.from(new Set([...(profile.skills || []), ...extractedSkills]));

  const updatedProfile = await upsertStudentProfile({
    userId: req.user.id,
    department: profile.department,
    cgpa: profile.cgpa,
    skills: mergedSkills,
    resumeUrl: `/uploads/resumes/${path.basename(req.file.path)}`,
    projects: profile.projects || [],
    preferences: profile.preferences || {},
    graduationYear: profile.graduation_year,
    facultyMentorId: profile.faculty_mentor_id
  });

  res.json({
    success: true,
    message: "Resume uploaded and parsed successfully",
    data: {
      resumeUrl: updatedProfile.resume_url,
      extractedSkills,
      profile: updatedProfile
    }
  });
});
