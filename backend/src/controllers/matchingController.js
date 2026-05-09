/**
 * Matching Controller
 * Handles intelligent job-student matching with AI scoring
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getStudentProfileByUserId, listStudentsForJob } from "../models/studentModel.js";
import { getJobById, listJobs } from "../models/jobModel.js";
import { rankJobsForStudent, rankCandidatesForJob } from "../utils/matchingEngine.js";
import { ROLES } from "../utils/constants.js";

/**
 * Get matched jobs for a student
 * Returns ranked jobs with match scores and recommendations
 */
export const getMatchedJobsForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Authorization check
  if (req.user.role === ROLES.STUDENT && req.user.id !== parseInt(studentId)) {
    throw new HttpError(403, "Students can only access their own matches");
  }

  // Get student profile
  const profile = await getStudentProfileByUserId(studentId);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  // Get verified jobs
  const jobs = await listJobs({ onlyVerified: true });

  // Rank jobs with matching engine
  const rankedJobs = rankJobsForStudent(profile, jobs);

  res.json({
    success: true,
    data: {
      studentProfile: {
        id: profile.id,
        cgpa: profile.cgpa,
        department: profile.department,
        skillCount: (profile.skills || []).length,
        projectCount: (profile.projects || []).length
      },
      matchedJobs: rankedJobs,
      summary: {
        totalJobs: rankedJobs.length,
        excellentMatches: rankedJobs.filter((j) => j.matchScore >= 80).length,
        goodMatches: rankedJobs.filter((j) => j.matchScore >= 60 && j.matchScore < 80).length,
        fairMatches: rankedJobs.filter((j) => j.matchScore < 60).length
      }
    }
  });
});

/**
 * Get matched candidates for a job
 * Returns ranked candidates with match scores
 */
export const getMatchedCandidatesForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Get job
  const job = await getJobById(jobId);
  if (!job) {
    throw new HttpError(404, "Job not found");
  }

  // Authorization: Only recruiter or TPO can access
  if (req.user.role === ROLES.RECRUITER && job.posted_by !== req.user.id) {
    throw new HttpError(403, "You can only view candidates for your jobs");
  }

  // Get candidates with applications
  const candidates = await listStudentsForJob(jobId, req.user.role === ROLES.TPO);

  // Rank candidates using matching engine
  const rankedCandidates = rankCandidatesForJob(job, candidates);

  res.json({
    success: true,
    data: {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        requirements: job.requirements || [],
        minCgpa: job.min_cgpa
      },
      rankedCandidates,
      summary: {
        totalApplications: rankedCandidates.length,
        excellentMatches: rankedCandidates.filter((c) => c.matchScore >= 80).length,
        goodMatches: rankedCandidates.filter((c) => c.matchScore >= 60 && c.matchScore < 80).length,
        fairMatches: rankedCandidates.filter((c) => c.matchScore < 60).length
      }
    }
  });
});

/**
 * Get personalized job recommendations for student
 * Top 5 jobs with best match scores and only positive recommendation tags
 */
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(404, "Student profile not found");
  }

  const jobs = await listJobs({ onlyVerified: true });
  const rankedJobs = rankJobsForStudent(profile, jobs);

  // Filter top recommendations with match score >= 70 or top 10
  const recommendations = rankedJobs
    .filter((job) => job.matchScore >= 70 || rankedJobs.indexOf(job) < 10)
    .slice(0, 10)
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employment_type,
      matchScore: job.matchScore,
      recommendationTags: job.recommendationTags,
      scoreDetails: job.scoreDetails,
      whyRecommended: generateRecommendationMessage(job, profile)
    }));

  res.json({
    success: true,
    data: {
      recommendations,
      message: `Found ${recommendations.length} great opportunities for you!`
    }
  });
});

/**
 * Generate human-readable recommendation message
 */
const generateRecommendationMessage = (job, profile) => {
  const scores = job.scoreDetails;
  const messages = [];

  if (scores.skillScore >= 40) {
    messages.push(
      `Your skills match ${Math.round(scores.skillScore / 50 * 100)}% of the job requirements`
    );
  }

  if (scores.cgpaScore >= 15) {
    messages.push("Your CGPA meets the minimum requirement");
  }

  if (scores.experienceScore >= 15) {
    messages.push("Your experience level is suitable for this role");
  }

  if (job.matchScore >= 80) {
    messages.push(`This is an excellent match for your profile (${job.matchScore}% match)`);
  } else if (job.matchScore >= 70) {
    messages.push(`This is a good fit for your profile (${job.matchScore}% match)`);
  }

  return messages.join(". ");
};

/**
 * Get students similar to a given profile
 * Useful for peer comparison
 */
export const getSimilarStudents = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await getStudentProfileByUserId(studentId);
  if (!student) {
    throw new HttpError(404, "Student profile not found");
  }

  // This would require a query to fetch similar students
  // Implementation depends on your database structure
  res.json({
    success: true,
    data: {
      message: "Similar students feature coming soon",
      currentStudent: {
        cgpa: student.cgpa,
        skills: student.skills
      }
    }
  });
});

export default {
  getMatchedJobsForStudent,
  getMatchedCandidatesForJob,
  getPersonalizedRecommendations,
  getSimilarStudents
};
