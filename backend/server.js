const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/studentRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);
app.use("/student", studentRoutes);
app.use("/mentors", mentorRoutes);
app.use("/recommendations", recommendationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
