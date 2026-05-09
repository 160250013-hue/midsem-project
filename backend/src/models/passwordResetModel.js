import { pool } from "../config/db.js";

export const createPasswordReset = async ({ userId, token, expiryTime }) => {
  const result = await pool.query(
    `INSERT INTO password_resets (user_id, token, expiry_time)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expiry_time, is_used`,
    [userId, token, expiryTime]
  );
  return result.rows[0];
};

export const getPasswordResetByToken = async (token) => {
  const result = await pool.query(
    `SELECT id, user_id, token, expiry_time, is_used
     FROM password_resets
     WHERE token = $1`,
    [token]
  );
  return result.rows[0];
};

export const markPasswordResetAsUsed = async (resetId) => {
  const result = await pool.query(
    `UPDATE password_resets
     SET is_used = TRUE
     WHERE id = $1
     RETURNING id, user_id, token, expiry_time, is_used`,
    [resetId]
  );
  return result.rows[0];
};

export const deleteExpiredPasswordResets = async () => {
  await pool.query(
    `DELETE FROM password_resets
     WHERE expiry_time < NOW() OR is_used = TRUE`,
    []
  );
};

export const deletePasswordResetsByUserId = async (userId) => {
  await pool.query(
    `DELETE FROM password_resets
     WHERE user_id = $1 AND is_used = FALSE`,
    [userId]
  );
};
