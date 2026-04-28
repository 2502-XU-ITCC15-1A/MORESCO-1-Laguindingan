import { useState } from 'react'
import Patient from '../Patient/Patient.jsx'
import AddPatient from '../MODALS/AddPatient/AddPatient.jsx'
import { SAMPLE_PATIENTS } from '../../data/patients.js'
import './PatientGrid.css'

const PATIENTS_PER_PAGE = 12

function PatientGrid() {
  const [patients, setPatients]         = useState(SAMPLE_PATIENTS)
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState('name-asc')
  const [currentPage, setCurrentPage]   = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)

  // --- Filter & Sort ---
  const filtered = patients
    .filter(p => {
      const q = search.toLowerCase()
      return (
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.idNumber.includes(q) ||
        p.position.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name-asc':  return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'name-desc': return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
        case 'id-asc':    return a.idNumber.localeCompare(b.idNumber)
        default: return 0
      }
    })

  // --- Pagination ---
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PATIENTS_PER_PAGE))
  const safePage    = Math.min(currentPage, totalPages)
  const pageStart   = (safePage - 1) * PATIENTS_PER_PAGE
  const paginated   = filtered.slice(pageStart, pageStart + PATIENTS_PER_PAGE)

  function handleAddPatient(newPatient) {
    setPatients(prev => [
      ...prev,
      { ...newPatient, id: Date.now(), idNumber: String(Date.now()).slice(-12) }
    ])
    setShowAddModal(false)
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
      {/* Search & Sort bar */}
      <div className="grid-toolbar">
        <input
          className="grid-search"
          type="text"
          placeholder="Search patient name, ID, or position…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <select
          className="grid-sort"
          value={sort}
          onChange={e => { setSort(e.target.value); setCurrentPage(1) }}
        >
          <option value="name-asc">Sort: Name A→Z</option>
          <option value="name-desc">Sort: Name Z→A</option>
          <option value="id-asc">Sort: ID</option>
        </select>
      </div>

      {/* Patient Grid */}
      <div className="patient-grid-wrapper">
        <div className="patient-grid-container">
          {paginated.length > 0
            ? paginated.map(p => <Patient key={p.id} patient={p} />)
            : <div className="grid-empty">No patients found.</div>
          }
        </div>

        {/* Pagination */}
        <div className="grid-pagination">
          <button
            className="page-btn"
            disabled={safePage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >&lt;</button>

          {getPageNumbers().map((page, i) =>
            page === '...'
              ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
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

      {/* Add Patient FAB */}
      <button className="fab-add" onClick={() => setShowAddModal(true)} title="Add Patient">+</button>

      {/* Add Patient Modal */}
      <AddPatient
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
      />
    </div>
  )
}

export default PatientGrid
