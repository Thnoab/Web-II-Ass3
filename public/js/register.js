// register.js

function getApiBaseUrl() {
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }

  if (window.location.protocol === "file:") {
    return "http://localhost:3000";
  }

  return `http://24516989.it.scu.edu.au/Assessment3`;
}

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("message");

  msg.textContent = "Creating account...";
  msg.style.color = "#333";

  try {

    const res = await fetch(`${getApiBaseUrl()}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      msg.textContent = "✅ Account created successfully! Redirecting...";
      msg.style.color = "green";
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } else {
      msg.textContent = "⚠️ " + (data.error || "Registration failed.");
      msg.style.color = "red";
    }
  } catch (err) {
    msg.textContent = "❌ Error connecting to server.";
    msg.style.color = "red";
  }
});


