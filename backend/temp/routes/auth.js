const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { supabase } = require("../supabaseClient");

const router = express.Router();

// ----------------- STUDENT SIGNUP -----------------
router.post("/signup/student", async (req, res) => {
  const {
    email,
    password,
    full_name,
    dob,
    image,
    stream,
    major,
    skills,
    interests,
    enrollment_number,
    contact_number,
    address,
  } = req.body;

  try {
    // Check if student exists
    const { data: existingStudent } = await supabase
      .from("student_details")
      .select("*")
      .eq("enrollment_number", enrollment_number)
      .single();

    if (existingStudent) return res.status(400).json({ error: "Student already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("student_details")
      .insert([
        {
          email,
          password: hashedPassword,
          full_name,
          dob,
          image,
          role: "student",
          stream,
          major,
          skills,
          interests,
          enrollment_number,
          contact_number,
          address,
        },
      ])
      .select();

    if (error) throw error;
    res.json({ message: "Student signup successful", user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- MENTOR SIGNUP (Admin assigned mentor_id) -----------------
router.post("/signup/mentor", async (req, res) => {
  const {
    mentor_id,
    full_name,
    email,
    password,
    contact_number,
    department,
    designation,
    dob,
    image,
    research_areas,
    address,
  } = req.body;

  try {
    // Check if mentor exists
    const { data: existingMentor } = await supabase
      .from("mentor_details")
      .select("*")
      .eq("mentor_id", mentor_id)
      .single();

    if (existingMentor) return res.status(400).json({ error: "Mentor already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("mentor_details")
      .insert([
        {
          mentor_id,
          email,
          password: hashedPassword,
          full_name,
          contact_number,
          department,
          designation,
          dob,
          image,
          research_areas,
          address,
          role: "mentor",
        },
      ])
      .select();

    if (error) throw error;
    res.json({ message: "Mentor signup successful", mentor: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- STUDENT LOGIN -----------------
router.post("/login/student", async (req, res) => {
  const { enrollment_number, password } = req.body;

  try {
    const { data: users, error } = await supabase
      .from("student_details")
      .select("*")
      .eq("enrollment_number", enrollment_number)
      .limit(1);

    if (error) throw error;
    if (!users || users.length === 0) return res.status(400).json({ error: "Student not found" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        enrollment_number: user.enrollment_number,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- MENTOR LOGIN -----------------
router.post("/login/mentor", async (req, res) => {
  const { mentor_id, password } = req.body;

  try {
    const { data: mentors, error } = await supabase
      .from("mentor_details")
      .select("*")
      .eq("mentor_id", mentor_id)
      .limit(1);

    if (error) throw error;
    if (!mentors || mentors.length === 0) return res.status(400).json({ error: "Mentor not found" });

    const mentor = mentors[0];
    const validPassword = await bcrypt.compare(password, mentor.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      {
        id: mentor.id,
        email: mentor.email,
        role: mentor.role,
        full_name: mentor.full_name,
        mentor_id: mentor.mentor_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, role: mentor.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
