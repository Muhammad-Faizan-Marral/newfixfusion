// models/userModel.js
const pool = require('../config/db');

const createUser = async ({ name, email, password, role, otp, otp_expires_at }) => {
  const query = `
    INSERT INTO users (name, email, password, role, otp, otp_expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, role, is_verified;
  `;
  const values = [name, email, password, role, otp, otp_expires_at];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const verifyUserOTP = async (email) => {
  await pool.query(`
    UPDATE users
    SET is_verified = true, otp = NULL, otp_expires_at = NULL
    WHERE email = $1
  `, [email]);
};

module.exports = {
  createUser,
  getUserByEmail,
  verifyUserOTP
};
