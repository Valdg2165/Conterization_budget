const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PowensUser } = require('../db');
const { initUser, getTempCode, buildWebviewUrl } = require('../powens');

const router = express.Router();

const CALLBACK_URL   = process.env.CALLBACK_URL;    // http://localhost:3003/api/powens/callback
const FRONTEND_URL   = process.env.FRONTEND_URL;    // http://localhost:5173

// Returns an HTML page that navigates out of any iframe context (no inline JS, CSP-safe)
function redirectPage(url) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url}"><title>Redirection...</title></head>
<body><p>Redirection en cours... <a href="${url}">Cliquez ici</a> si vous n'êtes pas redirigé.</p>
</body></html>`;
}

// GET /api/powens/init
// Returns the WebView URL for the user to connect their bank
router.get('/init', requireAuth, async (req, res) => {
  const userId = req.user.sub;

  try {
    // Get or create Powens user record
    let powensUser = await PowensUser.findOne({ user_id: userId });
    if (!powensUser) {
      const accessToken = await initUser();
      powensUser = await PowensUser.create({ user_id: userId, access_token: accessToken });
    }

    // Get a one-time code for the WebView
    const tempCode   = await getTempCode(powensUser.access_token);
    const webviewUrl = buildWebviewUrl(tempCode, CALLBACK_URL, userId);

    res.json({ webview_url: webviewUrl });
  } catch (err) {
    console.error('Connect init error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to initiate bank connection', detail: err.response?.data });
  }
});

// GET /powens/connect/callback
// Powens redirects the user's browser here after bank connection
router.get('/callback', async (req, res) => {
  const { connection_id, state, error, error_description } = req.query;

  if (error) {
    console.error('Powens callback error:', error, error_description);
    return res.send(redirectPage(`${FRONTEND_URL}/dashboard?error=${encodeURIComponent(error_description || error)}`));
  }

  if (!connection_id || !state) {
    return res.send(redirectPage(`${FRONTEND_URL}/dashboard?error=missing_params`));
  }

  try {
    // state = our user_id
    await PowensUser.findOneAndUpdate(
      { user_id: state },
      { $addToSet: { connection_ids: connection_id }, updated_at: new Date() }
    );

    res.send(redirectPage(`${FRONTEND_URL}/dashboard?connected=1`));
  } catch (err) {
    console.error('Callback error:', err.message);
    res.send(redirectPage(`${FRONTEND_URL}/dashboard?error=server_error`));
  }
});

module.exports = router;
