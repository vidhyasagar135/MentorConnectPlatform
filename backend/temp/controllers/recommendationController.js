const { supabase } = require("../supabaseClient");
const { recommendMentorsForStudent } = require("../services/recommendationService");

exports.getRecommendations = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Get student
    const { data: student } = await supabase
      .from("student_details")
      .select("*")
      .eq("id", student_id)
      .single();

    if (!student) return res.status(404).json({ error: "Student not found" });

    // Get all mentors
    const { data: mentors } = await supabase.from("mentor_details").select("*");
    if (!mentors) return res.status(404).json({ error: "No mentors found" });

    // Generate recommendations
    const recommendations = await recommendMentorsForStudent(student, mentors);

    res.json({ student_id, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
