import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar.jsx'
import { getStoredUser } from '../../utils/authStorage.js'
import PatientGrid from '../../components/PatientsGrid/PatientGrid.jsx'
import { canAccessPatients, canManageUserAccess } from '../../utils/roles.js'

function Patients() {
  const user = getStoredUser()

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
