import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import powensClient from '../api/powensClient'

export default function Investments() {
  const navigate = useNavigate()
  const [investments, setInvestments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      powensClient.get('/api/powens/investments'),
      powensClient.get('/api/powens/accounts'),
    ]).then(([invRes, accRes]) => {
      setInvestments(invRes.data.investments || [])
      setAccounts(accRes.data.accounts || [])
    }).finally(() => setLoading(false))
  }, [])

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  const goToAccount = (inv) => {
    const acc = accountMap[inv.id_account]
    if (!acc) return
    const params = new URLSearchParams({
      name:     acc.name || 'Investment account',
      type:     acc.type || 'market',
      balance:  acc.balance ?? 0,
      currency: acc.currency?.id || 'EUR',
    })
    navigate(`/accounts/${acc.id}?${params}`)
  }

  const totalValuation = investments.reduce((sum, inv) => sum + (inv.valuation || 0), 0)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>BudgetApp</h1>
        <nav className="dashboard-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/accounts">Accounts</Link>
          <Link to="/transactions">Transactions</Link>
        </nav>
      </header>
      <main className="dashboard-main">
        <h2 className="page-title">Investments</h2>
        {loading ? <div className="loading">Loading…</div> : (
          investments.length === 0
            ? <p className="empty">No investments found. Connect a wealth account to see your portfolio.</p>
            : <>
                <div className="stat-card wide">
                  <p className="stat-label">Total portfolio value</p>
                  <p className="stat-value">
                    {totalValuation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="list">
                  {investments.map(inv => {
                    const acc = accountMap[inv.id_account]
                    return (
                      <div
                        key={inv.id}
                        className={`list-card ${acc ? 'clickable' : ''}`}
                        onClick={() => acc && goToAccount(inv)}
                        title={acc ? `View account: ${acc.name}` : ''}
                      >
                        <div className="list-card-left">
                          <p className="list-card-title">{inv.label || inv.code || 'Investment'}</p>
                          <p className="list-card-sub">
                            {inv.code && `${inv.code} · `}
                            {inv.quantity != null && `${inv.quantity} units`}
                            {inv.unitvalue != null && ` @ ${inv.unitvalue.toFixed(2)}`}
                            {acc && ` · ${acc.name}`}
                          </p>
                        </div>
                        <div className="list-card-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <p className="list-card-amount positive">
                            {(inv.valuation || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                          {acc && <span className="arrow-icon">›</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
        )}
      </main>
    </div>
  )
}
