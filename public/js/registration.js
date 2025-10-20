// registration.js

function getApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

function qs(name){ return new URLSearchParams(location.search).get(name); }

async function loadEvent(){
  const id = qs('event_id');
  const out = document.getElementById('eventInfo');
  if (!id) { out.innerHTML = '<p>Missing event_id.</p>'; return; }
  const res = await fetch(`${getApiBaseUrl()}/api/events/${id}`);
  const e = await res.json();
  out.innerHTML = `
    <h2>${e.name}</h2>
    <p>${e.location} — ${e.date}</p>
    <p>${e.description || e.short_description || ''}</p>
  `;
}

document.getElementById('regForm').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const form = ev.target;
  const body = {
    event_id: qs('event_id'),
    full_name: form.full_name.value,
    email: form.email.value,
    phone: form.phone.value,
    num_tickets: form.num_tickets.value
  };
  const res = await fetch(`${getApiBaseUrl()}/api/registrations`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  const msg = document.getElementById('msg');
  if(res.ok){
    msg.innerHTML = `<p style="color:green">${data.message}</p>`;
    form.reset();
  } else {
    msg.innerHTML = `<p style="color:red">${data.error || 'Failed to register'}</p>`;
  }
});

loadEvent();

