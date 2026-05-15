import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { recordsAPI } from '../../api/client.js'
import { canAccessPatients, canManageUserAccess, canViewDiseaseStats, roleLabel } from '../../utils/roles.js'
import morescoLogo from '../../assets/logo.png'
import './NavBar.css'

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    return {}
  }
}

function NavBar({ showDrawer = true }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [statsStartMonth, setStatsStartMonth] = useState('')
  const [statsEndMonth, setStatsEndMonth] = useState('')
  const [stats, setStats] = useState({ total: 0, stats: [] })
  const [statsError, setStatsError] = useState('')
  const profileMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const displayName = 'Moresco-1'
  const displayRole = roleLabel(user.role)
  const hasPatientsAccess = canAccessPatients(user.role)
  const hasUserAccessTab = canManageUserAccess(user.role)
  const canSeeDiseaseStats = canViewDiseaseStats(user.role)
  const onPatientsPage = location.pathname === '/patients'
  const onUserAccessPage = location.pathname === '/user-access'
  const initials = displayName.split(/[.\s]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'M'

  useEffect(() => {
    if (!drawerOpen) return
    let active = true

    async function loadStats() {
      setStatsError('')
      try {
        const filters = {}
        if (statsStartMonth) filters.startMonth = statsStartMonth
        if (statsEndMonth) filters.endMonth = statsEndMonth
        const data = await recordsAPI.getDiseaseStats(filters)
        if (active) setStats(data)
      } catch (err) {
        if (active) setStatsError(err.message || 'Unable to load disease stats.')
      }
    }

    loadStats()
    return () => { active = false }
  }, [drawerOpen, statsStartMonth, statsEndMonth])

  useEffect(() => {
    if (!profileMenuOpen) return

    function handleClickOutside(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setProfileMenuOpen(false)
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
            <p>Employee Health Information Tracking and Management System</p>
          </div>
        </div>

        <div className="nav-center">
          {hasPatientsAccess && hasUserAccessTab ? (
            <div className="nav-tab-group" aria-label="System pages">
              <button
                className={`nav-page-badge ${onPatientsPage ? 'active' : ''}`}
                onClick={() => navigate('/patients')}
                title="Go to patients page"
                type="button"
              >
                Patients
              </button>
              <button
                className={`nav-page-badge ${onUserAccessPage ? 'active' : ''}`}
                onClick={() => navigate('/user-access')}
                title="Open user access management"
                type="button"
              >
                User Access
              </button>
            </div>
          ) : hasPatientsAccess ? (
            <button
              className={`nav-page-badge ${onPatientsPage ? 'active' : ''}`}
              onClick={() => navigate('/patients')}
              title="Go to patients page"
              type="button"
            >
              Patients
            </button>
          ) : hasUserAccessTab ? (
            <button
              className={`nav-page-badge ${onUserAccessPage ? 'active' : ''}`}
              onClick={() => navigate('/user-access')}
              title="Open user access management"
              type="button"
            >
              User Access
            </button>
          ) : (
            <button
              className="nav-page-badge"
              onClick={() => navigate('/patients')}
              title="Go to patients page"
              type="button"
            >
              Back
            </button>
          )}
        </div>

        <div className="nav-end" ref={profileMenuRef}>
          <button
            className={`nav-profile ${profileMenuOpen ? 'active' : ''}`}
            onClick={() => setProfileMenuOpen(open => !open)}
            title="Open profile menu"
            type="button"
            aria-expanded={profileMenuOpen}
          >
            <span className="nav-profile-name">{displayName}</span>
            <span className="nav-profile-role">{displayRole}</span>
          </button>

          {profileMenuOpen && (
            <div className="nav-profile-menu">
              <div className="nav-profile-menu-card">
                <div className="nav-profile-menu-head">
                  <div className="nav-profile-menu-avatar">{initials}</div>
                  <div className="nav-profile-menu-user">
                    <strong>{displayName}</strong>
                    <span>{displayRole}</span>
                  </div>
                </div>

                <div className="nav-profile-menu-divider" />

                {showDrawer && canSeeDiseaseStats && (
                  <button
                    className="nav-profile-menu-item"
                    onClick={() => {
                      setDrawerOpen(true)
                      setProfileMenuOpen(false)
                    }}
                    type="button"
                  >
                    Common Disease Stats
                  </button>
                )}

                <button className="nav-profile-menu-item logout" onClick={handleLogout} type="button">
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {showDrawer && canSeeDiseaseStats && (
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
                <p className="drawer-sys-sub">Employee Health Information Tracking and Management System</p>
              </div>
            </div>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              className="drawer-close-btn"
              aria-label="Close drawer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </IconButton>
          </div>

          <div className="drawer-content">
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
              </div>

              <div className="drawer-stats-filters">
                <label>
                  <span>Start month</span>
                  <input
                    type="month"
                    value={statsStartMonth}
                    onChange={e => setStatsStartMonth(e.target.value)}
                  />
                </label>
                <label>
                  <span>End month</span>
                  <input
                    type="month"
                    value={statsEndMonth}
                    onChange={e => setStatsEndMonth(e.target.value)}
                  />
                </label>
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
          </div>
        </Drawer>
      )}
    </>
  )
}

export default NavBar
