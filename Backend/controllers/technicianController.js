const {
  createOrUpdateProfile,
  getProfileWithRating
} = require('../models/technicianModel');

const postProfile = async (req, res) => {
  try {
    const { technician_id, bio, location, skills, availability } = req.body;
    
    console.log('Received data:', { technician_id, bio, location, skills, availability });
    
    if (!technician_id || !bio || !location || !skills) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    // Handle skills array - ensure it's always an array
    let skillsArray;
    if (Array.isArray(skills)) {
      skillsArray = skills.filter(skill => skill.trim() !== ''); // Remove empty strings
    } else if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(s => s.trim()).filter(skill => skill !== '');
    } else {
      return res.status(400).json({ message: 'Skills must be an array or comma-separated string.' });
    }
    
    console.log('Processed skills array:', skillsArray);
    
    const profile = await createOrUpdateProfile({
      technician_id,
      bio,
      location,
      skills: skillsArray,
      availability: availability || 'Available' // Default value if not provided
    });
    
    res.status(201).json({ message: 'Profile saved.', profile });
  } catch (err) {
    console.error('Post Profile Error:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getTechnicianProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getProfileWithRating(id);
    
    if (!data.profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error('Get Profile Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  postProfile,
  getTechnicianProfile
};