// index.js

function getApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL;

  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const firstDir = pathParts.length > 0 ? '/' + pathParts[0] : '';
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

async function loadEvents() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();

    const out = document.getElementById('events');
    if (!events || events.length === 0) {
      out.innerHTML = '<p>No events found.</p>';
      return;
    }

    out.innerHTML = events.map(e => {
      const imgSrc = e.image_url?.startsWith('/images/')
        ? `${getApiBaseUrl()}${e.image_url}`
        : (e.image_url || 'https://via.placeholder.com/300x200?text=No+Image');
      return `
        <div class="card">
          <img src="${imgSrc}" alt="Event Image" class="thumb">
          <h3>${escapeHtml(e.name)}</h3>
          <p class="meta">${e.org_name || ''} — ${e.location || ''} — ${e.date} (${e.status})</p>
          <p>${escapeHtml(e.short_description || (e.description || '').slice(0,120))}</p>
          <a href="event.html?id=${e.id}">View Details</a>
        </div>
      `;
    }).join('');
  } catch (err) {
    document.getElementById('events').innerText = 'Failed to load events: ' + err.message;
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

loadEvents();

