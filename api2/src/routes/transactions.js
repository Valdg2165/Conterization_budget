const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PowensUser } = require('../db');
const { getTransactions } = require('../powens');

const router = express.Router();

// GET /powens/transactions?limit=50
router.get('/', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    const powensUser = await PowensUser.findOne({ user_id: req.user.sub });
    if (!powensUser) {
      return res.json({ transactions: [], connected: false });
    }

    const transactions = await getTransactions(powensUser.access_token, limit);
    res.json({ transactions, connected: true });
  } catch (err) {
    console.error('Transactions error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
