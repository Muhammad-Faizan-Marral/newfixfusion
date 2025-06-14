const axios = require("axios");

const getSuggestedTechnicians = async (req, res) => {
  const { issue, technicianProfiles } = req.body;

  try {
    const response = await axios.post("http://localhost:7000/suggest", {
      issue,
      technicians: technicianProfiles,
    });

    res.json(response.data);
  } catch (err) {
    console.error("ML Error:", err.message);
    res.status(500).json({ error: "ML service failed" });
  }
};

module.exports = { getSuggestedTechnicians };
