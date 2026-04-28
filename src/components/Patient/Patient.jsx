import { useState } from 'react'
import PatientInfo from '../MODALS/PatientInfo/PatientInfo.jsx'
import './Patient.css'

function Patient({ patient }) {
  const [showInfo, setShowInfo] = useState(false)

  const displayName = `${patient.firstName} ${patient.lastName}`

  return (
    <>
      <div className="patient-card" onClick={() => setShowInfo(true)}>
        {/* Avatar */}
        <div className="patient-avatar">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
            <circle cx="40" cy="28" r="18" fill="rgba(255,255,255,0.85)"/>
            <ellipse cx="40" cy="72" rx="28" ry="20" fill="rgba(255,255,255,0.85)"/>
          </svg>
        </div>

        {/* Patient Info */}
        <div className="patient-card-info">
          <p className="patient-card-name">{displayName}</p>
          <p className="patient-card-id">{patient.idNumber}</p>
          <p className="patient-card-position">{patient.position}</p>
        </div>
      </div>

      <PatientInfo
        show={showInfo}
        onClose={() => setShowInfo(false)}
        patient={patient}
      />
    </>
  )
}

export default Patient
