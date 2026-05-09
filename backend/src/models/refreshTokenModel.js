import { query } from "../config/db.js";
import { hashToken } from "../utils/tokenService.js";

export const saveRefreshToken = async ({ userId, token, expiryDate }) => {
  const tokenHash = hashToken(token);

  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token, expiry_date)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expiry_date, created_at`,
    [userId, tokenHash, expiryDate]
  );

  return result.rows[0];
};

export const getRefreshToken = async (token) => {
  const tokenHash = hashToken(token);

  const result = await query(
    `SELECT id, user_id, token, expiry_date, created_at
     FROM refresh_tokens
     WHERE token = $1`,
    [tokenHash]
  );

  return result.rows[0];
};

export const deleteRefreshToken = async (token) => {
  const tokenHash = hashToken(token);

  const result = await query(
    `DELETE FROM refresh_tokens
     WHERE token = $1
     RETURNING id`,
    [tokenHash]
  );

  return result.rowCount > 0;
};

export const deleteRefreshTokensByUserId = async (userId) => {
  await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
};

export const deleteExpiredRefreshTokens = async () => {
  await query("DELETE FROM refresh_tokens WHERE expiry_date <= NOW()");
};
