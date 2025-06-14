// models/ratingModel.js
const pool = require('../config/db');

const giveRating = async ({ technician_id, customer_id, rating, comment }) => {
  const query = `
    INSERT INTO ratings (technician_id, customer_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [technician_id, customer_id, rating, comment];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getRatingsByTechnician = async (technician_id) => {
  const result = await pool.query(
    `SELECT r.*, u.name AS customer_name
     FROM ratings r
     JOIN users u ON r.customer_id = u.id
     WHERE r.technician_id = $1
     ORDER BY r.created_at DESC`,
    [technician_id]
  );
  return result.rows;
};

const getTechnicianAvgRating = async (technician_id) => {
  const result = await pool.query(
    `SELECT AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*) AS total_reviews
     FROM ratings
     WHERE technician_id = $1`,
    [technician_id]
  );
  return result.rows[0];
};

module.exports = {
  giveRating,
  getRatingsByTechnician,
  getTechnicianAvgRating
};
