const express = require("express");
const { supabase } = require("../supabaseClient");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { generateRecommendations } = require("../services/recommendationService");

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// ✅ Get student profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student_details")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update profile (Settings)
router.put("/update-profile", verifyToken, async (req, res) => {
  try {
    const { name, email, contact_number, address, dob, stream, major, skills, interests } = req.body;

    const { error } = await supabase
      .from("student_details")
      .update({
        full_name: name,
        email,
        contact_number,
        address,
        dob,
        stream,
        major,
        skills,
        interests,
      })
      .eq("id", req.user.id);

    if (error) throw error;
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Change password (Settings)
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const { data: student, error } = await supabase
      .from("student_details")
      .select("password")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("student_details")
      .update({ password: hashedPassword })
      .eq("id", req.user.id);

    if (updateError) throw updateError;
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get student courses
router.get("/courses", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student_subjects")
      .select(`
        id,
        semester,
        subjects!inner(id, name, code)
      `)
      .eq("student_id", req.user.id);

    if (error) throw error;

    const courses = data.map((item) => ({
      id: item.subjects.id,
      name: item.subjects.name,
      code: item.subjects.code,
      semester: item.semester,
    }));

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get student grades
router.get("/grades", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("grades")
      .select(`
        id,
        grade,
        subjects!inner(name, code)
      `)
      .eq("student_id", req.user.id);

    if (error) throw error;

    const grades = data.map((g) => ({
      id: g.id,
      subject_name: g.subjects.name,
      subject_code: g.subjects.code,
      grade: g.grade,
    }));

    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get student attendance
router.get("/attendance", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student_subjects")
      .select(`
        id,
        attendance_percentage,
        subjects!inner(name, code)
      `)
      .eq("student_id", req.user.id);

    if (error) throw error;

    const attendance = data.map((a) => ({
      id: a.id,
      subject_name: a.subjects.name,
      subject_code: a.subjects.code,
      attendance_percentage: a.attendance_percentage || 0,
    }));

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all mentors
router.get("/mentors", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("mentor_details")
      .select("id, full_name, email, department,designation, research_areas");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assigned-mentors/:studentId", verifyToken, async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const { data, error } = await supabase
      .from("assigned_mentors")
      .select(`
        id,
        score,
        mentor_details!inner(id, full_name, designation, department, research_areas)
      `)
      .eq("student_id", studentId);

    if (error) throw error;

    // Convert comma-separated research_areas to array
    const assignedMentors = data.map((r) => {
      let researchAreas = [];
      if (Array.isArray(r.mentor_details.research_areas)) {
        researchAreas = r.mentor_details.research_areas; // already array
      } else if (typeof r.mentor_details.research_areas === "string") {
        researchAreas = r.mentor_details.research_areas.split(",").map((s) => s.trim());
      }

      return {
        id: r.id,
        score: r.score,
        mentor_id: r.mentor_details.id,
        full_name: r.mentor_details.full_name,
        designation: r.mentor_details.designation,
        department: r.mentor_details.department,
        research_areas: researchAreas,
      };
    });


    res.json({ assignedMentors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assigned mentors" });
  }
});

// ✅ Get mentor schedule (Mon–Fri)
router.get("/mentor/:mentorId/schedule", verifyToken, async (req, res) => {
  try {
    const { mentorId } = req.params;

    const { data, error } = await supabase
      .from("schedule")
      .select("*")
      .eq("mentorid", mentorId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book a slot
router.post("/schedule/book", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { scheduleId } = req.body;

    const { data, error } = await supabase
      .from("schedule")
      .update({ status: "booked", studentid: studentId })
      .eq("id", scheduleId)
      .eq("status", "free"); // only book if slot is free

    if (error) throw error;
    if (!data || data.length === 0)
      return res.status(400).json({ message: "Slot already booked" });

    res.status(200).json({ message: "Slot booked successfully", slot: data[0] });
  } catch (err) {
    console.error("Error booking slot:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel a slot
router.post("/schedule/cancel", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { scheduleId } = req.body;

    // Only cancel if the slot belongs to the logged-in student
    const { data, error } = await supabase
      .from("schedule")
      .update({ status: "free", studentid: null, student_name: null })
      .eq("id", scheduleId)
      .eq("studentid", studentId);

    if (error) throw error;
    if (!data || data.length === 0)
      return res.status(400).json({ message: "Cannot cancel this slot" });

    res.status(200).json({ message: "Slot cancelled successfully", slot: data[0] });
  } catch (err) {
    console.error("Error cancelling slot:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /student/announcements - announcements from assigned mentors
router.get("/announcements", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1️⃣ Get assigned mentors
    const { data: assignedMentors, error: assignError } = await supabase
      .from("assigned_mentors")
      .select("mentor_id")
      .eq("student_id", studentId);

    if (assignError) throw assignError;
    if (!assignedMentors || assignedMentors.length === 0) return res.json({ announcements: [] });

    const mentorIds = assignedMentors.map((m) => m.mentor_id);

    // 2️⃣ Fetch announcements from those mentors
    const { data: announcements, error: annError } = await supabase
      .from("mentor_announcements")
      .select("id, mentor_id, title, content, created_at")
      .in("mentor_id", mentorIds)
      .order("created_at", { ascending: false });

    if (annError) throw annError;

    res.json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err.message);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
