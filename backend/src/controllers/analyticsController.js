import { asyncHandler } from "../utils/asyncHandler.js";
import { query } from "../config/db.js";

export const getOverview = asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM applications) AS total_applications,
       (SELECT COUNT(*) FROM applications WHERE status IN ('selected', 'offer_released')) AS selected_students,
       (SELECT COUNT(*) FROM jobs WHERE verified = true) AS active_jobs,
       (SELECT ROUND(
          CASE WHEN (SELECT COUNT(*) FROM students) = 0 THEN 0
          ELSE ((SELECT COUNT(*) FROM applications WHERE status IN ('selected', 'offer_released'))::numeric /
                (SELECT COUNT(*) FROM students)::numeric) * 100 END, 2)
       ) AS placement_percentage`,
    []
  );

  const pipeline = await query(
    `SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status ORDER BY status`,
    []
  );

  // Add match score distribution
  const matchScoreDistribution = await query(
    `SELECT 
       CASE 
         WHEN match_score >= 90 THEN '90-100'
         WHEN match_score >= 80 THEN '80-90'
         WHEN match_score >= 70 THEN '70-80'
         WHEN match_score >= 60 THEN '60-70'
         WHEN match_score >= 50 THEN '50-60'
         ELSE '0-50'
       END as score_range,
       COUNT(*)::int as count
     FROM applications
     WHERE match_score IS NOT NULL
     GROUP BY score_range
     ORDER BY score_range DESC`,
    []
  );

  // Add CGPA vs Placement analysis
  const cgpaAnalysis = await query(
    `SELECT 
       CASE 
         WHEN s.cgpa >= 8.5 THEN '8.5-10'
         WHEN s.cgpa >= 7.5 THEN '7.5-8.5'
         WHEN s.cgpa >= 6.5 THEN '6.5-7.5'
         WHEN s.cgpa >= 5.5 THEN '5.5-6.5'
         ELSE '0-5.5'
       END as cgpa_range,
       COUNT(DISTINCT s.user_id)::int as total_students,
       COUNT(DISTINCT CASE WHEN a.status IN ('selected', 'offer_released') THEN s.user_id END)::int as placed_students
     FROM students s
     LEFT JOIN applications a ON a.student_id = s.user_id
     GROUP BY cgpa_range
     ORDER BY cgpa_range DESC`,
    []
  );

  // Add trending jobs
  const trendingJobs = await query(
    `SELECT 
       j.id,
       j.title,
       j.company,
       COUNT(a.id)::int as recent_applications,
       ROUND(AVG(COALESCE(a.match_score, 0))::numeric, 2) as avg_match_score
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.id 
       AND a.created_at >= NOW() - INTERVAL '7 days'
     WHERE j.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY j.id, j.title, j.company
     HAVING COUNT(a.id) > 0
     ORDER BY recent_applications DESC
     LIMIT 10`,
    []
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      pipeline: pipeline.rows,
      matchScoreDistribution,
      cgpaAnalysis: cgpaAnalysis.rows,
      trendingJobs: trendingJobs.rows
    }
  });
});

export const getAdvancedAnalytics = asyncHandler(async (_req, res) => {
  const applicationsOverTime = await query(
    `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::int AS applications
     FROM applications
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at) ASC`,
    []
  );

  const topRecruiters = await query(
    `SELECT j.company, COUNT(a.id)::int AS hires
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.status IN ('selected', 'offer_released')
     GROUP BY j.company
     ORDER BY hires DESC
     LIMIT 8`,
    []
  );

  const skillsDemand = await query(
    `SELECT LOWER(TRIM(skill)) AS skill, COUNT(*)::int AS demand
     FROM jobs,
          UNNEST(requirements) AS skill
     GROUP BY LOWER(TRIM(skill))
     ORDER BY demand DESC
     LIMIT 10`,
    []
  );

  const placementByMonth = await query(
    `SELECT TO_CHAR(DATE_TRUNC('month', updated_at), 'YYYY-MM') AS month,
            COUNT(*)::int AS placed
     FROM applications
     WHERE status IN ('selected', 'offer_released')
     GROUP BY DATE_TRUNC('month', updated_at)
     ORDER BY DATE_TRUNC('month', updated_at) ASC`,
    []
  );

  res.json({
    success: true,
    data: {
      applicationsOverTime: applicationsOverTime.rows,
      topRecruiters: topRecruiters.rows,
      skillsDemand: skillsDemand.rows,
      placementByMonth: placementByMonth.rows
    }
  });
});

/**
 * Get match score analysis for students
 */
export const getMatchScoreAnalysis = asyncHandler(async (_req, res) => {
  const distribution = await query(
    `SELECT 
       CASE 
         WHEN match_score >= 90 THEN '90-100'
         WHEN match_score >= 80 THEN '80-90'
         WHEN match_score >= 70 THEN '70-80'
         WHEN match_score >= 60 THEN '60-70'
           WHEN match_score >= 50 THEN '50-60'
         ELSE '0-50'
       END as score_range,
       COUNT(*)::int as count,
       ROUND(AVG(match_score)::numeric, 2) as avg_score
     FROM applications
     WHERE match_score IS NOT NULL
     GROUP BY score_range
     ORDER BY score_range DESC`,
    []
  );

  res.json({ success: true, data: distribution.rows });
});

/**
 * Get CGPA and placement correlation
 */
export const getCGPAPlacementCorrelation = asyncHandler(async (_req, res) => {
  const data = await query(
    `SELECT 
       CASE 
         WHEN s.cgpa >= 8.5 THEN '8.5-10'
         WHEN s.cgpa >= 7.5 THEN '7.5-8.5'
         WHEN s.cgpa >= 6.5 THEN '6.5-7.5'
         WHEN s.cgpa >= 5.5 THEN '5.5-6.5'
         ELSE '0-5.5'
       END as cgpa_range,
       COUNT(DISTINCT s.user_id)::int as total_students,
       COUNT(DISTINCT CASE WHEN a.status IN ('selected', 'offer_released') THEN s.user_id END)::int as placed_students,
       ROUND(AVG(COALESCE(a.match_score, 0))::numeric, 2) as avg_match_score
     FROM students s
     LEFT JOIN applications a ON a.student_id = s.user_id
     GROUP BY cgpa_range
     ORDER BY cgpa_range DESC`,
    []
  );

  const enhanced = data.rows.map((row) => ({
    ...row,
    placement_rate: row.total_students > 0 
      ? ((row.placed_students / row.total_students) * 100).toFixed(2)
      : 0
  }));

  res.json({ success: true, data: enhanced });
});

/**
 * Get skill demand with student skill distribution
 */
export const getSkillAnalysis = asyncHandler(async (_req, res) => {
  const jobsSkills = await query(
    `SELECT LOWER(TRIM(skill)) AS skill, COUNT(*)::int AS job_demand
     FROM jobs,
          UNNEST(requirements) AS skill
     GROUP BY LOWER(TRIM(skill))
     ORDER BY job_demand DESC
     LIMIT 15`,
    []
  );

  const studentSkills = await query(
    `SELECT LOWER(TRIM(unnest(skills))) AS skill, COUNT(DISTINCT user_id)::int AS student_count
     FROM students
     WHERE skills IS NOT NULL AND array_length(skills, 1) > 0
     GROUP BY skill
     ORDER BY student_count DESC
     LIMIT 15`,
    []
  );

  res.json({
    success: true,
    data: {
      jobsDemand: jobsSkills.rows,
      studentSkills: studentSkills.rows
    }
  });
});
