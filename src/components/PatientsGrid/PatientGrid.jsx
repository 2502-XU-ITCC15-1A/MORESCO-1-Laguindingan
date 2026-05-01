import { useEffect, useState } from 'react'
import Patient from '../Patient/Patient.jsx'
import AddPatient from '../MODALS/AddPatient/AddPatient.jsx'
import DiseaseManager from '../MODALS/DiseaseManager/DiseaseManager.jsx'
import { patientsAPI } from '../../api/client.js'
import './PatientGrid.css'

const PATIENTS_PER_PAGE = 12

function PatientGrid() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDiseaseModal, setShowDiseaseModal] = useState(false)
  const [speedDialOpen, setSpeedDialOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = String(user.role || '').toLowerCase().includes('admin')

  useEffect(() => {
    let active = true

    async function loadPatients() {
      try {
        const data = await patientsAPI.getAll()
        if (active) setPatients(data)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load patients.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPatients()
    return () => { active = false }
  }, [])

  const filtered = patients
    .filter(p => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      const names = [p.firstName, p.middleName, p.lastName].filter(Boolean).map(name => String(name).toLowerCase())
      const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim().toLowerCase()
      return (
        names.some(name => name.startsWith(q)) ||
        fullName.startsWith(q) ||
        String(p.idNumber || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name-asc': return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'name-desc': return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
        case 'id-asc': return String(a.idNumber).localeCompare(String(b.idNumber))
        default: return 0
      }
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PATIENTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PATIENTS_PER_PAGE
  const paginated = filtered.slice(pageStart, pageStart + PATIENTS_PER_PAGE)

  async function handleAddPatient(formData) {
    const created = await patientsAPI.create(formData)
    setPatients(prev => [...prev, created])
    setShowAddModal(false)
  }

  function handlePatientUpdated(updatedPatient) {
    setPatients(prev => prev.map(patient => (
      patient.id === updatedPatient.id ? updatedPatient : patient
    )))
  }

  async function handleDeletePatient(patientId) {
    await patientsAPI.delete(patientId)
    setPatients(prev => prev.filter(patient => patient.id !== patientId))
  }

  function getPageNumbers() {
    const pages = []
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3, 4)
      if (safePage > 5) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="main-content">
      <div className="grid-toolbar">
        <input
          className="grid-search"
          type="text"
          placeholder="Search patient name, ID, or position..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <select
          className="grid-sort"
          value={sort}
          onChange={e => { setSort(e.target.value); setCurrentPage(1) }}
        >
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="name-desc">Sort: Name Z-A</option>
          <option value="id-asc">Sort: ID</option>
        </select>
      </div>

      <div className="patient-grid-wrapper">
        <div className="patient-grid-container">
          {loading && <div className="grid-empty">Loading patients...</div>}
          {!loading && error && <div className="grid-empty">{error}</div>}
          {!loading && !error && paginated.length > 0 &&
            paginated.map(p => (
              <Patient
                key={p.id}
                patient={p}
                onPatientUpdated={handlePatientUpdated}
                onDelete={isAdmin ? handleDeletePatient : undefined}
                canDelete={isAdmin}
              />
            ))
          }
          {!loading && !error && paginated.length === 0 && <div className="grid-empty">No patients found.</div>}
        </div>

        <div className="grid-pagination">
          <button
            className="page-btn"
            disabled={safePage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >&lt;</button>

          {getPageNumbers().map((page, i) =>
            page === '...'
              ? <span key={`ellipsis-${i}`} className="page-ellipsis">...</span>
              : <button
                  key={page}
                  className={`page-btn ${safePage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >{page}</button>
          )}

          <button
            className="page-btn"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >&gt;</button>
        </div>
      </div>

      <div className="speed-dial">
        {speedDialOpen && (
          <div className="speed-dial-menu">
            {isAdmin && (
              <button onClick={() => { setShowDiseaseModal(true); setSpeedDialOpen(false) }}>
                Diseases
              </button>
            )}
            <button onClick={() => { setShowAddModal(true); setSpeedDialOpen(false) }}>
              Add Patient
            </button>
          </div>
        )}
        <button className="fab-add" onClick={() => setSpeedDialOpen(open => !open)} title="Actions">+</button>
      </div>

      <AddPatient
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
      />
      <DiseaseManager
        show={showDiseaseModal}
        onClose={() => setShowDiseaseModal(false)}
      />
    </div>
  )
}

export default PatientGrid
