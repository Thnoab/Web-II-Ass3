// admin.js

function getApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

const listApiBase = `${getApiBaseUrl()}/api/events`; // ✅
const apiBase = `${getApiBaseUrl()}/api/events`;
const catApiBase = `${getApiBaseUrl()}/api/categories`;

const eventTable = document.querySelector('#eventTable tbody');
const addFormSection = document.getElementById('addFormSection');
const eventForm = document.getElementById('eventForm');
const showAddFormBtn = document.getElementById('showAddForm');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');

const regListSection = document.getElementById('regListSection');
const regTableBody = document.querySelector('#regTable tbody');

let editMode = false;
let catEditMode = false;

// ===== Events List (admin: include suspended) =====
async function loadEvents() {
  const res = await fetch(listApiBase);
  const events = await res.json();
  eventTable.innerHTML = '';
  events.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.name}</td>
      <td>${e.date || '-'}</td>
      <td>${e.location || '-'}</td>
      <td>${e.category_id || '-'}</td>
      <td>${e.goal}</td>
      <td>${e.progress}</td>
      <td>
        <button onclick="editEvent(${e.id})" class="edit-btn">Edit</button>
        <button onclick="deleteEvent(${e.id})" class="delete-btn">Delete</button>
      </td>
    `;
    eventTable.appendChild(tr);
  });
}

showAddFormBtn.addEventListener('click', () => {
  eventForm.reset();
  document.getElementById('eventId').value = '';
  formTitle.textContent = 'Add New Event';
  editMode = false;
  addFormSection.classList.remove('hidden');
  if (regListSection) regListSection.classList.add('hidden');
});

cancelBtn.addEventListener('click', () => {
  addFormSection.classList.add('hidden');
  if (regListSection) regListSection.classList.add('hidden');
});

eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // basic validation
  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  if (!name) { alert('Name is required'); return; }
  if (!date) { alert('Date is required'); return; }

  const data = {
    name,
    short_description: document.getElementById('short_description').value,
    description: document.getElementById('description').value,
    location: document.getElementById('location').value,
    date,
    start_time: document.getElementById('start_time').value,
    price: Number(document.getElementById('price').value || 0),
    goal: Number(document.getElementById('goal').value || 0),
    progress: Number(document.getElementById('progress').value || 0),
    category_id: Number(document.getElementById('category_id').value || 0) || null,
    org_id: Number(document.getElementById('org_id').value || 0) || null,
    image_url: document.getElementById('image_url').value
  };

  let url = apiBase;
  let method = 'POST';
  if (editMode) {
    const id = document.getElementById('eventId').value;
    url = `${apiBase}/${id}`;
    method = 'PUT';
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert(editMode ? 'Event updated!' : 'Event added!');
    addFormSection.classList.add('hidden');
    if (regListSection) regListSection.classList.add('hidden');
    loadEvents();
  } else {
    const err = await res.json().catch(()=>({}));
    alert('Error: ' + (err.error || 'Request failed'));
  }
});

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  if (res.ok) {
    alert('Deleted!');
    loadEvents();
  } else {
    const err = await res.json().catch(()=>({}));
    alert('Error: ' + (err.error || 'Request failed'));
  }
}

window.editEvent = async function(id) {
  const res = await fetch(`${listApiBase}/${id}`);
  const event = await res.json();
  formTitle.textContent = 'Edit Event';
  editMode = true;
  addFormSection.classList.remove('hidden');

  document.getElementById('eventId').value = event.id;
  document.getElementById('name').value = event.name || '';
  document.getElementById('short_description').value = event.short_description || '';
  document.getElementById('description').value = event.description || '';
  document.getElementById('location').value = event.location || '';
  document.getElementById('date').value = event.date ? String(event.date).split('T')[0] : '';
  document.getElementById('start_time').value = event.start_time || '';
  document.getElementById('price').value = event.price ?? 0;
  document.getElementById('goal').value = event.goal ?? 0;
  document.getElementById('progress').value = event.progress ?? 0;
  document.getElementById('category_id').value = event.category_id ?? '';
  document.getElementById('org_id').value = event.org_id ?? '';
  document.getElementById('image_url').value = event.image_url || '';

  // render registrations
  if (regListSection) {
    const regs = Array.isArray(event.registrations) ? event.registrations : [];
    regTableBody.innerHTML = regs.length ? regs.map(r => `
      <tr>
        <td>${escapeHtml(r.full_name)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.phone || '')}</td>
        <td>${r.num_tickets}</td>
        <td>${(r.registered_at || '').toString().slice(0,19).replace('T',' ')}</td>
      </tr>
    `).join('') : `<tr><td colspan="5">No registrations</td></tr>`;
    regListSection.classList.remove('hidden');
  }
};

// utility
function escapeHtml(s){ 
  return String(s||'').replace(/[&<>"']/g, c=> ({
    '&':'&','<':'<','>':'>','"':'"',"'":'&#39;'
  }[c])); 
}

// ===== Category Management =====
const categoryTable = document.querySelector('#categoryTable tbody');
const showCatAddFormBtn = document.getElementById('showCatAddForm');
const catFormWrap = document.getElementById('catFormWrap');
const catForm = document.getElementById('categoryForm');
const catFormTitle = document.getElementById('catFormTitle');
const catCancelBtn = document.getElementById('catCancelBtn');

async function loadCategories() {
  const res = await fetch(catApiBase);
  const cats = await res.json();
  categoryTable.innerHTML = '';
  cats.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>
        <button onclick="editCategory(${c.id}, '${(c.name || '').replace(/'/g,"\\'")}')">Edit</button>
        <button onclick="deleteCategory(${c.id})">Delete</button>
      </td>
    `;
    categoryTable.appendChild(tr);
  });
}

showCatAddFormBtn.addEventListener('click', () => {
  catForm.reset();
  document.getElementById('catId').value = '';
  catFormTitle.textContent = 'Add Category';
  catEditMode = false;
  catFormWrap.classList.remove('hidden');
});

catCancelBtn.addEventListener('click', () => {
  catFormWrap.classList.add('hidden');
});

catForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('catId').value;
  const name = document.getElementById('catName').value.trim();
  if (!name) { alert('Name is required'); return; }
  let url = catApiBase;
  let method = 'POST';
  let payload = { name };
  if (catEditMode) {
    url = `${catApiBase}/${id}`;
    method = 'PUT';
  }
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (res.ok) {
    alert(catEditMode ? 'Category updated!' : 'Category added!');
    catFormWrap.classList.add('hidden');
    loadCategories();
  } else {
    alert('Error: ' + (data.error || 'Request failed'));
  }
});

window.editCategory = function(id, name){
  catEditMode = true;
  catFormWrap.classList.remove('hidden');
  catFormTitle.textContent = 'Edit Category';
  document.getElementById('catId').value = id;
  document.getElementById('catName').value = name;
};

async function deleteCategory(id){
  if (!confirm('Delete this category?')) return;
  const res = await fetch(`${catApiBase}/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(()=>({}));
  if (res.ok) {
    alert('Deleted!');
    loadCategories();
  } else {
    alert('Error: ' + (data.error || 'Request failed'));
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  window.location.href = 'login.html';
});

// initial load
loadEvents();
loadCategories();