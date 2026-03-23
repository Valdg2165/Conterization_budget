const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PowensUser } = require('../db');
const { getAccountTransactions, getAccountInvestments } = require('../powens');

const router = express.Router({ mergeParams: true });

// GET /api/powens/accounts/:id/transactions?limit=20
router.get('/transactions', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  try {
    const powensUser = await PowensUser.findOne({ user_id: req.user.sub });
    if (!powensUser) return res.status(404).json({ error: 'No bank connection found' });

    const transactions = await getAccountTransactions(powensUser.access_token, req.params.id, limit);
    res.json({ transactions });
  } catch (err) {
    console.error('Account transactions error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch account transactions' });
  }
});

// GET /api/powens/accounts/:id/investments
router.get('/investments', requireAuth, async (req, res) => {
  try {
    const powensUser = await PowensUser.findOne({ user_id: req.user.sub });
    if (!powensUser) return res.status(404).json({ error: 'No bank connection found' });

    const investments = await getAccountInvestments(powensUser.access_token, req.params.id);

    // Enrich each investment with performance data
    const enriched = investments.map(inv => {
      const bought    = inv.unitprice   ?? null;
      const current   = inv.unitvalue   ?? null;
      const diffAbs   = (bought !== null && current !== null) ? (current - bought) * (inv.quantity || 1) : null;
      const diffPct   = (bought !== null && current !== null && bought !== 0)
        ? ((current - bought) / bought) * 100
        : null;
      return { ...inv, _diffAbs: diffAbs, _diffPct: diffPct };
    });

    res.json({ investments: enriched });
  } catch (err) {
    console.error('Account investments error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch account investments' });
  }
});

module.exports = router;
