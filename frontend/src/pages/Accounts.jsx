import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import powensClient from '../api/powensClient'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

// ── Mappings ────────────────────────────────────────────────────────────────
const TYPE_TO_CAT = {
  // Savings (compte courant)
  checking: 'savings', card: 'savings', deposit: 'savings', cat: 'savings',
  // Livrets
  savings: 'livret', livret: 'livret', pel: 'livret', cel: 'livret', csl: 'livret',
  ldds: 'livret', livret_a: 'livret', livret_b: 'livret',
  // Investment
  market: 'investment', lifeinsurance: 'investment', 'life-insurance': 'investment',
  pea: 'investment', per: 'investment', madelin: 'investment',
  'real-estate': 'investment', realestate: 'investment', real_estate: 'investment',
  crypto: 'investment', article83: 'investment',
  investment: 'investment', capitalisation: 'investment',
  perp: 'investment', perco: 'investment', perob: 'investment',
  fcpe: 'investment', bons: 'investment', tontine: 'investment',
  pee: 'investment', rsp: 'investment', crowdlending: 'investment',
}

const GROUPS = [
  { key: 'savings',    label: 'Savings',    color: '#3b82f6', icon: '🏦' },
  { key: 'livret',     label: 'Livrets',    color: '#10b981', icon: '💰' },
  { key: 'investment', label: 'Investment', color: '#8b5cf6', icon: '📈' },
  { key: 'other',      label: 'Other',      color: '#6b7280', icon: '💳' },
]

const TYPE_TO_ASSET = {
  checking: 'Cash', card: 'Cash', deposit: 'Cash', cat: 'Cash',
  savings: 'Livret', livret: 'Livret', pel: 'Livret', cel: 'Livret', csl: 'Livret',
  ldds: 'Livret', livret_a: 'Livret', livret_b: 'Livret',
  market: 'Bourse', pea: 'Bourse', investment: 'Bourse',
  pee: 'Bourse', rsp: 'Bourse', crowdlending: 'Bourse',
  lifeinsurance: 'Assurance Vie', 'life-insurance': 'Assurance Vie', capitalisation: 'Assurance Vie',
  per: 'Retraite', madelin: 'Retraite', article83: 'Retraite',
  perp: 'Retraite', perco: 'Retraite', perob: 'Retraite',
  fcpe: 'Retraite', bons: 'Retraite', tontine: 'Retraite',
  'real-estate': 'Immobilier', realestate: 'Immobilier', real_estate: 'Immobilier',
  crypto: 'Crypto',
}

const ASSET_COLORS = {
  Cash: '#3b82f6', Livret: '#10b981', Bourse: '#f59e0b',
  'Assurance Vie': '#8b5cf6', Retraite: '#ec4899',
  Immobilier: '#f97316', Crypto: '#06b6d4', Autre: '#6b7280',
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return null

  const cx = 90, cy = 90, r = 62, strokeW = 26
  const GAP = 0.03 // radians gap between segments
  let angle = -Math.PI / 2
  const fmtK = v => v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v.toFixed(0)}€`
  const fmtFull = v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  const paths = data.map(d => {
    const sweep = Math.max(0, (d.value / total) * 2 * Math.PI - GAP)
    if (sweep < 0.01) { angle += (d.value / total) * 2 * Math.PI; return null }
    const a1 = angle + GAP / 2
    const a2 = a1 + sweep
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    angle += (d.value / total) * 2 * Math.PI
    return (
      <path key={d.label}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2} ${y2}`}
        fill="none" stroke={d.color} strokeWidth={strokeW} strokeLinecap="round"
      />
    )
  })

  return (
    <div className="card chart-card">
      <p className="chart-title">Wealth breakdown</p>
      <div className="chart-body">
        <div className="donut-wrap">
          <svg viewBox="0 0 180 180" width={180} height={180}>
            {paths}
            <text x={cx} y={cy - 7} textAnchor="middle" className="donut-center-label">Total</text>
            <text x={cx} y={cy + 11} textAnchor="middle" className="donut-center-value">{fmtK(total)}</text>
          </svg>
        </div>
        <div className="chart-legend">
          {data.map(d => (
            <div key={d.label} className="legend-row">
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-name">{d.label}</span>
              <span className="legend-pct">{((d.value / total) * 100).toFixed(1)}%</span>
              <span className="legend-amt">{fmtFull(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Accounts() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    powensClient.get('/api/powens/accounts')
      .then(({ data }) => setAccounts(data.accounts || []))
      .finally(() => setLoading(false))
  }, [])

  const goTo = (acc) => {
    const p = new URLSearchParams({
      name: acc.name || 'Account', type: acc.type || '',
      balance: acc.balance ?? 0, currency: acc.currency?.id || 'EUR',
    })
    navigate(`/accounts/${acc.id}?${p}`)
  }

  // Group
  const grouped = Object.fromEntries(GROUPS.map(g => [g.key, []]))
  accounts.forEach(acc => {
    const cat = TYPE_TO_CAT[acc.type?.toLowerCase()] || 'other'
    grouped[cat].push(acc)
  })

  // Chart data
  const totals = {}
  accounts.forEach(acc => {
    if ((acc.balance ?? 0) <= 0) return
    const asset = TYPE_TO_ASSET[acc.type?.toLowerCase()] || 'Autre'
    totals[asset] = (totals[asset] || 0) + acc.balance
  })
  const chartData = Object.entries(totals)
    .map(([label, value]) => ({ label, value, color: ASSET_COLORS[label] || ASSET_COLORS.Autre }))
    .sort((a, b) => b.value - a.value)

  const fmt = (v, cur = 'EUR') => (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: cur })

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">BudgetApp</span>
        <nav className="app-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>Transactions</NavLink>
        </nav>
        <div className="app-header-actions">
          <button className="btn-icon" onClick={toggle} title="Toggle theme">
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-heading-row">
          <h1 className="page-heading">Accounts</h1>
        </div>

        {loading ? (
          <p className="loading-inline">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="empty">No accounts found. Connect a bank first.</p>
        ) : (
          <>
            <DonutChart data={chartData} />

            {GROUPS.filter(g => grouped[g.key].length > 0).map(g => (
              <div key={g.key} className="acc-group">
                <div className="acc-group-header">
                  <span className="acc-group-dot" style={{ background: g.color }} />
                  {g.label}
                </div>
                {grouped[g.key].map(acc => (
                  <div key={acc.id} className="acc-card" onClick={() => goTo(acc)}>
                    <div className="acc-card-icon" style={{ background: g.color + '1a' }}>
                      <span style={{ fontSize: '1.15rem' }}>{g.icon}</span>
                    </div>
                    <div className="acc-card-body">
                      <p className="acc-card-name">{acc.name || 'Account'}</p>
                      <p className="acc-card-sub">{acc.type}{acc.number ? ` · ${acc.number}` : ''}</p>
                    </div>
                    <div className="acc-card-right">
                      <p className="acc-card-balance">{fmt(acc.balance, acc.currency?.id || 'EUR')}</p>
                      <p className="acc-card-arrow">›</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
