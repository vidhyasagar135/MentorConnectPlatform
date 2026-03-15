const express = require("express");
const { supabase } = require("../supabaseClient");
const router = express.Router();
const jwt = require("jsonwebtoken");

// --- IMPORTANT: Password Hashing/Comparison Library ---
// In a real application, you would require 'bcrypt' or a similar library here.
// const bcrypt = require('bcrypt'); 

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

// Middleware to ensure the user is a mentor
const verifyMentor = (req, res, next) => {
  if (!req.user || req.user.role !== "mentor") {
    return res.status(403).json({ error: "Access denied. Mentor privileges required." });
  }
  next();
};

// =========================================================================
// ✅ NEW: MENTOR SETTINGS ROUTES
// =========================================================================

// GET /mentors/profile - Fetch the logged-in mentor's details
router.get("/profile", verifyToken, verifyMentor, async (req, res) => {
  try {
    const { data: mentor, error } = await supabase
      .from("mentor_details")
      .select("id, full_name, email, contact_number, address, dob, department, designation, research_areas, image")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    if (!mentor) return res.status(404).json({ error: "Mentor profile not found." });

    res.json(mentor);
  } catch (err) {
    console.error("Error fetching mentor profile:", err.message);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// PUT /mentors/update-profile - Update mentor profile information
router.put("/update-profile", verifyToken, verifyMentor, async (req, res) => {
  try {
    const {
      full_name,
      contact_number,
      address,
      dob,
      department,
      designation,
      research_areas, // Expects an array of strings (from frontend conversion)
      image,
    } = req.body;

    // Build the update object, excluding fields that shouldn't be updated here (like email, role)
    const updatePayload = {
      full_name,
      contact_number,
      address,
      dob,
      department,
      designation,
      research_areas,
      image,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("mentor_details")
      .update(updatePayload)
      .eq("id", req.user.id);

    if (error) throw error;
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Mentor Profile Update Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /mentors/change-password - Change mentor's password
router.put("/change-password", verifyToken, verifyMentor, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Old password and new password (min 6 chars) are required." });
    }

    // 1. Fetch current mentor details to verify old password
    const { data: mentor, error: fetchError } = await supabase
      .from("mentor_details")
      .select("password")
      .eq("id", req.user.id)
      .single();

    if (fetchError || !mentor) throw new Error("Mentor not found.");

    // 2. Verify old password
    // ⚠️ CRITICAL SECURITY WARNING: In production, the stored password MUST BE HASHED.
    // Replace the following line with:
    // const isPasswordValid = await bcrypt.compare(oldPassword, mentor.password);
    const isPasswordValid = oldPassword === mentor.password; 

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect old password." });
    }

    // 3. Hash the new password (REQUIRED)
    // ⚠️ In production, replace this line with:
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    const hashedPassword = newPassword; // UNSAFE placeholder for testing purposes only

    // 4. Update password in the database
    const { error: updateError } = await supabase
      .from("mentor_details")
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id);

    if (updateError) throw updateError;

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password Change Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔄 EXISTING ROUTES (Unchanged)
// =========================================================================

// GET all students assigned to logged-in mentor
router.get("/students", verifyToken, verifyMentor, async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Get assigned students
    const { data: assignedStudents, error: assignedError } = await supabase
      .from("assigned_mentors")
      .select("student_id, score")
      .eq("mentor_id", mentorId);

    if (assignedError) throw assignedError;
    if (!assignedStudents || assignedStudents.length === 0) return res.json([]);

    const studentIds = assignedStudents.map((s) => s.student_id);

    // Get student details
    const { data: students, error: studentError } = await supabase
      .from("student_details")
      .select("id, enrollment_number, full_name, email, major")
      .in("id", studentIds);

    if (studentError) throw studentError;

    // Merge score
    const studentsWithScores = students.map((stu) => {
      const match = assignedStudents.find((s) => s.student_id === stu.id);
      return { ...stu, score: match ? match.score : 0 };
    });

    res.json(studentsWithScores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET student details including personal info, grades, and attendance
router.get("/student-details/:studentId", verifyToken, verifyMentor, async (req, res) => {
  const { studentId } = req.params;

  try {
    // 1️⃣ Fetch student personal details
    const { data: student, error: studentError } = await supabase
      .from("student_details")
      .select("*")
      .eq("id", studentId)
      .single(); // single returns one row

    if (studentError) throw studentError;

    // 2️⃣ Fetch grades
    const { data: grades, error: gradesError } = await supabase
      .from("grades")
      .select("subject_id, grade")
      .eq("student_id", studentId);

    if (gradesError) throw gradesError;

    // 3️⃣ Fetch attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from("student_subjects")
      .select("subject_id, semester, attendance_percentage")
      .eq("student_id", studentId);

    if (attendanceError) throw attendanceError;

    res.json({ student, grades, attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /mentors/subjects
router.get("/subjects", verifyToken, async (req, res) => {
  try {
    const { data: subjects, error } = await supabase
      .from("subjects")
      .select("id, name");

    if (error) throw error;
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET mentor schedule
router.get("/schedule", verifyToken, verifyMentor, async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Fetch schedule for logged-in mentor
    const { data: schedule, error } = await supabase
      .from("schedule")
      .select("*")
      .eq("mentorid", mentorId);

    if (error) throw error;

    // Check if schedule exists
    if (!schedule || schedule.length === 0) {
      return res.status(200).json({
        message: "No schedule found. Please update your availability.",
        schedule: [],
        filled: false,
      });
    }

    // If schedule exists
    res.status(200).json({
      message: "Schedule loaded successfully.",
      schedule,
      filled: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST or PUT schedule
router.post("/schedule", verifyToken, verifyMentor, async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { day, start_time, end_time, status } = req.body;

    if (!day || !start_time || !end_time || !status) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if this exact time slot already exists for the mentor
    const { data: existing, error: fetchError } = await supabase
      .from("schedule")
      .select("id")
      .eq("mentorid", mentorId)
      .eq("day", day)
      .eq("start_time", start_time)
      .eq("end_time", end_time);

    if (fetchError) throw fetchError;
    if (existing && existing.length > 0) {
      return res.status(400).json({
        error: `A schedule already exists for ${day} from ${start_time} to ${end_time}.`,
      });
    }

    // Insert the new schedule
    const { data, error } = await supabase
      .from("schedule")
      .insert([{ mentorid: mentorId, day, start_time, end_time, status }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Schedule added successfully", data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/schedule/:id", verifyToken, verifyMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;

    const { data, error } = await supabase
      .from("schedule")
      .update({ start_time, end_time, status })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.status(200).json({ message: "Schedule updated successfully", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get mentor's available schedule slots (Unchanged, primarily used by student dashboard)
router.get("/:mentorId/slots", async (req, res) => {
  const { mentorId } = req.params;

  try {
    const { data, error } = await supabase
      .from("schedule")
      .select("*")
      .eq("mentorid", mentorId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching slots:", err.message);
    res.status(500).json({ error: "Failed to fetch mentor slots" });
  }
});

// POST /mentors/announcement - Add a new announcement
router.post(
  "/announcement",
  verifyToken,
  verifyMentor,
  async (req, res) => {
    try {
      const mentorId = req.user.id;
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
      }

      // Insert announcement
      const { data, error } = await supabase
        .from("mentor_announcements")
        .insert([{ mentor_id: mentorId, title, content }])
        .select();

      if (error) throw error;

      res.status(201).json({ message: "Announcement added successfully", data });
    } catch (err) {
      console.log("Error adding announcement:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /mentors/announcements - Get all announcements by this mentor
router.get(
  "/announcements",
  verifyToken,
  verifyMentor,
  async (req, res) => {
    try {
      const mentorId = req.user.id;

      // Fetch announcements by this mentor
      const { data: announcements, error: annError } = await supabase
        .from("mentor_announcements")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });

      if (annError) throw annError;

      // Note: Removed fetching assigned students/details here as the frontend only consumes the announcements list.

      res.json({ announcements });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


module.exports = router;