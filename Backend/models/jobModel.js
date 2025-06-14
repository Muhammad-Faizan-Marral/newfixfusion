// models/jobModel.js
const pool = require('../config/db');

const createJob = async ({ request_id, bid_id, customer_id, technician_id }) => {
  const query = `
    INSERT INTO jobs (request_id, bid_id, customer_id, technician_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [request_id, bid_id, customer_id, technician_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getJobsByCustomer = async (customer_id) => {
  const result = await pool.query(
    `SELECT j.*, u.name AS technician_name
     FROM jobs j
     JOIN users u ON j.technician_id = u.id
     WHERE j.customer_id = $1
     ORDER BY j.started_at DESC`,
    [customer_id]
  );
  return result.rows;
};

const getJobsByTechnician = async (technician_id) => {
  const result = await pool.query(
    `SELECT j.*, u.name AS customer_name
     FROM jobs j
     JOIN users u ON j.customer_id = u.id
     WHERE j.technician_id = $1
     ORDER BY j.started_at DESC`,
    [technician_id]
  );
  return result.rows;
};

const markJobComplete = async (job_id) => {
  const result = await pool.query(
    `UPDATE jobs SET status = 'completed', completed_at = NOW()
     WHERE id = $1 RETURNING *`,
    [job_id]
  );
  return result.rows[0];
};

module.exports = {
  createJob,
  getJobsByCustomer,
  getJobsByTechnician,
  markJobComplete
};
