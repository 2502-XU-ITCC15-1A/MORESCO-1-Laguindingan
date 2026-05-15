import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar.jsx'
import PatientGrid from '../../components/PatientsGrid/PatientGrid.jsx'
import { canAccessPatients, canManageUserAccess } from '../../utils/roles.js'

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function Patients() {
  const user = getCurrentUser()

  if (!canAccessPatients(user.role)) {
    return <Navigate to={canManageUserAccess(user.role) ? '/user-access' : '/login'} replace />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <NavBar showDrawer />
      <PatientGrid />
    </div>
  )
}

export default Patients
