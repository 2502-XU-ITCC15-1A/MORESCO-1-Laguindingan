import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import './NavBar.css'

const NAV_LINKS = [
  {
    label: 'Patients',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    active: true,
  },
  {
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Reports',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    setDrawerOpen(false)
    navigate('/login')
  }

  return (
    <>
      <nav className="nav-container">

        {/* LEFT — Logo + System Name */}
        <div className="nav-left">
          <div className="nav-logo-circle">
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="29" cy="29" r="28" fill="#0D2B77" stroke="#4a9fff" strokeWidth="1.5"/>
              <circle cx="29" cy="29" r="22" stroke="rgba(74,159,255,0.4)" strokeWidth="1" fill="none"/>
              <text x="29" y="36" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">M1</text>
            </svg>
          </div>
          <div className="nav-system-name">
            <h1>Moresco 1</h1>
            <p>Employee Health Record System</p>
          </div>
        </div>

        {/* CENTER — Clickable Page Title Badge */}
        <div className="nav-center">
          <button
            className="nav-page-badge"
            onClick={() => setDrawerOpen(true)}
            title="Open navigation menu"
          >
            Patients
          </button>
        </div>

        {/* RIGHT — User Profile */}
        <div className="nav-end">
          <div className="nav-profile">
            <span className="nav-profile-name">Andrei Valdez</span>
            <span className="nav-profile-role">CEO of Nursing</span>
          </div>
        </div>

      </nav>

      {/* ── MUI Right-Side Drawer ───────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: 'nav-drawer-paper' }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-logo-row">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="18" fill="#0D2B77" stroke="#4a9fff" strokeWidth="1.2"/>
              <text x="19" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">M1</text>
            </svg>
            <div>
              <p className="drawer-sys-name">Moresco 1</p>
              <p className="drawer-sys-sub">Employee Health Record System</p>
            </div>
          </div>
          {/* Exit / Close Button */}
          <IconButton
            onClick={() => setDrawerOpen(false)}
            className="drawer-close-btn"
            aria-label="Close drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </IconButton>
        </div>

        <div className="drawer-divider" />

        {/* Nav Links */}
        <nav className="drawer-nav">
          {NAV_LINKS.map(link => (
            <button
              key={link.label}
              className={`drawer-nav-item ${link.active ? 'active' : ''}`}
              onClick={() => setDrawerOpen(false)}
            >
              <span className="drawer-nav-icon">{link.icon}</span>
              <span className="drawer-nav-label">{link.label}</span>
              {link.active && <span className="drawer-active-dot" />}
            </button>
          ))}
        </nav>

        {/* Bottom — User Info + Logout */}
        <div className="drawer-footer">
          <div className="drawer-divider" />
          <div className="drawer-user">
            <div className="drawer-user-avatar">AV</div>
            <div className="drawer-user-info">
              <span className="drawer-user-name">Andrei Valdez</span>
              <span className="drawer-user-role">CEO of Nursing</span>
            </div>
          </div>
          <button className="drawer-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>

      </Drawer>
    </>
  )
}

export default NavBar
