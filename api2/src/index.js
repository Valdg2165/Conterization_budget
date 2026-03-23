require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDb } = require('./db');
const connectRouter = require('./routes/connect');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const investmentsRouter = require('./routes/investments');
const accountDetailRouter = require('./routes/accountDetail');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/powens',                          connectRouter);
app.use('/api/powens/accounts',                 accountsRouter);
app.use('/api/powens/accounts/:id',             accountDetailRouter);
app.use('/api/powens/transactions',             transactionsRouter);
app.use('/api/powens/investments',              investmentsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'powens-api' });
});

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Powens API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
