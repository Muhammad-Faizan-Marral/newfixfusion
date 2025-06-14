// controllers/adminController.js
const pool = require('../config/db');

const getPendingTechnicians = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role FROM users WHERE role = 'technician' AND is_approved = false`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get Pending Techs Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE users SET is_approved = true WHERE id = $1`,
      [id]
    );
    res.status(200).json({ message: 'Technician approved successfully.' });
  } catch (err) {
    console.error('Approve Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM users WHERE id = $1 AND role = 'technician'`, [id]);
    res.status(200).json({ message: 'Technician rejected and removed.' });
  } catch (err) {
    console.error('Reject Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingTechnicians,
  approveTechnician,
  rejectTechnician
};
