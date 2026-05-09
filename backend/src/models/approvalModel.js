import { query } from "../config/db.js";

export const createApproval = async ({ applicationId, facultyId, decision, remarks }) => {
  const result = await query(
    `INSERT INTO approvals (application_id, faculty_id, decision, remarks)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [applicationId, facultyId, decision, remarks || null]
  );
  return result.rows[0];
};

export const getApprovalByApplicationId = async (applicationId) => {
  const result = await query(
    `SELECT * FROM approvals WHERE application_id = $1`,
    [applicationId]
  );
  return result.rows[0];
};

export const listPendingApprovals = async (facultyId) => {
  const result = await query(
    `SELECT ap.*, a.student_id, a.job_id, u.full_name AS student_name, j.title, j.company
     FROM approvals ap
     JOIN applications a ON a.id = ap.application_id
     JOIN users u ON u.id = a.student_id
     JOIN jobs j ON j.id = a.job_id
     WHERE ap.faculty_id = $1 AND ap.decision = 'pending'
     ORDER BY ap.created_at ASC`,
    [facultyId]
  );
  return result.rows;
};

export const updateApproval = async ({ id, decision, remarks }) => {
  const result = await query(
    `UPDATE approvals
     SET decision = $2, remarks = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, decision, remarks || null]
  );
  return result.rows[0];
};
