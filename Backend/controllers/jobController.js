// controllers/jobController.js
const {
  createJob,
  getJobsByCustomer,
  getJobsByTechnician,
  markJobComplete
} = require('../models/jobModel');

const startJob = async (req, res) => {
  try {
    const { request_id, bid_id, customer_id, technician_id } = req.body;

    if (!request_id || !bid_id || !customer_id || !technician_id) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    const job = await createJob({ request_id, bid_id, customer_id, technician_id });
    res.status(201).json({ message: 'Job started.', job });
  } catch (err) {
    console.error('Start Job Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getCustomerJobs = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const jobs = await getJobsByCustomer(customer_id);
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Get Customer Jobs Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTechnicianJobs = async (req, res) => {
  try {
    const { technician_id } = req.params;
    const jobs = await getJobsByTechnician(technician_id);
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Get Technician Jobs Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await markJobComplete(id);

    if (!job) return res.status(404).json({ message: 'Job not found.' });

    res.status(200).json({ message: 'Job marked as completed.', job });
  } catch (err) {
    console.error('Complete Job Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  startJob,
  getCustomerJobs,
  getTechnicianJobs,
  completeJob
};
