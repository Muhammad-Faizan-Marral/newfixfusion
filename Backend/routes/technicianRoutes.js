const express = require('express');
const router = express.Router();
const {
  postProfile,
  getTechnicianProfile
} = require('../controllers/technicianController');

// POST/UPDATE technician profile
router.post('/profile', postProfile);

// GET technician profile + ratings
router.get('/:id/profile', getTechnicianProfile);

module.exports = router;
