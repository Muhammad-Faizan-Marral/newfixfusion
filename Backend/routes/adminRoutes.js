// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPendingTechnicians,
  approveTechnician,
  rejectTechnician
} = require('../controllers/adminController');

router.get('/pending-technicians', getPendingTechnicians);
router.put('/approve/:id', approveTechnician);
router.put('/reject/:id', rejectTechnician);

module.exports = router;
