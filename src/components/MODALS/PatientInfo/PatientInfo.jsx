import { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { diseasesAPI, patientsAPI, recordsAPI } from '../../../api/client.js'
import AccordionRecord from './AccordionRecord/AccordionRecord.jsx'
import Personal from './Pages/Personal/Personal.jsx'
import Health from './Pages/Health/Health.jsx'
import { roleLabel } from '../../../utils/roles.js'
import morescoLogo from '../../../assets/logo.png'
import './PatientInfo.css'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateForDisplay(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return ''
  return `${month}/${day}/${year}`
}

function parseManualDateInput(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!match) return ''

  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return ''

  const normalized = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const parsed = new Date(`${normalized}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return ''
  if (parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) return ''

  return normalized
}

function sortRecordsByDateDesc(items) {
  return [...items].sort((a, b) => {
    const first = String(a.recordDate || a.date || '')
    const second = String(b.recordDate || b.date || '')
    return second.localeCompare(first)
  })
}

function PatientInfo({ show, onClose, patient, onPatientUpdated, canEditPatient = false }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [zoomPhoto, setZoomPhoto] = useState(false)
  const [diseases, setDiseases] = useState([])
  const [openRecordId, setOpenRecordId] = useState(null)
  const [showCreateRecordForm, setShowCreateRecordForm] = useState(false)
  const [newRecordDate, setNewRecordDate] = useState(formatDateForDisplay(getTodayDateInputValue()))
  const patientPhotoInputRef = useRef(null)
  const recordDatePickerRef = useRef(null)

  const [patientHealth, setPatientHealth] = useState({
    allergies: patient?.allergies || [],
    chronicConditions: patient?.chronicConditions || [],
    bloodType: patient?.bloodType || 'Unknown',
  })

  useEffect(() => {
    if (!show || !patient?.id) return
    let active = true

    async function loadRecords() {
      setLoadingRecords(true)
      setRecordError('')
      try {
        const data = await recordsAPI.getAll(patient.id)
        if (active) {
          setRecords(sortRecordsByDateDesc(data))
          setOpenRecordId(null)
          setShowCreateRecordForm(false)
          setNewRecordDate(formatDateForDisplay(getTodayDateInputValue()))
        }
      } catch (err) {
        if (active) setRecordError(err.message || 'Unable to load records.')
      } finally {
        if (active) setLoadingRecords(false)
      }
    }

    loadRecords()
    return () => { active = false }
  }, [show, patient?.id])

  useEffect(() => {
    if (!show) return
    diseasesAPI.getAll().then(setDiseases).catch(() => setDiseases([]))
  }, [show])

  if (!patient) return null

  const displayName = `${patient.firstName} ${patient.lastName}`

  let currentUser = {}
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    currentUser = {}
  }

  const displayRole = roleLabel(currentUser.role)

  function calcAge(birthDate) {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)

    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const age = calcAge(patient.birthDate)

  const filteredRecords = records.filter(r => {
    const parts = String(r.date || '').split('/')
    const yr = parts[0]
    const mo = String(Number(parts[1]))
    if (filterYear && yr !== filterYear) return false
    if (filterMonth && mo !== filterMonth) return false
    return true
  })

  async function handleDeleteRecord(id) {
    await recordsAPI.delete(id)
    setRecords(prev => prev.filter(r => r.id !== id))
    setOpenRecordId(current => current === id ? null : current)
  }

  async function handleAddRecord() {
    const selectedDate = parseManualDateInput(newRecordDate)
    const today = getTodayDateInputValue()

    if (!selectedDate) {
      setRecordError('Enter a valid record date in MM/DD/YYYY format.')
      return
    }

    if (selectedDate > today) {
      setRecordError('Record date cannot be later than today.')
      return
    }

    const payload = new FormData()

    payload.append('recordDate', selectedDate)
    payload.append('bpVal', '')
    payload.append('o2Val', '')
    payload.append('hrVal', '')
    payload.append('tempVal', '')
    payload.append('complaints', '')
    payload.append('diagnosis', '')
    payload.append('remarks', '')

    const created = await recordsAPI.create(patient.id, payload)
    setRecords(prev => sortRecordsByDateDesc([created, ...prev]))
    setOpenRecordId(created.id)
    setShowCreateRecordForm(false)
    setNewRecordDate(formatDateForDisplay(getTodayDateInputValue()))
    setRecordError('')
  }

  async function handleSaveRecord(recordId, form, photoFile) {
    const payload = new FormData()

    payload.append('bpVal', form.bpVal || '')
    payload.append('o2Val', form.o2Val || '')
    payload.append('hrVal', form.hrVal || '')
    payload.append('tempVal', form.tempVal || '')
    payload.append('complaints', form.complaints || '')
    payload.append('diagnosis', form.diagnosis || '')
    payload.append('remarks', form.remarks || '')

    if (photoFile) payload.append('photo', photoFile)

    const updated = await recordsAPI.update(recordId, payload)
    setRecords(prev =>
      prev.map(record => (record.id === recordId ? updated : record))
    )
  }

  async function handleHealthUpdate(data) {
    const payload = new FormData()

    payload.append('firstName', patient.firstName)
    payload.append('middleName', patient.middleName || '')
    payload.append('lastName', patient.lastName)
    payload.append('birthDate', patient.birthDate)
    payload.append('position', patient.position)
    payload.append('status', patient.status)
    payload.append('height', patient.height || '')
    payload.append('weight', patient.weight || '')
    payload.append('sex', patient.sex)
    payload.append('permAddress', patient.permAddress || '')
    payload.append('presAddress', patient.presAddress || '')

    payload.append('bloodType', data.bloodType || 'Unknown')
    payload.append('allergies', JSON.stringify(data.allergies || []))
    payload.append('chronicConditions', JSON.stringify(data.chronicConditions || []))

    const updated = await patientsAPI.update(patient.id, payload)

    setPatientHealth({
      allergies: updated.allergies || [],
      chronicConditions: updated.chronicConditions || [],
      bloodType: updated.bloodType || 'Unknown',
    })

    onPatientUpdated?.(updated)
  }

  async function handlePatientPhotoChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file || !canEditPatient) return

    const payload = new FormData()

    payload.append('firstName', patient.firstName)
    payload.append('middleName', patient.middleName || '')
    payload.append('lastName', patient.lastName)
    payload.append('birthDate', patient.birthDate)
    payload.append('position', patient.position)
    payload.append('status', patient.status)
    payload.append('height', patient.height || '')
    payload.append('weight', patient.weight || '')
    payload.append('sex', patient.sex)
    payload.append('permAddress', patient.permAddress || '')
    payload.append('presAddress', patient.presAddress || '')

    payload.append('bloodType', patientHealth.bloodType || 'Unknown')
    payload.append('allergies', JSON.stringify(patientHealth.allergies || []))
    payload.append('chronicConditions', JSON.stringify(patientHealth.chronicConditions || []))
    payload.append('photo', file)

    try {
      const updated = await patientsAPI.update(patient.id, payload)
      onPatientUpdated?.(updated)
    } catch (error) {
      setRecordError(error.message || 'Unable to update patient photo.')
    }
  }

  const years = [...new Set(
    records.map(r => String(r.date || '').split('/')[0]).filter(Boolean)
  )].sort().reverse()

  return (
    <Modal
      show={show}
      onHide={onClose}
      contentClassName="pi-modal-content"
      dialogClassName="pi-modal-dialog"
    >
      <div className="pi-modal-header">
        <div className="pi-header-left">
          <img className="pi-header-logo" src={morescoLogo} alt="MORESCO-1 logo" />
          <div>
            <div className="pi-header-sysname">Moresco 1</div>
            <div className="pi-header-syssub">
              Employee Health Information Tracking and Management System
            </div>
          </div>
        </div>

        <div className="pi-header-center">Patient Profile</div>

        <div className="pi-header-right">
          <div className="pi-header-user">
            <span className="pi-header-username">Moresco-1</span>
            <span className="pi-header-userrole">{displayRole}</span>
          </div>
          <button
            className="pi-header-close"
            onClick={onClose}
            aria-label="Close patient profile"
            type="button"
          >
            &times;
          </button>
        </div>
      </div>

      <Modal.Body className="pi-modal-body">
        <div className="pi-container">
          <div className="pi-left">
            <div className="pi-profile-card">
              <button
                className="pi-profile-avatar"
                onClick={() => patient.photoPreview && setZoomPhoto(true)}
                aria-label={
                  patient.photoPreview
                    ? `Zoom ${displayName} photo`
                    : `${displayName} has no patient photo`
                }
                type="button"
              >
                {patient.photoPreview
                  ? <img src={patient.photoPreview} alt={displayName} />
                  : <div>No Photo</div>}
              </button>

              <div className="pi-profile-info">
                <h2>{displayName}</h2>
                <p>{patient.position}</p>
                <span>{patient.idNumber}</span>

                {canEditPatient && (
                  <>
                  <button
                    className="pi-change-photo-btn"
                    onClick={() => patientPhotoInputRef.current?.click()}
                    type="button"
                  >
                    Change Photo
                  </button>

                  <input
                    ref={patientPhotoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePatientPhotoChange}
                  />
                  </>
                )}
              </div>
            </div>

            <div className="pi-tabs">
              <button
                className={`pi-tab ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
                type="button"
              >
                Personal
              </button>
              <button
                className={`pi-tab ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
                type="button"
              >
                Health
              </button>
            </div>

            <div className="pi-tab-content">
              {activeTab === 'personal' && <Personal patient={patient} age={age} />}
              {activeTab === 'health' && (
                <Health
                  healthData={patientHealth}
                  onUpdate={handleHealthUpdate}
                  canEdit={canEditPatient}
                />
              )}
            </div>
          </div>

          <div className="pi-right">
            <div className="pi-records-header">
              <h3 className="pi-records-title">Health Records</h3>

              <div className="pi-records-filters">
                <select
                  aria-label="Filter records by month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  <option value="">All months</option>
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={String(index + 1)}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter records by year"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  <option value="">All years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {canEditPatient && (
                <button
                  className="pi-new-btn"
                  onClick={() => {
                    setShowCreateRecordForm(open => !open)
                    setNewRecordDate(current => current || formatDateForDisplay(getTodayDateInputValue()))
                  }}
                  type="button"
                >
                  {showCreateRecordForm ? 'Close' : 'New'}
                </button>
              )}
            </div>

            {canEditPatient && showCreateRecordForm && (
              <div className="pi-record-create-bar">
                <label className="pi-record-create-label" htmlFor="pi-new-record-date">
                  Record date
                </label>
                <div className="pi-record-create-input-wrap">
                  <input
                    id="pi-new-record-date"
                    className="pi-record-create-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/DD/YYYY"
                    value={newRecordDate}
                    onChange={e => {
                      setNewRecordDate(e.target.value)
                      setRecordError('')
                    }}
                    onBlur={() => {
                      const normalized = parseManualDateInput(newRecordDate)
                      if (normalized) setNewRecordDate(formatDateForDisplay(normalized))
                    }}
                  />
                  <button
                    className="pi-record-create-picker-btn"
                    type="button"
                    aria-label="Open calendar"
                    onClick={() => {
                      if (typeof recordDatePickerRef.current?.showPicker === 'function') {
                        recordDatePickerRef.current.showPicker()
                        return
                      }
                      recordDatePickerRef.current?.click()
                    }}
                  >
                    <span aria-hidden="true">📅</span>
                  </button>
                  <input
                    ref={recordDatePickerRef}
                    className="pi-record-create-native-picker"
                    type="date"
                    value={parseManualDateInput(newRecordDate) || ''}
                    max={getTodayDateInputValue()}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={e => {
                      setNewRecordDate(formatDateForDisplay(e.target.value))
                      setRecordError('')
                    }}
                  />
                </div>
                <button className="pi-record-create-btn" onClick={handleAddRecord} type="button">
                  Create record
                </button>
              </div>
            )}

            <div className="pi-records-list">
              {loadingRecords && <div className="pi-no-records">Loading records...</div>}
              {!loadingRecords && recordError && <div className="pi-no-records">{recordError}</div>}
              {!loadingRecords && !recordError && filteredRecords.length === 0 && (
                <div className="pi-no-records">No health records found for this patient.</div>
              )}

              {!loadingRecords && !recordError && filteredRecords.map(record => (
                <AccordionRecord
                  key={record.id}
                  record={record}
                  isOpen={openRecordId === record.id}
                  onToggle={() => setOpenRecordId(current => (current === record.id ? null : record.id))}
                  onDelete={() => handleDeleteRecord(record.id)}
                  onSave={(form, file) => handleSaveRecord(record.id, form, file)}
                  diseases={diseases}
                  canEdit={canEditPatient}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal.Body>

      {zoomPhoto && (
        <div className="pi-photo-zoom" onClick={() => setZoomPhoto(false)}>
          <img src={patient.photoPreview} alt={displayName} />
        </div>
      )}
    </Modal>
  )
}

export default PatientInfo
