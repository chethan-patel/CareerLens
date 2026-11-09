// CareerLens Salary Insights - Public dataset
const DATA_URL = "http://127.0.0.1:5000/api/salary";

const SKILL_PALETTE = [
  "#39764d", "#76a983", "#aacbb0", "#8a78c7",
  "#e5b76c", "#6f9fc5", "#d88972", "#9bada0"
];

let dashboardData = null;
let salaryChart = null;
let skillsChart = null;

const locationFilter = document.getElementById("locationFilter");

function formatINR(value) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function selectedCityData() {
  const city = locationFilter.value;

  if (city === "All") return null;

  return dashboardData.salary_by_city.find(
    item => item.city === city
  ) || null;
}

function renderMetrics() {
  const summary = dashboardData.summary;
  const cityData = selectedCityData();

  document.getElementById("averageSalary").textContent =
    formatINR(cityData ? cityData.average_salary : summary.average_salary);

  document.getElementById("highestSalary").textContent =
    formatINR(dashboardData.top_paying_roles[0]?.average_salary || 0);

  document.getElementById("roleCount").textContent =
    Number(summary.total_job_roles).toLocaleString("en-IN");

  document.getElementById("skillCount").textContent =
    dashboardData.top_required_skills.length;

  document.querySelector("#averageSalary")
    .parentElement.querySelector(".metric-foot").textContent =
    cityData ? `Average in ${cityData.city}` : "Across all cities";

  document.querySelector("#highestSalary")
    .parentElement.querySelector(".metric-foot").textContent =
    "Highest average among listed roles";

  document.querySelector("#roleCount")
    .parentElement.querySelector(".metric-foot").textContent =
    `Across ${summary.total_jobs.toLocaleString("en-IN")} job records`;

  document.querySelector("#skillCount")
    .parentElement.querySelector(".metric-foot").textContent =
    "Top skills displayed below";
}

function renderSalaryChart() {
  const roles = dashboardData.top_paying_roles;

  if (salaryChart) salaryChart.destroy();

  salaryChart = new Chart(document.getElementById("salaryChart"), {
    type: "bar",

    data: {
      labels: roles.map(x => x.job_role),
      datasets: [{
        label: "Average salary (INR)",
        data: roles.map(x => x.average_salary),
        backgroundColor: "#39764d",
        borderRadius: 5,
        borderSkipped: false
      }]
    },

    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },

        tooltip: {
          callbacks: {
            label: c => `Average: ${formatINR(c.raw)}`
          }
        }
      },

      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average salary (INR)"
          },
          ticks: {
            callback: value => formatINR(value)
          },
          grid: { color: "#edf1ed" }
        },

        y: {
          grid: { display: false },
          ticks: { autoSkip: false }
        }
      }
    }
  });
}

function renderSkillsChart() {
  const skills = dashboardData.top_required_skills;

  if (skillsChart) skillsChart.destroy();

  skillsChart = new Chart(document.getElementById("skillsChart"), {
    type: "doughnut",

    data: {
      labels: skills.map(x => x.skill),
      datasets: [{
        data: skills.map(x => x.count),
        backgroundColor: skills.map(
          (_, i) => SKILL_PALETTE[i % SKILL_PALETTE.length]
        ),
        borderColor: "#fff",
        borderWidth: 4,
        hoverOffset: 5
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "66%",

      plugins: {
        legend: { display: false },

        tooltip: {
          callbacks: {
            label: c =>
              `${c.label}: ${Number(c.raw).toLocaleString("en-IN")} mentions`
          }
        }
      }
    }
  });

  document.getElementById("skillsLegend").innerHTML =
    skills.map((item, i) => `
      <span class="legend-item">
        <span class="legend-dot"
          style="background:${SKILL_PALETTE[i % SKILL_PALETTE.length]}">
        </span>
        ${escapeHTML(item.skill)}
        <strong>${Number(item.count).toLocaleString("en-IN")}</strong>
      </span>
    `).join("");
}

function renderTable() {
  const tbody = document.getElementById("salaryTableBody");
  const rows = dashboardData.top_paying_roles;

  document.getElementById("tableCount").textContent =
    `${rows.length} top-paying roles`;

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td>
        ${escapeHTML(item.job_role)}
        <span class="role-subtitle">Top-paying role in dataset</span>
      </td>
      <td>India</td>
      <td><span class="skill-pill">See skills chart</span></td>
      <td>
        <span class="salary-range">
          ${formatINR(item.average_salary)} average
        </span>
      </td>
    </tr>
  `).join("");
}

function populateLocations() {
  dashboardData.salary_by_city.forEach(item => {
    const option = document.createElement("option");
    option.value = item.city;
    option.textContent = item.city;
    locationFilter.appendChild(option);
  });
}

async function initDashboard() {
  const notice = document.querySelector(".notice");

  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    dashboardData = await response.json();

    populateLocations();
    renderMetrics();
    renderSalaryChart();
    renderSkillsChart();
    renderTable();

    notice.innerHTML = `
      <span class="notice-icon">ⓘ</span>
      <div>
        <strong>Public dataset insights</strong>
        <p>
          Based on 100,000 records from the downloaded
          India Tech Career Intelligence 2026 dataset.
          Salary values are in INR; the salary period
          is not specified in the dataset.
          These figures are not verified live vacancies
          or official market statistics.
        </p>
      </div>
    `;

    document.querySelector(".sidebar-footer").innerHTML =
      '<span class="status-dot"></span> Python dashboard data connected';

    document.querySelector(".page-footer").innerHTML =
      'CareerLens · Salary Insights <span>Public dataset · Academic analysis</span>';

  } catch (error) {
    console.error("CareerLens dashboard data could not be loaded:", error);

    notice.innerHTML = `
      <span class="notice-icon">ⓘ</span>
      <div>
        <strong>Dashboard data not loaded</strong>
        <p>Start the Flask backend and refresh this page.</p>
      </div>
    `;
  }
}

locationFilter.addEventListener("change", () => {
  if (dashboardData) renderMetrics();
});

initDashboard();