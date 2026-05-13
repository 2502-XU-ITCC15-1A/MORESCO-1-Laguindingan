import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import './AddPatient.css'

const STEPS = ['Basic Info', 'Address', 'Patient Photo']
const HEIGHT_OPTIONS = Array.from({ length: 37 }, (_, i) => {
  const totalInches = 48 + i
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}`
})

const INITIAL_FORM = {
  firstName: '', middleName: '', lastName: '',
  birthDate: '', position: '', status: 'Single',
  height: '', weightValue: '', weightUnit: 'kg', sex: 'Male',
  permLine1: '', permLine2: '', permCity: '', permBarangay: '', permProvince: '',
  presLine1: '', presLine2: '', presCity: '', presBarangay: '', presProvince: '',
  photo: null, photoPreview: null,
}

function calculateBMI(height, weightValue, weightUnit) {
  const weight = Number(weightValue)
  const heightMatch = height.match(/^(\d+)'(\d+)$/)
  if (!heightMatch || !weight || weight <= 0) return ''

  const totalInches = Number(heightMatch[1]) * 12 + Number(heightMatch[2])
  const heightM = totalInches * 0.0254
  const weightKg = weightUnit === 'lb' ? weight * 0.45359237 : weight
  return (weightKg / (heightM * heightM)).toFixed(1)
}

function AddPatient({ show, onClose, onAdd }) {
  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function validateStep() {
    const e = {}
    if (step === 0) {
      if (!form.firstName.trim())  e.firstName  = 'Required'
      if (!form.lastName.trim())   e.lastName   = 'Required'
      if (!form.birthDate)         e.birthDate  = 'Required'
      if (!form.position.trim())   e.position   = 'Required'
      if (!form.height)            e.height     = 'Required'
      if (!form.weightValue)       e.weightValue = 'Required'
    }
    if (step === 1) {
      if (!form.permLine1.trim())  e.permLine1  = 'Required'
      if (!form.permCity.trim())   e.permCity   = 'Required'
      if (!form.presLine1.trim())  e.presLine1  = 'Required'
      if (!form.presCity.trim())   e.presCity   = 'Required'
    }
    if (step === 2) {
      if (!form.photo) e.photo = 'Patient photo is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validateStep()) setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => s - 1)
    setErrors({})
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    update('photo', file)
    const reader = new FileReader()
    reader.onload = ev => update('photoPreview', ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!validateStep()) return

    setSaving(true)
    setErrors({})

    const payload = new FormData()
    payload.append('firstName', form.firstName)
    payload.append('middleName', form.middleName)
    payload.append('lastName', form.lastName)
    payload.append('birthDate', form.birthDate)
    payload.append('position', form.position)
    payload.append('status', form.status)
    payload.append('height', form.height)
    payload.append('weight', `${form.weightValue}${form.weightUnit}`)
    payload.append('sex', form.sex)
    payload.append('permAddress', `${form.permLine1}${form.permLine2 ? ', ' + form.permLine2 : ''}, ${form.permCity}, ${form.permBarangay}, ${form.permProvince}`)
    payload.append('presAddress', `${form.presLine1}${form.presLine2 ? ', ' + form.presLine2 : ''}, ${form.presCity}, ${form.presBarangay}, ${form.presProvince}`)
    payload.append('bloodType', 'Unknown')
    payload.append('allergies', '[]')
    payload.append('chronicConditions', '[]')
    if (form.photo) payload.append('photo', form.photo)

    try {
      await onAdd(payload)
      setForm(INITIAL_FORM)
      setStep(0)
      setErrors({})
    } catch (err) {
      setErrors({ submit: err.message || 'Unable to save patient.' })
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setStep(0)
    setErrors({})
    onClose()
  }

  const bmi = calculateBMI(form.height, form.weightValue, form.weightUnit)

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="add-patient-modal-content" dialogClassName="add-patient-dialog">
      <Modal.Header className="add-patient-header">
        <h2 className="add-patient-title">Create Patient</h2>
      </Modal.Header>

      <Modal.Body className="add-patient-body">

        {/* Step 1 — Basic Info */}
        {step === 0 && (
          <div className="ap-section">
            <div className="ap-row ap-three">
              <div className="ap-field">
                <label>First Name <span className="req">*</span></label>
                <input value={form.firstName} onChange={e => update('firstName', e.target.value)} className={errors.firstName ? 'err' : ''}/>
                {errors.firstName && <span className="ap-err">{errors.firstName}</span>}
              </div>
              <div className="ap-field">
                <label>Middle Name</label>
                <input value={form.middleName} onChange={e => update('middleName', e.target.value)}/>
              </div>
              <div className="ap-field">
                <label>Last Name <span className="req">*</span></label>
                <input value={form.lastName} onChange={e => update('lastName', e.target.value)} className={errors.lastName ? 'err' : ''}/>
                {errors.lastName && <span className="ap-err">{errors.lastName}</span>}
              </div>
            </div>

            <div className="ap-row ap-three">
              <div className="ap-field">
                <label>Birth Date <span className="req">*</span></label>
                <input type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)} className={errors.birthDate ? 'err' : ''}/>
                {errors.birthDate && <span className="ap-err">{errors.birthDate}</span>}
              </div>
              <div className="ap-field">
                <label>Position <span className="req">*</span></label>
                <input value={form.position} onChange={e => update('position', e.target.value)} className={errors.position ? 'err' : ''}/>
                {errors.position && <span className="ap-err">{errors.position}</span>}
              </div>
              <div className="ap-field">
                <label>Status</label>
                <select value={form.status} onChange={e => update('status', e.target.value)}>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Separated</option>
                </select>
              </div>
            </div>

            <div className="ap-row ap-three">
              <div className="ap-field">
                <label>Height <span className="req">*</span></label>
                <select value={form.height} onChange={e => update('height', e.target.value)} className={errors.height ? 'err' : ''}>
                  <option value="">Select height</option>
                  {HEIGHT_OPTIONS.map(height => <option key={height} value={height}>{height}</option>)}
                </select>
                {errors.height && <span className="ap-err">{errors.height}</span>}
              </div>
              <div className="ap-field">
                <label>Weight <span className="req">*</span></label>
                <div className="ap-weight-row">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weightValue}
                    onChange={e => update('weightValue', e.target.value)}
                    placeholder="70.0"
                    className={errors.weightValue ? 'err' : ''}
                  />
                  <select value={form.weightUnit} onChange={e => update('weightUnit', e.target.value)} aria-label="Weight unit">
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
                {errors.weightValue && <span className="ap-err">{errors.weightValue}</span>}
                <span className="ap-bmi-preview">BMI: {bmi || '--'}</span>
              </div>
              <div className="ap-field">
                <label>Sex</label>
                <div className="ap-radio-group">
                  <label className="ap-radio"><input type="radio" value="Male"   checked={form.sex === 'Male'}   onChange={() => update('sex','Male')}/> Male</label>
                  <label className="ap-radio"><input type="radio" value="Female" checked={form.sex === 'Female'} onChange={() => update('sex','Female')}/> Female</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Address */}
        {step === 1 && (
          <div className="ap-section">
            <div className="ap-address-cols">
              <div className="ap-address-col">
                <h4 className="ap-addr-title">Permanent Address</h4>
                <div className="ap-field">
                  <label>Address Line 1 <span className="req">*</span></label>
                  <input value={form.permLine1} onChange={e => update('permLine1', e.target.value)} placeholder="Enter Address Line 1" className={errors.permLine1 ? 'err' : ''}/>
                  {errors.permLine1 && <span className="ap-err">{errors.permLine1}</span>}
                </div>
                <div className="ap-field">
                  <label>Address Line 2 (Optional)</label>
                  <input value={form.permLine2} onChange={e => update('permLine2', e.target.value)} placeholder="Enter Address Line 2"/>
                </div>
                <div className="ap-row ap-two">
                  <div className="ap-field">
                    <label>City <span className="req">*</span></label>
                    <input value={form.permCity} onChange={e => update('permCity', e.target.value)} placeholder="Enter City" className={errors.permCity ? 'err' : ''}/>
                    {errors.permCity && <span className="ap-err">{errors.permCity}</span>}
                  </div>
                  <div className="ap-field">
                    <label>Barangay</label>
                    <input value={form.permBarangay} onChange={e => update('permBarangay', e.target.value)} placeholder="Enter Barangay"/>
                  </div>
                </div>
                <div className="ap-field">
                  <label>Province</label>
                  <input value={form.permProvince} onChange={e => update('permProvince', e.target.value)} placeholder="Enter Province"/>
                </div>
              </div>

              <div className="ap-address-col">
                <h4 className="ap-addr-title">Present Address</h4>
                <div className="ap-field">
                  <label>Address Line 1 <span className="req">*</span></label>
                  <input value={form.presLine1} onChange={e => update('presLine1', e.target.value)} placeholder="Enter Address Line 1" className={errors.presLine1 ? 'err' : ''}/>
                  {errors.presLine1 && <span className="ap-err">{errors.presLine1}</span>}
                </div>
                <div className="ap-field">
                  <label>Address Line 2 (Optional)</label>
                  <input value={form.presLine2} onChange={e => update('presLine2', e.target.value)} placeholder="Enter Address Line 2"/>
                </div>
                <div className="ap-row ap-two">
                  <div className="ap-field">
                    <label>City <span className="req">*</span></label>
                    <input value={form.presCity} onChange={e => update('presCity', e.target.value)} placeholder="Enter City" className={errors.presCity ? 'err' : ''}/>
                    {errors.presCity && <span className="ap-err">{errors.presCity}</span>}
                  </div>
                  <div className="ap-field">
                    <label>Barangay</label>
                    <input value={form.presBarangay} onChange={e => update('presBarangay', e.target.value)} placeholder="Enter Barangay"/>
                  </div>
                </div>
                <div className="ap-field">
                  <label>Province</label>
                  <input value={form.presProvince} onChange={e => update('presProvince', e.target.value)} placeholder="Enter Province"/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Patient Photo */}
        {step === 2 && (
          <div className="ap-section ap-photo-section">
            <label className="ap-photo-upload" htmlFor="photo-input">
              {form.photoPreview
                ? <img src={form.photoPreview} alt="Preview" className="ap-photo-preview"/>
                : (
                  <div className="ap-photo-placeholder">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="12" width="60" height="48" rx="4" stroke="#333" strokeWidth="3" fill="none"/>
                      <circle cx="35" cy="32" r="10" stroke="#333" strokeWidth="3" fill="none"/>
                      <path d="M5 52 L20 38 L32 50 L47 35 L65 52" stroke="#333" strokeWidth="3" fill="none" strokeLinejoin="round"/>
                      <circle cx="58" cy="60" r="10" fill="#333"/>
                      <path d="M58 55 L58 65 M53 60 L63 60" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <p>Insert Image</p>
                    <span>Click to upload a photo</span>
                  </div>
                )
              }
            </label>
            {errors.photo && <span className="ap-err ap-photo-err">{errors.photo}</span>}
            <input id="photo-input" type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange}/>
          </div>
        )}

      </Modal.Body>

      {/* Step Indicator + Navigation */}
      <Modal.Footer className="add-patient-footer">
        <div className="ap-step-indicator">
          {STEPS.map((label, i) => (
            <div key={label} className="ap-step-item">
              <div className={`ap-step-dot ${i <= step ? 'done' : ''} ${i === step ? 'current' : ''}`}/>
              <span className={`ap-step-label ${i === step ? 'active' : ''}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="ap-footer-btns">
          {errors.submit && <span className="ap-err">{errors.submit}</span>}
          {step > 0 && (
            <button className="ap-btn ap-btn-back" onClick={handleBack} disabled={saving}>Back</button>
          )}
          {step < STEPS.length - 1 && (
            <button className="ap-btn ap-btn-next" onClick={handleNext} disabled={saving}>Next</button>
          )}
          {step === STEPS.length - 1 && (
            <button className="ap-btn ap-btn-save" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Patient'}
            </button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default AddPatient
