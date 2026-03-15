// recommendationService.js
const { supabase } = require("../supabaseClient");
const axios = require("axios");
const EMBEDDING_API = process.env.EMBEDDING_API_URL || "http://localhost:8000";


// ===== Helper Functions =====

// Fetch embeddings and combine all keyword embeddings into one vector
async function getEmbedding(texts) {
  if (!texts || texts.length === 0) return null;
  try {
    const res = await axios.post(`${EMBEDDING_API}/embedding`, { texts });
    const embeddings = res.data.embeddings; // array of embeddings
    const dim = embeddings[0].length;
    const meanEmbedding = new Array(dim).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        meanEmbedding[i] += emb[i];
      }
    }
    for (let i = 0; i < dim; i++) meanEmbedding[i] /= embeddings.length;

    return meanEmbedding;
  } catch (err) {
    console.error("Error fetching embedding:", err.message);
    throw err;
  }
}

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dot = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ===== Lazy mentor embedding generation =====
async function ensureMentorEmbeddings() {
  const { data: mentors, error } = await supabase.from("mentor_details").select("*");
  if (error) throw error;

  for (const mentor of mentors) {
    if (!mentor.embedding && mentor.research_areas) {
      const researchArray = Array.isArray(mentor.research_areas)
        ? mentor.research_areas
        : mentor.research_areas.split(",").map(r => r.trim());
      const embedding = await getEmbedding(researchArray);
      await supabase.from("mentor_details").update({ embedding }).eq("id", mentor.id);
    }
  }
}

// ===== Recommendation Generation =====
async function generateRecommendations(student_id) {
  // Ensure mentor embeddings exist
  await ensureMentorEmbeddings();

  // Check existing recommendations
  const { data: existingRecs } = await supabase
    .from("recommendations")
    .select("*")
    .eq("student_id", student_id);

  if (existingRecs && existingRecs.length > 0) return existingRecs;

  // Fetch student
  const { data: student } = await supabase
    .from("student_details")
    .select("*")
    .eq("id", student_id)
    .single();

  if (!student) throw new Error("Student not found");

  const skills = Array.isArray(student.skills) ? student.skills : (student.skills || "").split(",").map(s => s.trim());
  const interests = Array.isArray(student.interests) ? student.interests : (student.interests || "").split(",").map(i => i.trim());
  const studentKeywords = [...skills, ...interests].filter(Boolean);

  const studentEmbedding = await getEmbedding(studentKeywords);

  const { data: mentors } = await supabase
    .from("mentor_details")
    .select("*")
    .not("embedding", "is", null);

  // Compute scores
  const recommendations = mentors.map(mentor => {
    const researchArray = Array.isArray(mentor.research_areas)
      ? mentor.research_areas
      : (mentor.research_areas || "").split(",").map(r => r.trim());

    const score = cosineSimilarity(studentEmbedding, mentor.embedding);

    return {
      student_id,
      mentor_id: mentor.id,
      score,
      reason: `Matched areas: ${researchArray.filter(k => studentKeywords.includes(k)).join(", ") || "Semantic match"}`
    };
  });

  // Save top 5
  recommendations.sort((a, b) => b.score - a.score);
  const topRecs = recommendations.slice(0, 5);

  for (const rec of topRecs) {
    await supabase.from("recommendations").upsert(rec, { onConflict: ["student_id", "mentor_id"] });
  }

  return topRecs;
}

async function generateRecommendations(student_id) {
  const MAX_STUDENTS_PER_MENTOR = 3; // set your limit

  // Ensure mentor embeddings exist
  await ensureMentorEmbeddings();

  // Check existing recommendations
  const { data: existingRecs } = await supabase
    .from("recommendations")
    .select("*")
    .eq("student_id", student_id);

  if (existingRecs && existingRecs.length > 0) return existingRecs;

  // Fetch student
  const { data: student } = await supabase
    .from("student_details")
    .select("*")
    .eq("id", student_id)
    .single();

  if (!student) throw new Error("Student not found");

  const skills = Array.isArray(student.skills) ? student.skills : (student.skills || "").split(",").map(s => s.trim());
  const interests = Array.isArray(student.interests) ? student.interests : (student.interests || "").split(",").map(i => i.trim());
  const studentKeywords = [...skills, ...interests].filter(Boolean);

  const studentEmbedding = await getEmbedding(studentKeywords);

  const { data: mentors } = await supabase
    .from("mentor_details")
    .select("*")
    .not("embedding", "is", null);

  // Compute scores
  const recommendations = mentors.map(mentor => {
    const researchArray = Array.isArray(mentor.research_areas)
      ? mentor.research_areas
      : (mentor.research_areas || "").split(",").map(r => r.trim());

    const score = cosineSimilarity(studentEmbedding, mentor.embedding);

    return {
      student_id,
      mentor_id: mentor.id,
      score,
      reason: `Matched areas: ${researchArray.filter(k => studentKeywords.includes(k)).join(", ") || "Semantic match"}`
    };
  });

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // Assign top available mentor respecting capacity
  let assignedMentor = null;
  for (const rec of recommendations) {
    const { count: assignedCount } = await supabase
      .from("assigned_mentors")
      .select("*", { count: "exact" })
      .eq("mentor_id", rec.mentor_id);

    if (assignedCount < MAX_STUDENTS_PER_MENTOR) {
      assignedMentor = rec;
      break;
    }
  }

  if (!assignedMentor) {
    throw new Error("No mentors available for assignment");
  }

  // Save recommendation and assignment
  await supabase.from("recommendations").upsert(assignedMentor, {
    onConflict: ["student_id", "mentor_id"]
  });

  await supabase.from("assigned_mentors").upsert({
    student_id,
    mentor_id: assignedMentor.mentor_id,
    score: assignedMentor.score
  }, { onConflict: ["student_id"] });

  return [assignedMentor]; // return top mentor assigned
}


// Fetch saved recommendations
async function getSavedRecommendations(student_id) {
  const { data, error } = await supabase
    .from("recommendations")
    .select("*, mentor_details(*)")
    .eq("student_id", student_id)
    .order("score", { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  generateRecommendations,
  getSavedRecommendations
};
