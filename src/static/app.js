document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const checkEmailInput = document.getElementById("check-email");
  const checkBtn = document.getElementById("check-btn");
  const registeredList = document.getElementById("registered-list");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to fetch registered activities for a student
  async function fetchRegisteredActivities(email) {
    try {
      const response = await fetch(`/activities/registered/${encodeURIComponent(email)}`);
      const activities = await response.json();

      // Clear previous content
      registeredList.innerHTML = "";

      const activityCount = Object.keys(activities).length;

      if (activityCount === 0) {
        registeredList.innerHTML = '<p class="info-text">You are not registered for any activities.</p>';
        return;
      }

      // Populate registered activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card registered";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <button class="cancel-btn" data-activity="${name}" data-email="${email}">Cancel Registration</button>
        `;

        registeredList.appendChild(activityCard);
      });

      // Add event listeners to cancel buttons
      document.querySelectorAll(".cancel-btn").forEach((btn) => {
        btn.addEventListener("click", handleCancelRegistration);
      });
    } catch (error) {
      registeredList.innerHTML = '<p class="error">Failed to load registered activities. Please try again.</p>';
      console.error("Error fetching registered activities:", error);
    }
  }

  // Handle cancel registration with confirmation
  async function handleCancelRegistration(event) {
    const activityName = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to cancel your registration for "${activityName}"?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/cancel?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Show success message
        alert(result.message);
        
        // Refresh the registered activities list
        fetchRegisteredActivities(email);
        
        // Refresh the available activities list to update spots
        fetchActivities();
      } else {
        alert(result.detail || "Failed to cancel registration");
      }
    } catch (error) {
      alert("Failed to cancel registration. Please try again.");
      console.error("Error canceling registration:", error);
    }
  }

  // Handle check button click
  checkBtn.addEventListener("click", () => {
    const email = checkEmailInput.value.trim();
    if (email) {
      fetchRegisteredActivities(email);
    } else {
      alert("Please enter your email address");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh activities list to update spots
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
