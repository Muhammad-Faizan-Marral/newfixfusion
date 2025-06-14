const express = require("express");
const router = express.Router();
const { getSuggestedTechnicians } = require("../controllers/mlController");

router.post("/ml/suggest", getSuggestedTechnicians);

module.exports = router;
