/**
 * Matching Routes
 * API endpoints for intelligent job-candidate matching
 */

import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";
import {
  getMatchedJobsForStudent,
  getMatchedCandidatesForJob,
  getPersonalizedRecommendations,
  getSimilarStudents
} from "../controllers/matchingController.js";

const router = Router();

/**
 * GET /matching/jobs/:studentId
 * Get matched jobs for a student with scoring and tags
 * Access: Student (own profile), TPO, Recruiters
 */
router.get(
  "/jobs/:studentId",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT, ROLES.TPO, ROLES.RECRUITER, ROLES.FACULTY),
  getMatchedJobsForStudent
);

/**
 * GET /matching/candidates/:jobId
 * Get matched candidates for a job with scoring
 * Access: Recruiter (own jobs), TPO
 */
router.get(
  "/candidates/:jobId",
  authenticateUser,
  authorizeRoles(ROLES.RECRUITER, ROLES.TPO),
  getMatchedCandidatesForJob
);

/**
 * GET /matching/recommendations
 * Get personalized job recommendations for current student
 * Top jobs with best matches and positive tags
 * Access: Student only
 */
router.get(
  "/recommendations",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT),
  getPersonalizedRecommendations
);

/**
 * GET /matching/similar/:studentId
 * Get students similar to given profile
 * Access: TPO, Faculty mentors
 */
router.get(
  "/similar/:studentId",
  authenticateUser,
  authorizeRoles(ROLES.TPO, ROLES.FACULTY),
  getSimilarStudents
);

export default router;
