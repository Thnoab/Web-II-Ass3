// search.js

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

async function loadCategories(){
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/categories`);
    const cats = await res.json();
    const sel = document.getElementById('categorySelect');
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
  } catch (err){
    console.error('Failed to load categories', err);
  }
}

function renderFullEvent(e){
  return `<div class="card">
    <h3>${escapeHtml(e.name)}</h3>
    <p class="meta">${e.org_name || ''} — ${e.location || ''} — ${e.date} (${e.status})</p>
    <p><strong>Description:</strong> ${escapeHtml(e.description || e.short_description || '')}</p>
    <p><strong>Price:</strong> ${e.price==0 ? 'Free' : '$'+e.price}</p>
    <p><strong>Goal:</strong> $${e.goal} — <strong>Progress:</strong> $${e.progress}</p>
    <a href="event.html?id=${e.id}">Open detail page</a>
  </div>`;
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.getElementById('searchForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const params = new URLSearchParams();
  if (form.date.value) params.append('date', form.date.value);
  if (form.location.value) params.append('location', form.location.value);
  if (form.category.value) params.append('category', form.category.value);

  const res = await fetch(`${getApiBaseUrl()}/api/search?` + params.toString());
  const data = await res.json();
  const out = document.getElementById('results');
  if (!data || data.length === 0) { out.innerHTML = '<p>No matching events.</p>'; return; }
  out.innerHTML = data.map(renderFullEvent).join('');
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('searchForm').reset();
  document.getElementById('results').innerHTML = '';
});

loadCategories();
