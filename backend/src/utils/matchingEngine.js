/**
 * Enhanced AI Matching Engine
 * Implements intelligent job-student matching with weighted scoring
 * Weights: Skills (50%) + CGPA (20%) + Experience (20%) + Preferences (10%)
 */

const normalizeArray = (items = []) =>
  items.map((item) => item.toString().trim().toLowerCase()).filter(Boolean);

/**
 * Calculate skill match score (0-50 points)
 * Matches student skills with job requirements
 */
export const calculateSkillScore = (studentSkills, requiredSkills) => {
  const normalized_student = normalizeArray(studentSkills);
  const normalized_required = normalizeArray(requiredSkills);

  if (normalized_required.length === 0) return 50; // No requirements = perfect match

  const matchedSkills = normalized_required.filter((skill) =>
    normalized_student.some(
      (s) => s.includes(skill) || skill.includes(s) // Partial match support
    )
  );

  return (matchedSkills.length / normalized_required.length) * 50;
};

/**
 * Calculate CGPA score (0-20 points)
 * Penalties for below minimum CGPA
 */
export const calculateCgpaScore = (studentCgpa, minCgpa) => {
  const cgpa = Number(studentCgpa || 0);
  const min_cgpa = Number(minCgpa || 0);

  if (cgpa >= min_cgpa) {
    return 20; // Full points if meets minimum
  }

  // Penalty: -8 points per 0.1 CGPA below minimum
  const penalty = (min_cgpa - cgpa) * 8;
  return Math.max(0, 20 - penalty);
};

/**
 * Calculate experience score (0-20 points)
 * Based on projects and inferred experience years
 */
export const calculateExperienceScore = (
  studentProfile,
  jobExperienceYears = 0
) => {
  const projectCount = (studentProfile.projects?.length || 0);
  const inferredYears = projectCount * 0.5; // 0.5 years per project
  const experienceYears = studentProfile.experience_years || inferredYears;

  const required = Number(jobExperienceYears || 0);

  if (required === 0) {
    return 20; // No experience requirement = full points
  }

  const ratio = Math.min(experienceYears / required, 1);
  return ratio * 20;
};

/**
 * Calculate preference match score (0-10 points)
 * Job title and location preferences
 */
export const calculatePreferenceScore = (studentProfile, job) => {
  const preferenceRoles = normalizeArray(
    studentProfile.preferences?.roles || []
  );
  const preferenceLocations = normalizeArray(
    studentProfile.preferences?.locations || []
  );

  const job_title = (job.title || "").toLowerCase();
  const job_location = (job.location || "").toLowerCase();

  let score = 0;

  // Title preferences: 6 points
  if (
    preferenceRoles.some((pref) =>
      job_title.includes(pref) || pref.includes(job_title.split(" ")[0])
    )
  ) {
    score += 6;
  }

  // Location preferences: 4 points
  if (
    preferenceLocations.some(
      (pref) =>
        job_location.includes(pref) || pref.includes(job_location.split(" ")[0])
    )
  ) {
    score += 4;
  }

  return Math.min(score, 10);
};

/**
 * Main matching score calculation
 * Returns 0-100 score with weighted components
 * Weights: Skills(50) + CGPA(20) + Experience(20) + Preferences(10)
 */
export const calculateMatchScore = (studentProfile, job) => {
  const skillScore = calculateSkillScore(
    studentProfile.skills || [],
    job.requirements || []
  );

  const cgpaScore = calculateCgpaScore(studentProfile.cgpa, job.min_cgpa);

  const experienceScore = calculateExperienceScore(
    studentProfile,
    job.preferences?.experienceYears ||
      job.preferences?.experience_years ||
      0
  );

  const preferenceScore = calculatePreferenceScore(studentProfile, job);

  const totalScore = skillScore + cgpaScore + experienceScore + preferenceScore;

  return Math.round(totalScore);
};

/**
 * Generate recommendation tags for a job
 * Tags: Best Match, High Salary, Trending Skill, Growth Opportunity
 */
export const generateRecommendationTags = (matchScore, job, studentProfile) => {
  const tags = [];

  // Best Match: score >= 75
  if (matchScore >= 75) {
    tags.push({ tag: "Best Match", color: "green", priority: 1 });
  }

  // High Salary: if salary > 10 LPA (assumed from preferences)
  if (job.preferences?.salary_lpa && job.preferences.salary_lpa > 10) {
    tags.push({ tag: "High Salary", color: "blue", priority: 2 });
  }

  // Trending Skill: if job has in-demand tech stacks
  const trendingSkills = [
    "react",
    "node.js",
    "python",
    "machine learning",
    "cloud",
    "kubernetes",
    "aws"
  ];
  const jobReqs = normalizeArray(job.requirements || []);
  const hasTrendingSkill = jobReqs.some((req) =>
    trendingSkills.some(
      (trend) =>
        req.includes(trend) ||
        trend.includes(req.split(" ")[0])
    )
  );

  if (hasTrendingSkill) {
    tags.push({ tag: "Trending Skills", color: "purple", priority: 3 });
  }

  // Growth Opportunity: if CGPA requirement is flexible or experience is low
  if (job.min_cgpa <= 6.0 && (!job.preferences?.experienceYears || job.preferences.experienceYears <= 1)) {
    tags.push({ tag: "Growth Opportunity", color: "orange", priority: 4 });
  }

  return tags;
};

/**
 * Rank jobs for a student
 * Returns jobs sorted by match score with recommendation tags
 */
export const rankJobsForStudent = (studentProfile, jobs) => {
  return jobs
    .map((job) => {
      const matchScore = calculateMatchScore(studentProfile, job);
      const tags = generateRecommendationTags(matchScore, job, studentProfile);

      return {
        ...job,
        matchScore,
        recommendationTags: tags,
        scoreDetails: {
          skillScore: calculateSkillScore(
            studentProfile.skills || [],
            job.requirements || []
          ),
          cgpaScore: calculateCgpaScore(studentProfile.cgpa, job.min_cgpa),
          experienceScore: calculateExperienceScore(
            studentProfile,
            job.preferences?.experienceYears ||
              job.preferences?.experience_years
          ),
          preferenceScore: calculatePreferenceScore(studentProfile, job)
        }
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Find best matches for a job (recruiter view)
 * Returns top candidates ranked by match score
 */
export const rankCandidatesForJob = (job, candidates) => {
  return candidates
    .map((candidate) => {
      const matchScore = calculateMatchScore(candidate.student, job);
      const tags = generateRecommendationTags(matchScore, job, candidate.student);

      return {
        ...candidate,
        matchScore,
        recommendationTags: tags,
        scoreDetails: {
          skillScore: calculateSkillScore(
            candidate.student.skills || [],
            job.requirements || []
          ),
          cgpaScore: calculateCgpaScore(
            candidate.student.cgpa,
            job.min_cgpa
          ),
          experienceScore: calculateExperienceScore(candidate.student, 0),
          preferenceScore: calculatePreferenceScore(candidate.student, job)
        }
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

export default {
  calculateSkillScore,
  calculateCgpaScore,
  calculateExperienceScore,
  calculatePreferenceScore,
  calculateMatchScore,
  generateRecommendationTags,
  rankJobsForStudent,
  rankCandidatesForJob
};
