
import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const savedJobsList = document.getElementById("savedJobsList");
const statusMessage = document.getElementById("statusMessage");

let currentUser = null;

// Display a message when no jobs are saved.
function showEmptyState() {
    savedJobsList.replaceChildren();

    const empty = document.createElement("div");
    empty.className = "empty-state";

    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "♡";

    const heading = document.createElement("h3");
    heading.textContent = "No saved jobs yet!";

    const description = document.createElement("p");
    description.textContent =
        "Explore opportunities and save jobs you are interested in.";

    const link = document.createElement("a");
    link.href = "jobs.html";
    link.className = "primary-link";
    link.textContent = "Explore Jobs";

    empty.append(heart, heading, description, link);
    savedJobsList.appendChild(empty);
}

// Create a job card safely using DOM elements.
function createJobCard(job, jobId) {
    const card = document.createElement("article");
    card.className = "job-card";

    const info = document.createElement("div");

    const company = document.createElement("p");
    company.textContent =
        `${job.company || "Company"} · ${job.location || "Location not specified"}`;

    const title = document.createElement("h3");
    title.textContent = job.title || "Untitled Job";

    const description = document.createElement("p");
    description.textContent =
        `${job.type || "Job"} · ${job.description || ""}`;

    const tags = document.createElement("div");
    tags.className = "job-tags";

    const skills = Array.isArray(job.skills) ? job.skills : [];

    skills.forEach(skill => {
        const tag = document.createElement("span");
        tag.textContent = skill;
        tags.appendChild(tag);
    });

    info.append(company, title, description, tags);

    const action = document.createElement("div");
    action.className = "job-action";

    const salary = document.createElement("strong");
    salary.textContent = job.salary || "Salary not specified";

    // View details button
    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.textContent = "View Details";

    detailsButton.addEventListener("click", () => {
        const params = new URLSearchParams({
            title: job.title || "",
            company: job.company || "",
            location: job.location || "",
            type: job.type || "",
            salary: job.salary || "",
            description: job.description || "",
            skills: skills.join(",")
        });

        window.location.href =
            "job-details.html?" + params.toString();
    });

    // Remove saved job button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.textContent = "♥ Remove Saved Job";

    removeButton.addEventListener("click", async () => {
        await removeSavedJob(jobId, removeButton);
    });

    action.append(salary, detailsButton, removeButton);

    card.append(info, action);

    return card;
}

// Load saved jobs from the current user's Firestore collection.
async function loadSavedJobs() {
    if (!currentUser) return;

    statusMessage.textContent = "Loading your saved jobs...";
    savedJobsList.replaceChildren();

    try {
        const savedJobsRef = collection(
            db,
            "users",
            currentUser.uid,
            "savedJobs"
        );

        const snapshot = await getDocs(savedJobsRef);

        if (snapshot.empty) {
            statusMessage.textContent = "0 saved jobs";
            showEmptyState();
            return;
        }

        savedJobsList.replaceChildren();

        snapshot.forEach(savedDoc => {
            const job = savedDoc.data();

            const card = createJobCard(job, savedDoc.id);
            savedJobsList.appendChild(card);
        });

        statusMessage.textContent =
            `${snapshot.size} saved job${snapshot.size === 1 ? "" : "s"} found.`;

    } catch (error) {
        console.error("Loading saved jobs error:", error);

        statusMessage.textContent =
            "Unable to load saved jobs. Please check your Firebase connection and Firestore rules.";
    }
}

// Remove a job from Firestore.
async function removeSavedJob(jobId, button) {
    if (!currentUser) return;

    const confirmRemove = confirm(
        "Are you sure you want to remove this saved job?"
    );

    if (!confirmRemove) return;

    button.disabled = true;
    button.textContent = "Removing...";

    try {
        const jobRef = doc(
            db,
            "users",
            currentUser.uid,
            "savedJobs",
            jobId
        );

        await deleteDoc(jobRef);

        statusMessage.textContent = "Job removed successfully!";

        // Refresh the saved jobs list.
        await loadSavedJobs();

    } catch (error) {
        console.error("Removing saved job error:", error);

        statusMessage.textContent =
            "Could not remove job. Please try again.";

        button.disabled = false;
        button.textContent = "♥ Remove Saved Job";
    }
}

// Check Firebase authentication.
onAuthStateChanged(auth, async user => {
    currentUser = user;

    if (!user) {
        statusMessage.textContent =
            "Please log in to view your saved jobs.";

        savedJobsList.replaceChildren();

        const link = document.createElement("a");
        link.href = "login.html";
        link.className = "primary-link";
        link.textContent = "Login to Continue";

        savedJobsList.appendChild(link);
        return;
    }

    await loadSavedJobs();
});
