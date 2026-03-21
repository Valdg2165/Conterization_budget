const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PowensUser } = require('../db');
const { getAccounts } = require('../powens');

const router = express.Router();

// GET /powens/accounts
router.get('/', requireAuth, async (req, res) => {
  try {
    const powensUser = await PowensUser.findOne({ user_id: req.user.sub });
    if (!powensUser) {
      return res.json({ accounts: [], connected: false });
    }

    const accounts = await getAccounts(powensUser.access_token);
    res.json({ accounts, connected: true });
  } catch (err) {
    console.error('Accounts error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch accounts' });
  }
});

module.exports = router;
