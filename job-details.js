
const params = new URLSearchParams(window.location.search);

const job = {
    title: params.get("title") || "Junior Data Analyst",
    company: params.get("company") || "InsightWorks",
    location: params.get("location") || "Bangalore",
    type: params.get("type") || "Full-time",
    salary: params.get("salary") || "Sample salary",
    description: params.get("description") ||
        "Explore this sample career opportunity.",
    skills: (params.get("skills") || "SQL,Excel,Power BI")
        .split(",")
};

document.getElementById("jobTitle").textContent = job.title;
document.getElementById("companyName").textContent =
    `${job.company} · ${job.location}`;
document.getElementById("jobType").textContent = job.type;
document.getElementById("jobLocation").textContent = job.location;
document.getElementById("jobSalary").textContent = job.salary;
document.getElementById("sideSalary").textContent = job.salary;
document.getElementById("jobDescription").textContent = job.description;

document.getElementById("skillList").replaceChildren(
    ...job.skills.map(skill => {
        const tag = document.createElement("span");
        tag.textContent = skill;
        return tag;
    })
);

document.getElementById("applyButton").addEventListener("click", () => {
    document.getElementById("applyMessage").textContent =
        "Demo only: connect a verified employer application link to enable real applications.";
});
