import { query } from "../config/db.js";

export const createApplication = async ({
  studentId,
  jobId,
  status,
  matchScore
}) => {
  const result = await query(
    `INSERT INTO applications (student_id, job_id, status, match_score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [studentId, jobId, status, matchScore]
  );
  return result.rows[0];
};

export const getApplicationByStudentAndJob = async (studentId, jobId) => {
  const result = await query(
    `SELECT * FROM applications WHERE student_id = $1 AND job_id = $2`,
    [studentId, jobId]
  );
  return result.rows[0];
};

export const getApplicationById = async (id) => {
  const result = await query(
    `SELECT * FROM applications WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const listApplicationsForStudent = async (studentId) => {
  const result = await query(
    `SELECT a.*, j.title, j.company, j.location
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.student_id = $1
     ORDER BY a.created_at DESC`,
    [studentId]
  );
  return result.rows;
};

export const updateApplicationStatus = async (id, status) => {
  const result = await query(
    `UPDATE applications
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return result.rows[0];
};

export const getApplicationNotificationDetails = async (applicationId) => {
  const result = await query(
    `SELECT a.id,
            a.status,
            u.email,
            u.full_name AS student_name,
            j.title AS job_title,
            j.company
     FROM applications a
     JOIN users u ON u.id = a.student_id
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1`,
    [applicationId]
  );

  return result.rows[0];
};
