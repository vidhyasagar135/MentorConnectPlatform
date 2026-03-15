const express = require("express");
const { supabase } = require("../supabaseClient");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Middleware to verify JWT and extract user data (shared with others)
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

// Middleware to ensure the authenticated user is an Admin
const verifyAdmin = (req, res, next) => {
  // Assuming the user role is stored in the JWT payload (req.user.role)
  // This role must be set during the login/sign-up process
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
};

// --- ADMIN SPECIFIC ROUTES ---

// ✅ Get system-wide dashboard statistics
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // 1. Total Student Count
    const { count: studentCount, error: studentError } = await supabase
      .from("student_details")
      .select("id", { count: "exact", head: true });

    if (studentError) throw studentError;

    // 2. Total Mentor Count
    const { count: mentorCount, error: mentorError } = await supabase
      .from("mentor_details")
      .select("id", { count: "exact", head: true });

    if (mentorError) throw mentorError;

    // 3. New Users (Placeholder - requires a 'created_at' column to filter by date)
    const newUsersLastWeek = 15; // Mock data for now

    res.json({
      total_students: studentCount,
      total_mentors: mentorCount,
      new_users_week: newUsersLastWeek,
      open_reports: 3, // Mock data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get list of all students (All Students tab)
router.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from("student_details")
      .select("id:user_id, enrollment_number, full_name, email, major");

    if (error) throw error;
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get list of all mentors (All Mentors tab)
router.get("/mentors", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { data: mentors, error } = await supabase
      .from("mentor_details")
      .select("id:user_id, mentor_id, full_name, email, department, designation");

    if (error) throw error;
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get System Logs (Placeholder for a logs table)
router.get("/logs", verifyToken, verifyAdmin, async (req, res) => {
    try {
        // NOTE: A real application would query a separate 'system_logs' table here.
        // For demonstration, we'll return mock data.
        const mockLogs = [
            { id: 5, timestamp: new Date(Date.now() - 3600000), user: "Admin", role: "admin", message: "Deleted student ID 10001.", type: "action" },
            { id: 4, timestamp: new Date(Date.now() - 7200000), user: "System", role: "system", message: "Database backup completed.", type: "info" },
            { id: 3, timestamp: new Date(Date.now() - 10800000), user: "User123", role: "student", message: "Login failed due to incorrect password.", type: "error" },
            { id: 2, timestamp: new Date(Date.now() - 14400000), user: "Mentor456", role: "mentor", message: "Updated research areas.", type: "action" },
            { id: 1, timestamp: new new Date(Date.now() - 18000000), user: "System", role: "system", message: "Server reboot successful.", type: "info" },
        ];
        res.json(mockLogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ✅ Delete a user (Student or Mentor)
router.delete("/delete-user/:role/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { role, id } = req.params;
  const tableName = role === "student" ? "student_details" : role === "mentor" ? "mentor_details" : null;

  if (!tableName) {
    return res.status(400).json({ error: "Invalid user role specified." });
  }

  try {
    // 1. Delete the user from their specific table
    const { error: deleteError } = await supabase
      .from(tableName)
      // Note: Assuming 'user_id' is the unique ID for the user's row in their respective table.
      .eq("user_id", id); 

    if (deleteError) throw deleteError;
    
    // 2. (Optional but Recommended) Delete the associated user from a main 'users' table if one exists
    // If your architecture relies solely on 'student_details'/'mentor_details', this step might be skipped
    // or you might use a Supabase Function to handle cascading deletion.

    res.json({ message: `${role} with ID ${id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete ${role}: ${err.message}` });
  }
});


module.exports = router;