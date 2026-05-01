import { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { diseasesAPI, patientsAPI, recordsAPI } from '../../../api/client.js'
import AccordionRecord from './AccordionRecord/AccordionRecord.jsx'
import Personal from './Pages/Personal/Personal.jsx'
import Health from './Pages/Health/Health.jsx'
import './PatientInfo.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function PatientInfo({ show, onClose, patient, onPatientUpdated }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [zoomPhoto, setZoomPhoto] = useState(false)
  const [diseases, setDiseases] = useState([])
  const patientPhotoInputRef = useRef(null)
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
        if (active) setRecords(data)
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

  function calcAge(birthDate) {
    if (!birthDate) return null
    const d = new Date(birthDate)
    if (isNaN(d)) return null
    return new Date().getFullYear() - d.getFullYear()
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
  }

  async function handleAddRecord() {
    const payload = new FormData()
    const today = new Date().toISOString().slice(0, 10)
    payload.append('recordDate', today)
    payload.append('bpVal', '')
    payload.append('o2Val', '')
    payload.append('hrVal', '')
    payload.append('tempVal', '')
    payload.append('complaints', '')
    payload.append('diagnosis', '')
    payload.append('remarks', '')

    const created = await recordsAPI.create(patient.id, payload)
    setRecords(prev => [created, ...prev])
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
    setRecords(prev => prev.map(record => record.id === recordId ? updated : record))
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
    if (!file) return

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

    const updated = await patientsAPI.update(patient.id, payload)
    onPatientUpdated?.(updated)
  }

  const years = [...new Set(records.map(r => String(r.date || '').split('/')[0]).filter(Boolean))].sort().reverse()

  return (
    <Modal
      show={show}
      onHide={onClose}
      contentClassName="pi-modal-content"
      dialogClassName="pi-modal-dialog"
    >
      <div className="pi-modal-header">
        <div className="pi-header-left">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="19" fill="#0D2B77" stroke="#4a9fff" strokeWidth="1.2"/>
            <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">M1</text>
          </svg>
          <div>
            <div className="pi-header-sysname">Moresco 1</div>
            <div className="pi-header-syssub">Employee Health Record System</div>
          </div>
        </div>

        <div className="pi-header-center">Patient Profile</div>

        <div className="pi-header-right">
          <div className="pi-header-user">
            <span className="pi-header-username">Andrei Valdez</span>
            <span className="pi-header-userrole">CEO of Nursing</span>
          </div>
          <button className="pi-header-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
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
                title={patient.photoPreview ? 'Zoom patient photo' : 'No patient photo'}
                type="button"
              >
                {patient.photoPreview
                  ? <img src={patient.photoPreview} alt={displayName} />
                  : (
                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="20" r="14" fill="#c8d4e8"/>
                      <ellipse cx="30" cy="54" rx="22" ry="16" fill="#c8d4e8"/>
                    </svg>
                  )
                }
              </button>
              <div className="pi-profile-info">
                <h2>{displayName}</h2>
                <p>{patient.position}</p>
                <span>{patient.idNumber}</span>
                <button className="pi-change-photo-btn" onClick={() => patientPhotoInputRef.current?.click()}>
                  Change Photo
                </button>
                <input
                  ref={patientPhotoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePatientPhotoChange}
                />
              </div>
            </div>

            <div className="pi-tabs">
              <button className={`pi-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal</button>
              <button className={`pi-tab ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
            </div>

            <div className="pi-tab-content">
              {activeTab === 'personal' && <Personal patient={patient} age={age} />}
              {activeTab === 'health' && (
                <Health
                  healthData={patientHealth}
                  onUpdate={handleHealthUpdate}
                />
              )}
            </div>
          </div>

          <div className="pi-right">
            <div className="pi-records-header">
              <h3 className="pi-records-title">Health Records</h3>
              <button className="pi-new-btn" onClick={handleAddRecord}>New</button>
              <div className="pi-records-filters">
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="pi-records-list">
              {loadingRecords && <p className="pi-no-records">Loading records...</p>}
              {!loadingRecords && recordError && <p className="pi-no-records">{recordError}</p>}
              {!loadingRecords && !recordError && filteredRecords.length > 0 &&
                filteredRecords.map(record => (
                  <AccordionRecord
                    key={record.id}
                    record={record}
                    onDelete={() => handleDeleteRecord(record.id)}
                    onSave={(form, photoFile) => handleSaveRecord(record.id, form, photoFile)}
                    diseases={diseases}
                  />
                ))
              }
              {!loadingRecords && !recordError && filteredRecords.length === 0 &&
                <p className="pi-no-records">No records found for the selected filters.</p>
              }
            </div>
          </div>
        </div>
      </Modal.Body>

      {zoomPhoto && (
        <div className="pi-photo-zoom" onClick={() => setZoomPhoto(false)}>
          <button className="pi-photo-zoom-close" onClick={() => setZoomPhoto(false)} aria-label="Close photo zoom">x</button>
          <img src={patient.photoPreview} alt={displayName} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Modal>
  )
}

export default PatientInfo
