const pool = require('../config/db');

const addIssue = async ({ user_id, issue, image }) => {
  const query = `
    INSERT INTO repair_requests (user_id, issue, image)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [user_id, issue, image];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getIssuesByUserId = async (userId) => {
  try {
    let query;
    let values;

    if (userId === 'all') {
      // If "all", fetch all issues
      query = 'SELECT * FROM repair_requests ORDER BY created_at DESC';
      values = [];
    } else {
      // Otherwise, fetch user-specific issues
      query = 'SELECT * FROM repair_requests WHERE user_id = $1 ORDER BY created_at DESC';
      values = [parseInt(userId)];
    }

    const result = await pool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error('Get Issues Error:', err);
    throw err;
  }
};



const deleteIssue = async (id, user_id) => {
  const result = await pool.query(
    'DELETE FROM repair_requests WHERE id = $1 AND user_id = $2 RETURNING *', 
    [id, user_id]
  );
  return result.rows[0];
};

const updateIssue = async ({ id, user_id, issue, image }) => {
  let query, values;
  
  if (image) {
    // Update with new image
    query = `
      UPDATE repair_requests
      SET issue = $1, image = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *;
    `;
    values = [issue, image, id, user_id];
  } else {
    // Update without changing image
    query = `
      UPDATE repair_requests
      SET issue = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *;
    `;
    values = [issue, id, user_id];
  }
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  addIssue,
  getIssuesByUserId,
  deleteIssue,
  updateIssue
};
