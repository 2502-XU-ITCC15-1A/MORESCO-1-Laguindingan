import { useEffect, useState } from 'react'
import Patient from '../Patient/Patient.jsx'
import AddPatient from '../MODALS/AddPatient/AddPatient.jsx'
import DiseaseManager from '../MODALS/DiseaseManager/DiseaseManager.jsx'
import { patientsAPI } from '../../api/client.js'
import { canManageDiseases, canManagePatients } from '../../utils/roles.js'
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
  const [reloadKey, setReloadKey] = useState(0)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEditPatients = canManagePatients(user.role)
  const canOpenDiseaseManager = canManageDiseases(user.role)

  useEffect(() => {
    let active = true

    async function loadPatients() {
      if (active) {
        setLoading(true)
        setError('')
      }

      try {
        const data = await patientsAPI.getAll({
          q: search.trim(),
          sort,
        })
        if (active) setPatients(data)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load patients.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const timeoutId = setTimeout(loadPatients, 250)
    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [search, sort, reloadKey])

  const totalPages = Math.max(1, Math.ceil(patients.length / PATIENTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PATIENTS_PER_PAGE
  const paginated = patients.slice(pageStart, pageStart + PATIENTS_PER_PAGE)

  async function handleAddPatient(formData) {
    await patientsAPI.create(formData)
    setShowAddModal(false)
    setCurrentPage(1)
    setReloadKey(key => key + 1)
  }

  function handlePatientUpdated(updatedPatient) {
    setPatients(prev => prev.map(patient => (
      patient.id === updatedPatient.id ? updatedPatient : patient
    )))
  }

  async function handleDeletePatient(patientId) {
    await patientsAPI.delete(patientId)
    setReloadKey(key => key + 1)
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
    <main className="main-content">
      <div className="grid-toolbar">
        <input
          className="grid-search"
          type="text"
          aria-label="Search patients"
          placeholder="Search patient name, ID, or position..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <select
          className="grid-sort"
          aria-label="Sort patients"
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
                onDelete={canEditPatients ? handleDeletePatient : undefined}
                canDelete={canEditPatients}
                canEditPatient={canEditPatients}
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
            aria-label="Previous page"
          >&lt;</button>

          {getPageNumbers().map((page, i) =>
            page === '...'
              ? <span key={`ellipsis-${i}`} className="page-ellipsis">...</span>
              : <button
                  key={page}
                  className={`page-btn ${safePage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={safePage === page ? 'page' : undefined}
                >{page}</button>
          )}

          <button
            className="page-btn"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            aria-label="Next page"
          >&gt;</button>
        </div>
      </div>

      <div className="speed-dial">
        {speedDialOpen && (
          <div className="speed-dial-menu">
            {canOpenDiseaseManager && (
              <button onClick={() => { setShowDiseaseModal(true); setSpeedDialOpen(false) }}>
                Diseases
              </button>
            )}
            {canEditPatients && (
              <button onClick={() => { setShowAddModal(true); setSpeedDialOpen(false) }}>
                Add Patient
              </button>
            )}
          </div>
        )}
        <button
          className="fab-add"
          onClick={() => setSpeedDialOpen(open => !open)}
          title="Actions"
          aria-label={speedDialOpen ? 'Close actions menu' : 'Open actions menu'}
          aria-expanded={speedDialOpen}
        >
          +
        </button>
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
    </main>
  )
}

export default PatientGrid
