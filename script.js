
const searchForm = document.getElementById("jobSearch");
const roleInput = document.getElementById("role");
const locationInput = document.getElementById("location");

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const role = roleInput.value.trim();
    const location = locationInput.value.trim();

    const params = new URLSearchParams();

    if (role) {
        params.set("keyword", role);
    }

    if (location) {
        params.set("city", location);
    }

    window.location.href = "jobs.html?" + params.toString();
});
