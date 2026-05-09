import { query } from "../config/db.js";

export const createOffer = async ({
  applicationId,
  offerLetterUrl,
  certificateUrl
}) => {
  const result = await query(
    `INSERT INTO offers (application_id, offer_letter_url, certificate_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [applicationId, offerLetterUrl, certificateUrl || null]
  );
  return result.rows[0];
};

export const listOffersByStudent = async (studentId) => {
  const result = await query(
    `SELECT o.*, j.title, j.company
     FROM offers o
     JOIN applications a ON a.id = o.application_id
     JOIN jobs j ON j.id = a.job_id
     WHERE a.student_id = $1
     ORDER BY o.created_at DESC`,
    [studentId]
  );
  return result.rows;
};
