import { query } from "../config/db.js";

export const createJob = async ({
  title,
  company,
  description,
  requirements,
  minCgpa,
  location,
  employmentType,
  postedBy,
  verified,
  deadline,
  preferences
}) => {
  const result = await query(
    `INSERT INTO jobs
      (title, company, description, requirements, min_cgpa, location, employment_type, posted_by, verified, deadline, preferences)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      title,
      company,
      description,
      requirements,
      minCgpa,
      location,
      employmentType,
      postedBy,
      verified,
      deadline,
      JSON.stringify(preferences || {})
    ]
  );
  return mapJob(result.rows[0]);
};

export const listJobs = async ({ onlyVerified = false, postedBy = null } = {}) => {
  const conditions = [];
  const params = [];

  if (onlyVerified) {
    params.push(true);
    conditions.push(`verified = $${params.length}`);
  }

  if (postedBy) {
    params.push(postedBy);
    conditions.push(`posted_by = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT j.*, u.full_name AS poster_name
     FROM jobs j
     JOIN users u ON u.id = j.posted_by
     ${whereClause}
     ORDER BY created_at DESC`,
    params
  );
  return result.rows.map(mapJob);
};

export const getJobById = async (id) => {
  const result = await query(
    `SELECT j.*, u.full_name AS poster_name
     FROM jobs j
     JOIN users u ON u.id = j.posted_by
     WHERE j.id = $1`,
    [id]
  );
  return result.rows[0] ? mapJob(result.rows[0]) : null;
};

const mapJob = (row) => ({
  ...row,
  requirements: row.requirements || [],
  preferences: row.preferences || {}
});
