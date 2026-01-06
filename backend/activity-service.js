
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Check-in endpoint
app.post('/api/sessions/checkin', async (req, res) => {
  const { clubId, playerId } = req.body;
  try {
    const session = await prisma.session.create({
      data: {
        clubId,
        playerId,
        status: 'playing',
        checkInTime: new Date()
      }
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: "Could not check in" });
  }
});

// Add service to session
app.post('/api/sessions/:id/services', async (req, res) => {
  const { id } = req.params;
  const { serviceId, quantity, unitPrice } = req.body;
  try {
    const sessionService = await prisma.sessionService.create({
      data: {
        sessionId: id,
        serviceId,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice
      }
    });
    res.status(201).json(sessionService);
  } catch (error) {
    res.status(500).json({ error: "Could not add service" });
  }
});

app.listen(3002, () => console.log('Activity Service running on port 3002'));
