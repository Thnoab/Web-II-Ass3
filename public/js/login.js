// login.js

function getApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("message");

  msg.textContent = "Logging in...";
  msg.style.color = "#333";

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      msg.textContent = "✅ Login successful! Redirecting...";
      msg.style.color = "green";
      setTimeout(() => (window.location.href = "admin.html"), 1500);
    } else {
      msg.textContent = "⚠️ " + (data.error || "Login failed.");
      msg.style.color = "red";
    }
  } catch (err) {
    msg.textContent = "❌ Error connecting to server.";
    msg.style.color = "red";
  }
});
