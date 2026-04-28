import { useState, useRef } from 'react'
import './AccordionRecord.css'

// Strip the unit suffix so the nurse only sees/types the number
function extractValue(str) {
  if (!str) return ''
  return str.replace(/\s*(mmhg|bpm|%|°?c)\s*/gi, '').trim()
}

function AccordionRecord({ record, onDelete }) {
  const [open, setOpen]         = useState(false)
  const [tab, setTab]           = useState('complaints')
  const [editMode, setEditMode] = useState(false)
  const photoInputRef           = useRef(null)

  const [form, setForm] = useState({
    bpVal:      extractValue(record.bpVal  || record.bp),
    o2Val:      extractValue(record.o2Val  || record.o2),
    hrVal:      extractValue(record.hrVal  || record.hr),
    tempVal:    extractValue(record.tempVal || record.temp),
    complaints: record.complaints || '',
    diagnosis:  record.diagnosis  || '',
    remarks:    record.remarks    || '',
    photoUrl:   record.photoUrl   || null,
  })

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => update('photoUrl', ev.target.result)
    reader.readAsDataURL(file)
  }

  // Formatted display strings
  const displayBP   = form.bpVal   ? `${form.bpVal} mmhg`  : ''
  const displayO2   = form.o2Val   ? `${form.o2Val} %`      : ''
  const displayHR   = form.hrVal   ? `${form.hrVal} bpm`    : ''
  const displayTemp = form.tempVal ? `${form.tempVal} °C`   : ''
  const hasVitals   = displayBP || displayO2 || displayHR || displayTemp

  const tabKey = tab === 'complaints' ? 'complaints' : tab === 'diagnosis' ? 'diagnosis' : 'remarks'

  return (
    <div className="accordion-record">

      {/* ── Summary Row ── */}
      <div className="accordion-summary" onClick={() => setOpen(o => !o)}>
        <span className="accordion-date">{record.date}</span>
        <div className="accordion-actions" onClick={e => e.stopPropagation()}>
          <button className="acc-icon-btn" title="Delete" onClick={onDelete}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
          <button className="acc-icon-btn" title={open ? 'Collapse' : 'Expand'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Details Panel ── */}
      {open && (
        <div className="accordion-details">
          <div className="acc-details-layout">

            {/* LEFT — Photo + Vitals */}
            <div className="acc-left">

              {/* Clickable photo area */}
              <div
                className="acc-photo-area"
                onClick={() => photoInputRef.current?.click()}
                title="Click to upload a photo"
              >
                {form.photoUrl
                  ? <img src={form.photoUrl} alt="Record" className="acc-photo-img" />
                  : (
                    <div className="acc-photo-placeholder">
                      <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="12" width="60" height="48" rx="4" stroke="#9ca3af" strokeWidth="3" fill="none"/>
                        <circle cx="35" cy="32" r="10" stroke="#9ca3af" strokeWidth="3" fill="none"/>
                        <path d="M5 52 L20 38 L32 50 L47 35 L65 52" stroke="#9ca3af" strokeWidth="3" fill="none"/>
                        <circle cx="58" cy="58" r="10" fill="#6b7280"/>
                        <path d="M58 53v10M53 58h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      <span>No Photo</span>
                      <span className="acc-photo-hint">Click to upload</span>
                    </div>
                  )
                }
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />

              {/* Vitals */}
              <div className="acc-vitals">
                <div className="acc-vitals-title">Chief Complaints</div>

                {editMode ? (
                  /* EDIT MODE — nurse types value only, units are pre-labeled */
                  <div className="acc-vitals-edit">
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">BP:</span>
                      <input
                        className="acc-vital-input"
                        value={form.bpVal}
                        onChange={e => update('bpVal', e.target.value)}
                        placeholder="120/80"
                        title="Enter blood pressure (e.g. 120/80)"
                      />
                      <span className="acc-vital-unit">mmhg</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">O2 Sat:</span>
                      <input
                        className="acc-vital-input"
                        value={form.o2Val}
                        onChange={e => update('o2Val', e.target.value)}
                        placeholder="98"
                        title="Enter oxygen saturation"
                      />
                      <span className="acc-vital-unit">%</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">HR:</span>
                      <input
                        className="acc-vital-input"
                        value={form.hrVal}
                        onChange={e => update('hrVal', e.target.value)}
                        placeholder="72"
                        title="Enter heart rate"
                      />
                      <span className="acc-vital-unit">bpm</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">Temp:</span>
                      <input
                        className="acc-vital-input"
                        value={form.tempVal}
                        onChange={e => update('tempVal', e.target.value)}
                        placeholder="36.5"
                        title="Enter temperature"
                      />
                      <span className="acc-vital-unit">°C</span>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE — show full formatted strings */
                  <div className="acc-vitals-display">
                    {displayBP   && <p><strong>BP:</strong> {displayBP}</p>}
                    {displayO2   && <p><strong>O2 sat:</strong> {displayO2}</p>}
                    {displayHR   && <p><strong>HR:</strong> {displayHR}</p>}
                    {displayTemp && <p><strong>Temp:</strong> {displayTemp}</p>}
                    {!hasVitals  && <p className="acc-empty">No vitals recorded</p>}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Tabs + Content */}
            <div className="acc-right">
              <div className="acc-tabs">
                <button className={`acc-tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>Chief Complaints</button>
                <button className={`acc-tab ${tab === 'diagnosis'  ? 'active' : ''}`} onClick={() => setTab('diagnosis')}>Diagnosis</button>
                <button className={`acc-tab ${tab === 'remarks'    ? 'active' : ''}`} onClick={() => setTab('remarks')}>Remarks</button>
              </div>

              <div className="acc-tab-content">
                {editMode ? (
                  <textarea
                    className="acc-textarea"
                    value={form[tabKey]}
                    onChange={e => update(tabKey, e.target.value)}
                    placeholder={`Enter ${tab}…`}
                  />
                ) : (
                  <div className="acc-text-display">
                    {form[tabKey] || <span className="acc-empty">Nothing recorded yet.</span>}
                  </div>
                )}
              </div>

              <div className="acc-edit-row">
                {editMode
                  ? <button className="acc-save-btn" onClick={() => setEditMode(false)}>Save</button>
                  : <button className="acc-edit-btn" onClick={() => setEditMode(true)}>Edit</button>
                }
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default AccordionRecord
