import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar.jsx'
import { getDefaultRoute, roleLabel } from '../../utils/roles.js'
import './Profile.css'

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function Profile() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const displayName = 'Moresco-1'
  const displayRole = roleLabel(user.role)
  const initials = displayName
    .split(/[.\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'PR'

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="profile-page-shell">
      <NavBar showDrawer={false} />
      <main className="profile-page">
        <section className="profile-card-page">
          <div className="profile-avatar-page">{initials}</div>
          <div className="profile-copy-page">
            <p className="profile-eyebrow-page">Account Profile</p>
            <h1>{displayName}</h1>
            <p>{displayRole}</p>
          </div>

          <div className="profile-actions-page">
            <button type="button" className="profile-primary-page" onClick={() => navigate(getDefaultRoute(user.role))}>
              {getDefaultRoute(user.role) === '/user-access' ? 'Back to User Access' : 'Back to Patients'}
            </button>
            <button type="button" className="profile-danger-page" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Profile
