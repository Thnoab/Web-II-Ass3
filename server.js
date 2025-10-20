// server.js
const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = "/Assessment3";

app.use(BASE_PATH, express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "super_secret_key_123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

console.log("🧩 DB Config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  name: process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: "localhost",
  user: "yqin14_webapp",
  password: "Chevalierest!c1",
  database: "yqin14_Assessment3_WebII",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
const db = pool.promise();

/* -------------------- REGISTER -------------------- */
// 🔹改动：去除 bcrypt.hash，直接存储明文（仅测试用）
app.post(BASE_PATH + '/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    const [exists] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );
    if (exists.length > 0)
      return res.status(409).json({ error: 'Username or email already exists.' });

    await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password] // 🔹直接插入
    );

    res.status(201).json({ message: 'Admin account created successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* -------------------- LOGIN -------------------- */
// 🔹改动：去除 bcrypt.compare，改为明文比对
app.post(BASE_PATH + '/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing username or password' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    if (user.password !== password)
      return res.status(401).json({ error: 'Invalid password' });

    req.session.user = { id: user.id, username: user.username };
    res.json({ success: true, username: user.username, message: "Login successful" });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* -------------------- SESSION CHECK -------------------- */
app.get(BASE_PATH + '/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

/* -------------------- LOGOUT -------------------- */
app.post(BASE_PATH + '/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/* -------------------- CATEGORIES -------------------- */
app.get(BASE_PATH + '/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- EVENTS (CRUD) -------------------- */
app.get(BASE_PATH + '/api/events', async (req, res) => {
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

app.get(BASE_PATH + '/api/events/:id', async (req, res) => {
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

app.post(BASE_PATH + '/api/events', async (req, res) => {
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

app.put(BASE_PATH + '/api/events/:id', async (req, res) => {
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

app.delete(BASE_PATH + '/api/events/:id', async (req, res) => {
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

/* -------------------- REGISTRATIONS -------------------- */
app.get(BASE_PATH + '/api/registrations', async (req, res) => {
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

app.post(BASE_PATH + '/api/registrations', async (req, res) => {
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

/* -------------------- EXTRA ROUTES -------------------- */
app.get(`${BASE_PATH}/api/hello`, (req, res) => {
  res.send("Hello from Node.js backend!");
});

app.get(`${BASE_PATH}/api/search`, async (req, res) => {
  try {
    const { date, location, category } = req.query;
    let sql = `
      SELECT e.*, c.name AS category_name, o.name AS org_name,
        CASE WHEN e.date < CURDATE() THEN 'past' ELSE 'upcoming' END AS status
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN organizations o ON e.org_id = o.id
      WHERE e.suspended = FALSE
    `;
    const params = [];
    if (date) { sql += ' AND e.date = ?'; params.push(date); }
    if (location) { sql += ' AND e.location LIKE ?'; params.push('%' + location + '%'); }
    if (category) { sql += ' AND e.category_id = ?'; params.push(category); }
    sql += ' ORDER BY e.date ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

