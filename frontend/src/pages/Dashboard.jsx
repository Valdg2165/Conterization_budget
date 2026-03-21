import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import authClient from '../api/authClient'
import powensClient from '../api/powensClient'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

const fmt = v => (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function Dashboard() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (searchParams.get('connected')) setBanner('ok:Bank connected successfully!')
    if (searchParams.get('error')) setBanner(`err:Connection error: ${searchParams.get('error')}`)
  }, [searchParams])

  useEffect(() => {
    authClient.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); navigate('/login') })
    powensClient.get('/api/powens/accounts')
      .then(({ data }) => { setConnected(data.connected); setAccounts(data.accounts || []) })
      .catch(() => {})
  }, [navigate])

  const connectBank = async () => {
    setConnecting(true)
    try {
      const { data } = await powensClient.get('/api/powens/init')
      window.location.href = data.webview_url
    } catch {
      setBanner('err:Failed to initiate bank connection.')
      setConnecting(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) return <div className="loading-page">Loading…</div>

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const isErr = banner.startsWith('err:')
  const bannerMsg = banner.replace(/^(ok|err):/, '')

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">BudgetApp</span>
        <nav className="app-nav">
          {connected && <>
            <Link to="/accounts">Accounts</Link>
            <Link to="/transactions">Transactions</Link>
          </>}
        </nav>
        <div className="app-header-actions">
          <button className="btn-icon" onClick={toggle} title="Toggle theme">
            {dark ? '☀' : '☾'}
          </button>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="app-main">
        {bannerMsg && (
          <div className={`banner ${isErr ? 'banner-err' : 'banner-ok'}`}>{bannerMsg}</div>
        )}

        {connected ? (
          <>
            <div className="hero-card">
              <p className="hero-label">Total portfolio</p>
              <p className="hero-value">{fmt(totalBalance)}</p>
              <p className="hero-sub">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
            </div>

            <div className="stat-grid">
              <div className="stat-card clickable" onClick={() => navigate('/accounts')}>
                <p className="stat-label">Accounts</p>
                <p className="stat-value">{accounts.length}</p>
              </div>
              <div className="stat-card clickable" onClick={() => navigate('/transactions')}>
                <p className="stat-label">Transactions</p>
                <p className="stat-value">View →</p>
              </div>
              <div className="stat-card clickable" onClick={() => navigate('/accounts')}>
                <p className="stat-label">Holdings</p>
                <p className="stat-value">View →</p>
              </div>
            </div>

            <div className="card card-pad">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member since</span>
                  <span className="info-value">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Bank status</span>
                  <span className="badge badge-green">Connected</span>
                </div>
              </div>
            </div>

            <div className="reconnect-row">
              <button className="btn-secondary" onClick={connectBank} disabled={connecting}>
                {connecting ? 'Opening Powens…' : '+ Add another account'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card card-pad">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member since</span>
                  <span className="info-value">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Bank status</span>
                  <span className="badge badge-gray">Not connected</span>
                </div>
              </div>
            </div>

            <div className="connect-card">
              <h3>Connect your bank</h3>
              <p>Link your accounts to see balances, transactions and investments in real time.</p>
              <p className="connect-hint">Demo: use <strong>Demo Institution</strong> — any username/password works.</p>
              <button className="btn-primary" onClick={connectBank} disabled={connecting}>
                {connecting ? 'Opening Powens…' : 'Connect a bank account'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
