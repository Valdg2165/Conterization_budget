import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import powensClient from '../api/powensClient'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

const INVESTMENT_TYPES = ['market', 'lifeinsurance', 'life-insurance', 'pea', 'per', 'madelin']

const fmt = (v, cur = 'EUR') =>
  (v ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: cur })

const fmtPct = v => {
  if (v === null || v === undefined) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)} %`
}

export default function AccountDetail() {
  const { id } = useParams()
  const { dark, toggle } = useTheme()
  const [searchParams] = useSearchParams()
  const accountName     = searchParams.get('name')    || 'Account'
  const accountType     = (searchParams.get('type')   || '').toLowerCase()
  const accountBalance  = parseFloat(searchParams.get('balance') || '0')
  const currency        = searchParams.get('currency') || 'EUR'

  const isInvestment = INVESTMENT_TYPES.includes(accountType)

  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const ep = isInvestment
      ? `/api/powens/accounts/${id}/investments`
      : `/api/powens/accounts/${id}/transactions`
    powensClient.get(ep)
      .then(({ data: res }) => setData(isInvestment ? res.investments : res.transactions))
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [id, isInvestment])

  const totalValuation = isInvestment
    ? data.reduce((s, inv) => s + (inv.valuation || 0), 0)
    : null

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">BudgetApp</span>
        <nav className="app-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/accounts">Accounts</Link>
          {!isInvestment && <Link to="/transactions">Transactions</Link>}
        </nav>
        <div className="app-header-actions">
          <button className="btn-icon" onClick={toggle} title="Toggle theme">
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* ── Hero ── */}
        <div className="detail-hero">
          <div>
            <p className="detail-type">{accountType || 'account'}</p>
            <h2 className="detail-name">{accountName}</h2>
          </div>
          <div>
            <p className="detail-balance-label">{isInvestment ? 'Portfolio value' : 'Balance'}</p>
            <p className="detail-balance-value">
              {fmt(isInvestment ? totalValuation : accountBalance, currency)}
            </p>
          </div>
        </div>

        {loading && <p className="loading-inline">Loading…</p>}
        {error   && <p className="err-box">{error}</p>}

        {/* ── Holdings table ── */}
        {!loading && !error && isInvestment && (
          <>
            <p className="section-heading">Portfolio holdings</p>
            {data.length === 0 ? (
              <p className="empty">No positions found for this account.</p>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th className="r">Qty</th>
                      <th className="r">Buy price</th>
                      <th className="r">Current</th>
                      <th className="r">Valuation</th>
                      <th className="r">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(inv => (
                      <tr key={inv.id}>
                        <td className="inv-name">{inv.label || '—'}</td>
                        <td><span className="inv-code">{inv.code || '—'}</span></td>
                        <td className="r">{inv.quantity ?? '—'}</td>
                        <td className="r">{inv.unitprice  != null ? fmt(inv.unitprice,  currency) : '—'}</td>
                        <td className="r">{inv.unitvalue  != null ? fmt(inv.unitvalue,  currency) : '—'}</td>
                        <td className="r bold">{fmt(inv.valuation, currency)}</td>
                        <td className="r">
                          <span className={inv._diffPct >= 0 ? 'perf-pos' : 'perf-neg'}>
                            {inv._diffPct !== null ? fmtPct(inv._diffPct) : '—'}
                          </span>
                          {inv._diffAbs !== null && (
                            <span className="perf-sub"> ({fmt(inv._diffAbs, currency)})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Transactions ── */}
        {!loading && !error && !isInvestment && (
          <>
            <p className="section-heading">Recent transactions</p>
            {data.length === 0 ? (
              <p className="empty">No transactions found for this account.</p>
            ) : (
              <div className="card">
                <div className="tx-list" style={{ padding: '0.5rem' }}>
                  {data.map(tx => {
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
                          {isPos ? '+' : ''}{fmt(amt, tx.original_currency?.id || currency)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
