// models/bidModel.js
const pool = require('../config/db');

const placeBid = async ({ request_id, technician_id, price, estimated_time, message }) => {
  const query = `
    INSERT INTO bids (request_id, technician_id, price, estimated_time, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [request_id, technician_id, price, estimated_time, message];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getBidsForRequest = async (request_id) => {
  const result = await pool.query(
    `SELECT bids.*, users.name AS technician_name
     FROM bids
     JOIN users ON bids.technician_id = users.id
     WHERE request_id = $1`,
    [request_id]
  );
  return result.rows;
};

module.exports = {
  placeBid,
  getBidsForRequest
};
