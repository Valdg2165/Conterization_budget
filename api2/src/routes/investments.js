const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PowensUser } = require('../db');
const { getInvestments } = require('../powens');

const router = express.Router();

// GET /powens/investments
router.get('/', requireAuth, async (req, res) => {
  try {
    const powensUser = await PowensUser.findOne({ user_id: req.user.sub });
    if (!powensUser) {
      return res.json({ investments: [], connected: false });
    }

    const investments = await getInvestments(powensUser.access_token);
    res.json({ investments, connected: true });
  } catch (err) {
    console.error('Investments error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch investments' });
  }
});

module.exports = router;
