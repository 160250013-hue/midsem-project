import { query } from "../config/db.js";

export const createUser = async ({
  name,
  fullName,
  email,
  passwordHash,
  role,
  phone
}) => {
  const displayName = name || fullName;

  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, role, phone, is_active, email_verified, is_verified, created_at`,
    [displayName, email.toLowerCase(), passwordHash, role, phone]
  );

  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await query(
    `SELECT id, full_name, email, password_hash, role, phone, is_active, email_verified, is_verified, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await query(
    `SELECT id, full_name, email, role, phone, is_active, email_verified, is_verified, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const listUsers = async () => {
  const result = await query(
    `SELECT id, full_name, email, role, phone, is_active, email_verified, is_verified, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

export const updateUserStatus = async (id, isActive) => {
  const result = await query(
    `UPDATE users SET is_active = $2 WHERE id = $1
     RETURNING id, full_name, email, role, phone, is_active, email_verified, is_verified, created_at`,
    [id, isActive]
  );
  return result.rows[0];
};

export const updateUserPassword = async (id, passwordHash) => {
  const result = await query(
    `UPDATE users SET password_hash = $2 WHERE id = $1
     RETURNING id, full_name, email, role, phone, is_active, email_verified, is_verified, created_at`,
    [id, passwordHash]
  );
  return result.rows[0];
};
