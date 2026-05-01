import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { recordsAPI } from '../../api/client.js'
import morescoLogo from '../../assets/logo.png'
import './NavBar.css'

const MONTHS = [
  { value: '', label: 'All months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    return {}
  }
}

function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState('stats')
  const [statsMonth, setStatsMonth] = useState('')
  const [stats, setStats] = useState({ total: 0, stats: [] })
  const [statsError, setStatsError] = useState('')
  const navigate = useNavigate()
  const user = getCurrentUser()
  const displayName = user.username === 'admin' ? 'Administrator' : user.username || 'Andrei Valdez'
  const initials = displayName.split(/[.\s]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AV'

  useEffect(() => {
    if (!drawerOpen) return
    let active = true

    async function loadStats() {
      setStatsError('')
      try {
        const data = await recordsAPI.getDiseaseStats({ month: statsMonth })
        if (active) setStats(data)
      } catch (err) {
        if (active) setStatsError(err.message || 'Unable to load disease stats.')
      }
    }

    loadStats()
    return () => { active = false }
  }, [drawerOpen, statsMonth])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setDrawerOpen(false)
    navigate('/login')
  }

  return (
    <>
      <nav className="nav-container">
        <div className="nav-left">
          <div className="nav-logo-circle">
            <img src={morescoLogo} alt="MORESCO-1" />
          </div>
          <div className="nav-system-name">
            <h1>Moresco 1</h1>
            <p>Employee Health Record System</p>
          </div>
        </div>

        <div className="nav-center">
          <button
            className="nav-page-badge"
            onClick={() => setDrawerOpen(true)}
            title="Open dashboard drawer"
          >
            Patients
          </button>
        </div>

        <div className="nav-end">
          <button className="nav-profile" onClick={() => setDrawerOpen(true)} title="Open profile and stats">
            <span className="nav-profile-name">{displayName}</span>
            <span className="nav-profile-role">{user.role || 'CEO of Nursing'}</span>
          </button>
        </div>
      </nav>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: 'nav-drawer-paper' }}
      >
        <div className="drawer-header">
          <div className="drawer-logo-row">
            <img src={morescoLogo} alt="MORESCO-1" className="drawer-logo-img" />
            <div>
              <p className="drawer-sys-name">Moresco 1</p>
              <p className="drawer-sys-sub">Employee Health Record System</p>
            </div>
          </div>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            className="drawer-close-btn"
            aria-label="Close drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </IconButton>
        </div>

        <div className="drawer-tabs">
          <button className={drawerTab === 'stats' ? 'active' : ''} onClick={() => setDrawerTab('stats')}>Stats</button>
          <button className={drawerTab === 'profile' ? 'active' : ''} onClick={() => setDrawerTab('profile')}>Profile</button>
        </div>

        <div className="drawer-content">
          {drawerTab === 'stats' && (
            <>
          <button className="drawer-nav-item active" onClick={() => setDrawerOpen(false)}>
            <span className="drawer-nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span className="drawer-nav-label">Patients</span>
            <span className="drawer-active-dot" />
          </button>

          <section className="drawer-stats">
            <div className="drawer-stats-head">
              <div>
                <h2>Common Diseases</h2>
                <p>{stats.total} record{stats.total === 1 ? '' : 's'} counted</p>
              </div>
              <select value={statsMonth} onChange={e => setStatsMonth(e.target.value)}>
                {MONTHS.map(month => (
                  <option key={month.value || 'all'} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div className="drawer-stats-list">
              {statsError && <div className="drawer-stats-empty">{statsError}</div>}
              {!statsError && stats.stats.length === 0 && (
                <div className="drawer-stats-empty">No diagnosis data for this filter.</div>
              )}
              {!statsError && stats.stats.map(item => (
                <div className="drawer-stat-row" key={item.name}>
                  <div className="drawer-stat-meta">
                    <span>{item.name}</span>
                    <strong>{item.percentage}%</strong>
                  </div>
                  <div className="drawer-stat-bar">
                    <span style={{ width: `${Math.max(item.percentage, 4)}%` }} />
                  </div>
                  <small>{item.count} case{item.count === 1 ? '' : 's'}</small>
                </div>
              ))}
            </div>
          </section>
            </>
          )}

          {drawerTab === 'profile' && (
            <section className="drawer-profile-tab">
              <div className="drawer-user-avatar large">{initials}</div>
              <h2>{displayName}</h2>
              <p>{user.role || 'CEO of Nursing'}</p>
              <button className="drawer-logout-btn standalone" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </section>
          )}
        </div>
      </Drawer>
    </>
  )
}

export default NavBar
