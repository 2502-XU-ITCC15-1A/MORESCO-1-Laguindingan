import NavBar from '../../components/NavBar/NavBar.jsx'
import PatientGrid from '../../components/PatientsGrid/PatientGrid.jsx'

function Patients() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <NavBar />
      <PatientGrid />
    </div>
  )
}

export default Patients
