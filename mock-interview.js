
import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// Six questions for each career role.
// correct is the zero-based index of the correct option.

const interviewQuestions = {
  uiux: {
    title: "UI/UX Designer",
    questions: [
      {
        skill: "UX Research",
        question: "What is the main purpose of UX research?",
        options: [
          "To understand user needs and problems",
          "To select random colors",
          "To write backend code",
          "To increase image size"
        ],
        correct: 0
      },
      {
        skill: "Wireframing",
        question: "What is a wireframe?",
        options: [
          "A final coded website",
          "A basic layout showing page structure",
          "A database table",
          "A marketing report"
        ],
        correct: 1
      },
      {
        skill: "Prototyping",
        question: "Why do designers create prototypes?",
        options: [
          "To test interactions before development",
          "To store passwords",
          "To host a website",
          "To replace user research"
        ],
        correct: 0
      },
      {
        skill: "Figma",
        question: "Which Figma feature helps create reusable design elements?",
        options: [
          "Components",
          "Browser history",
          "Terminal",
          "Database"
        ],
        correct: 0
      },
      {
        skill: "Accessibility",
        question: "Which practice improves accessibility?",
        options: [
          "Using very small text",
          "Using good color contrast",
          "Removing all labels",
          "Using color as the only indicator"
        ],
        correct: 1
      },
      {
        skill: "User Testing",
        question: "What is usability testing?",
        options: [
          "Watching users complete tasks to find problems",
          "Checking only the designer's laptop",
          "Changing the logo",
          "Writing SQL queries"
        ],
        correct: 0
      }
    ]
  },

  frontend: {
    title: "Frontend Developer",
    questions: [
      {
        skill: "HTML",
        question: "What is the purpose of HTML?",
        options: [
          "To structure web page content",
          "To manage databases",
          "To create server hardware",
          "To edit videos"
        ],
        correct: 0
      },
      {
        skill: "HTML",
        question: "Which HTML element creates a hyperlink?",
        options: ["<link>", "<a>", "<href>", "<url>"],
        correct: 1
      },
      {
        skill: "CSS",
        question: "Which CSS property changes text color?",
        options: ["font-size", "background", "color", "display"],
        correct: 2
      },
      {
        skill: "CSS",
        question: "Which CSS layout system is useful for arranging items in one dimension?",
        options: ["Flexbox", "SQL", "PHP", "JSON"],
        correct: 0
      },
      {
        skill: "JavaScript",
        question: "Which keyword declares a block-scoped variable that can be reassigned?",
        options: ["const", "let", "static", "class"],
        correct: 1
      },
      {
        skill: "JavaScript",
        question: "Which method selects an element by its ID?",
        options: [
          "document.getElementById()",
          "document.getClass()",
          "window.getID()",
          "select.id()"
        ],
        correct: 0
      }
    ]
  },

  data: {
    title: "Data Analyst",
    questions: [
      {
        skill: "SQL",
        question: "Which SQL command retrieves data from a table?",
        options: ["SELECT", "DELETE", "DROP", "UPDATE"],
        correct: 0
      },
      {
        skill: "SQL",
        question: "Which SQL clause filters rows?",
        options: ["ORDER BY", "WHERE", "GROUP BY", "JOIN"],
        correct: 1
      },
      {
        skill: "Excel",
        question: "Which Excel function calculates an average?",
        options: ["SUM()", "COUNT()", "AVERAGE()", "MAX()"],
        correct: 2
      },
      {
        skill: "Excel",
        question: "What is a pivot table mainly used for?",
        options: [
          "Summarizing and analyzing data",
          "Creating passwords",
          "Writing HTML",
          "Installing software"
        ],
        correct: 0
      },
      {
        skill: "Python",
        question: "Which Python library is commonly used for data analysis?",
        options: ["Pandas", "Flask only", "Turtle only", "Pygame only"],
        correct: 0
      },
      {
        skill: "Power BI",
        question: "What is Power BI mainly used for?",
        options: [
          "Building interactive reports and dashboards",
          "Editing operating systems",
          "Creating mobile hardware",
          "Writing Java classes"
        ],
        correct: 0
      }
    ]
  },

  python: {
    title: "Python Developer",
    questions: [
      {
        skill: "Python Basics",
        question: "Which symbol is used for comments in Python?",
        options: ["//", "#", "<!--", "**"],
        correct: 1
      },
      {
        skill: "Python Basics",
        question: "Which data type stores True or False?",
        options: ["int", "str", "bool", "list"],
        correct: 2
      },
      {
        skill: "OOP",
        question: "Which keyword is used to define a class in Python?",
        options: ["function", "class", "object", "define"],
        correct: 1
      },
      {
        skill: "OOP",
        question: "What is inheritance in OOP?",
        options: [
          "A class acquiring features from another class",
          "Deleting a class",
          "Changing a variable name",
          "Printing a string"
        ],
        correct: 0
      },
      {
        skill: "Data Structures",
        question: "Which Python collection is ordered and changeable?",
        options: ["tuple", "list", "frozenset", "None"],
        correct: 1
      },
      {
        skill: "Exception Handling",
        question: "Which keywords are used for exception handling?",
        options: [
          "try and except",
          "if and print",
          "for and while",
          "class and import"
        ],
        correct: 0
      }
    ]
  }
};

let currentUser = null;
let activeQuestions = [];
let selectedRole = "";

// Check Firebase login
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user) {
    document.getElementById("setupMessage").textContent =
      "Please log in to take an interview and save your results.";
    document.getElementById("startBtn").disabled = true;
  } else {
    document.getElementById("setupMessage").textContent =
      "You are logged in. Your assessment will be saved to your account.";
    document.getElementById("startBtn").disabled = false;
  }
});

// Start interview
document.getElementById("startBtn").addEventListener("click", () => {
  if (!currentUser) return;

  selectedRole = document.getElementById("roleSelect").value;
  activeQuestions = interviewQuestions[selectedRole].questions;

  document.getElementById("quizTitle").textContent =
    interviewQuestions[selectedRole].title + " Mock Interview";

  document.getElementById("setupPanel").classList.add("mi-hidden");
  document.getElementById("quizPanel").classList.remove("mi-hidden");

  renderQuestions();
});

function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  activeQuestions.forEach((item, index) => {
    const questionBlock = document.createElement("div");
    questionBlock.className = "mi-question";

    const heading = document.createElement("h3");
    heading.textContent = `${index + 1}. ${item.question}`;
    questionBlock.appendChild(heading);

    item.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "mi-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `question-${index}`;
      radio.value = optionIndex;
      radio.required = true;

      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      questionBlock.appendChild(label);
    });

    container.appendChild(questionBlock);
  });

  document.getElementById("questionCount").textContent =
    `${activeQuestions.length} questions • Answer every question`;

  document.getElementById("progressBar").style.width = "100%";
}

// Submit and calculate result
document.getElementById("quizForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const submitButton = document.getElementById("submitBtn");
  const message = document.getElementById("quizMessage");

  const answers = [];
  let correctCount = 0;

  const skillResults = {};

  activeQuestions.forEach((question, index) => {
    const selected = document.querySelector(
      `input[name="question-${index}"]:checked`
    );

    const selectedAnswer = Number(selected.value);
    const isCorrect = selectedAnswer === question.correct;

    if (isCorrect) correctCount++;

    if (!skillResults[question.skill]) {
      skillResults[question.skill] = {
        correct: 0,
        total: 0
      };
    }

    skillResults[question.skill].total++;

    if (isCorrect) {
      skillResults[question.skill].correct++;
    }

    answers.push({
      question: question.question,
      skill: question.skill,
      selectedAnswer: question.options[selectedAnswer],
      correctAnswer: question.options[question.correct],
      isCorrect
    });
  });

  const totalQuestions = activeQuestions.length;
  const overallScore = Math.round((correctCount / totalQuestions) * 100);

  const skillScores = {};

  Object.entries(skillResults).forEach(([skill, result]) => {
    skillScores[skill] = Math.round(
      (result.correct / result.total) * 100
    );
  });

  let level = "Beginner";

  if (overallScore >= 80) {
    level = "Advanced";
  } else if (overallScore >= 50) {
    level = "Intermediate";
  }

  const resultData = {
    role: selectedRole,
    roleTitle: interviewQuestions[selectedRole].title,
    overallScore,
    correctCount,
    totalQuestions,
    level,
    skillScores,
    answers,
    createdAt: serverTimestamp()
  };

  submitButton.disabled = true;
  submitButton.textContent = "Saving result...";
  message.textContent = "Please wait while we save your assessment.";

  try {
    const resultRef = await addDoc(
      collection(db, "users", currentUser.uid, "interviewResults"),
      resultData
    );

    window.location.href =
      `interview-results.html?id=${resultRef.id}`;

  } catch (error) {
    console.error("Interview save error:", error);
    message.textContent =
      "Could not save your result. Please check your Firebase connection and try again.";

    submitButton.disabled = false;
    submitButton.textContent = "Submit Interview";
  }
});
