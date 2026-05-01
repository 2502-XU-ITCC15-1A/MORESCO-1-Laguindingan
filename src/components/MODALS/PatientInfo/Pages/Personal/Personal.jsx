import './Personal.css'

function calculateBMI(height, weight) {
  if (!height || !weight) return null

  const rawWeight = String(weight).toLowerCase()
  const weightValue = parseFloat(rawWeight.replace(/[^0-9.]/g, ''))
  const weightKg = rawWeight.includes('lb') ? weightValue * 0.45359237 : weightValue
  if (isNaN(weightKg) || weightKg <= 0) return null

  const feetInch = height.match(/(\d+)'(\d+)/)
  if (feetInch) {
    const totalInches = parseInt(feetInch[1]) * 12 + parseInt(feetInch[2])
    const heightM = totalInches * 0.0254
    return (weightKg / (heightM * heightM)).toFixed(1)
  }

  const cm = height.match(/(\d+(?:\.\d+)?)\s*cm?/i)
  if (cm) {
    const heightM = parseFloat(cm[1]) / 100
    return (weightKg / (heightM * heightM)).toFixed(1)
  }

  return null
}

function getBMIStatus(bmi) {
  const b = parseFloat(bmi)
  if (isNaN(b)) return null
  if (b < 18.5) return { label: 'Underweight', color: '#3b82f6' }
  if (b < 25)   return { label: 'Normal',       color: '#16a34a' }
  if (b < 30)   return { label: 'Overweight',   color: '#f59e0b' }
  return               { label: 'Obese',         color: '#ef4444' }
}

function InfoBox({ label, value, badge }) {
  return (
    <div className="info-box">
      <span className="info-box-label">{label}</span>
      <div className="info-box-value-row">
        <span className="info-box-value">{value || '—'}</span>
        {badge && (
          <span className="info-box-badge" style={{ background: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
    </div>
  )
}

function Personal({ patient, age }) {
  if (!patient) return null

  // Always auto-calculate BMI from height + weight
  const computedBMI = calculateBMI(patient.height, patient.weight)
  const bmiStatus   = computedBMI ? getBMIStatus(computedBMI) : null

  return (
    <div className="personal-container">

      {/* Personal Information */}
      <div className="personal-section">
        <h4 className="personal-section-title">Personal Information</h4>

        <div className="info-grid info-three">
          <InfoBox label="First Name"  value={patient.firstName} />
          <InfoBox label="Middle Name" value={patient.middleName || '—'} />
          <InfoBox label="Last Name"   value={patient.lastName} />
        </div>

        <div className="info-grid info-three">
          <InfoBox label="Birth Date"  value={patient.birthDate} />
          <InfoBox label="Age"         value={age !== null ? age : '—'} />
          <InfoBox label="Sex"         value={patient.sex} />
        </div>

        <div className="info-grid info-one">
          <InfoBox label="Status"      value={patient.status} />
        </div>

        <div className="info-grid info-three">
          <InfoBox label="Height" value={patient.height} />
          <InfoBox label="Weight" value={patient.weight} />
          <InfoBox
            label="BMI"
            value={computedBMI ?? '—'}
            badge={bmiStatus}
          />
        </div>
      </div>

      {/* Address */}
      <div className="personal-section">
        <h4 className="personal-section-title">Address</h4>
        <div className="addr-box">
          <span className="addr-box-label">Permanent Address</span>
          <span className="addr-box-value">{patient.permAddress || '—'}</span>
        </div>
        <div className="addr-box">
          <span className="addr-box-label">Present Address</span>
          <span className="addr-box-value">{patient.presAddress || '—'}</span>
        </div>
      </div>

    </div>
  )
}

export default Personal
