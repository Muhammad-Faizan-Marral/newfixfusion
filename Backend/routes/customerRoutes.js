const express = require('express');
const router = express.Router();
const {
  upload,
  postIssue,
  getMyIssues,
  deleteMyIssue,
  updateMyIssue,
  getAllIssues
} = require('../controllers/customerController');

// Post issue (text + image)
router.post('/issue', upload.single('image'), postIssue);

// Get all issues by user
router.get('/issues/:user_id', getMyIssues);

// Get all issues for technician dashboard
router.get('/issues/all', getAllIssues);

// Delete an issue
router.delete('/issue/:id', deleteMyIssue);

// Update an issue
router.put('/issue/:id', upload.single('image'), updateMyIssue);


module.exports = router;