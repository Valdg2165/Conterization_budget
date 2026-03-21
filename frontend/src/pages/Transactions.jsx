import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import powensClient from '../api/powensClient'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

export default function Transactions() {
  const { dark, toggle } = useTheme()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    powensClient.get('/api/powens/transactions?limit=50')
      .then(({ data }) => setTransactions(data.transactions || []))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v, cur = 'EUR') =>
    (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: cur })

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">BudgetApp</span>
        <nav className="app-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/accounts">Accounts</Link>
        </nav>
        <div className="app-header-actions">
          <button className="btn-icon" onClick={toggle} title="Toggle theme">
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-heading-row">
          <h1 className="page-heading">Transactions</h1>
          {!loading && <span className="page-count">{transactions.length} entries</span>}
        </div>

        {loading ? (
          <p className="loading-inline">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="empty">No transactions found.</p>
        ) : (
          <div className="card">
            <div className="tx-list" style={{ padding: '0.5rem' }}>
              {transactions.map(tx => {
                const amt = tx.value || 0
                const isPos = amt >= 0
                return (
                  <div key={tx.id} className="tx-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="tx-label">
                        {tx.simplified_wording || tx.original_wording || 'Transaction'}
                      </p>
                      <p className="tx-sub">
                        {tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : ''}
                        {tx.category ? ` · ${tx.category}` : ''}
                      </p>
                    </div>
                    <p className={`tx-amount ${isPos ? 'tx-pos' : 'tx-neg'}`}>
                      {isPos ? '+' : ''}{fmt(amt, tx.original_currency?.id || 'EUR')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
