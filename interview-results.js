
import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// Sample job data.
// Keep these skill names aligned with your existing jobs.js data.
// Later, we can connect recommendations directly to your job database.

const availableJobs = [
  {
    title: "Junior Data Analyst",
    company: "InsightWorks",
    location: "Bangalore",
    salary: "₹3–5 LPA",
    skills: ["SQL", "Excel", "Power BI", "Python"]
  },
  {
    title: "UI/UX Design Intern",
    company: "Pixel Studio",
    location: "Bangalore",
    salary: "₹10,000–15,000/month",
    skills: ["Figma", "UX Research", "Wireframing", "Prototyping"]
  },
  {
    title: "Frontend Developer",
    company: "WebCraft",
    location: "Mysore",
    salary: "₹4–6 LPA",
    skills: ["HTML", "CSS", "JavaScript"]
  },
  {
    title: "Remote Product Designer",
    company: "DesignLab",
    location: "Remote",
    salary: "₹5–8 LPA",
    skills: ["Figma", "UX Research", "Accessibility", "Prototyping"]
  },
  {
    title: "Python Developer Intern",
    company: "CodeNest",
    location: "Bangalore",
    salary: "₹12,000/month",
    skills: ["Python", "OOP", "Data Structures", "SQL"]
  }
];

const loadingMessage = document.getElementById("loadingMessage");
const resultsContent = document.getElementById("resultsContent");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loadingMessage.textContent =
      "Please log in to view your interview result.";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const resultId = params.get("id");

  if (!resultId) {
    loadingMessage.textContent =
      "No interview result was selected. Please take a mock interview first.";
    return;
  }

  try {
    const resultRef = doc(
      db,
      "users",
      user.uid,
      "interviewResults",
      resultId
    );

    const resultSnapshot = await getDoc(resultRef);

    if (!resultSnapshot.exists()) {
      loadingMessage.textContent =
        "This interview result was not found in your account.";
      return;
    }

    const result = resultSnapshot.data();
    displayResults(result);

  } catch (error) {
    console.error("Could not load interview result:", error);
    loadingMessage.textContent =
      "Unable to load your result. Please refresh and try again.";
  }
});

function displayResults(result) {
  loadingMessage.hidden = true;
  resultsContent.hidden = false;

  document.getElementById("overallScore").textContent =
    `${result.overallScore}%`;

  document.getElementById("skillLevel").textContent =
    result.level;

  document.getElementById("correctAnswers").textContent =
    `${result.correctCount}/${result.totalQuestions}`;

  document.getElementById("roleTitle").textContent =
    `${result.roleTitle} Assessment`;

  let message = "Keep practising to improve your skills.";

  if (result.overallScore >= 80) {
    message = "Excellent work! You demonstrated strong knowledge in this assessment.";
  } else if (result.overallScore >= 50) {
    message = "Good progress! Strengthen the skills listed below to improve further.";
  }

  document.getElementById("resultMessage").textContent = message;

  const skillEntries = Object.entries(result.skillScores || {});

  const breakdown = document.getElementById("skillBreakdown");
  breakdown.innerHTML = "";

  skillEntries.forEach(([skill, score]) => {
    const item = document.createElement("div");
    item.className = "ir-skill";

    const heading = document.createElement("strong");
    heading.textContent = `${skill} — ${score}%`;

    const track = document.createElement("div");
    track.className = "ir-track";

    const fill = document.createElement("div");
    fill.className = "ir-fill";
    fill.style.width = `${score}%`;

    track.appendChild(fill);
    item.appendChild(heading);
    item.appendChild(track);
    breakdown.appendChild(item);
  });

  const strengths = skillEntries
    .filter(([, score]) => score >= 70)
    .map(([skill]) => skill);

  const improvements = skillEntries
    .filter(([, score]) => score < 70)
    .map(([skill]) => skill);

  document.getElementById("strengths").textContent =
    strengths.length ? strengths.join(", ") : "Keep practising to build your strengths.";

  document.getElementById("improvements").textContent =
    improvements.length ? improvements.join(", ") : "Great work! Continue practising to maintain your skills.";

  showJobRecommendations(result.skillScores || {});
}

// Compare user's assessed skills with job requirements.
// A skill counts as a match when its assessment score is 50% or higher.
function showJobRecommendations(skillScores) {
  const container = document.getElementById("jobRecommendations");
  container.innerHTML = "";

  const normalizedScores = {};

  Object.entries(skillScores).forEach(([skill, score]) => {
    normalizedScores[skill.toLowerCase()] = score;
  });

  const recommendations = availableJobs.map((job) => {
    const matchedSkills = job.skills.filter((skill) => {
      return (normalizedScores[skill.toLowerCase()] || 0) >= 50;
    });

    const matchPercentage = Math.round(
      (matchedSkills.length / job.skills.length) * 100
    );

    return {
      ...job,
      matchedSkills,
      matchPercentage
    };
  })
  .filter((job) => job.matchPercentage > 0)
  .sort((a, b) => b.matchPercentage - a.matchPercentage);

  if (recommendations.length === 0) {
    container.textContent =
      "No close matches yet. Continue practising and explore all available jobs.";
    return;
  }

  recommendations.slice(0, 5).forEach((job) => {
    const card = document.createElement("div");
    card.className = "ir-job";

    const title = document.createElement("h3");
    title.textContent = job.title;

    const company = document.createElement("p");
    company.textContent = `${job.company} • ${job.location}`;

    const salary = document.createElement("p");
    salary.textContent = `Salary: ${job.salary}`;

    const match = document.createElement("p");
    match.textContent = `Skill match: ${job.matchPercentage}%`;

    const skills = document.createElement("p");
    skills.textContent = job.matchedSkills.length
      ? `Matching skills: ${job.matchedSkills.join(", ")}`
      : "No matching assessed skills yet.";

    const link = document.createElement("a");
    link.href = "jobs.html";
    link.className = "ir-btn";
    link.textContent = "Explore Jobs";

    card.append(title, company, salary, match, skills, link);
    container.appendChild(card);
  });
}
