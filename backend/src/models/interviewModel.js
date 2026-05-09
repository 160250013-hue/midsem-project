import { query } from "../config/db.js";

export const scheduleInterview = async ({
  applicationId,
  recruiterId,
  interviewDate,
  mode,
  status
}) => {
  const result = await query(
    `INSERT INTO interviews (application_id, recruiter_id, interview_date, mode, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [applicationId, recruiterId, interviewDate, mode, status]
  );
  return result.rows[0];
};

export const listInterviewsByUser = async ({ userId, role }) => {
  const result = await query(
    `SELECT i.*, j.title, j.company, u.full_name AS student_name
     FROM interviews i
     JOIN applications a ON a.id = i.application_id
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = a.student_id
     WHERE ${role === "student" ? "a.student_id" : "i.recruiter_id"} = $1
     ORDER BY i.interview_date ASC`,
    [userId]
  );
  return result.rows;
};
