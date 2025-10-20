// event.js

// 动态获取 API 基础 URL
function getApiBaseUrl() {
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  
  // 如果 config.js 没有加载，使用默认值
  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }
  
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

function qs(name){ 
  return new URLSearchParams(location.search).get(name); 
}
function escapeHtml(s){ 
  return String(s||'').replace(/[&<>"']/g, c=> ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c])); 
}

async function load(){
  const id = qs('id');
  const out = document.getElementById('event');
  if (!id) { 
    out.innerHTML = '<p>No event selected.</p>'; 
    return; 
  }

  const res = await fetch(`${getApiBaseUrl()}/api/events/` + id);
  if (!res.ok){ 
    out.innerHTML = '<p>Event not found.</p>'; 
    return; 
  }

  const e = await res.json();

  const imgSrc = e.image_url?.startsWith('/images/')
    ? `${getApiBaseUrl()}${e.image_url}`
    : (e.image_url || 'https://via.placeholder.com/600x300?text=No+Image');

  let regList = '';
  if (e.registrations && e.registrations.length > 0) {
    regList = `
      <h3>Recent Registrations</h3>
      <ul class="registrations">
        ${e.registrations.map(r => `
          <li>${escapeHtml(r.full_name)} — ${escapeHtml(r.email)} (${r.num_tickets} ticket${r.num_tickets>1?'s':''}) on ${r.registered_at.slice(0,10)}</li>
        `).join('')}
      </ul>
    `;
  } else {
    regList = '<p>No registrations yet.</p>';
  }

  out.innerHTML = `
    <div class="card detail">
      <img src="${imgSrc}" alt="Event Image" class="cover">
      <h2>${escapeHtml(e.name)}</h2>
      <p class="meta">${e.org_name || ''} — ${e.location} — ${e.date} (${e.status})</p>
      <p><strong>Description:</strong> ${escapeHtml(e.description || e.short_description || '')}</p>
      <p><strong>Price:</strong> ${e.price==0 ? 'Free' : '$'+e.price}</p>
      <p><strong>Goal:</strong> $${e.goal} — <strong>Progress:</strong> $${e.progress}</p>
      <button id="registerBtn">Register for this event</button>
      ${regList}
    </div>
  `;

  document.getElementById('registerBtn').addEventListener('click', () => {
    window.location.href = `registration.html?event_id=${e.id}`;
  });
}

load();

