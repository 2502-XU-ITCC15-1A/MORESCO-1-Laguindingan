import { useState } from 'react'
import {
  calculateAgeFromBirthDate,
  calculateBMIFromHeightAndWeight,
  formatWeight,
  getBMIBadge,
  HEIGHT_OPTIONS,
  parseWeight,
  WEIGHT_UNIT_OPTIONS,
} from '../../../../../utils/measurements.js'
import './Personal.css'

const PHONE_LENGTH = 11

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function birthDateFromAge(ageValue, currentBirthDate) {
  const numericAge = Number(ageValue)
  if (!Number.isFinite(numericAge) || numericAge < 0) return currentBirthDate || ''

  const today = new Date()
  const existingBirthDate = currentBirthDate ? new Date(currentBirthDate) : null
  const hasExistingBirthDate = existingBirthDate && !Number.isNaN(existingBirthDate.getTime())

  const month = hasExistingBirthDate ? existingBirthDate.getMonth() : today.getMonth()
  const day = hasExistingBirthDate ? existingBirthDate.getDate() : today.getDate()

  let year = today.getFullYear() - Math.trunc(numericAge)
  const birthdayAlreadyPassed =
    month < today.getMonth() || (month === today.getMonth() && day <= today.getDate())

  if (!birthdayAlreadyPassed) {
    year -= 1
  }

  const candidate = new Date(year, month, day)
  while (candidate.getMonth() !== month) {
    candidate.setDate(candidate.getDate() - 1)
  }

  return `${candidate.getFullYear()}-${padNumber(candidate.getMonth() + 1)}-${padNumber(candidate.getDate())}`
}

function InfoBox({ label, value, badge }) {
  return (
    <div className="info-box">
      <span className="info-box-label">{label}</span>
      <div className="info-box-value-row">
        <span className="info-box-value">{value || '-'}</span>
        {badge && (
          <span className="info-box-badge" style={{ background: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
    </div>
  )
}

function PersonalField({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  inputMode,
  maxLength,
}) {
  const Component = multiline ? 'textarea' : 'input'

  return (
    <label className="personal-edit-field">
      <span className="personal-edit-label">{label}</span>
      <Component
        className="personal-edit-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        type={multiline ? undefined : type}
        rows={multiline ? 3 : undefined}
        inputMode={multiline ? undefined : inputMode}
        maxLength={multiline ? undefined : maxLength}
      />
    </label>
  )
}

function PersonalSelect({ label, value, onChange, options }) {
  return (
    <label className="personal-edit-field">
      <span className="personal-edit-label">{label}</span>
      <select
        className="personal-edit-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

const SEX_OPTIONS = ['Male', 'Female']
const STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated']

function buildForm(patient) {
  const parsedWeight = parseWeight(patient?.weight)

  return {
    idNumber: patient?.idNumber || '',
    firstName: patient?.firstName || '',
    middleName: patient?.middleName || '',
    lastName: patient?.lastName || '',
    birthDate: patient?.birthDate || '',
    age: String(calculateAgeFromBirthDate(patient?.birthDate) ?? ''),
    position: patient?.position || '',
    sex: patient?.sex || 'Male',
    status: patient?.status || 'Single',
    emergencyContact: patient?.emergencyContact || '',
    contactNumber: patient?.contactNumber || '',
    height: patient?.height || '',
    weightValue: parsedWeight.value,
    weightUnit: parsedWeight.unit,
    permAddress: patient?.permAddress || '',
    presAddress: patient?.presAddress || '',
  }
}

function sanitizeDigits(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, PHONE_LENGTH)
}

function Personal({ patient, age, onUpdate, canEdit = false, canEditMeasurements = false }) {
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => buildForm(patient))

  if (!patient) return null

  const measurementWeight = editMode
    ? formatWeight(form.weightValue, form.weightUnit)
    : patient.weight
  const parsedMeasurementWeight = parseWeight(measurementWeight)
  const computedBMI = calculateBMIFromHeightAndWeight(
    editMode ? form.height : patient.height,
    parsedMeasurementWeight.value,
    parsedMeasurementWeight.unit,
  )
  const bmiStatus = getBMIBadge({ bmi: computedBMI })

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
  }

  function handleBirthDateChange(value) {
    setForm(current => ({
      ...current,
      birthDate: value,
      age: String(calculateAgeFromBirthDate(value) ?? ''),
    }))
    setError('')
  }

  function handleAgeChange(value) {
    if (value !== '' && !/^\d+$/.test(value)) return

    setForm(current => (
      value === ''
        ? { ...current, age: '' }
        : {
            ...current,
            age: value,
            birthDate: birthDateFromAge(value, current.birthDate),
          }
    ))
    setError('')
  }

  function handleCancel() {
    setForm(buildForm(patient))
    setEditMode(false)
    setError('')
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || form.age === '') {
      setError('First name, last name, birth date, and age are required.')
      return
    }

    if (!form.idNumber.trim()) {
      setError('Patient ID is required.')
      return
    }

    if (form.emergencyContact && form.emergencyContact.length !== PHONE_LENGTH) {
      setError('Emergency contact must be exactly 11 digits.')
      return
    }

    if (form.contactNumber && form.contactNumber.length !== PHONE_LENGTH) {
      setError('Contact number must be exactly 11 digits.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onUpdate?.({
        ...form,
        idNumber: form.idNumber.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        position: form.position.trim(),
        emergencyContact: form.emergencyContact.trim(),
        contactNumber: form.contactNumber.trim(),
        weight: formatWeight(form.weightValue, form.weightUnit),
      })
      setEditMode(false)
    } catch (err) {
      setError(err.message || 'Unable to save personal information.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="personal-container">
      <div className="personal-section">
        <div className="personal-section-header">
          <h4 className="personal-section-title">Personal Information</h4>
          <div className="personal-header-btns">
            {editMode ? (
              <>
                <button className="personal-cancel-btn" onClick={handleCancel} type="button">
                  Cancel
                </button>
                <button className="personal-save-btn" onClick={handleSave} disabled={saving} type="button">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : canEdit && (
              <button
                className="personal-edit-btn"
                onClick={() => {
                  setForm(buildForm(patient))
                  setEditMode(true)
                  setError('')
                }}
                type="button"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {error && <div className="personal-error">{error}</div>}

        {editMode ? (
          <>
            <div className="info-grid info-one">
              <PersonalField label="Patient ID" value={form.idNumber} onChange={value => updateField('idNumber', value)} />
            </div>

            <div className="info-grid info-three">
              <PersonalField label="First Name" value={form.firstName} onChange={value => updateField('firstName', value)} />
              <PersonalField label="Middle Name" value={form.middleName} onChange={value => updateField('middleName', value)} />
              <PersonalField label="Last Name" value={form.lastName} onChange={value => updateField('lastName', value)} />
            </div>

            <div className="info-grid info-three">
              <PersonalField label="Birth Date" value={form.birthDate} onChange={handleBirthDateChange} type="date" />
              <PersonalField label="Age" value={form.age} onChange={handleAgeChange} type="number" />
              <PersonalSelect label="Sex" value={form.sex} onChange={value => updateField('sex', value)} options={SEX_OPTIONS} />
            </div>

            <div className="info-grid info-two">
              <PersonalField label="Position" value={form.position} onChange={value => updateField('position', value)} />
              <PersonalSelect label="Status" value={form.status} onChange={value => updateField('status', value)} options={STATUS_OPTIONS} />
            </div>

            <div className="info-grid info-two">
              <PersonalField
                label="Emergency Contact"
                value={form.emergencyContact}
                onChange={value => updateField('emergencyContact', sanitizeDigits(value))}
                type="text"
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
              />
              <PersonalField
                label="Contact Number"
                value={form.contactNumber}
                onChange={value => updateField('contactNumber', sanitizeDigits(value))}
                type="text"
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
              />
            </div>
          </>
        ) : (
          <>
            <div className="info-grid info-one">
              <InfoBox label="Patient ID" value={patient.idNumber || '-'} />
            </div>

            <div className="info-grid info-three">
              <InfoBox label="First Name" value={patient.firstName} />
              <InfoBox label="Middle Name" value={patient.middleName || '-'} />
              <InfoBox label="Last Name" value={patient.lastName} />
            </div>

            <div className="info-grid info-three">
              <InfoBox label="Birth Date" value={patient.birthDate} />
              <InfoBox label="Age" value={age !== null ? age : '-'} />
              <InfoBox label="Sex" value={patient.sex} />
            </div>

            <div className="info-grid info-two">
              <InfoBox label="Position" value={patient.position} />
              <InfoBox label="Status" value={patient.status} />
            </div>
            <div className="info-grid info-two">
              <InfoBox label="Emergency Contact" value={patient.emergencyContact} />
              <InfoBox label="Contact Number" value={patient.contactNumber} />
            </div>
          </>
        )}
      </div>

      <div className="personal-section">
        <h4 className="personal-section-title">Measurements</h4>
        {editMode && canEditMeasurements ? (
          <div className="info-grid personal-measurements-grid">
            <label className="personal-edit-field">
              <span className="personal-edit-label">Height</span>
              <select
                className="personal-edit-input"
                value={form.height}
                onChange={e => updateField('height', e.target.value)}
              >
                <option value="">Select height</option>
                {HEIGHT_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="personal-edit-field">
              <span className="personal-edit-label">Weight</span>
              <div className="personal-weight-row">
                <input
                  className="personal-edit-input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={form.weightValue}
                  onChange={e => updateField('weightValue', e.target.value)}
                />
                <select
                  className="personal-edit-input"
                  value={form.weightUnit}
                  onChange={e => updateField('weightUnit', e.target.value)}
                >
                  {WEIGHT_UNIT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <div className="personal-measurements-bmi">
              <InfoBox label="BMI (Auto)" value={computedBMI ?? '-'} badge={bmiStatus} />
            </div>
          </div>
        ) : (
          <div className="info-grid info-three">
            <InfoBox label="Height" value={patient.height} />
            <InfoBox label="Weight" value={patient.weight} />
            <InfoBox label="BMI (Auto)" value={computedBMI ?? '-'} badge={bmiStatus} />
          </div>
        )}
      </div>

      <div className="personal-section">
        <h4 className="personal-section-title">Address</h4>
        {editMode ? (
          <>
            <PersonalField label="Permanent Address" value={form.permAddress} onChange={value => updateField('permAddress', value)} multiline />
            <PersonalField label="Present Address" value={form.presAddress} onChange={value => updateField('presAddress', value)} multiline />
          </>
        ) : (
          <>
            <div className="addr-box">
              <span className="addr-box-label">Permanent Address</span>
              <span className="addr-box-value">{patient.permAddress || '-'}</span>
            </div>
            <div className="addr-box">
              <span className="addr-box-label">Present Address</span>
              <span className="addr-box-value">{patient.presAddress || '-'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Personal
