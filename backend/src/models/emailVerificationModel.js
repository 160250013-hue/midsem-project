import { pool } from "../config/db.js";

export const createEmailVerification = async ({ userId, otp, expiryTime }) => {
  const result = await pool.query(
    `INSERT INTO email_verifications (user_id, otp, expiry_time, attempt_count)
     VALUES ($1, $2, $3, 0)
     RETURNING id, user_id, otp, expiry_time, attempt_count, is_verified`,
    [userId, otp, expiryTime]
  );
  return result.rows[0];
};

export const getEmailVerificationByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id, user_id, otp, expiry_time, attempt_count, is_verified
     FROM email_verifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

export const incrementEmailVerificationAttempts = async (verificationId) => {
  const result = await pool.query(
    `UPDATE email_verifications
     SET attempt_count = attempt_count + 1
     WHERE id = $1
     RETURNING id, user_id, otp, expiry_time, attempt_count, is_verified`,
    [verificationId]
  );
  return result.rows[0];
};

export const updateUserEmailVerificationStatus = async (userId) => {
  const result = await pool.query(
    `UPDATE users
     SET email_verified = TRUE,
         is_verified = TRUE
     WHERE id = $1
     RETURNING id, full_name, email, role, email_verified, is_verified`,
    [userId]
  );
  return result.rows[0];
};

export const deleteEmailVerificationsByUserId = async (userId) => {
  await pool.query(
    `DELETE FROM email_verifications
     WHERE user_id = $1`,
    [userId]
  );
};

export const deleteExpiredEmailVerifications = async () => {
  await pool.query(
    `DELETE FROM email_verifications
     WHERE expiry_time < NOW()`,
    []
  );
};
