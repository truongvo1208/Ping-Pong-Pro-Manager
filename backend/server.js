const express = require('express');
const path = require('path');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * API Health Check
 */
const healthCheck = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'online', 
      database: 'connected', 
      version: '1.0.6',
      timestamp: new Date() 
    });
  } catch (e) {
    console.error('[HEALTH ERROR]', e.message);
    res.status(503).json({ 
      status: 'degraded', 
      database: 'error', 
      message: "Hệ thống đang khởi tạo hoặc DB gặp sự cố." 
    });
  }
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

const apiRouter = express.Router();
apiRouter.get('/health', healthCheck);

// --- AUTH API ---
apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === '__check__') return res.status(200).json({ ok: true });
  
  try {
    const club = await prisma.club.findUnique({ where: { username } });
    if (!club || club.password !== password) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }
    const { password: _, ...userData } = club;
    res.json(userData);
  } catch (e) {
    console.error("Login Error:", e);
    res.status(500).json({ error: "Lỗi đăng nhập hệ thống." });
  }
});

// --- CLUBS (SUPER ADMIN) ---
apiRouter.get('/clubs', async (req, res) => {
  try { 
    res.json(await prisma.club.findMany({ orderBy: { createdAt: 'desc' } })); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/clubs', async (req, res) => {
  try { 
    const club = await prisma.club.create({ data: req.body });
    res.status(201).json(club);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.patch('/clubs/:id', async (req, res) => {
  try { 
    const club = await prisma.club.update({ 
      where: { id: req.params.id }, 
      data: req.body 
    });
    res.json(club);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete('/clubs/:id', async (req, res) => {
  try { 
    await prisma.club.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PLAYERS ---
apiRouter.get('/players', async (req, res) => {
  const { clubId } = req.query;
  try {
    res.json(await prisma.player.findMany({ 
      where: clubId ? { clubId } : {},
      orderBy: { createdAt: 'desc' }
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/players', async (req, res) => {
  try { 
    const player = await prisma.player.create({ data: req.body });
    res.status(201).json(player);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.patch('/players/:id', async (req, res) => {
  try { 
    const player = await prisma.player.update({ 
      where: { id: req.params.id }, 
      data: req.body 
    });
    res.json(player);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SERVICES ---
apiRouter.get('/services', async (req, res) => {
  const { clubId } = req.query;
  try { 
    res.json(await prisma.service.findMany({ 
      where: clubId ? { clubId } : {} 
    })); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/services', async (req, res) => {
  try { 
    const service = await prisma.service.create({ data: req.body });
    res.status(201).json(service);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.patch('/services/:id', async (req, res) => {
  try { 
    const service = await prisma.service.update({ 
      where: { id: req.params.id }, 
      data: req.body 
    });
    res.json(service);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SESSIONS ---
apiRouter.get('/sessions', async (req, res) => {
  const { clubId } = req.query;
  try {
    res.json(await prisma.session.findMany({
      where: clubId ? { clubId } : {},
      include: { 
        sessionServices: true,
        player: { select: { id: true, name: true, phone: true, membershipEndDate: true } }
      },
      orderBy: { checkInTime: 'desc' }
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/sessions/checkin', async (req, res) => {
  try {
    const { clubId, playerId } = req.body;
    const session = await prisma.session.create({
      data: { clubId, playerId, status: 'playing', checkInTime: new Date() },
      include: { sessionServices: true, player: true }
    });
    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/sessions/:id/checkout', async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { 
        status: 'finished', 
        checkOutTime: new Date(), 
        totalAmount: parseFloat(req.body.totalAmount) 
      }
    });
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/sessions/:id/services', async (req, res) => {
  const { id } = req.params;
  const { serviceId, quantity, unitPrice } = req.body;
  try {
    const ss = await prisma.sessionService.create({
      data: { 
        sessionId: id, 
        serviceId, 
        quantity: parseInt(quantity), 
        unitPrice: parseFloat(unitPrice), 
        totalPrice: quantity * unitPrice 
      }
    });
    res.status(201).json(ss);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- EXPENSES ---
apiRouter.get('/expenses', async (req, res) => {
  const { clubId } = req.query;
  try { 
    res.json(await prisma.expense.findMany({ 
      where: clubId ? { clubId } : {},
      orderBy: { date: 'desc' }
    })); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/expenses', async (req, res) => {
  try { 
    const expense = await prisma.expense.create({ 
      data: { ...req.body, date: new Date(req.body.date || undefined) } 
    });
    res.status(201).json(expense);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete('/expenses/:id', async (req, res) => {
  try { 
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- MEMBERSHIP ---
apiRouter.post('/membership-payments', async (req, res) => {
  try {
    const { clubId, playerId, amount, startDate, endDate } = req.body;
    const payment = await prisma.membershipPayment.create({
      data: { 
        clubId, playerId, 
        amount: parseFloat(amount), 
        startDate: new Date(startDate), 
        endDate: new Date(endDate), 
        paymentDate: new Date() 
      }
    });
    // Cập nhật ngày hết hạn của người chơi
    await prisma.player.update({
      where: { id: playerId },
      data: { membershipEndDate: new Date(endDate) }
    });
    res.status(201).json(payment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mount Router
app.use('/api', apiRouter);

// Static frontend delivery
const projectRoot = path.resolve(__dirname, '..');
app.use(express.static(projectRoot));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "API Endpoint not found" });
  }
  res.sendFile(path.join(projectRoot, 'index.html'));
});

const PORT = process.env.PORT || 8080;

async function start() {
  console.log('--- KHỞI ĐỘNG HỆ THỐNG PINGPONG PRO ---');
  try {
    await prisma.$connect();
    console.log('[DB] Kết nối thành công.');
    
    // Đảm bảo các tài khoản admin luôn tồn tại với mật khẩu đúng
    // Sử dụng upsert để ghi đè mật khẩu nếu tài khoản đã tồn tại
    const adminData = [
      { id: 'super-admin', name: 'Quản trị Hệ thống', username: 'admin_supper', password: 'M@i250563533', role: 'superadmin' },
      { id: 'club-demo-3t', name: 'CLB Bóng Bàn 3T', username: 'admin_sg', password: 'admin', role: 'club' }
    ];

    for (const admin of adminData) {
      await prisma.club.upsert({
        where: { username: admin.username },
        update: { password: admin.password, name: admin.name, role: admin.role },
        create: admin
      });
    }
    console.log('[SEED] Đã đồng bộ tài khoản quản trị.');
    
  } catch (e) {
    console.error('[DB ERROR] Lỗi database:', e.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Đang lắng nghe tại cổng ${PORT}`);
  });
}

start();