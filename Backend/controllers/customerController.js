const multer = require('multer');
const path = require('path');
const pool = require('../config/db'); // Add pool import for getAllIssues
const {
  addIssue,
  getIssuesByUserId,
  deleteIssue,
  updateIssue,
} = require('../models/customerModel');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

const postIssue = async (req, res) => {
  try {
    const { user_id, issue } = req.body;
    const image = req.file ? req.file.filename : null;
    
    const newIssue = await addIssue({ user_id, issue, image });
    res.status(201).json({ message: 'Issue posted successfully.', issue: newIssue });
  } catch (err) {
    console.error('Post Issue Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyIssues = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const issues = await getIssuesByUserId(user_id);
    res.status(200).json(issues);
  } catch (err) {
    console.error('Get Issues Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


const deleteMyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const deleted = await deleteIssue(id, user_id);
    if (!deleted) {
      return res.status(404).json({ message: 'Issue not found or not yours.' });
    }
    
    res.status(200).json({ message: 'Issue deleted.', deleted });
  } catch (err) {
    console.error('Delete Issue Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, issue } = req.body;
    const image = req.file ? req.file.filename : null;
    
    const updated = await updateIssue({ id, user_id, issue, image });
    if (!updated) {
      return res.status(404).json({ message: 'Issue not found or not yours.' });
    }
    
    res.status(200).json({ message: 'Issue updated.', updated });
  } catch (err) {
    console.error('Update Issue Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllIssues = async (req, res) => {
  try {
    const issues = await pool.query(
      'SELECT * FROM repair_requests ORDER BY created_at DESC'
    );
    res.status(200).json(issues.rows);
  } catch (err) {
    console.error('Get All Issues Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  upload,
  postIssue,
  getMyIssues,
  deleteMyIssue,
  updateMyIssue,
  getAllIssues
};