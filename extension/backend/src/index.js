require('dotenv').config();
const express = require('express');
const cors = require('cors');

const profileRoutes = require('./routes/profile');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/profile', profileRoutes);
app.use('/api/webhook', webhookRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SmartApply Backend running on port ${PORT}`);
});

module.exports = app;
