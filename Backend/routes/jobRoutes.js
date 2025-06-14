// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const {
  startJob,
  getCustomerJobs,
  getTechnicianJobs,
  completeJob
} = require('../controllers/jobController');

// Start a job
router.post('/start', startJob);

// Get jobs by customer
router.get('/user/:customer_id', getCustomerJobs);

// Get jobs by technician
router.get('/technician/:technician_id', getTechnicianJobs);

// Mark job completed
router.put('/:id/complete', completeJob);


module.exports = router;
