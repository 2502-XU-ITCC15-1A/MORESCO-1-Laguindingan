import { useEffect, useRef, useState } from 'react'
import morescoLogo from '../../../../assets/logo.png'
import ImageCarousel from './ImageCarousel/ImageCarousel.jsx'
import './AccordionRecord.css'

const MAX_RECORD_PHOTOS = 10

function extractValue(str) {
  if (!str) return ''
  return str.replace(/\s*(mmhg|bpm|%|c)\s*/gi, '').trim()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateLabel(value) {
  if (!value) return 'Not recorded'
  const [year, month, day] = String(value).split(/[/-]/)

  if (year?.length === 4 && month && day) {
    return `${month}/${day}/${year}`
  }

  return String(value)
}

function formatDateTimeLabel(value) {
  if (!value) return 'Not recorded'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatJoinedList(items, key) {
  if (!Array.isArray(items) || items.length === 0) return 'None recorded'
  return items
    .map(item => {
      if (typeof item === 'string') return item
      return item?.[key] || ''
    })
    .filter(Boolean)
    .join(', ') || 'None recorded'
}

function buildPrintableHtml({ patient, healthData, record, form, logoSrc }) {
  const fullName = [patient?.firstName, patient?.middleName, patient?.lastName].filter(Boolean).join(' ')
  const age = patient?.birthDate
    ? Math.max(0, new Date().getFullYear() - new Date(patient.birthDate).getFullYear())
    : 'Not recorded'
  const allergies = formatJoinedList(healthData?.allergies, 'allergyName')
  const conditions = formatJoinedList(healthData?.chronicConditions, 'conditionName')
  const recordPhotos = Array.isArray(form.recordImages)
    ? form.recordImages.map(image => image.photoUrl).filter(Boolean)
    : []
  const photoCount = recordPhotos.length
  const photoColumns = photoCount <= 2 ? Math.max(photoCount, 1) : photoCount <= 4 ? 2 : photoCount <= 9 ? 3 : 5
  const photoHeight = photoCount <= 2 ? 42 : photoCount <= 4 ? 34 : photoCount <= 9 ? 28 : 22
  const recordPhoto = recordPhotos.length > 0
    ? `
      <div class="attachments">
        <div class="attachments-title">Attached Photos (${photoCount})</div>
        <div class="photo-grid" style="--photo-columns: ${photoColumns}; --photo-height: ${photoHeight}mm;">
        ${recordPhotos.map((photoUrl, index) => `
          <div class="photo-card">
            <img src="${escapeHtml(photoUrl)}" alt="Health record attachment ${index + 1}" />
          </div>
        `).join('')}
        </div>
      </div>
    `
    : ''

  const field = value => escapeHtml(value || 'Not recorded')

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MORESCO-1 Health Record</title>
    <style>
      :root {
        color-scheme: light;
        --brand: #071a78;
        --brand-soft: #dfe7fb;
        --ink: #14213d;
        --muted: #5b6478;
        --line: #c7d2e8;
        --panel: #f7f9ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--ink);
        background: #eef2fb;
      }
      @page {
        size: A4;
        margin: 0;
      }
      .page {
        width: 210mm;
        margin: 0 auto;
        background: white;
        padding: 14mm 14mm 12mm;
      }
      .hero {
        display: grid;
        grid-template-columns: 82px 1fr;
        gap: 16px;
        align-items: center;
        margin-bottom: 14px;
      }
      .logo-wrap {
        width: 82px;
        height: 82px;
        border-radius: 50%;
        border: 4px solid var(--brand);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: white;
      }
      .logo-wrap img {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: white;
        object-fit: contain;
        object-position: center center;
        padding: 4px;
      }
      .hero-copy h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 0.08em;
        color: #c7d3ee;
        font-weight: 800;
      }
      .hero-copy h2 {
        margin: 0;
        font-size: 17px;
        letter-spacing: 0.14em;
        color: var(--brand);
      }
      .hero-copy p {
        margin: 6px 0 0;
        font-size: 11px;
        color: var(--muted);
      }
      .section-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 0;
        border: 1px solid var(--line);
        border-bottom: none;
      }
      .section {
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .section:nth-child(2n) {
        border-right: none;
      }
      .section-title {
        background: var(--brand-soft);
        color: var(--brand);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        padding: 6px 10px;
        break-after: avoid;
        page-break-after: avoid;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        border-top: 1px solid var(--line);
        padding: 6px 10px;
        font-size: 12px;
        vertical-align: top;
      }
      td.label {
        width: 34%;
        font-weight: 700;
        color: #38445f;
        background: #fbfcff;
      }
      .wide-section {
        border: 1px solid var(--line);
        border-top: none;
      }
      .section-body {
        padding: 9px 12px 11px;
        font-size: 12px;
        line-height: 1.45;
      }
      .text-block {
        padding: 8px 0 0;
        font-size: 12px;
        line-height: 1.45;
        white-space: pre-wrap;
      }
      .record-layout {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .attachments {
        margin-top: 8px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .attachments-title {
        color: var(--brand);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        margin-bottom: 7px;
        text-transform: uppercase;
        break-after: avoid;
        page-break-after: avoid;
      }
      .photo-grid {
        display: grid;
        grid-template-columns: repeat(var(--photo-columns, 3), minmax(0, 1fr));
        gap: 6px;
      }
      .photo-card {
        height: var(--photo-height, 28mm);
        border: 1px dashed var(--line);
        background: var(--panel);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        font-size: 12px;
        color: var(--muted);
        text-align: center;
      }
      .photo-card img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .badge {
        border: 1px solid var(--line);
        background: #fbfcff;
        color: var(--brand);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
      }
      @media print {
        body {
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          margin: 0;
          min-height: auto;
          break-after: avoid;
          page-break-after: avoid;
        }
        table,
        tr,
        .remarks-section,
        .photo-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="hero">
        <div class="logo-wrap">
          <img src="${logoSrc}" alt="MORESCO-1 logo" />
        </div>
        <div class="hero-copy">
          <h1>MEDICAL</h1>
          <h2>INFORMATION</h2>
          <p>MORESCO-1 Employee Health Information Tracking and Management System</p>
        </div>
      </div>

      <div class="section-grid">
        <div class="section">
          <div class="section-title">Patient Information</div>
          <table>
            <tr><td class="label">Name</td><td>${field(fullName)}</td></tr>
            <tr><td class="label">Employee ID</td><td>${field(patient?.idNumber)}</td></tr>
            <tr><td class="label">Position</td><td>${field(patient?.position)}</td></tr>
            <tr><td class="label">Sex</td><td>${field(patient?.sex)}</td></tr>
            <tr><td class="label">Civil Status</td><td>${field(patient?.status)}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Personal Info</div>
          <table>
            <tr><td class="label">Birth Date</td><td>${field(formatDateLabel(patient?.birthDate))}</td></tr>
            <tr><td class="label">Age</td><td>${field(age)}</td></tr>
            <tr><td class="label">Blood Type</td><td>${field(healthData?.bloodType || patient?.bloodType)}</td></tr>
            <tr><td class="label">Height</td><td>${field(patient?.height)}</td></tr>
            <tr><td class="label">Weight</td><td>${field(patient?.weight)}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Address Information</div>
          <table>
            <tr><td class="label">Permanent</td><td>${field(patient?.permAddress)}</td></tr>
            <tr><td class="label">Present</td><td>${field(patient?.presAddress)}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Medical Conditions & Allergies</div>
          <table>
            <tr><td class="label">Allergies</td><td>${field(allergies)}</td></tr>
            <tr><td class="label">Conditions</td><td>${field(conditions)}</td></tr>
          </table>
        </div>
      </div>

      <div class="wide-section">
        <div class="section-title">Health Record Details</div>
        <div class="section-body">
          <div class="record-layout">
            <div>
              <table>
                <tr><td class="label">Record Date</td><td>${field(formatDateLabel(record?.recordDate || record?.date))}</td></tr>
                <tr><td class="label">Created On</td><td>${field(formatDateTimeLabel(record?.createdAt))}</td></tr>
                <tr><td class="label">Blood Pressure</td><td>${field(form.bpVal ? `${form.bpVal} mmhg` : '')}</td></tr>
                <tr><td class="label">O2 Saturation</td><td>${field(form.o2Val ? `${form.o2Val} %` : '')}</td></tr>
                <tr><td class="label">Heart Rate</td><td>${field(form.hrVal ? `${form.hrVal} bpm` : '')}</td></tr>
                <tr><td class="label">Temperature</td><td>${field(form.tempVal ? `${form.tempVal} C` : '')}</td></tr>
                <tr><td class="label">Diagnosis</td><td>${field(form.diagnosis)}</td></tr>
              </table>
              <div class="badges">
                <span class="badge">Chief Complaints</span>
              </div>
              <div class="text-block">${field(form.complaints)}</div>
            </div>
            ${recordPhoto}
          </div>
        </div>
      </div>

      <div class="wide-section remarks-section">
        <div class="section-title">Remarks</div>
        <div class="section-body">
          <div class="text-block">${field(form.remarks)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function AccordionRecord({
  record,
  isOpen = false,
  onToggle,
  onDelete,
  onSave,
  diseases = [],
  canEdit = true,
  patient = null,
  healthData = null,
  onEditingChange,
}) {
  const [tab, setTab] = useState('complaints')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef(null)

  const [form, setForm] = useState({
    bpVal: extractValue(record.bpVal || record.bp),
    o2Val: extractValue(record.o2Val || record.o2),
    hrVal: extractValue(record.hrVal || record.hr),
    tempVal: extractValue(record.tempVal || record.temp),
    complaints: record.complaints || '',
    diagnosis: record.diagnosis || '',
    remarks: record.remarks || '',
    recordImages: record.recordImages?.length
      ? record.recordImages
      : (record.photoUrls || []).map((photoUrl, index) => ({
          id: `legacy-${index}`,
          photoUrl,
          persisted: true,
        })),
  })

  useEffect(() => {
    onEditingChange?.(record.id, editMode)
  }, [record.id, editMode, onEditingChange])

  useEffect(() => {
    return () => {
      onEditingChange?.(record.id, false)
    }
  }, [record.id, onEditingChange])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handlePhotoChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    e.target.value = ''
    if (selectedFiles.length === 0) return

    const availableSlots = Math.max(0, MAX_RECORD_PHOTOS - form.recordImages.length)
    if (availableSlots === 0) {
      setPhotoError(`Health records can have up to ${MAX_RECORD_PHOTOS} photos. Remove one before adding another.`)
      return
    }

    const files = selectedFiles.slice(0, availableSlots)
    setPhotoError(
      selectedFiles.length > availableSlots
        ? `Only ${availableSlots} more photo${availableSlots > 1 ? 's' : ''} can be added. Health records are limited to ${MAX_RECORD_PHOTOS} photos.`
        : '',
    )

    setPhotoFiles(current => [...current, ...files])
    const previews = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target?.result || '')
      reader.readAsDataURL(file)
    })))

    setForm(current => ({
      ...current,
      recordImages: [
        ...current.recordImages,
        ...previews.filter(Boolean).map((photoUrl, index) => ({
          id: `new-${Date.now()}-${index}`,
          photoUrl,
          persisted: false,
        })),
      ],
    }))
  }

  function handleRemoveImage(imageId) {
    setPhotoError('')
    setForm(current => ({
      ...current,
      recordImages: current.recordImages.filter(image => image.id !== imageId),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setPhotoError('')
    try {
      await onSave?.(form, photoFiles)
      setPhotoFiles([])
      setEditMode(false)
    } catch (err) {
      setPhotoError(err.message || 'Unable to save health record photos.')
    } finally {
      setSaving(false)
    }
  }

  const displayBP = form.bpVal ? `${form.bpVal} mmhg` : ''
  const displayO2 = form.o2Val ? `${form.o2Val} %` : ''
  const displayHR = form.hrVal ? `${form.hrVal} bpm` : ''
  const displayTemp = form.tempVal ? `${form.tempVal} C` : ''
  const hasVitals = displayBP || displayO2 || displayHR || displayTemp
  const tabKey = tab === 'complaints' ? 'complaints' : tab === 'diagnosis' ? 'diagnosis' : 'remarks'

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=960,height=1200')
    if (!printWindow) return

    const printableMarkup = buildPrintableHtml({
      patient,
      healthData,
      record,
      form,
      logoSrc: morescoLogo,
    })

    printWindow.document.open('text/html', 'replace')
    printWindow.document.write(printableMarkup)
    printWindow.document.close()
    printWindow.focus()

    const triggerPrint = () => {
      try {
        printWindow.focus()
        printWindow.print()
      } catch {
        // If printing is blocked, the rendered page remains open for manual PDF save.
      }
    }

    printWindow.addEventListener('load', triggerPrint, { once: true })
    window.setTimeout(triggerPrint, 400)
  }

  return (
    <div className={`accordion-record ${isOpen ? 'open' : ''}`}>
      <div className="accordion-summary" onClick={onToggle}>
        <span className="accordion-date">{record.date}</span>
        <div className="accordion-actions" onClick={e => e.stopPropagation()}>
          <button
            className="acc-icon-btn"
            title="Print as PDF"
            aria-label={`Print health record from ${record.date}`}
            onClick={handlePrint}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V3h12v6"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 14h12v7H6z"/>
              <circle cx="18" cy="12" r="1"/>
            </svg>
          </button>
          {canEdit && (
            <button className="acc-icon-btn" title="Delete" aria-label={`Delete health record from ${record.date}`} onClick={onDelete} type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          )}
          <button
            className="acc-icon-btn"
            title={isOpen ? 'Collapse' : 'Expand'}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} health record from ${record.date}`}
            aria-expanded={isOpen}
            onClick={onToggle}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="accordion-details">
          <div className="acc-details-layout">
            <div className="acc-left">
              <div className="acc-photo-wrap">
                <ImageCarousel
                  images={form.recordImages}
                  recordDate={record.date}
                  editMode={editMode}
                  onChangePhotoClick={() => photoInputRef.current?.click()}
                  pendingUploadsCount={photoFiles.length}
                  onRemoveImage={handleRemoveImage}
                  maxPhotos={MAX_RECORD_PHOTOS}
                />
                {photoError && <div className="acc-photo-limit-error">{photoError}</div>}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange}/>

              <div className="acc-vitals">
                <div className="acc-vitals-title">Chief Complaints</div>
                {editMode ? (
                  <div className="acc-vitals-edit">
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">BP:</span>
                      <input className="acc-vital-input" value={form.bpVal} onChange={e => update('bpVal', e.target.value)} placeholder="120/80" />
                      <span className="acc-vital-unit">mmhg</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">O2 Sat:</span>
                      <input className="acc-vital-input" value={form.o2Val} onChange={e => update('o2Val', e.target.value)} placeholder="98" />
                      <span className="acc-vital-unit">%</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">HR:</span>
                      <input className="acc-vital-input" value={form.hrVal} onChange={e => update('hrVal', e.target.value)} placeholder="72" />
                      <span className="acc-vital-unit">bpm</span>
                    </div>
                    <div className="acc-vital-row">
                      <span className="acc-vital-label">Temp:</span>
                      <input className="acc-vital-input" value={form.tempVal} onChange={e => update('tempVal', e.target.value)} placeholder="36.5" />
                      <span className="acc-vital-unit">C</span>
                    </div>
                  </div>
                ) : (
                  <div className="acc-vitals-display">
                    {displayBP && <p><strong>BP:</strong> {displayBP}</p>}
                    {displayO2 && <p><strong>O2 sat:</strong> {displayO2}</p>}
                    {displayHR && <p><strong>HR:</strong> {displayHR}</p>}
                    {displayTemp && <p><strong>Temp:</strong> {displayTemp}</p>}
                    {!hasVitals && <p className="acc-empty">No vitals recorded</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="acc-right">
              <div className="acc-tabs">
                <button className={`acc-tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>Chief Complaints</button>
                <button className={`acc-tab ${tab === 'diagnosis' ? 'active' : ''}`} onClick={() => setTab('diagnosis')}>Diagnosis</button>
                <button className={`acc-tab ${tab === 'remarks' ? 'active' : ''}`} onClick={() => setTab('remarks')}>Remarks</button>
              </div>

              <div className="acc-tab-content">
                {editMode ? (
                  tab === 'diagnosis' ? (
                    <select className="acc-select" value={form.diagnosis} onChange={e => update('diagnosis', e.target.value)}>
                      <option value="">Select diagnosis</option>
                      {diseases.map(disease => (
                        <option key={disease.id} value={disease.name}>
                          {disease.name}{disease.aliases?.length ? ` (${disease.aliases.join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea className="acc-textarea" value={form[tabKey]} onChange={e => update(tabKey, e.target.value)} placeholder={`Enter ${tab}...`} />
                  )
                ) : (
                  <div className="acc-text-display">
                    {form[tabKey] || <span className="acc-empty">Nothing recorded yet.</span>}
                  </div>
                )}
              </div>

              <div className="acc-edit-row">
                {canEdit && (
                  editMode
                    ? <button className="acc-save-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    : <button className="acc-edit-btn" onClick={() => setEditMode(true)}>Edit</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AccordionRecord
