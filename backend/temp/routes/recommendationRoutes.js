const express = require("express");
const { getRecommendations } = require("../controllers/recommendationController");

const router = express.Router();

// Get mentor recommendations for a student
router.get("/student/:student_id", getRecommendations);

module.exports = router;
