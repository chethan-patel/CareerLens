import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";


// ======================================
// CONFIGURATION
// ======================================

const API_URL = "http://127.0.0.1:5000/api/jobs";
const PAGE_LIMIT = 50;


// ======================================
// HTML ELEMENTS
// ======================================

const list = document.getElementById("jobList");
const count = document.getElementById("jobCount");
const message = document.getElementById("resultMessage");
const form = document.getElementById("filters");


// ======================================
// GLOBAL VARIABLES
// ======================================

let currentUser = null;
let savedJobIds = new Set();
let currentJobs = [];

let currentPage = 1;
let totalJobs = 0;

let cursorByPage = new Map();
let hasMoreJobs = false;


// ======================================
// JOB ID
// ======================================

function getJobId(job) {

    if (job.id !== undefined && job.id !== null) {
        return "job-" + String(job.id);
    }

    return String(job.title + "-" + job.company)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}


// ======================================
// GET SKILLS
// ======================================

function getSkills(job) {

    if (Array.isArray(job.skills)) {
        return job.skills;
    }

    if (typeof job.skills === "string") {
        return job.skills
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean);
    }

    return [];
}


// ======================================
// LOAD SAVED JOBS FROM FIREBASE
// ======================================

async function loadSavedJobs() {

    savedJobIds = new Set();

    if (!currentUser) return;

    const savedJobsRef = collection(
        db,
        "users",
        currentUser.uid,
        "savedJobs"
    );

    const snapshot = await getDocs(savedJobsRef);

    snapshot.forEach(savedDoc => {
        savedJobIds.add(savedDoc.id);
    });
}


// ======================================
// SAVE OR UNSAVE JOB
// ======================================

async function toggleSavedJob(job, button) {

    if (!currentUser) {
        alert("Please log in to save jobs.");
        window.location.href = "login.html";
        return;
    }

    const jobId = getJobId(job);

    button.disabled = true;

    try {

        const jobRef = doc(
            db,
            "users",
            currentUser.uid,
            "savedJobs",
            jobId
        );

        if (savedJobIds.has(jobId)) {

            await deleteDoc(jobRef);

            savedJobIds.delete(jobId);

            message.textContent =
                "Job removed from your saved jobs.";

        } else {

            await setDoc(jobRef, {
                ...job,
                savedAt: serverTimestamp()
            });

            savedJobIds.add(jobId);

            message.textContent =
                "Job saved successfully!";
        }

        renderJobs(currentJobs);

    } catch (error) {

        console.error("Save job error:", error);

        message.textContent =
            "Could not update saved job. Check your Firestore rules and connection.";

    } finally {

        button.disabled = false;
    }
}


// ======================================
// PAGINATION
// ======================================

function createPagination() {

    let pagination =
        document.getElementById("jobPagination");

    if (!pagination) {

        pagination = document.createElement("div");

        pagination.id = "jobPagination";

        pagination.style.display = "flex";
        pagination.style.justifyContent = "center";
        pagination.style.alignItems = "center";
        pagination.style.gap = "16px";
        pagination.style.margin = "24px 0";
        pagination.style.flexWrap = "wrap";

        list.insertAdjacentElement(
            "afterend",
            pagination
        );
    }

    pagination.replaceChildren();

    if (currentPage <= 1 && !hasMoreJobs) {
        return;
    }

    // Previous button
    const previousButton =
        document.createElement("button");

    previousButton.type = "button";
    previousButton.textContent = "Previous";

    previousButton.disabled = currentPage <= 1;

    previousButton.addEventListener("click", () => {

        if (currentPage > 1) {

            currentPage--;

            loadJobs();
        }
    });

    // Page number
    const pageText = document.createElement("span");

    pageText.textContent = `Page ${currentPage}`;

    // Next button
    const nextButton =
        document.createElement("button");

    nextButton.type = "button";
    nextButton.textContent = "Next";

    nextButton.disabled = !hasMoreJobs;

    nextButton.addEventListener("click", () => {

        if (hasMoreJobs) {

            currentPage++;

            loadJobs();
        }
    });

    pagination.append(
        previousButton,
        pageText,
        nextButton
    );
}


// ======================================
// DISPLAY JOBS
// ======================================

function renderJobs(items) {

    currentJobs = items;

    list.replaceChildren();

    // Current page job count
    const start = items.length === 0
        ? 0
        : (currentPage - 1) * PAGE_LIMIT + 1;

    const end = start + items.length - 1;

    count.textContent = items.length === 0
        ? "No jobs found"
        : `Showing ${start}-${end} jobs`;

    // No jobs found
    if (items.length === 0) {

        const empty = document.createElement("div");

        empty.className = "no-results";

        empty.textContent =
            "No matching jobs found. Try another keyword or clear the filters.";

        list.appendChild(empty);

        createPagination();

        return;
    }

    // Create each job card
    items.forEach(job => {

        const card = document.createElement("article");

        card.className = "job-card";

        const info = document.createElement("div");

        // Company and location
        const company = document.createElement("p");

        company.textContent =
            `${job.company || "Company not specified"} · ${job.location || "Location not specified"}`;

        // Job title
        const title = document.createElement("h3");

        title.textContent =
            job.title || "Job title not specified";

        // Description
        const description = document.createElement("p");

        description.textContent =
            `${job.type || "Job type not specified"} · ${job.description || "No description available."}`;

        // Skills
        const tags = document.createElement("div");

        tags.className = "job-tags";

        getSkills(job).forEach(skill => {

            const tag = document.createElement("span");

            tag.textContent = skill;

            tags.appendChild(tag);
        });

        info.append(
            company,
            title,
            description,
            tags
        );

        // Action section
        const action = document.createElement("div");

        action.className = "job-action";

        // Salary
        const salary = document.createElement("strong");

        salary.textContent =
            job.salary || "Salary not disclosed";

        // Save Job button
        const saveButton =
            document.createElement("button");

        saveButton.type = "button";

        saveButton.textContent =
            savedJobIds.has(getJobId(job))
                ? "Unsave Job"
                : "Save Job";

        saveButton.addEventListener("click", () => {

            toggleSavedJob(job, saveButton);
        });

        // View Details button
        const detailsButton =
            document.createElement("button");

        detailsButton.type = "button";

        detailsButton.textContent = "View Details";

        detailsButton.style.marginTop = "8px";

        detailsButton.addEventListener("click", () => {

            const params = new URLSearchParams({

                title: job.title || "",

                company: job.company || "",

                location: job.location || "",

                type: job.type || "",

                salary: job.salary || "",

                description: job.description || "",

                skills: getSkills(job).join(",")

            });

            window.location.href =
                "job-details.html?" + params.toString();
        });

        // Apply Now button
        let applyButton = null;

        if (job.application_url) {

            try {

                const applicationLink =
                    new URL(job.application_url);

                if (applicationLink.protocol === "https:") {

                    applyButton =
                        document.createElement("button");

                    applyButton.type = "button";

                    applyButton.textContent = "Apply Now";

                    applyButton.style.marginTop = "8px";

                    applyButton.addEventListener("click", () => {

                        window.open(
                            applicationLink.href,
                            "_blank",
                            "noopener,noreferrer"
                        );
                    });
                }

            } catch (error) {

                console.warn(
                    "Invalid application URL:",
                    error
                );
            }
        }

        action.append(
            salary,
            saveButton,
            detailsButton
        );

        if (applyButton) {
            action.appendChild(applyButton);
        }

        card.append(
            info,
            action
        );

        list.appendChild(card);
    });

    createPagination();
}


// ======================================
// LOAD LIVE JOBS FROM HEADCOUNT LABS
// ======================================

async function loadJobs() {

    message.textContent = "Loading live jobs...";

    const keyword =
        document.getElementById("keyword").value.trim();

    const city =
        document.getElementById("city").value.trim();

    const type =
        document.getElementById("jobType").value;

    const params = new URLSearchParams({

        page: currentPage,

        limit: PAGE_LIMIT

    });

    // Cursor pagination
    const cursor = cursorByPage.get(currentPage);

    if (cursor) {

        params.set("cursor", cursor);
    }

    // Keyword filter
    if (keyword) {

        params.set("keyword", keyword);
    }

    // City filter
    if (city) {

        params.set("city", city);
    }

    // Job type filter
    if (type) {

        params.set("type", type);
    }

    try {

        const response = await fetch(
            `${API_URL}?${params.toString()}`
        );

        if (!response.ok) {

            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (data.status !== "success") {

            throw new Error(
                data.message || "Could not load jobs."
            );
        }

        // Store next cursor
        const nextCursor =
            data.next_cursor || null;

        hasMoreJobs = Boolean(nextCursor);

        if (nextCursor) {

            cursorByPage.set(
                currentPage + 1,
                nextCursor
            );
        }

        // Current page
        currentPage = Number(data.page) || 1;

        // Current page jobs
        const jobs = data.jobs || [];

        totalJobs = jobs.length;

        // Display jobs
        renderJobs(jobs);

        message.textContent =
            `Live job listings from ${data.source || "CareerLens"}.`;

    } catch (error) {

        console.error(
            "Loading jobs failed:",
            error
        );

        totalJobs = 0;

        currentJobs = [];

        hasMoreJobs = false;

        count.textContent = "Jobs unavailable";

        list.replaceChildren();

        const errorBox =
            document.createElement("div");

        errorBox.className = "no-results";

        errorBox.textContent =
            "Could not load live jobs. Please check that the CareerLens backend is running and try again.";

        list.appendChild(errorBox);

        createPagination();

        message.textContent =
            "Unable to load live jobs. Please try again.";
    }
}


// ======================================
// SEARCH AND FILTER SUBMISSION
// ======================================

form.addEventListener("submit", event => {

    event.preventDefault();

    currentPage = 1;

    cursorByPage.clear();

    hasMoreJobs = false;

    loadJobs();
});


// ======================================
// FIREBASE AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async user => {

    currentUser = user;

    try {

        await loadSavedJobs();

        await loadJobs();

    } catch (error) {

        console.error(
            "Authentication or saved jobs error:",
            error
        );

        message.textContent =
            "Could not load your saved jobs. Please try again.";
    }
});