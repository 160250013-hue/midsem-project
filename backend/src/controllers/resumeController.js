/**
 * Resume Controller
 * Handles resume uploads, parsing, skill extraction, and quality scoring
 */

import fs from "fs/promises";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getStudentProfileByUserId, upsertStudentProfile } from "../models/studentModel.js";
import { extractSkillsFromText, extractSkillsByCategory, scoreResumeQuality, getSkillRecommendations } from "../utils/skillExtractor.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Parse PDF and extract text
 */
const parsePDF = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text || "";
  } catch (error) {
    throw new HttpError(400, `Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Upload and parse resume
 * Automatically extracts skills and updates student profile
 */
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Resume PDF file is required");
  }

  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found. Complete your profile first.");
  }

  // Parse PDF
  const resumeText = await parsePDF(req.file.path);
  if (!resumeText || resumeText.trim().length === 0) {
    throw new HttpError(400, "Resume PDF appears to be empty or corrupted");
  }

  // Extract skills
  const extractedSkills = extractSkillsFromText(resumeText);
  const skillsByCategory = extractSkillsByCategory(resumeText);
  const resumeQuality = scoreResumeQuality(resumeText);
  const skillRecommendations = getSkillRecommendations(extractedSkills);

  // Merge with existing skills
  const mergedSkills = Array.from(
    new Set([...(profile.skills || []), ...extractedSkills])
  );

  // Update profile
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
      profile: updatedProfile,
      extractedSkills,
      skillsByCategory,
      resumeQuality,
      skillRecommendations,
      resume_url: updatedProfile.resume_url
    }
  });
});

/**
 * Get resume analysis for student
 */
export const getResumeAnalysis = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  if (!profile.resume_url) {
    return res.json({
      success: true,
      data: {
        message: "No resume uploaded yet",
        analysis: null
      }
    });
  }

  // Try to read resume (if accessible)
  try {
    const resumePath = path.join(process.cwd(), "uploads/resumes", path.basename(profile.resume_url));
    const resumeText = await fs.readFile(resumePath, "utf-8");
    
    const analysis = {
      skills: profile.skills || [],
      skillsByCategory: extractSkillsByCategory(resumeText),
      quality: scoreResumeQuality(resumeText),
      recommendations: getSkillRecommendations(profile.skills || [])
    };

    res.json({ success: true, data: analysis });
  } catch {
    // If resume file not accessible, return skills from profile
    res.json({
      success: true,
      data: {
        skills: profile.skills || [],
        recommendations: getSkillRecommendations(profile.skills || []),
        message: "Resume file not accessible, showing stored skills"
      }
    });
  }
});

/**
 * Get skill recommendations based on profile
 */
export const getSkillRecommendationsController = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  const recommendations = getSkillRecommendations(profile.skills || []);

  res.json({
    success: true,
    data: {
      currentSkills: profile.skills || [],
      recommendedSkills: recommendations,
      message: `Based on your ${profile.skills?.length || 0} current skills, we recommend learning: ${recommendations.join(", ")}`
    }
  });
});

/**
 * Delete resume
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  if (!profile.resume_url) {
    throw new HttpError(404, "No resume to delete");
  }

  // Delete file from server
  try {
    const resumePath = path.join(process.cwd(), "uploads/resumes", path.basename(profile.resume_url));
    await fs.unlink(resumePath);
  } catch {
    // File might not exist, continue
  }

  // Update profile
  const updatedProfile = await upsertStudentProfile({
    userId: req.user.id,
    department: profile.department,
    cgpa: profile.cgpa,
    skills: profile.skills || [],
    resumeUrl: "",
    projects: profile.projects || [],
    preferences: profile.preferences || {},
    graduationYear: profile.graduation_year,
    facultyMentorId: profile.faculty_mentor_id
  });

  res.json({
    success: true,
    message: "Resume deleted successfully",
    data: updatedProfile
  });
});

export default {
  uploadResume,
  getResumeAnalysis,
  getSkillRecommendationsController,
  deleteResume
};
