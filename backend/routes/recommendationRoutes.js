const express = require("express");
const router = express.Router();
const { generateRecommendations, getSavedRecommendations } = require("../services/recommendationService");

// GET recommendations for a student
router.get("/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;

    // Step 1: Check if saved recommendations exist
    let recommendations = await getSavedRecommendations(student_id);

    // Step 2: If none exist, generate new ones
    if (!recommendations || recommendations.length === 0) {
      await generateRecommendations(student_id);
      recommendations = await getSavedRecommendations(student_id);
    }

    res.json({
      message: "Top mentor recommendations generated successfully",
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
