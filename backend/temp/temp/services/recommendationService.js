const natural = require("natural"); // npm install natural
const tokenizer = new natural.WordTokenizer();

function textToVector(text) {
  return tokenizer.tokenize(text.toLowerCase());
}

function jaccardSimilarity(arr1, arr2) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

async function recommendMentorsForStudent(student, mentors) {
  const studentText = [...(student.skills || []), ...(student.interests || [])].join(" ");
  const studentTokens = textToVector(studentText);

  const recommendations = mentors.map((mentor) => {
    const mentorText = [...(mentor.research_areas || []), mentor.department].join(" ");
    const mentorTokens = textToVector(mentorText);

    const score = jaccardSimilarity(studentTokens, mentorTokens);

    return {
      mentor_id: mentor.id,
      full_name: mentor.full_name,
      department: mentor.department,
      research_areas: mentor.research_areas,
      score,
      reason: `Matched on skills/interests vs research areas (${score.toFixed(2)})`,
    };
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 mentors
}

module.exports = { recommendMentorsForStudent };
