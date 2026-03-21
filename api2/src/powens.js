const axios = require('axios');

const BASE_URL  = process.env.POWENS_BASE_URL;   // https://demo.biapi.pro/2.0
const CLIENT_ID = process.env.POWENS_CLIENT_ID;
const SECRET    = process.env.POWENS_CLIENT_SECRET;

// Extract domain from base URL: "demo.biapi.pro" → "demo"
const DOMAIN = new URL(BASE_URL).hostname.split('.')[0];

// WebView base URL (new Powens format)
const WEBVIEW_BASE = process.env.POWENS_WEBVIEW_URL || 'https://webview.powens.com/connect';

/**
 * Step 1 — Create a permanent Powens access token for a new user.
 * POST /auth/init  →  { auth_token }
 */
async function initUser() {
  const { data } = await axios.post(`${BASE_URL}/auth/init`, {
    client_id: CLIENT_ID,
    client_secret: SECRET,
  });
  return data.auth_token;
}

/**
 * Step 2 — Exchange permanent token for a one-time code used in the WebView URL.
 * GET /auth/token/code  →  { code }
 */
async function getTempCode(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/auth/token/code`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.code;
}

/**
 * Build the WebView URL the frontend should redirect the user to.
 */
function buildWebviewUrl(tempCode, redirectUri, state) {
  const url = new URL(WEBVIEW_BASE);
  url.searchParams.set('domain', DOMAIN);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', tempCode);
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

/**
 * GET /users/me/accounts
 */
async function getAccounts(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/users/me/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.accounts || [];
}

/**
 * GET /users/me/transactions?limit=50
 */
async function getTransactions(accessToken, limit = 50) {
  const { data } = await axios.get(`${BASE_URL}/users/me/transactions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });
  return data.transactions || [];
}

/**
 * GET /users/me/investments
 */
async function getInvestments(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/users/me/investments`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.investments || [];
}

/**
 * GET /users/me/accounts/{id}/transactions?limit=20
 */
async function getAccountTransactions(accessToken, accountId, limit = 20) {
  const { data } = await axios.get(`${BASE_URL}/users/me/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });
  return data.transactions || [];
}

/**
 * GET /users/me/investments  (filtered by account id)
 * Powens does not have a per-account investments endpoint — filter client-side.
 */
async function getAccountInvestments(accessToken, accountId) {
  const { data } = await axios.get(`${BASE_URL}/users/me/investments`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const all = data.investments || [];
  return all.filter(inv => String(inv.id_account) === String(accountId));
}

module.exports = {
  initUser, getTempCode, buildWebviewUrl,
  getAccounts, getTransactions, getInvestments,
  getAccountTransactions, getAccountInvestments,
};
