
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
// Database file sẽ nằm trong thư mục backend
const dbPath = path.join(__dirname, 'pingpong.db');
const db = new sqlite3.Database(dbPath);

// --- PROMISIFIED DB HELPERS ---
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// --- DATABASE INITIALIZATION ---
async function initDatabase() {
  console.log('[DB] Đang khởi tạo SQLite tại:', dbPath);
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, 
      password TEXT NOT NULL, role TEXT DEFAULT 'club', status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY, clubId TEXT, name TEXT NOT NULL, phone TEXT, note TEXT, 
      membershipEndDate TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY, clubId TEXT, name TEXT NOT NULL, price REAL NOT NULL, 
      unit TEXT, status TEXT DEFAULT 'active'
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, clubId TEXT, playerId TEXT, checkInTime TEXT, 
      checkOutTime TEXT, status TEXT DEFAULT 'playing', totalAmount REAL DEFAULT 0
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS session_services (
      id TEXT PRIMARY KEY, sessionId TEXT, serviceId TEXT, quantity INTEGER, 
      unitPrice REAL, totalPrice REAL
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY, clubId TEXT, date TEXT, description TEXT, amount REAL, note TEXT
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS membership_payments (
      id TEXT PRIMARY KEY, clubId TEXT, playerId TEXT, amount REAL, 
      paymentDate TEXT, startDate TEXT, endDate TEXT
    )`);

    // Dữ liệu mẫu khởi tạo
    const clubCount = await dbGet("SELECT count(*) as count FROM clubs");
    if (clubCount.count === 0) {
      console.log('[DB] Nạp dữ liệu mẫu khởi tạo...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedSuperPass = await bcrypt.hash('M@i250563533', salt);
      const hashedDemoPass = await bcrypt.hash('demopro@123', salt);

      await dbRun("INSERT INTO clubs (id, name, username, password, role) VALUES (?, ?, ?, ?, ?)", 
        ['super-admin', 'Hệ thống Quản trị', 'sadmin', hashedSuperPass, 'superadmin']);
      await dbRun("INSERT INTO clubs (id, name, username, password, role) VALUES (?, ?, ?, ?, ?)", 
        ['club-demopro', 'CLB Bóng Bàn Demo Pro', 'demopro', hashedDemoPass, 'club']);
    }
    console.log('[DB] Cơ sở dữ liệu đã sẵn sàng.');
  } catch (err) {
    console.error('[DB] Lỗi khởi tạo nghiêm trọng:', err);
  }
}

app.use(cors());
app.use(express.json());

// Log Middleware cho Debug
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res, next) => {
  const { username, password } = req.body;
  if (username === '__check__' && password === '__check__') return res.json({ status: 'ok' });
  try {
    const club = await dbGet("SELECT * FROM clubs WHERE username = ?", [username]);
    if (!club) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    
    // So sánh mật khẩu bằng bcrypt
    const isMatch = await bcrypt.compare(password, club.password);
    if (!isMatch) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });

    const result = { ...club };
    delete result.password;
    res.json(result);
  } catch (e) { next(e); }
});

// Clubs (CRUD cho SuperAdmin)
app.get('/api/clubs', async (req, res, next) => {
  try { res.json(await dbAll("SELECT * FROM clubs")); } catch (e) { next(e); }
});

app.post('/api/clubs', async (req, res, next) => {
  const { name, username, password, role, status } = req.body;
  const id = `club-${Date.now()}`;
  try {
    // Mã hóa mật khẩu khi tạo mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await dbRun("INSERT INTO clubs (id, name, username, password, role, status) VALUES (?,?,?,?,?,?)", 
      [id, name, username, hashedPassword, role || 'club', status || 'active']);
    res.status(201).json({ id, name, username, role, status });
  } catch (e) { next(e); }
});

app.patch('/api/clubs/:id', async (req, res, next) => {
  const { name, status, password } = req.body;
  try {
    let hashedPassword = undefined;
    if (password) {
      // Mã hóa mật khẩu nếu có yêu cầu cập nhật mật khẩu
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    await dbRun("UPDATE clubs SET name = COALESCE(?, name), status = COALESCE(?, status), password = COALESCE(?, password) WHERE id = ?", 
      [name, status, hashedPassword, req.params.id]);
    
    const updatedClub = await dbGet("SELECT * FROM clubs WHERE id = ?", [req.params.id]);
    if (updatedClub) delete updatedClub.password;
    res.json(updatedClub);
  } catch (e) { next(e); }
});

app.delete('/api/clubs/:id', async (req, res, next) => {
  try {
    await dbRun("DELETE FROM clubs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Players
app.get('/api/players', async (req, res, next) => {
  const { clubId } = req.query;
  const sql = clubId ? "SELECT * FROM players WHERE clubId = ?" : "SELECT * FROM players";
  try { res.json(await dbAll(sql, clubId ? [clubId] : [])); } catch (e) { next(e); }
});

app.post('/api/players', async (req, res, next) => {
  const { clubId, name, phone, note } = req.body;
  const id = `p-${Date.now()}`;
  try {
    await dbRun("INSERT INTO players (id, clubId, name, phone, note) VALUES (?,?,?,?,?)", [id, clubId, name, phone, note]);
    res.status(201).json({ id, clubId, name, phone, note });
  } catch (e) { next(e); }
});

app.patch('/api/players/:id', async (req, res, next) => {
  const { name, phone, note, membershipEndDate } = req.body;
  try {
    await dbRun("UPDATE players SET name = COALESCE(?, name), phone = COALESCE(?, phone), note = COALESCE(?, note), membershipEndDate = COALESCE(?, membershipEndDate) WHERE id = ?", 
      [name, phone, note, membershipEndDate, req.params.id]);
    res.json(await dbGet("SELECT * FROM players WHERE id = ?", [req.params.id]));
  } catch (e) { next(e); }
});

// Services
app.get('/api/services', async (req, res, next) => {
  const { clubId } = req.query;
  const sql = clubId ? "SELECT * FROM services WHERE clubId = ?" : "SELECT * FROM services";
  try { res.json(await dbAll(sql, clubId ? [clubId] : [])); } catch (e) { next(e); }
});

app.post('/api/services', async (req, res, next) => {
  const { clubId, name, price, unit } = req.body;
  const id = `s-${Date.now()}`;
  try {
    await dbRun("INSERT INTO services (id, clubId, name, price, unit) VALUES (?,?,?,?,?)", [id, clubId, name, price, unit]);
    res.status(201).json({ id, name, price, unit });
  } catch (e) { next(e); }
});

app.patch('/api/services/:id', async (req, res, next) => {
  const { name, price, status } = req.body;
  try {
    await dbRun("UPDATE services SET name = COALESCE(?, name), price = COALESCE(?, price), status = COALESCE(?, status) WHERE id = ?", 
      [name, price, status, req.params.id]);
    res.json(await dbGet("SELECT * FROM services WHERE id = ?", [req.params.id]));
  } catch (e) { next(e); }
});

// Sessions
app.get('/api/sessions', async (req, res, next) => {
  const { clubId } = req.query;
  try {
    const sessions = await dbAll(clubId ? "SELECT * FROM sessions WHERE clubId = ?" : "SELECT * FROM sessions", clubId ? [clubId] : []);
    const enriched = await Promise.all(sessions.map(async (s) => {
      const sServices = await dbAll("SELECT * FROM session_services WHERE sessionId = ?", [s.id]);
      return { ...s, sessionServices: sServices };
    }));
    res.json(enriched);
  } catch (e) { next(e); }
});

app.post('/api/sessions/checkin', async (req, res, next) => {
  const { clubId, playerId } = req.body;
  const id = `sess-${Date.now()}`;
  const now = new Date().toISOString();
  try {
    await dbRun("INSERT INTO sessions (id, clubId, playerId, checkInTime, status) VALUES (?,?,?,?,?)", [id, clubId, playerId, now, 'playing']);
    res.status(201).json({ id, clubId, playerId, checkInTime: now, status: 'playing', sessionServices: [] });
  } catch (e) { next(e); }
});

app.post('/api/sessions/:id/services', async (req, res, next) => {
  const { id } = req.params;
  const { serviceId, quantity, unitPrice, totalPrice } = req.body;
  const ssId = `ss-${Date.now()}`;
  try {
    await dbRun("INSERT INTO session_services (id, sessionId, serviceId, quantity, unitPrice, totalPrice) VALUES (?,?,?,?,?,?)", 
      [ssId, id, serviceId, quantity, unitPrice, totalPrice]);
    res.status(201).json({ id: ssId, sessionId: id, serviceId, quantity, unitPrice, totalPrice });
  } catch (e) { next(e); }
});

app.post('/api/sessions/:id/checkout', async (req, res, next) => {
  const { totalAmount } = req.body;
  const now = new Date().toISOString();
  try {
    await dbRun("UPDATE sessions SET status = 'finished', checkOutTime = ?, totalAmount = ? WHERE id = ?", 
      [now, totalAmount, req.params.id]);
    res.json({ id: req.params.id, status: 'finished', totalAmount, checkOutTime: now });
  } catch (e) { next(e); }
});

// Expenses
app.get('/api/expenses', async (req, res, next) => {
  const { clubId } = req.query;
  try { res.json(await dbAll(clubId ? "SELECT * FROM expenses WHERE clubId = ?" : "SELECT * FROM expenses", clubId ? [clubId] : [])); } catch (e) { next(e); }
});

app.post('/api/expenses', async (req, res, next) => {
  const { clubId, date, description, amount, note } = req.body;
  const id = `exp-${Date.now()}`;
  try {
    await dbRun("INSERT INTO expenses (id, clubId, date, description, amount, note) VALUES (?,?,?,?,?,?)", [id, clubId, date, description, amount, note]);
    res.status(201).json({ id, clubId, date, description, amount, note });
  } catch (e) { next(e); }
});

app.delete('/api/expenses/:id', async (req, res, next) => {
  try { await dbRun("DELETE FROM expenses WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { next(e); }
});

// Membership Payments
app.get('/api/membership-payments', async (req, res, next) => {
  const { clubId } = req.query;
  try { res.json(await dbAll(clubId ? "SELECT * FROM membership_payments WHERE clubId = ?" : "SELECT * FROM membership_payments", clubId ? [clubId] : [])); } catch (e) { next(e); }
});

app.post('/api/membership-payments', async (req, res, next) => {
  const { clubId, playerId, amount, paymentDate, startDate, endDate } = req.body;
  const id = `mp-${Date.now()}`;
  try {
    await dbRun("INSERT INTO membership_payments (id, clubId, playerId, amount, paymentDate, startDate, endDate) VALUES (?,?,?,?,?,?,?)", 
      [id, clubId, playerId, amount, paymentDate, startDate, endDate]);
    await dbRun("UPDATE players SET membershipEndDate = ? WHERE id = ?", [endDate, playerId]);
    res.status(201).json({ id, clubId, playerId, amount, endDate });
  } catch (e) { next(e); }
});

// Serve Static Frontend
const projectRoot = path.resolve(__dirname, '..');
app.use(express.static(projectRoot));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: "Endpoint không tồn tại" });
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ 
    error: "Máy chủ gặp sự cố xử lý yêu cầu", 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 8080;
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Đang chạy tại cổng ${PORT}`);
  });
});
