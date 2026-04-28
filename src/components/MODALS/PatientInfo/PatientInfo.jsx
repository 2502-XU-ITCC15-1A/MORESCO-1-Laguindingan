import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { SAMPLE_RECORDS } from '../../../data/patients.js'
import AccordionRecord from './AccordionRecord/AccordionRecord.jsx'
import Personal from './Pages/Personal/Personal.jsx'
import Health from './Pages/Health/Health.jsx'
import './PatientInfo.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function PatientInfo({ show, onClose, patient }) {
  const [activeTab, setActiveTab]     = useState('personal')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear]   = useState('')
  const [records, setRecords]         = useState(SAMPLE_RECORDS)
  const [patientHealth, setPatientHealth] = useState({
    allergies:        patient?.allergies        || [],
    chronicConditions:patient?.chronicConditions|| [],
    bloodType:        patient?.bloodType        || 'Unknown',
  })

  if (!patient) return null

  const displayName = `${patient.firstName} ${patient.lastName}`

  // Calculate age from birthDate string
  function calcAge(birthDate) {
    if (!birthDate) return null
    const d = new Date(birthDate)
    if (isNaN(d)) return null
    return new Date().getFullYear() - d.getFullYear()
  }
  const age = calcAge(patient.birthDate)

  // Filter records
  const filteredRecords = records.filter(r => {
    const [yr, mo] = r.date.split('/')
    if (filterYear  && yr !== filterYear)  return false
    if (filterMonth && mo !== filterMonth) return false
    return true
  })

  function handleDeleteRecord(id) {
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function handleAddRecord() {
    const today = new Date()
    const newRecord = {
      id: Date.now(),
      date: `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`,
      bpVal: '', o2Val: '', hrVal: '', tempVal: '',
      complaints: '', diagnosis: '', remarks: '', photoUrl: null,
    }
    setRecords(prev => [newRecord, ...prev])
  }

  const years = [...new Set(records.map(r => r.date.split('/')[0]))].sort().reverse()

  return (
    <Modal
      show={show}
      onHide={onClose}
      contentClassName="pi-modal-content"
      dialogClassName="pi-modal-dialog"
    >
      {/* ── CUSTOM HEADER — proper 3-column layout ── */}
      <div className="pi-modal-header">
        {/* LEFT */}
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

        {/* CENTER */}
        <div className="pi-header-center">Patient Profile</div>

        {/* RIGHT */}
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

          {/* LEFT PANEL */}
          <div className="pi-left">
            {/* Profile card */}
            <div className="pi-profile-card">
              <div className="pi-profile-avatar">
                {patient.photoPreview
                  ? <img src={patient.photoPreview} alt={displayName} />
                  : (
                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="20" r="14" fill="#c8d4e8"/>
                      <ellipse cx="30" cy="54" rx="22" ry="16" fill="#c8d4e8"/>
                    </svg>
                  )
                }
              </div>
              <div className="pi-profile-info">
                <h2>{displayName}</h2>
                <p>{patient.position}</p>
                <span>{patient.idNumber}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="pi-tabs">
              <button className={`pi-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal</button>
              <button className={`pi-tab ${activeTab === 'health'   ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
            </div>

            {/* Tab Content */}
            <div className="pi-tab-content">
              {activeTab === 'personal' && <Personal patient={patient} age={age} />}
              {activeTab === 'health'   && (
                <Health
                  healthData={patientHealth}
                  onUpdate={data => setPatientHealth(prev => ({ ...prev, ...data }))}
                />
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
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
              {filteredRecords.length > 0
                ? filteredRecords.map(record => (
                  <AccordionRecord
                    key={record.id}
                    record={record}
                    onDelete={() => handleDeleteRecord(record.id)}
                  />
                ))
                : <p className="pi-no-records">No records found for the selected filters.</p>
              }
            </div>
          </div>

        </div>
      </Modal.Body>
    </Modal>
  )
}

export default PatientInfo
