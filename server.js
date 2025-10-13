// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'super_secret_key_123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Qassk72345',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const db = pool.promise();

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {

    const [exists] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashed]
    );

    res.status(201).json({ message: 'Admin account created successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing username or password' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid password' });

    req.session.user = { id: user.id, username: user.username };
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//-------------------CRUD-------------------
app.get('/api/events', async (req, res) => {
  try {
    const sql = `
      SELECT e.*, c.name AS category_name, o.name AS org_name,
        CASE WHEN e.date < CURDATE() THEN 'past' ELSE 'upcoming' END AS status
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN organizations o ON e.org_id = o.id
      WHERE e.suspended = FALSE
      ORDER BY e.date ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const sql = `
      SELECT e.*, c.name AS category_name, o.name AS org_name,
        CASE WHEN e.date < CURDATE() THEN 'past' ELSE 'upcoming' END AS status
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN organizations o ON e.org_id = o.id
      WHERE e.id = ? AND e.suspended = FALSE
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
    const event = rows[0];

    const [regs] = await db.query(
      'SELECT id, full_name, email, phone, num_tickets, ticket_id, registered_at FROM registrations WHERE event_id = ? ORDER BY registered_at DESC',
      [req.params.id]
    );
    event.registrations = regs;
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const {
      name, short_description = '', description = '', location = '',
      date = null, start_time = null, end_time = null,
      price = 0.00, goal = 0.00, progress = 0.00,
      category_id = null, org_id = null, suspended = false, image_url = ''
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Event name is required' });

    const [result] = await db.query(
      `INSERT INTO events (name, short_description, description, location, date, start_time, end_time, price, goal, progress, category_id, org_id, suspended, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [name, short_description, description, location, date, start_time, end_time, price, goal, progress, category_id, org_id, suspended ? 1 : 0, image_url]
    );

    res.status(201).json({ id: result.insertId, message: 'Event created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      name, short_description = '', description = '', location = '',
      date = null, start_time = null, end_time = null,
      price = 0.00, goal = 0.00, progress = 0.00,
      category_id = null, org_id = null, suspended = false, image_url = ''
    } = req.body;

    const [result] = await db.query(
      `UPDATE events SET name = ?, short_description = ?, description = ?, location = ?, date = ?, start_time = ?, end_time = ?, price = ?, goal = ?, progress = ?, category_id = ?, org_id = ?, suspended = ?, image_url = ? WHERE id = ?` ,
      [name, short_description, description, location, date, start_time, end_time, price, goal, progress, category_id, org_id, suspended ? 1 : 0, image_url, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await pool.promise().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM registrations WHERE event_id = ?', [id]);
    const cnt = rows[0].cnt;
    if (cnt > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Cannot delete event: there are registrations for this event' });
    }
    const [del] = await conn.query('DELETE FROM events WHERE id = ?', [id]);
    await conn.commit();
    if (del.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

//--------------------------------------
app.get('/api/registrations', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  try {
    const [rows] = await db.query(`
      SELECT r.*, e.name AS event_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registered_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/registrations', async (req, res) => {
  const {
    event_id,
    full_name,
    email,
    phone = '',
    num_tickets = 1,
    ticket_id = null,
    contact_address = ''
  } = req.body;

  if (!event_id || !full_name || !email) {
    return res.status(400).json({ error: 'Missing required fields: event_id, full_name, email' });
  }

  const conn = await pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query(
      'SELECT id FROM events WHERE id = ? AND suspended = FALSE',
      [event_id]
    );
    if (eventRows.length === 0) {
      throw { status: 404, message: 'Event not found or suspended' };
    }

    const [existing] = await conn.query(
      'SELECT id FROM registrations WHERE event_id = ? AND email = ? LIMIT 1',
      [event_id, email]
    );
    if (existing.length > 0) {
      throw { status: 409, message: 'You have already registered for this event with this email.' };
    }

    const [result] = await conn.query(
      `INSERT INTO registrations (event_id, full_name, email, phone, num_tickets, ticket_id, contact_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id, full_name, email, phone, num_tickets, ticket_id, contact_address]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId, message: 'Registration successful!' });
  } catch (err) {
    await conn.rollback();
    console.error('Registration error:', err);
    if (err.status) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  } finally {
    conn.release();
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
