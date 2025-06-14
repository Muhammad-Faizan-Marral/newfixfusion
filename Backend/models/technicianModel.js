const pool = require('../config/db');

const createOrUpdateProfile = async ({ technician_id, bio, location, skills, availability }) => {
  try {
    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT * FROM technician_profiles WHERE technician_id = $1',
      [technician_id]
    );
    
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      const query = `
        UPDATE technician_profiles 
        SET bio = $1, location = $2, skills = $3, availability = $4, updated_at = CURRENT_TIMESTAMP
        WHERE technician_id = $5
        RETURNING *;
      `;
      // PostgreSQL array format: skills directly as array, not JSON.stringify
      const values = [bio, location, skills, availability, technician_id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } else {
      // Create new profile
      const query = `
        INSERT INTO technician_profiles (technician_id, bio, location, skills, availability)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      // PostgreSQL array format: skills directly as array, not JSON.stringify
      const values = [technician_id, bio, location, skills, availability];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    throw error;
  }
};

const getProfileWithRating = async (technician_id) => {
  try {
    // Get profile
    const profileResult = await pool.query(
      'SELECT * FROM technician_profiles WHERE technician_id = $1',
      [technician_id]
    );
    
    // Get average rating
    const ratingResult = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE technician_id = $1',
      [technician_id]
    );
    
    const profile = profileResult.rows[0];
    const ratingData = ratingResult.rows[0];
    
    return {
      profile: profile || null,
      avgRating: ratingData.avg_rating ? parseFloat(ratingData.avg_rating).toFixed(1) : 0,
      totalRatings: parseInt(ratingData.total_ratings) || 0
    };
  } catch (error) {
    console.error('Error in getProfileWithRating:', error);
    throw error;
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfileWithRating
};